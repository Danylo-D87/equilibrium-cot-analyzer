#!/bin/bash
# ================================================================
# Equilibrium — Full Server Setup
# ================================================================
# Run as root on Ubuntu 22.04+ / Debian 12+
# Does EVERYTHING: packages, venv, deps, build, nginx, systemd,
# initial data load, and verification.
#
# Usage:
#   sudo bash /opt/cftc/deploy/full-setup.sh
# ================================================================
set -euo pipefail

APP_USER="cftc"
APP_DIR="/opt/cftc"
NODE_VERSION="20"
LOG_FILE="/tmp/cftc-setup-$(date +%Y%m%d-%H%M%S).log"

# ── Colours ──────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log()  { echo -e "${CYAN}[$(date +%H:%M:%S)]${NC} $*" | tee -a "$LOG_FILE"; }
ok()   { echo -e "${GREEN}  ✅ $*${NC}" | tee -a "$LOG_FILE"; }
warn() { echo -e "${YELLOW}  ⚠️  $*${NC}" | tee -a "$LOG_FILE"; }
fail() { echo -e "${RED}  ❌ $*${NC}" | tee -a "$LOG_FILE"; }
hr()   { echo -e "${BOLD}$(printf '═%.0s' {1..60})${NC}" | tee -a "$LOG_FILE"; }

# ── Pre-flight checks ───────────────────────────────────────────
hr
echo -e "${BOLD}  Equilibrium — Full Server Setup${NC}" | tee -a "$LOG_FILE"
hr
echo "" | tee -a "$LOG_FILE"

if [ "$(id -u)" -ne 0 ]; then
    fail "This script must be run as root (use sudo)"
    exit 1
fi

if [ ! -f "$APP_DIR/backend/app/main.py" ]; then
    fail "Project not found at $APP_DIR"
    echo "  Copy files first:"
    echo "    rsync -av --exclude node_modules --exclude .git --exclude __pycache__ . root@server:$APP_DIR/"
    echo "  Or clone:"
    echo "    git clone https://github.com/YOUR_REPO/cftc.git $APP_DIR"
    exit 1
fi

log "Log file: $LOG_FILE"
echo ""

# ─────────────────────────────────────────────────────────────────
# 1. System packages
# ─────────────────────────────────────────────────────────────────
log "[1/8] Installing system packages..."
apt-get update -qq >> "$LOG_FILE" 2>&1
apt-get install -y -qq python3 python3-venv python3-pip nginx git curl >> "$LOG_FILE" 2>&1
ok "System packages installed"

# ─────────────────────────────────────────────────────────────────
# 2. Node.js
# ─────────────────────────────────────────────────────────────────
log "[2/8] Installing Node.js ${NODE_VERSION}..."
if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - >> "$LOG_FILE" 2>&1
    apt-get install -y -qq nodejs >> "$LOG_FILE" 2>&1
fi
ok "Node $(node --version), npm $(npm --version)"

# ─────────────────────────────────────────────────────────────────
# 3. App user & directories
# ─────────────────────────────────────────────────────────────────
log "[3/8] Creating app user & directories..."
if ! id "$APP_USER" &>/dev/null; then
    useradd --system --home-dir "$APP_DIR" --shell /bin/bash "$APP_USER"
    ok "Created user: $APP_USER"
else
    ok "User $APP_USER already exists"
fi

mkdir -p "$APP_DIR/backend/data" "$APP_DIR/backend/logs"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
ok "Directories ready"

# ─────────────────────────────────────────────────────────────────
# 4. Python venv + deps
# ─────────────────────────────────────────────────────────────────
log "[4/8] Setting up Python environment..."
sudo -u "$APP_USER" bash -c "
    cd $APP_DIR
    python3 -m venv venv
    source venv/bin/activate
    pip install -q --upgrade pip
    pip install -q -r backend/requirements.txt
" >> "$LOG_FILE" 2>&1
ok "Python venv ready ($(sudo -u "$APP_USER" $APP_DIR/venv/bin/python --version))"

# ─────────────────────────────────────────────────────────────────
# 5. Build frontend
# ─────────────────────────────────────────────────────────────────
log "[5/8] Building frontend..."
sudo -u "$APP_USER" bash -c "
    cd $APP_DIR/frontend
    npm ci --silent
    npx vite build
" >> "$LOG_FILE" 2>&1
ok "Frontend built → $APP_DIR/frontend/dist"

