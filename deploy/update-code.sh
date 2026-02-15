#!/bin/bash
# ================================================================
# Equilibrium — Update Code from GitHub
# ================================================================
# Pulls latest code, rebuilds frontend, restarts backend.
# Does NOT re-run the data pipeline or touch the database.
#
# Usage:
#   sudo bash /opt/cftc/deploy/update-code.sh
#   sudo bash /opt/cftc/deploy/update-code.sh --skip-frontend
#   sudo bash /opt/cftc/deploy/update-code.sh --with-deps
# ================================================================
set -euo pipefail

APP_USER="cftc"
APP_DIR="/opt/cftc"
LOG_FILE="/tmp/cftc-update-$(date +%Y%m%d-%H%M%S).log"

# ── Flags ────────────────────────────────────────────────────────
SKIP_FRONTEND=false
WITH_DEPS=false

for arg in "$@"; do
    case "$arg" in
        --skip-frontend) SKIP_FRONTEND=true ;;
        --with-deps)     WITH_DEPS=true ;;
        -h|--help)
            echo "Usage: sudo bash update-code.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --skip-frontend   Don't rebuild frontend (backend-only update)"
            echo "  --with-deps       Reinstall Python + Node dependencies"
            echo "  -h, --help        Show this help"
            exit 0
            ;;
        *) echo "Unknown option: $arg"; exit 1 ;;
    esac
done

# ── Colours ──────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log()  { echo -e "${CYAN}[$(date +%H:%M:%S)]${NC} $*" | tee -a "$LOG_FILE"; }
ok()   { echo -e "${GREEN}  ✅ $*${NC}" | tee -a "$LOG_FILE"; }
warn() { echo -e "${YELLOW}  ⚠️  $*${NC}" | tee -a "$LOG_FILE"; }
fail() { echo -e "${RED}  ❌ $*${NC}" | tee -a "$LOG_FILE"; }
hr()   { echo -e "${BOLD}$(printf '─%.0s' {1..55})${NC}" | tee -a "$LOG_FILE"; }

# ── Pre-flight ───────────────────────────────────────────────────
hr
echo -e "${BOLD}  Equilibrium — Code Update${NC}" | tee -a "$LOG_FILE"
hr
echo "" | tee -a "$LOG_FILE"

if [ "$(id -u)" -ne 0 ]; then
    fail "Run as root (use sudo)"
    exit 1
fi

if [ ! -d "$APP_DIR/.git" ]; then
    fail "Not a git repo at $APP_DIR — use full-setup.sh instead"
    exit 1
fi

log "Log file: $LOG_FILE"
PREV_HASH=$(cd "$APP_DIR" && git rev-parse --short HEAD)
log "Current commit: $PREV_HASH"
echo ""

# ─────────────────────────────────────────────────────────────────
# 1. Pull latest code
# ─────────────────────────────────────────────────────────────────
log "[1/5] Pulling latest code from GitHub..."

cd "$APP_DIR"
sudo -u "$APP_USER" git fetch origin >> "$LOG_FILE" 2>&1

# Show what's incoming
CHANGES=$(sudo -u "$APP_USER" git log HEAD..origin/main --oneline 2>/dev/null || true)
if [ -z "$CHANGES" ]; then
    ok "Already up to date ($PREV_HASH)"
    echo ""
    echo "  Nothing to update. Exiting."
    exit 0
fi

echo "  Incoming commits:" | tee -a "$LOG_FILE"
echo "$CHANGES" | head -10 | sed 's/^/    /' | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

sudo -u "$APP_USER" git pull origin main >> "$LOG_FILE" 2>&1
NEW_HASH=$(git rev-parse --short HEAD)
ok "Updated: $PREV_HASH → $NEW_HASH"

# ─────────────────────────────────────────────────────────────────
# 2. Python deps (optional)
# ─────────────────────────────────────────────────────────────────
if [ "$WITH_DEPS" = true ]; then
    log "[2/5] Updating Python dependencies..."
    sudo -u "$APP_USER" bash -c "
        cd $APP_DIR
        source venv/bin/activate
        pip install -q --upgrade pip
        pip install -q -r backend/requirements.txt
    " >> "$LOG_FILE" 2>&1
    ok "Python deps updated"
else
    log "[2/5] Skipping Python deps (use --with-deps to update)"
fi

# ─────────────────────────────────────────────────────────────────
# 3. Build frontend
# ─────────────────────────────────────────────────────────────────
if [ "$SKIP_FRONTEND" = true ]; then
    log "[3/5] Skipping frontend build (--skip-frontend)"
else
    log "[3/5] Building frontend..."
    sudo -u "$APP_USER" bash -c "
        cd $APP_DIR/frontend
        npm ci --silent
        npx vite build
    " >> "$LOG_FILE" 2>&1
    ok "Frontend built"
fi

# ─────────────────────────────────────────────────────────────────
# 4. Update configs (if changed)
# ─────────────────────────────────────────────────────────────────
log "[4/5] Checking deploy configs..."

NGINX_CHANGED=false
SERVICE_CHANGED=false

if ! diff -q "$APP_DIR/deploy/nginx-cot.conf" /etc/nginx/sites-available/cot &>/dev/null 2>&1; then
    cp "$APP_DIR/deploy/nginx-cot.conf" /etc/nginx/sites-available/cot
    nginx -t >> "$LOG_FILE" 2>&1 && systemctl reload nginx
    NGINX_CHANGED=true
    ok "Nginx config updated & reloaded"
fi

if ! diff -q "$APP_DIR/deploy/cot-api.service" /etc/systemd/system/cot-api.service &>/dev/null 2>&1; then
    cp "$APP_DIR/deploy/cot-api.service" /etc/systemd/system/
    systemctl daemon-reload
    SERVICE_CHANGED=true
    ok "Systemd service updated"
fi

if [ "$NGINX_CHANGED" = false ] && [ "$SERVICE_CHANGED" = false ]; then
    ok "Configs unchanged"
fi

# ─────────────────────────────────────────────────────────────────
# 5. Restart backend
# ─────────────────────────────────────────────────────────────────
log "[5/5] Restarting backend..."
systemctl restart cot-api.service
sleep 3

API_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/api/v1/cot/status 2>/dev/null || echo "000")
if [ "$API_CODE" = "200" ]; then
    ok "Backend running (HTTP $API_CODE)"
else
    fail "Backend not responding (HTTP $API_CODE)"
    echo "  Debug: journalctl -u cot-api.service -n 30" | tee -a "$LOG_FILE"
fi

# ─────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────
echo "" | tee -a "$LOG_FILE"
hr
echo -e "${BOLD}  Update Complete — $PREV_HASH → $NEW_HASH${NC}" | tee -a "$LOG_FILE"
hr
echo "" | tee -a "$LOG_FILE"
echo "  📋 Log: $LOG_FILE" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "  Note: This updated CODE only. Data was NOT re-downloaded." | tee -a "$LOG_FILE"
echo "  To update data: cd $APP_DIR/backend && ../venv/bin/python scripts/run_pipeline.py" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
