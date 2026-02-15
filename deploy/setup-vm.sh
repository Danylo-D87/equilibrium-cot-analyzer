#!/bin/bash
# Market Analytics Platform — Full VM Setup Script
# Run as root on a fresh Ubuntu 22.04+ / Debian 12+
set -euo pipefail

APP_USER="cftc"
APP_DIR="/opt/cftc"
NODE_VERSION="20"

echo "=== Market Analytics Platform — VM Setup ==="

# ──────────────────────────────────────────────
# 1. System packages
# ──────────────────────────────────────────────
echo "[1/7] Installing system packages..."
apt-get update -qq
apt-get install -y -qq python3 python3-venv python3-pip nginx git curl

# ──────────────────────────────────────────────
# 2. Node.js (for frontend build)
# ──────────────────────────────────────────────
echo "[2/7] Installing Node.js ${NODE_VERSION}..."
if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y -qq nodejs
fi
echo "  Node: $(node --version), npm: $(npm --version)"

# ──────────────────────────────────────────────
# 3. Create app user + directories
# ──────────────────────────────────────────────
echo "[3/7] Creating app user..."
if ! id "$APP_USER" &>/dev/null; then
    useradd --system --home-dir "$APP_DIR" --shell /bin/bash "$APP_USER"
fi

mkdir -p "$APP_DIR"
chown "$APP_USER:$APP_USER" "$APP_DIR"

if [ ! -f "$APP_DIR/backend/app/main.py" ]; then
    echo "  ERROR: Copy project files to $APP_DIR first, then re-run this script."
    echo "  Example: rsync -av --exclude node_modules --exclude .git --exclude __pycache__ . root@vm:$APP_DIR/"
    exit 1
fi

# ──────────────────────────────────────────────
# 4. Python venv + deps
# ──────────────────────────────────────────────
echo "[4/7] Setting up Python environment..."
sudo -u "$APP_USER" bash -c "
    cd $APP_DIR
    python3 -m venv venv
    source venv/bin/activate
    pip install -q --upgrade pip
    pip install -q -r backend/requirements.txt
"

# ──────────────────────────────────────────────
# 5. Build frontend
# ──────────────────────────────────────────────
echo "[5/7] Building frontend..."
sudo -u "$APP_USER" bash -c "
    cd $APP_DIR/frontend
    npm ci --silent
    npx vite build
"

# ──────────────────────────────────────────────
# 6. Nginx + systemd
# ──────────────────────────────────────────────
echo "[6/7] Configuring nginx & API service..."

# Nginx
cp "$APP_DIR/deploy/nginx-cot.conf" /etc/nginx/sites-available/cot
ln -sf /etc/nginx/sites-available/cot /etc/nginx/sites-enabled/cot
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

# FastAPI backend service (includes built-in APScheduler for auto-updates)
cp "$APP_DIR/deploy/cot-api.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable cot-api.service

# Create runtime directories
sudo -u "$APP_USER" mkdir -p "$APP_DIR/backend/logs" "$APP_DIR/backend/data"

# ──────────────────────────────────────────────
# 7. Initial data load + verification
# ──────────────────────────────────────────────
echo ""
echo "[7/7] Running initial data load (COT + prices)..."
echo "       This may take 5-15 minutes..."
echo ""

sudo -u "$APP_USER" bash -c "
    cd $APP_DIR/backend
    ../venv/bin/python scripts/run_pipeline.py --verbose
"
PIPELINE_EXIT=$?

if [ $PIPELINE_EXIT -ne 0 ]; then
    echo ""
    echo "  ⚠️  Pipeline finished with errors (exit code: $PIPELINE_EXIT)"
    echo "  Check log: $APP_DIR/backend/logs/pipeline.log"
    echo "  Re-run:    sudo -u $APP_USER bash -c 'cd $APP_DIR/backend && ../venv/bin/python scripts/run_pipeline.py --verbose'"
    echo ""
fi

# Start API server
systemctl start cot-api.service
sleep 2

# Check API
API_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/api/v1/cot/status 2>/dev/null || echo "000")
if [ "$API_CODE" = "200" ]; then
    echo "  [API]   ✅ Backend running (HTTP $API_CODE)"
    curl -s http://localhost:8000/api/v1/cot/status | python3 -m json.tool 2>/dev/null | head -20 | sed 's/^/         /'
else
    echo "  [API]   ⚠️  Backend not responding (HTTP $API_CODE)"
    echo "          Check: journalctl -u cot-api.service -n 50"
fi

# Check nginx proxy
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost/api/v1/cot/status 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "  [NGINX] ✅ API accessible via nginx (HTTP $HTTP_CODE)"
else
    echo "  [NGINX] ⚠️  API not accessible via nginx (HTTP $HTTP_CODE)"
    echo "          Check: systemctl status nginx"
fi

# Health check
echo ""
echo "  [HEALTH] Running data health check..."
sudo -u "$APP_USER" bash -c "cd $APP_DIR/backend && ../venv/bin/python scripts/health_check.py" || true

echo ""
echo "=========================================="
echo "=== Setup Complete ==="
echo "=========================================="
echo ""
echo "  🌐 API server:   http://localhost:8000/api/v1/cot/status"
echo "  📖 API docs:     http://localhost:8000/api/docs"
echo "  🔄 Auto-update:  every Friday 23:00 Kyiv time + daily prices 00:00 (built-in scheduler)"
echo "                   To disable: add 'Environment=DISABLE_SCHEDULER=1' to /etc/systemd/system/cot-api.service"
echo "  📋 Logs:         $APP_DIR/backend/logs/"
echo ""
echo "  Useful commands:"
echo "    systemctl status cot-api.service           # API status"
echo "    journalctl -u cot-api.service -f           # API logs"
echo "    sudo systemctl restart cot-api.service     # Restart"
echo "    curl localhost:8000/api/v1/cot/status      # Data status"
echo ""
echo "  Manual data update:"
echo "    sudo -u $APP_USER bash -c 'cd $APP_DIR/backend && ../venv/bin/python scripts/run_pipeline.py'"
echo ""
echo "  (Optional) Add domain + HTTPS:"
echo "    apt install certbot python3-certbot-nginx"
echo "    certbot --nginx -d yourdomain.com"
