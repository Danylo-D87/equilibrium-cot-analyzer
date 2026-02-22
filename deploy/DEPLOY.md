# Deployment Guide — Equilibrium

> Production deployment: nginx + FastAPI + PostgreSQL + Docker + auto-updates

---

## Architecture

```
nginx (port 80/443)
├── /               → frontend/dist/ (React SPA)
├── /api/*          → proxy → FastAPI :8000
└── /data/*         → frontend/public/data/ (JSON, 1h cache)

FastAPI (uvicorn, 1 worker)
├── REST API
│   ├── /api/v1/auth/*        → Auth (JWT, OAuth, email verification)
│   ├── /api/v1/users/*       → User management (admin)
│   ├── /api/v1/admin/*       → Admin analytics
│   ├── /api/v1/journal/*     → Trading journal (portfolios, trades, images)
│   ├── /api/v1/cot/*         → COT reports, screener, groups
│   └── /api/v1/market-data/* → BTC price feed (ccxt/Binance)
├── APScheduler
│   ├── COT update     → Friday 23:00 Kyiv
│   └── BTC price      → Every 60 min
├── PostgreSQL 16      → Auth, users, journal, permissions (Docker)
└── SQLite WAL         → COT data (backend/data/app.db)
```

---

## Requirements

| | Version |
|---|---|
| OS | Ubuntu 22.04+ / Debian 12+ |
| Python | 3.10+ |
| Node.js | 20+ |
| Docker | 24+ (with Compose V2) |
| nginx | latest |
| Disk | ~500 MB |

---

## Quick Setup (fresh server)

```bash
# 1. Clone
git clone https://github.com/Danylo-D87/equilibrium-cot-analyzer.git /opt/cftc

# 2. Create environment file
cp /opt/cftc/.env.example /opt/cftc/.env
nano /opt/cftc/.env    # Fill in secrets (see Environment Variables below)

# 3. Start PostgreSQL (Docker)
cd /opt/cftc
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 4. Run full setup
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

## Post-Setup: Database & Users

After the basic setup, initialize the PostgreSQL database:

```bash
cd /opt/cftc/backend
source ../venv/bin/activate

# Run Alembic migrations (creates all tables)
alembic upgrade head

# (Optional) Seed demo users with portfolios & trades
python seed_users.py
```

**Alembic Migrations:**

| Migration | Description |
|-----------|-------------|
| `001_initial_auth.py` | Users table with roles, permissions, email verification |
| `002_journal_tables.py` | Portfolios, trades, trade images |
| `003_image_caption.py` | Image caption field |
| `004_oauth_email_verification.py` | OAuth linking, email verification codes |

**Seed Users (development/testing only):**

| User | Email | Portfolios | Trades |
|------|-------|------------|--------|
| `trader_one` | trader_one@example.com | 2 | 50 |
| `trader_two` | trader_two@example.com | 4 | 100 |

> **Warning:** `seed_users.py` clears ALL existing users. Do not run in production with real data.

---

## Environment Variables

Create a `.env` file in the project root (`/opt/cftc/.env`). The backend loads it automatically via `python-dotenv`.

### Required (Production)

```bash
# ── General ──────────────────────────────────────────────────
APP_NAME="Equilibrium"
DEBUG=false

# ── PostgreSQL ───────────────────────────────────────────────
DATABASE_URL=postgresql+asyncpg://equilibrium:<STRONG_PASSWORD>@localhost:5432/equilibrium_db
POSTGRES_PASSWORD=<STRONG_PASSWORD>

# ── JWT (generate: openssl rand -hex 32) ─────────────────────
JWT_SECRET_KEY=<RANDOM_256_BIT_KEY>
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# ── Public URL ───────────────────────────────────────────────
APP_URL=https://equilibriumm.tech
BACKEND_URL=https://equilibriumm.tech
API_CORS_ORIGINS=https://equilibriumm.tech
```

### Optional (Features)

```bash
# ── Email (Resend.com) ──────────────────────────────────────
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=noreply@equilibriumm.tech
EMAIL_FROM_NAME=Equilibrium

