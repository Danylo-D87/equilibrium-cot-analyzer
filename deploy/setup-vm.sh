#!/bin/bash
# COT Analyzer — Full VM Setup Script
# Run as root on a fresh Ubuntu 22.04+ / Debian 12+
set -euo pipefail

APP_USER="cftc"
APP_DIR="/opt/cftc"
NODE_VERSION="20"

echo "=== COT Analyzer — VM Setup ==="

# 1. System packages
echo "[1/10] Installing system packages..."
apt-get update -qq
apt-get install -y -qq python3 python3-venv python3-pip nginx git curl

# 2. Node.js (for frontend build)
echo "[2/10] Installing Node.js ${NODE_VERSION}..."
if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y -qq nodejs
fi
echo "  Node: $(node --version), npm: $(npm --version)"

# 3. Create app user
echo "[3/10] Creating app user..."
if ! id "$APP_USER" &>/dev/null; then
    useradd --system --home-dir "$APP_DIR" --shell /bin/bash "$APP_USER"
fi

# 4. Setup project directory
echo "[4/10] Setting up project..."
mkdir -p "$APP_DIR"
chown "$APP_USER:$APP_USER" "$APP_DIR"

if [ ! -f "$APP_DIR/backend/pipeline.py" ]; then
    echo "  ERROR: Copy project files to $APP_DIR first, then re-run this script."
    echo "  Example: rsync -av --exclude node_modules --exclude .git . root@vm:$APP_DIR/"
    exit 1
fi

# 5. Python venv + deps
echo "[5/10] Setting up Python environment..."
sudo -u "$APP_USER" bash -c "
    cd $APP_DIR
    python3 -m venv venv
    source venv/bin/activate
    pip install -q --upgrade pip
    pip install -q -r backend/requirements.txt
"

# 6. Build frontend
echo "[6/10] Building frontend..."
sudo -u "$APP_USER" bash -c "
    cd $APP_DIR/frontend
    npm ci --silent
    npx vite build
"

# 7. Nginx + systemd
echo "[7/10] Configuring nginx & systemd timer..."
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
echo "[8/10] Running initial data load (COT + prices)..."
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
echo "[9/10] Verifying data & services..."
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
echo "=========================================="
echo ""
echo "  📊 JSON files: $JSON_COUNT"
echo "  🔄 Auto-update: every Saturday 00:00 UTC"
echo "  📁 Data dir: $DATA_DIR"
echo "  📋 Logs: $APP_DIR/backend/logs/"
echo ""

# 10. Telegram bot setup
echo "[10/10] Setting up Telegram bot service..."

cp "$APP_DIR/deploy/cot-tgbot.service" /etc/systemd/system/
systemctl daemon-reload

# Create .env file if it doesn't exist
if [ ! -f "$APP_DIR/.env" ]; then
    cp "$APP_DIR/deploy/.env.example" "$APP_DIR/.env" 2>/dev/null || \
    cat > "$APP_DIR/.env" <<'ENVEOF'
# Telegram Bot Configuration
# Get token from @BotFather, chat ID from @userinfobot
TG_BOT_TOKEN=
TG_CHAT_ID=
ANALYTICS_PORT=8700
ENVEOF
    chown "$APP_USER:$APP_USER" "$APP_DIR/.env"
    chmod 600 "$APP_DIR/.env"
    echo "  Created $APP_DIR/.env — fill in TG_BOT_TOKEN and TG_CHAT_ID!"
fi

# Check if tokens are configured
if grep -q '^TG_BOT_TOKEN=$' "$APP_DIR/.env" 2>/dev/null; then
    echo ""
    echo "  ⚠️  Telegram bot NOT started — tokens not configured yet."
    echo "  To enable:"
    echo "    1. Get bot token from @BotFather in Telegram"
    echo "    2. Get your chat ID from @userinfobot in Telegram"
    echo "    3. Edit $APP_DIR/.env and set TG_BOT_TOKEN and TG_CHAT_ID"
    echo "    4. Run: sudo systemctl enable --now cot-tgbot.service"
else
    systemctl enable --now cot-tgbot.service
    echo "  ✅ Telegram bot started!"
fi

echo ""
echo "=========================================="
echo "=== ALL DONE ==="
echo "=========================================="
echo ""
echo "  Useful commands:"
echo "    systemctl status cot-update.timer        # Timer status"
echo "    systemctl status cot-tgbot.service       # Bot status"
echo "    journalctl -u cot-update.service -f      # Update logs"
echo "    journalctl -u cot-tgbot.service -f       # Bot logs"
echo "    $APP_DIR/deploy/update.sh --force         # Force manual update"
echo ""
echo "  (Optional) Add domain + HTTPS:"
echo "    apt install certbot python3-certbot-nginx"
echo "    certbot --nginx -d yourdomain.com"
