#!/bin/bash
# COT Analyzer — Full VM Setup Script
# Run as root on a fresh Ubuntu 22.04+ / Debian 12+
set -euo pipefail

APP_USER="cftc"
APP_DIR="/opt/cftc"
NODE_VERSION="20"

echo "=== COT Analyzer — VM Setup ==="

# 1. System packages
echo "[1/7] Installing system packages..."
apt-get update -qq
apt-get install -y -qq python3 python3-venv python3-pip nginx git curl

# 2. Node.js (for frontend build)
echo "[2/7] Installing Node.js ${NODE_VERSION}..."
if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y -qq nodejs
fi
echo "  Node: $(node --version), npm: $(npm --version)"

# 3. Create app user
echo "[3/7] Creating app user..."
if ! id "$APP_USER" &>/dev/null; then
    useradd --system --home-dir "$APP_DIR" --shell /bin/bash "$APP_USER"
fi

# 4. Setup project directory
echo "[4/7] Setting up project..."
mkdir -p "$APP_DIR"
chown "$APP_USER:$APP_USER" "$APP_DIR"

if [ ! -f "$APP_DIR/backend/pipeline.py" ]; then
    echo "  ERROR: Copy project files to $APP_DIR first, then re-run this script."
    echo "  Example: rsync -av --exclude node_modules --exclude .git . root@vm:$APP_DIR/"
    exit 1
fi

# 5. Python venv + deps
echo "[5/7] Setting up Python environment..."
sudo -u "$APP_USER" bash -c "
    cd $APP_DIR
    python3 -m venv venv
    source venv/bin/activate
    pip install -q --upgrade pip
    pip install -q -r backend/requirements.txt
"

# 6. Build frontend
echo "[6/7] Building frontend..."
sudo -u "$APP_USER" bash -c "
    cd $APP_DIR/frontend
    npm ci --silent
    npx vite build
"

# 7. Nginx + systemd
echo "[7/7] Configuring nginx & systemd timer..."
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

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Run initial data load:"
echo "     sudo -u $APP_USER bash -c 'cd $APP_DIR/backend && ../venv/bin/python pipeline.py'"
echo ""
echo "  2. Check it works:"
echo "     curl http://localhost/data/markets_legacy_fo.json | head -c 100"
echo ""
echo "  3. Timer status:"
echo "     systemctl list-timers | grep cot"
echo ""
echo "  4. (Optional) Add domain + HTTPS:"
echo "     apt install certbot python3-certbot-nginx"
echo "     certbot --nginx -d yourdomain.com"