# ── OAuth: Google ────────────────────────────────────────────
OAUTH_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
OAUTH_GOOGLE_CLIENT_SECRET=xxxxx

# ── OAuth: GitHub ────────────────────────────────────────────
OAUTH_GITHUB_CLIENT_ID=xxxxx
OAUTH_GITHUB_CLIENT_SECRET=xxxxx

# ── OAuth: LinkedIn ──────────────────────────────────────────
OAUTH_LINKEDIN_CLIENT_ID=xxxxx
OAUTH_LINKEDIN_CLIENT_SECRET=xxxxx

# ── Uploads ──────────────────────────────────────────────────
UPLOAD_DIR=/opt/cftc/backend/uploads
MAX_IMAGE_SIZE=5242880                 # 5 MB

# ── COT / Data ───────────────────────────────────────────────
DB_PATH=/opt/cftc/backend/data/app.db  # SQLite for COT
JSON_OUTPUT_DIR=/opt/cftc/frontend/public/data
LOG_DIR=/opt/cftc/backend/data/logs
DATA_STALE_DAYS=10
```

### All Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_NAME` | `Market Analytics Platform` | Application name |
| `DEBUG` | `false` | Debug mode |
| `DATABASE_URL` | `postgresql+asyncpg://...localhost:5432/equilibrium_db` | Async PG connection |
| `JWT_SECRET_KEY` | `CHANGE-ME-...` | **Must change!** JWT signing key |
| `JWT_ALGORITHM` | `HS256` | JWT algorithm |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | `15` | Access token TTL |
| `JWT_REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Refresh token TTL |
| `APP_URL` | `http://localhost:5173` | Public frontend URL |
| `BACKEND_URL` | `http://localhost:8000` | Public backend URL for OAuth callbacks |
| `API_HOST` | `127.0.0.1` | Uvicorn bind address |
| `API_PORT` | `8000` | Uvicorn port |
| `API_CORS_ORIGINS` | `http://localhost:5173,...` | Allowed CORS origins (comma-separated) |
| `RESEND_API_KEY` | _(empty)_ | Resend.com API key for emails |
| `EMAIL_FROM` | `noreply@equilibriumm.tech` | Sender email address |
| `EMAIL_FROM_NAME` | `Equilibrium` | Sender display name |
| `OAUTH_GOOGLE_CLIENT_ID` | _(empty)_ | Google OAuth client ID |
| `OAUTH_GOOGLE_CLIENT_SECRET` | _(empty)_ | Google OAuth client secret |
| `OAUTH_GITHUB_CLIENT_ID` | _(empty)_ | GitHub OAuth client ID |
| `OAUTH_GITHUB_CLIENT_SECRET` | _(empty)_ | GitHub OAuth client secret |
| `OAUTH_LINKEDIN_CLIENT_ID` | _(empty)_ | LinkedIn OAuth client ID |
| `OAUTH_LINKEDIN_CLIENT_SECRET` | _(empty)_ | LinkedIn OAuth client secret |
| `UPLOAD_DIR` | `backend/uploads` | Image upload directory |
| `MAX_IMAGE_SIZE` | `5242880` (5 MB) | Max upload file size |
| `DB_PATH` | `backend/data/app.db` | SQLite database path (COT) |
| `JSON_OUTPUT_DIR` | `frontend/public/data` | Exported JSON directory |
| `LOG_DIR` | `backend/data/logs` | Application log directory |
| `DATA_STALE_DAYS` | `10` | Data staleness threshold |
| `HTTP_TIMEOUT` | `60` | HTTP client timeout (sec) |
| `HTTP_RETRIES` | `3` | HTTP client retries |
| `POSTGRES_PASSWORD` | `dev_password` | Docker Compose PG password |

---

## Docker Compose — PostgreSQL

PostgreSQL runs in Docker. Two compose files:

### Development

```bash
docker compose up -d
# Creates: equilibrium-db on localhost:5432
# Credentials: equilibrium / dev_password / equilibrium_db
```

