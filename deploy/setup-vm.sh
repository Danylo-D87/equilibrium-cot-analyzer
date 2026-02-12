#!/bin/bash
# COT Analyzer — Full VM Setup Script
# Run as root on a fresh Ubuntu 22.04+ / Debian 12+
set -euo pipefail

APP_USER="cftc"
APP_DIR="/opt/cftc"
NODE_VERSION="20"

echo "=== COT Analyzer — VM Setup ==="

# 1. System packages
echo "[1/9] Installing system packages..."
apt-get update -qq
apt-get install -y -qq python3 python3-venv python3-pip nginx git curl

# 2. Node.js (for frontend build)
echo "[2/9] Installing Node.js ${NODE_VERSION}..."
if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y -qq nodejs
fi
echo "  Node: $(node --version), npm: $(npm --version)"

# 3. Create app user
echo "[3/9] Creating app user..."
if ! id "$APP_USER" &>/dev/null; then
    useradd --system --home-dir "$APP_DIR" --shell /bin/bash "$APP_USER"
fi

# 4. Setup project directory
echo "[4/9] Setting up project..."
mkdir -p "$APP_DIR"
chown "$APP_USER:$APP_USER" "$APP_DIR"

if [ ! -f "$APP_DIR/backend/pipeline.py" ]; then
    echo "  ERROR: Copy project files to $APP_DIR first, then re-run this script."
    echo "  Example: rsync -av --exclude node_modules --exclude .git . root@vm:$APP_DIR/"
    exit 1
fi

# 5. Python venv + deps
echo "[5/9] Setting up Python environment..."
sudo -u "$APP_USER" bash -c "
    cd $APP_DIR
    python3 -m venv venv
    source venv/bin/activate
    pip install -q --upgrade pip
    pip install -q -r backend/requirements.txt
"

# 6. Build frontend
echo "[6/9] Building frontend..."
sudo -u "$APP_USER" bash -c "
    cd $APP_DIR/frontend
    npm ci --silent
    npx vite build
"

# 7. Nginx + systemd
echo "[7/9] Configuring nginx & systemd timer..."
cp "$APP_DIR/deploy/nginx-cot.conf" /etc/nginx/sites-available/cot
ln -sf /etc/nginx/sites-available/cot /etc/nginx/sites-enabled/cot
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

cp "$APP_DIR/deploy/cot-update.service" /etc/systemd/system/
cp "$APP_DIR/deploy/cot-update.timer" /etc/systemd/system/
chmod +x "$APP_DIR/deploy/update.sh"
systemctl daemon-reload
systemctl enable --now cot-update.timer

# Create log directory
sudo -u "$APP_USER" mkdir -p "$APP_DIR/backend/logs"

# 8. Initial data load (COT reports + prices from Yahoo Finance)
echo ""
echo "[8/9] Running initial data load (COT + prices)..."
echo "       This may take 5-15 minutes (downloading 5 years of data)..."
echo ""

sudo -u "$APP_USER" bash -c "
    cd $APP_DIR/backend
    ../venv/bin/python pipeline.py --verbose
"
PIPELINE_EXIT=$?

if [ $PIPELINE_EXIT -ne 0 ]; then
    echo ""
    echo "  ⚠️  Pipeline finished with errors (exit code: $PIPELINE_EXIT)"
    echo "  Check log: $APP_DIR/backend/logs/pipeline.log"
    echo "  You can re-run manually:"
    echo "    sudo -u $APP_USER bash -c 'cd $APP_DIR/backend && ../venv/bin/python pipeline.py --verbose'"
    echo ""
fi

# 9. Health check & verification
echo ""
echo "[9/9] Verifying data & services..."
echo ""

# Check JSON files were exported
DATA_DIR="$APP_DIR/frontend/public/data"
JSON_COUNT=$(find "$DATA_DIR" -name '*.json' 2>/dev/null | wc -l)
echo "  [DATA] JSON files exported: $JSON_COUNT"

if [ "$JSON_COUNT" -eq 0 ]; then
    echo "  ⚠️  No JSON files found! Pipeline may have failed."
    echo "  Check: $APP_DIR/backend/logs/pipeline.log"
else
    # Show sample data
    echo "  [DATA] Sample market files:"
    ls -1 "$DATA_DIR"/markets_*.json 2>/dev/null | head -6 | sed 's/^/         /'
    echo ""

    # Check that data is accessible via nginx
    HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost/data/markets_legacy_fo.json 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        echo "  [NGINX] ✅ Data accessible via nginx (HTTP $HTTP_CODE)"
    else
        echo "  [NGINX] ⚠️  Data not accessible via nginx (HTTP $HTTP_CODE)"
        echo "         Check: systemctl status nginx"
    fi
fi

# Run health check script
echo ""
echo "  [HEALTH] Running data health check..."
sudo -u "$APP_USER" bash -c "cd $APP_DIR/backend && ../venv/bin/python data_health_check.py" || true

# Show timer status
echo ""
echo "  [TIMER] Auto-update timer status:"
systemctl list-timers --no-pager | grep -E 'cot|NEXT' || echo "         Timer not found!"

echo ""
echo "=========================================="
echo "=== Setup Complete ==="
echo "========================================="
echo ""
echo "  📊 JSON files: $JSON_COUNT"
echo "  🔄 Auto-update: every Saturday 00:00 UTC"
echo "  📁 Data dir: $DATA_DIR"
echo "  📋 Logs: $APP_DIR/backend/logs/"
echo ""

echo ""
echo "=========================================="
echo "=== ALL DONE ==="
echo "=========================================="
echo ""
echo "  Useful commands:"
echo "    systemctl status cot-update.timer        # Timer status"
echo "    journalctl -u cot-update.service -f      # Update logs"
echo "    $APP_DIR/deploy/update.sh --force         # Force manual update"
echo ""
echo "  (Optional) Add domain + HTTPS:"
echo "    apt install certbot python3-certbot-nginx"
echo "    certbot --nginx -d yourdomain.com"
