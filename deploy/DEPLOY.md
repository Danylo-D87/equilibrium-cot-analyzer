# COT Analyzer — VM Deployment Guide

## Architecture

- **Frontend**: Static files (HTML/JS/CSS + JSON data) served by nginx
- **Backend**: Python scripts run by cron (no server process needed)
- **Data flow**: `cron → auto_update.py → pipeline → JSON files → nginx → browser`

## Requirements

- Ubuntu 22.04+ / Debian 12+
- Python 3.10+
- nginx
- ~500 MB disk space

---

## 1. Initial Setup

```bash
# Clone or copy project to /opt/cftc
sudo mkdir -p /opt/cftc
sudo chown $USER:$USER /opt/cftc
# copy/clone your project here...

# Run full setup (installs deps, builds frontend, loads data, starts timer)
sudo bash deploy/setup-vm.sh
# This will automatically:
#   - Install system packages, Node.js, Python venv
#   - Build the frontend (npm ci + vite build)
#   - Configure nginx + systemd timer
#   - Run initial data load (5 years COT + prices from Yahoo Finance)
#   - Verify data health + nginx accessibility
```

## 2. Nginx Config

```bash
sudo cp deploy/nginx-cot.conf /etc/nginx/sites-available/cot
sudo ln -sf /etc/nginx/sites-available/cot /etc/nginx/sites-enabled/cot
sudo nginx -t
sudo systemctl reload nginx
```

## 3. Cron Setup (option A — simplest)

```bash
# Install crontab
crontab -l 2>/dev/null | cat - deploy/crontab | crontab -
# Or manually:
crontab -e
# Add: 0 0 * * 6  /opt/cftc/deploy/update.sh >> /opt/cftc/backend/logs/cron.log 2>&1
```

## 4. Systemd Timer (option B — recommended)

```bash
sudo cp deploy/cot-update.service /etc/systemd/system/
sudo cp deploy/cot-update.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now cot-update.timer

# Check status
systemctl status cot-update.timer
systemctl list-timers | grep cot
journalctl -u cot-update.service -f
```

## 5. Monitoring

```bash
# Check data health
cd /opt/cftc/backend
../venv/bin/python data_health_check.py

# Check last update log
tail -50 /opt/cftc/backend/logs/auto_update.log

# Manual trigger
/opt/cftc/deploy/update.sh
```

## 6. Updating Code

```bash
cd /opt/cftc
git pull
cd frontend && npm ci && npx vite build && cd ..
# Data will auto-update on next cron run
# To force immediate: /opt/cftc/deploy/update.sh --force
```