# ─────────────────────────────────────────────────────────────────
# 6. Nginx
# ─────────────────────────────────────────────────────────────────
log "[6/8] Configuring nginx..."
cp "$APP_DIR/deploy/nginx-cot.conf" /etc/nginx/sites-available/cot
ln -sf /etc/nginx/sites-available/cot /etc/nginx/sites-enabled/cot
rm -f /etc/nginx/sites-enabled/default

if nginx -t >> "$LOG_FILE" 2>&1; then
    systemctl reload nginx
    ok "Nginx configured & reloaded"
else
    fail "Nginx config test failed! Check: nginx -t"
    exit 1
fi

# ─────────────────────────────────────────────────────────────────
# 7. Systemd service
# ─────────────────────────────────────────────────────────────────
log "[7/8] Configuring systemd service..."
cp "$APP_DIR/deploy/cot-api.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable cot-api.service >> "$LOG_FILE" 2>&1
ok "Service cot-api.service enabled"

# ─────────────────────────────────────────────────────────────────
# 8. Initial data load
# ─────────────────────────────────────────────────────────────────
log "[8/8] Running initial data pipeline (COT + prices)..."
echo "       This may take 5–15 minutes..."
echo ""

sudo -u "$APP_USER" bash -c "
    cd $APP_DIR/backend
    ../venv/bin/python scripts/run_pipeline.py --verbose
" 2>&1 | tee -a "$LOG_FILE"
PIPE_EXIT=${PIPESTATUS[0]}

if [ "$PIPE_EXIT" -eq 0 ]; then
    ok "Data pipeline completed successfully"
else
    warn "Pipeline finished with errors (exit code: $PIPE_EXIT)"
    echo "  Check log: $APP_DIR/backend/logs/pipeline.log"
fi

# ─────────────────────────────────────────────────────────────────
# Start & verify
# ─────────────────────────────────────────────────────────────────
echo "" | tee -a "$LOG_FILE"
hr
log "Starting services & running verification..."
hr
echo "" | tee -a "$LOG_FILE"

systemctl start cot-api.service
sleep 3

# API check
API_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/api/v1/cot/status 2>/dev/null || echo "000")
if [ "$API_CODE" = "200" ]; then
    ok "[API]   Backend running (HTTP $API_CODE)"
    curl -s http://localhost:8000/api/v1/cot/status | python3 -m json.tool 2>/dev/null | head -20 | sed 's/^/         /' | tee -a "$LOG_FILE"
else
    fail "[API]   Backend not responding (HTTP $API_CODE)"
    echo "  Debug: journalctl -u cot-api.service -n 50" | tee -a "$LOG_FILE"
fi

# Nginx check
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost/api/v1/cot/status 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    ok "[NGINX] Proxy working (HTTP $HTTP_CODE)"
else
    warn "[NGINX] Proxy not responding (HTTP $HTTP_CODE)"
    echo "  Debug: systemctl status nginx" | tee -a "$LOG_FILE"
fi

# Frontend check
FE_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost/ 2>/dev/null || echo "000")
if [ "$FE_CODE" = "200" ]; then
    ok "[WEB]   Frontend accessible (HTTP $FE_CODE)"
else
    warn "[WEB]   Frontend not accessible (HTTP $FE_CODE)"
fi

# Health check
echo "" | tee -a "$LOG_FILE"
log "Running data health check..."
sudo -u "$APP_USER" bash -c "cd $APP_DIR/backend && ../venv/bin/python scripts/health_check.py" 2>&1 | tee -a "$LOG_FILE" || true

# ─────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────
echo "" | tee -a "$LOG_FILE"
hr
echo -e "${BOLD}  Setup Complete${NC}" | tee -a "$LOG_FILE"
hr
echo "" | tee -a "$LOG_FILE"
echo "  🌐 Site:         http://localhost" | tee -a "$LOG_FILE"
echo "  📡 API:          http://localhost:8000/api/v1/cot/status" | tee -a "$LOG_FILE"
echo "  📖 API Docs:     http://localhost:8000/api/docs" | tee -a "$LOG_FILE"
echo "  🔄 Auto-update:  Friday 23:00 Kyiv (COT) + Daily 00:00 (Prices)" | tee -a "$LOG_FILE"
echo "  📋 Setup log:    $LOG_FILE" | tee -a "$LOG_FILE"
echo "  📋 App logs:     $APP_DIR/backend/logs/" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "  Commands:" | tee -a "$LOG_FILE"
echo "    systemctl status cot-api.service        # Status" | tee -a "$LOG_FILE"
echo "    journalctl -u cot-api.service -f        # Live logs" | tee -a "$LOG_FILE"
echo "    bash $APP_DIR/deploy/update-code.sh     # Update from GitHub" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