### Production

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Production overrides:
- Password from `POSTGRES_PASSWORD` env var (no default)
- Data stored at `/opt/cftc/pgdata` (host mount, not Docker volume)
- Port **not** exposed externally (internal network only)
- `restart: always`

### Database Backup / Restore

```bash
# Backup
docker exec equilibrium-db pg_dump -U equilibrium equilibrium_db > backup.sql

# Restore
docker exec -i equilibrium-db psql -U equilibrium equilibrium_db < backup.sql
```

---

## Upload Directory

Trade images are stored in `backend/uploads/images/{user_id}/`:

```bash
mkdir -p /opt/cftc/backend/uploads/images
chown -R cftc:cftc /opt/cftc/backend/uploads
```

Served via the FastAPI backend (not nginx). Max upload size: 5 MB by default.

---

## Update Code (from GitHub)

```bash
sudo bash /opt/cftc/deploy/update-code.sh
```

**What it does:** `git pull` → rebuild frontend → update configs if changed → restart backend.

**Data is NOT touched.** Existing databases (PostgreSQL + SQLite) and JSON files stay as-is.

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

**After updating** — run any new Alembic migrations:

```bash
cd /opt/cftc/backend
source ../venv/bin/activate
alembic upgrade head
sudo systemctl restart cot-api.service
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

### Docker (PostgreSQL)

```bash
# Status
docker compose ps

# Restart
docker compose restart postgres

# Logs
docker compose logs -f postgres

# Stop
docker compose down

# Stop + delete data (⚠ destructive)
docker compose down -v
```

---

## Monitoring

```bash
# API health
curl -s localhost:8000/api/v1/cot/status | python3 -m json.tool

# Auth health (check JWT is working)
curl -s localhost:8000/api/docs

# Data health check
cd /opt/cftc/backend && ../venv/bin/python scripts/health_check.py

# PostgreSQL connection check
docker exec equilibrium-db pg_isready -U equilibrium -d equilibrium_db

# Nginx logs
tail -f /var/log/nginx/cot-access.log
tail -f /var/log/nginx/cot-error.log

# App logs
ls -la /opt/cftc/backend/data/logs/
```

---

## Auto-Updates

Built-in APScheduler, runs inside the FastAPI process. No cron needed.

| Job | Schedule | Timezone |
|---|---|---|
| COT data | Friday 23:00 | Europe/Kyiv |
| BTC price | Every 60 minutes | Europe/Kyiv |

CFTC publishes data every Friday ~15:30 ET → by 23:00 Kyiv it's always available.

**To disable auto-updates** — stop the backend service:
```bash
sudo systemctl stop cot-api.service
```

---

## HTTPS

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d equilibriumm.tech -d www.equilibriumm.tech
```

Auto-renewal is set up automatically by certbot.

> **Important:** After enabling HTTPS, update `APP_URL`, `BACKEND_URL`, and `API_CORS_ORIGINS` in `.env` to use `https://` and restart the backend.

---

## Nginx Configuration

The nginx config (`deploy/nginx-cot.conf`) sets up:

| Location | Target | Cache | Description |
|----------|--------|-------|-------------|
| `/api/*` | `proxy_pass :8000` | — | FastAPI backend (auth, journal, COT, etc.) |
| `/` | `frontend/dist/` | — | React SPA (try_files → index.html) |
| `/data/*` | `frontend/public/data/` | 1 hour | Static JSON (COT exports) |
| `/assets/*` | — | 30 days | Vite build assets (immutable hashed) |

Security headers: `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`. Gzip enabled for JSON, CSS, JS.

---

## Systemd Service

The `deploy/cot-api.service` runs the backend:

```ini
User=cftc
WorkingDirectory=/opt/cftc/backend
ExecStart=/opt/cftc/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 1
Restart=always
```

Security hardening: `NoNewPrivileges=yes`, `ProtectSystem=strict`, `PrivateTmp=yes`.

**Adding environment variables to systemd:**

