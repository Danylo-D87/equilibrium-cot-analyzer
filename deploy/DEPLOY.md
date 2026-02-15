# Deployment Guide — Equilibrium

> Production deployment: nginx + FastAPI + auto-updates

---

## Architecture

```
nginx (port 80/443)
├── /             → frontend/dist/ (SPA)
├── /api/*        → proxy → FastAPI :8000
└── /data/*       → frontend/public/data/ (JSON, 1h cache)

FastAPI (uvicorn, 1 worker)
├── REST API           → /api/v1/cot/*
├── APScheduler
│   ├── COT update     → Friday 23:00 Kyiv
│   └── Price update   → Daily 00:00 Kyiv
└── SQLite             → backend/data/app.db
```

## Requirements

| | Version |
|---|---|
| OS | Ubuntu 22.04+ / Debian 12+ |
| Python | 3.10+ |
| Node.js | 20+ |
| nginx | latest |
| Disk | ~500 MB |

---

## Quick Setup (fresh server)

```bash
# 1. Clone
git clone https://github.com/Danylo-D87/equilibrium-cot-analyzer.git /opt/cftc

# 2. Run everything
sudo bash /opt/cftc/deploy/full-setup.sh
```

**What `full-setup.sh` does:**

1. Installs system packages (python3, nginx, git, curl)
2. Installs Node.js 20
3. Creates system user `cftc`
4. Sets up Python venv + installs deps
5. Builds frontend (`npm ci && vite build`)
6. Configures nginx (site config, enables, reloads)
7. Configures systemd service (enable + autostart)
8. Runs initial data pipeline (COT + prices, ~5–15 min)
9. Starts backend, verifies API + nginx + frontend
10. Runs health check

Full log saved to `/tmp/cftc-setup-*.log`.

---

## Update Code (from GitHub)

```bash
sudo bash /opt/cftc/deploy/update-code.sh
```

**What it does:** `git pull` → rebuild frontend → update configs if changed → restart backend.

**Data is NOT touched.** Existing database and JSON files stay as-is.

**Flags:**

| Flag | What |
|---|---|
| `--skip-frontend` | Backend-only update, skip `npm ci && vite build` |
| `--with-deps` | Also reinstall Python + Node dependencies |

```bash
# Examples
sudo bash /opt/cftc/deploy/update-code.sh --skip-frontend    # backend only
sudo bash /opt/cftc/deploy/update-code.sh --with-deps        # full reinstall
```

---

## Manual Data Update

```bash
cd /opt/cftc/backend
source ../venv/bin/activate

# Full pipeline (all reports + prices)
python scripts/run_pipeline.py --verbose

# Force re-download (ignore cache)
python scripts/run_pipeline.py --force

# Specific variant
python scripts/run_pipeline.py --type legacy --subtype fo

# Without prices
python scripts/run_pipeline.py --no-prices
```

---

## Service Management

```bash
# Status
sudo systemctl status cot-api.service

# Restart
sudo systemctl restart cot-api.service

# Stop
sudo systemctl stop cot-api.service

# Disable auto-start
sudo systemctl disable cot-api.service

# Live logs
sudo journalctl -u cot-api.service -f

# Last 50 log lines
sudo journalctl -u cot-api.service -n 50
```

---

## Monitoring

```bash
# API status
curl -s localhost:8000/api/v1/cot/status | python3 -m json.tool

# Data health check
cd /opt/cftc/backend && ../venv/bin/python scripts/health_check.py

# Nginx logs
tail -f /var/log/nginx/cot-access.log
tail -f /var/log/nginx/cot-error.log

# App logs
ls -la /opt/cftc/backend/logs/
```

---

## Auto-Updates

Built-in APScheduler, runs inside the FastAPI process. No cron needed.

| Job | Schedule | Timezone |
|---|---|---|
| COT data | Friday 23:00 | Europe/Kyiv |
| Prices (Yahoo) | Daily 00:00 | Europe/Kyiv |

CFTC publishes data every Friday ~15:30 ET → by 23:00 Kyiv it's always available.

**To disable auto-updates** — stop the backend service:
```bash
sudo systemctl stop cot-api.service
```

---

## HTTPS

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

Auto-renewal is set up automatically by certbot.

---

## Files

| File | Description |
|---|---|
| `full-setup.sh` | Full server setup from scratch |
| `update-code.sh` | Pull code + rebuild + restart (no data) |
| `cot-api.service` | Systemd unit for FastAPI backend |
| `nginx-cot.conf` | Nginx site config |
| `DEPLOY.md` | This file |

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Service won't start | `journalctl -u cot-api.service -n 50` |
| Port 8000 busy | `ss -tlnp \| grep 8000` → kill process |
| Nginx 502 | Backend not running → `systemctl start cot-api.service` |
| Stale data | `python scripts/run_pipeline.py --force --verbose` |
| Permission denied | `chown -R cftc:cftc /opt/cftc` |
| No JSON files | Run pipeline → exports to `frontend/public/data/` |
| Frontend 404 | Rebuild: `cd frontend && npm ci && npx vite build` |

---

## Nuke & Reinstall

```bash
# Backup data
sudo cp -r /opt/cftc/backend/data /tmp/cftc-data-backup

# Delete everything
sudo systemctl stop cot-api.service
sudo systemctl disable cot-api.service
sudo rm -rf /opt/cftc

# Clone fresh + setup
sudo git clone https://github.com/Danylo-D87/equilibrium-cot-analyzer.git /opt/cftc
sudo bash /opt/cftc/deploy/full-setup.sh

# (Optional) Restore data to skip re-download
sudo cp -r /tmp/cftc-data-backup/* /opt/cftc/backend/data/
sudo chown -R cftc:cftc /opt/cftc/backend/data
sudo systemctl restart cot-api.service
```
