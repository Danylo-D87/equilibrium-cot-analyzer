# Market Analytics Platform — Deployment Guide

## Architecture

```
nginx (port 80/443)
├── /           → frontend/dist (SPA static files)
├── /api/*      → proxy → FastAPI backend (port 8000)
└── /data/*     → frontend/public/data (cached JSON)

FastAPI backend
├── app.main:app         → API server
├── APScheduler          → auto-update every Friday 23:00 Kyiv time
└── SQLite (data/app.db) → 265K+ COT records
```

## Requirements

- Ubuntu 22.04+ / Debian 12+
- Python 3.10+
- Node.js 20+ (for frontend build)
- nginx
- ~500 MB disk space

---

## Quick Setup

```bash
# 1. Copy project to server
rsync -av --exclude node_modules --exclude .git --exclude __pycache__ \
  . root@your-server:/opt/cftc/

# 2. Run setup (installs everything, builds frontend, loads data, starts server)
ssh root@your-server "bash /opt/cftc/deploy/setup-vm.sh"
```

The setup script does everything automatically: installs deps, builds frontend,
configures nginx + systemd, runs initial data load, and starts the server.

---

## Manual Setup (step by step)

### 1. Python environment

```bash
cd /opt/cftc
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
```

### 2. Initial data load

```bash
cd /opt/cftc/backend
../venv/bin/python scripts/run_pipeline.py --verbose
```

### 3. Nginx

```bash
sudo cp deploy/nginx-cot.conf /etc/nginx/sites-available/cot
sudo ln -sf /etc/nginx/sites-available/cot /etc/nginx/sites-enabled/cot
sudo nginx -t && sudo systemctl reload nginx
```

### 4. Systemd service

```bash
sudo cp deploy/cot-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now cot-api.service
```

### 5. Build frontend

```bash
cd /opt/cftc/frontend
npm ci && npx vite build
```

---

## Auto-Updates

The FastAPI server has a **built-in APScheduler** that automatically runs the
COT pipeline **every Friday at 23:00 Kyiv time** (Europe/Kyiv, via pytz).

CFTC publishes data every Friday ~15:30 ET → by 23:00 Kyiv the data is always available.

No external cron or systemd timer is needed — just keep the API service running.

---

## Monitoring

```bash
# Service status
systemctl status cot-api.service

# Live logs
journalctl -u cot-api.service -f

# Data status (via API)
curl -s localhost:8000/api/v1/cot/status | python3 -m json.tool

# Data health check (CLI)
cd /opt/cftc/backend && ../venv/bin/python scripts/health_check.py
```

---

## Updating Code

```bash
cd /opt/cftc
git pull

# Rebuild frontend
cd frontend && npm ci && npx vite build && cd ..

# Restart backend (picks up code changes + restarts scheduler)
sudo systemctl restart cot-api.service
```

---

## Manual Data Update

```bash
# Full pipeline (all report types)
cd /opt/cftc/backend
../venv/bin/python scripts/run_pipeline.py

# Force re-download
../venv/bin/python scripts/run_pipeline.py --force

# Specific report type only
../venv/bin/python scripts/run_pipeline.py --type legacy --subtype fo

# Skip price download
../venv/bin/python scripts/run_pipeline.py --no-prices
```

---

## HTTPS (optional)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```