Option A — Use `.env` file (recommended, backend loads via python-dotenv):
```bash
# Ensure .env is in /opt/cftc/backend/.env or /opt/cftc/.env
```

Option B — systemd override:
```bash
sudo systemctl edit cot-api.service
# Add:
# [Service]
# Environment=DATABASE_URL=postgresql+asyncpg://...
# Environment=JWT_SECRET_KEY=...
```

---

## Files

| File | Description |
|---|---|
| `full-setup.sh` | Full server setup from scratch |
| `update-code.sh` | Pull code + rebuild + restart (no data) |
| `cot-api.service` | Systemd unit for FastAPI backend |
| `nginx-cot.conf` | Nginx site config (equilibriumm.tech) |
| `DEPLOY.md` | This file |

---

## Full Setup Checklist

| # | Step | Command / Action |
|---|------|-----------------|
| 1 | Clone repo | `git clone ... /opt/cftc` |
| 2 | Create `.env` | Fill all required env vars |
| 3 | Start PostgreSQL | `docker compose -f ... up -d` |
| 4 | Run setup script | `sudo bash deploy/full-setup.sh` |
| 5 | Run migrations | `alembic upgrade head` |
| 6 | Create uploads dir | `mkdir -p backend/uploads/images` |
| 7 | (Optional) Seed users | `python seed_users.py` |
| 8 | Enable HTTPS | `certbot --nginx -d equilibriumm.tech` |
| 9 | Update URLs in `.env` | Set `APP_URL`, `BACKEND_URL` to https |
| 10 | Restart backend | `systemctl restart cot-api.service` |
| 11 | Verify | `curl https://equilibriumm.tech/api/v1/cot/status` |

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Service won't start | `journalctl -u cot-api.service -n 50` |
| Port 8000 busy | `ss -tlnp \| grep 8000` → kill process |
| Nginx 502 | Backend not running → `systemctl start cot-api.service` |
| PostgreSQL down | `docker compose ps` → `docker compose up -d` |
| Migration fails | Check `DATABASE_URL` in `.env`, ensure PG is running |
| OAuth callback error | Verify `BACKEND_URL` and OAuth provider redirect URIs |
| Email not sending | Check `RESEND_API_KEY` — empty = email disabled |
| Stale COT data | `python scripts/run_pipeline.py --force --verbose` |
| Permission denied | `chown -R cftc:cftc /opt/cftc` |
| No JSON files | Run pipeline → exports to `frontend/public/data/` |
| Frontend 404 | Rebuild: `cd frontend && npm ci && npx vite build` |
| Upload fails | Check `UPLOAD_DIR` exists, owned by `cftc` user |
| JWT expired | Client handles refresh automatically via HttpOnly cookie |

---

## Nuke & Reinstall

```bash
# Backup databases
docker exec equilibrium-db pg_dump -U equilibrium equilibrium_db > /tmp/pg-backup.sql
sudo cp -r /opt/cftc/backend/data /tmp/cftc-data-backup
sudo cp -r /opt/cftc/backend/uploads /tmp/cftc-uploads-backup

# Delete everything
sudo systemctl stop cot-api.service
sudo systemctl disable cot-api.service
docker compose -f /opt/cftc/docker-compose.yml -f /opt/cftc/docker-compose.prod.yml down -v
sudo rm -rf /opt/cftc

# Clone fresh + setup
sudo git clone https://github.com/Danylo-D87/equilibrium-cot-analyzer.git /opt/cftc
sudo bash /opt/cftc/deploy/full-setup.sh
cd /opt/cftc && docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
cd /opt/cftc/backend && source ../venv/bin/activate && alembic upgrade head

# (Optional) Restore data
sudo cp -r /tmp/cftc-data-backup/* /opt/cftc/backend/data/
sudo cp -r /tmp/cftc-uploads-backup/* /opt/cftc/backend/uploads/
docker exec -i equilibrium-db psql -U equilibrium equilibrium_db < /tmp/pg-backup.sql
sudo chown -R cftc:cftc /opt/cftc/backend
sudo systemctl restart cot-api.service
```
