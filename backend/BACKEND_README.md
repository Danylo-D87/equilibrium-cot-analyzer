# 🐍 Backend — Equilibrium Market Analytics Platform

> **FastAPI + PostgreSQL + SQLite + APScheduler — auth system, trading journal, CFTC COT pipeline & REST API**

🇺🇸 [English](#-english) · 🇺🇦 [Українська](#-українська)

← Back to [Main README](../README.md)

---

<a id="-english"></a>

## 🇺🇸 English

### Overview

The backend is a Python application built with **FastAPI** that provides:

1. **Authentication** — JWT + refresh tokens, OAuth 2.0 (Google, GitHub), email verification
2. **User Management** — roles (admin/user), per-module permissions (`cot`, `journal`)
3. **Trading Journal** — portfolios, trades, image attachments, 15+ analytics endpoints
4. **COT Pipeline** — downloads, parses, stores, calculates & exports CFTC COT data
5. **Price Data** — Yahoo Finance (100+ tickers) + BTC benchmark (Binance/ccxt)
6. **REST API** — with Swagger/ReDoc docs, TTL caching, structured error handling
7. **Scheduler** — automatic updates via APScheduler (COT weekly, prices daily)

### Architecture

```
backend/
├── app/                        # Application package
│   ├── __init__.py
│   ├── main.py                 # FastAPI app factory + lifespan
│   │
│   ├── core/                   # Shared infrastructure
│   │   ├── config.py           # App settings (30+ env vars, dataclass)
│   │   ├── database.py         # Dual DB: SQLite (COT) + async PostgreSQL
│   │   ├── models.py           # SQLAlchemy models (User, Token, OAuth, Verify)
│   │   ├── security.py         # JWT tokens (HS256) + bcrypt hashing
│   │   ├── email.py            # Resend.com email service (verification, welcome)
│   │   ├── cache.py            # Generic TTL cache (thread-safe, max size)
│   │   ├── exceptions.py       # Exception hierarchy → HTTP errors
│   │   ├── logging.py          # Structured logging (file + console)
│   │   ├── migrations.py       # SQLite version-based schema migrations
│   │   └── scheduler.py        # APScheduler wrapper (pytz timezones)
│   │
│   ├── middleware/
│   │   └── auth.py             # JWT auth deps, permission & admin guards
│   │
│   ├── modules/                # Domain modules (plug-in style)
│   │   ├── auth/               # 🔐 Authentication
│   │   │   ├── router.py       # 11 endpoints: register, login, OAuth, etc.
│   │   │   ├── service.py      # Auth business logic (553 lines)
│   │   │   ├── schemas.py      # Pydantic request/response models
│   │   │   └── oauth.py        # OAuth 2.0 for Google & GitHub
│   │   │
│   │   ├── users/              # 👤 User management (admin only)
│   │   │   ├── router.py       # 7 endpoints: list, update, permissions
│   │   │   ├── service.py      # User CRUD + permission management
│   │   │   └── schemas.py      # Admin schemas
│   │   │
│   │   ├── admin/              # 📊 Admin statistics
│   │   │   └── router.py       # Aggregated user stats endpoint
│   │   │
│   │   ├── cot/                # 📈 COT reports module
│   │   │   ├── config.py       # COT-specific settings
│   │   │   ├── constants.py    # Column mappings for 3 report types
│   │   │   ├── downloader.py   # CFTC ZIP/CSV downloader
│   │   │   ├── parser.py       # CSV → normalized g1–g5 rows
│   │   │   ├── storage.py      # SQLite data-access layer (CRUD)
│   │   │   ├── calculator.py   # COT Index, WCI, crowded, signals
│   │   │   ├── exporter.py     # Static JSON file export
│   │   │   ├── pipeline.py     # Full pipeline orchestrator (with lock)
│   │   │   ├── service.py      # Read-only API service layer
│   │   │   ├── router.py       # /api/v1/cot/* endpoints
│   │   │   ├── dependencies.py # FastAPI dependency injection
│   │   │   └── scheduler.py    # Cron: Fri 23:00 Kyiv
│   │   │
│   │   ├── journal/            # 📓 Trading Journal
│   │   │   ├── models.py       # Portfolio, Trade, TradeImage, Settings
│   │   │   ├── schemas.py      # 35+ Pydantic schemas
│   │   │   ├── storage.py      # Async SQLAlchemy CRUD (524 lines)
│   │   │   ├── service.py      # Business logic bridge
│   │   │   ├── analyzer.py     # PortfolioAnalyzer (1296 lines, 15+ metrics)
│   │   │   ├── image_service.py # Image upload/compress/serve (WebP)
│   │   │   ├── config.py       # Module-specific settings
│   │   │   ├── dependencies.py # FastAPI dependencies
│   │   │   ├── router.py       # Sub-router aggregator
│   │   │   └── routers/        # Sub-routers
│   │   │       ├── settings.py     # GET/PUT journal settings
│   │   │       ├── portfolios.py   # Portfolio CRUD
│   │   │       ├── trades.py       # Trade CRUD + filtering + pagination
│   │   │       ├── images.py       # Upload/serve/delete/reorder/caption
│   │   │       ├── analytics.py    # 15+ chart/metric endpoints
│   │   │       └── enums.py        # Trade type/style/direction/status enums
│   │   │
│   │   ├── prices/             # 💰 Price data module
│   │   │   ├── config.py       # 100+ CFTC → Yahoo Finance ticker mappings
│   │   │   ├── yahoo.py        # Yahoo Finance downloader (yfinance)
│   │   │   ├── service.py      # PriceService (ThreadPoolExecutor, 23h cache)
│   │   │   └── scheduler.py    # Cron: daily 00:00 Kyiv
│   │   │
│   │   └── market_data/        # 📉 Market benchmark data
│   │       ├── router.py       # /api/v1/market-data/btc/* (status, refresh)
│   │       └── btc_service.py  # BTC price data via ccxt (Binance)
│   │
│   └── utils/                  # Shared helpers
│       └── categories.py       # Market categorization & meta builders
│
├── alembic/                    # PostgreSQL migrations
│   ├── env.py                  # Alembic environment
│   └── versions/               # Migration files
│       ├── 001_initial_auth.py         # users, permissions, refresh_tokens
│       ├── 002_journal_tables.py       # portfolios, trades, images, settings
│       ├── 003_image_caption.py        # Add caption to trade_images
│       └── 004_oauth_email_verification.py  # oauth_accounts, email_verifications
│
├── scripts/                    # CLI entry points
│   ├── run_server.py           # Start API server (uvicorn)
│   ├── run_pipeline.py         # Run COT data pipeline
│   ├── auto_update.py          # Cron/timer entry point
│   └── health_check.py         # Data diagnostics
│
├── data/                       # Runtime data
│   ├── app.db                  # SQLite database (COT, generated)
│   ├── ticker_map.json         # CFTC→Yahoo ticker map
│   └── logs/                   # Log files
│
├── uploads/                    # Journal image storage
│   └── images/{user_id}/       # Per-user image directories
│
├── tests/                      # Test suite
│   ├── __init__.py
│   └── conftest.py
│
├── alembic.ini                 # Alembic configuration
├── seed_users.py               # Seed initial admin user
├── pyproject.toml              # Project metadata & tool config
└── requirements.txt            # Dependencies
```

---

### Quick Start

```bash
cd backend

# Create virtual environment & install dependencies
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/macOS
pip install -r requirements.txt

# Start PostgreSQL (from project root)
cd .. && docker compose up -d && cd backend

# Run Alembic migrations (PostgreSQL)
alembic upgrade head

# Seed initial admin user
python seed_users.py

# Run initial data pipeline (downloads COT + prices, ~5 min)
python scripts/run_pipeline.py --verbose

# Start API server
python scripts/run_server.py

# Health check
python scripts/health_check.py
```

**API docs:** http://localhost:8000/api/docs
**ReDoc:** http://localhost:8000/api/redoc

---

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| **General** | | |
| `APP_NAME` | `Market Analytics Platform` | Application name |
| `DEBUG` | `false` | Enable debug mode (verbose logging) |
| `DB_PATH` | `data/app.db` | SQLite database file path (COT) |
| `JSON_OUTPUT_DIR` | `../frontend/public/data` | Directory for exported JSON files |
| `LOG_DIR` | `data/logs` | Directory for log files |
| **API Server** | | |
| `API_HOST` | `127.0.0.1` | API server bind host |
| `API_PORT` | `8000` | API server bind port |
| `API_CORS_ORIGINS` | `http://localhost:5173,...` | Comma-separated CORS origins |
| **HTTP Client** | | |
| `HTTP_TIMEOUT` | `60` | HTTP client timeout (seconds) |
| `HTTP_RETRIES` | `3` | HTTP retry attempts |
| `HTTP_RETRY_BACKOFF` | `2` | Base backoff seconds for retries |
| `DATA_STALE_DAYS` | `10` | Days before data is considered stale |
| **PostgreSQL** | | |
| `DATABASE_URL` | `postgresql+asyncpg://equilibrium:dev_password@localhost:5432/equilibrium_db` | Async PostgreSQL connection |
| `POSTGRES_PASSWORD` | `dev_password` | Docker PostgreSQL password |
| `POSTGRES_PORT` | `5432` | Docker PostgreSQL port |
| **JWT** | | |
| `JWT_SECRET_KEY` | `CHANGE-ME-TO-...` | JWT signing key (**change in production!**) |
| `JWT_ALGORITHM` | `HS256` | JWT algorithm |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | `15` | Access token TTL |
| `JWT_REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Refresh token TTL |
| **Email (Resend.com)** | | |
| `RESEND_API_KEY` | `""` | Resend.com API key (empty = debug mode) |
| `EMAIL_FROM` | `noreply@equilibriumm.tech` | Sender email address |
| `EMAIL_FROM_NAME` | `Equilibrium` | Sender display name |
| **OAuth** | | |
| `OAUTH_GOOGLE_CLIENT_ID` | `""` | Google OAuth client ID |
| `OAUTH_GOOGLE_CLIENT_SECRET` | `""` | Google OAuth client secret |
| `OAUTH_GITHUB_CLIENT_ID` | `""` | GitHub OAuth client ID |
| `OAUTH_GITHUB_CLIENT_SECRET` | `""` | GitHub OAuth client secret |
| `OAUTH_LINKEDIN_CLIENT_ID` | `""` | LinkedIn OAuth client ID |
| `OAUTH_LINKEDIN_CLIENT_SECRET` | `""` | LinkedIn OAuth client secret |
| `BACKEND_URL` | `http://localhost:8000` | Backend public URL (OAuth callbacks) |
| **Uploads** | | |
| `UPLOAD_DIR` | `backend/uploads` | Image upload directory |
| `MAX_IMAGE_SIZE` | `5242880` | Max upload size (5 MB) |
| `APP_URL` | `http://localhost:5173` | Frontend public URL (emails, OAuth) |
| **COT Module** | | |
| `COT_YEARS` | `5` | Years of historical COT data |
| `COT_CROWDED_BUY` | `80` | COT Index threshold for BUY crowded signal |
| `COT_CROWDED_SELL` | `20` | COT Index threshold for SELL crowded signal |
| `PRICE_YEARS` | `3` | Years of Yahoo Finance price history |
| `TICKER_MAP_PATH` | `data/ticker_map.json` | Path to custom ticker map JSON |

---

### API Endpoints

#### Auth Module — `/api/v1/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register` | — | Register (returns 202, sends 6-digit email code) |
| `POST` | `/auth/verify-email` | — | Verify email code → issues JWT access + refresh tokens |
| `POST` | `/auth/resend-verification` | — | Resend verification code |
| `POST` | `/auth/login` | — | Login → access token (body) + HttpOnly refresh cookie |
| `POST` | `/auth/refresh` | Cookie | Refresh access token via HttpOnly cookie |
| `POST` | `/auth/logout` | ✅ | Revoke refresh token, clear cookie |
| `GET` | `/auth/me` | ✅ | Get current user profile |
| `PUT` | `/auth/me` | ✅ | Update profile (nickname, language, timezone) |
| `PUT` | `/auth/me/password` | ✅ | Change password |
| `GET` | `/auth/oauth/{provider}` | — | Initiate OAuth flow (google/github) |
| `GET` | `/auth/oauth/{provider}/callback` | — | OAuth callback handler |

**Auth flow:**
- **Registration:** `register` → 6-digit email code (10 min TTL) → `verify-email` → JWT tokens issued
- **Login:** `login` → access token (15 min) + refresh token as HttpOnly/Secure/SameSite cookie (7 days)
- **Token refresh:** `refresh` reads HttpOnly cookie → returns new access token
- **OAuth:** Redirect to provider → callback receives code → auto-register or login → redirect to frontend with access token
- **Re-registration:** Allowed for unverified accounts (updates credentials, resends code)

**JWT payload:** `sub` (user_id), `role`, `perms` (list), `exp`, `iat`, `type`

#### Users Module — `/api/v1/users` (admin only)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/users` | List all users |
| `GET` | `/users/{id}` | User detail |
| `PUT` | `/users/{id}` | Update user (role, active, nickname) |
| `DELETE` | `/users/{id}` | Deactivate user (soft delete) |
| `GET` | `/users/{id}/permissions` | List user permissions |
| `POST` | `/users/{id}/permissions` | Grant permission (`cot` or `journal`) |
| `DELETE` | `/users/{id}/permissions/{perm}` | Revoke permission |

#### Admin Module — `/api/v1/admin` (admin only)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/stats` | Aggregated user statistics with date range filter |

Returns: total/active/inactive/verified/unverified users, breakdown by role and permission, registrations per day.

#### COT Module — `/api/v1/cot`

| Method | Path | Cache TTL | Description |
|--------|------|-----------|-------------|
| `GET` | `/cot/markets/{report_type}/{subtype}` | 10 min | List all markets for a report type/subtype |
| `GET` | `/cot/markets/{report_type}/{subtype}/{code}` | 10 min | Full market data: weeks, stats, groups, prices |
| `GET` | `/cot/screener/{report_type}/{subtype}` | 5 min | Screener data with optional `limit`/`offset` |
| `GET` | `/cot/groups/{report_type}` | — | Trader group definitions |
| `GET` | `/cot/status` | — | System status: DB, scheduler, data freshness |

**Path parameters:**

| Parameter | Values | Description |
|-----------|--------|-------------|
| `report_type` | `legacy`, `disagg`, `tff` | COT report type |
| `subtype` | `fo`, `co` | Futures Only or Futures + Options Combined |
| `code` | e.g. `099741` | CFTC contract market code |

#### Journal Module — `/api/v1/journal` (requires `journal` permission)

**Settings:**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/journal/settings` | Get user's journal settings |
| `PUT` | `/journal/settings` | Update settings (initial_balance, risk_free_rate, currency, display_mode) |

**Portfolios:**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/journal/portfolios` | List portfolios |
| `POST` | `/journal/portfolios` | Create portfolio |
| `PUT` | `/journal/portfolios/{id}` | Update portfolio |
| `DELETE` | `/journal/portfolios/{id}` | Delete portfolio |

**Trades:**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/journal/trades` | List trades (with filters, pagination) |
| `POST` | `/journal/trades` | Create trade |
| `PUT` | `/journal/trades/{id}` | Update trade |
| `DELETE` | `/journal/trades/{id}` | Delete trade |

**Images:**

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/journal/trades/{id}/images` | Upload image (auto WebP compress) |
| `GET` | `/journal/images/{id}` | Serve image (with `thumb` param) |
| `DELETE` | `/journal/images/{id}` | Delete image |
| `PUT` | `/journal/images/{id}/caption` | Update image caption |
| `PUT` | `/journal/trades/{id}/images/reorder` | Reorder images |

**Analytics (all accept filter params: `portfolio_id`, `date_from`, `date_to`):**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/journal/metrics` | Key portfolio metrics |
| `GET` | `/journal/equity-curve` | Equity curve data |
| `GET` | `/journal/assets-exposure` | Assets exposure breakdown |
| `GET` | `/journal/alpha-curve` | Alpha vs benchmark curve |
| `GET` | `/journal/drawdown` | Drawdown analysis |
| `GET` | `/journal/rolling-metrics` | Rolling Sharpe, Sortino, etc. |
| `GET` | `/journal/daily-returns` | Daily returns distribution |
| `GET` | `/journal/rolling-win-rate` | Rolling win rate |
| `GET` | `/journal/r-multiple-distribution` | R-multiple distribution |
| `GET` | `/journal/risk-adjusted-comparison` | Risk-adjusted comparison |
| `GET` | `/journal/nav-history` | NAV history |
| `GET` | `/journal/rolling-information-ratio` | Rolling information ratio |
| `GET` | `/journal/expected-vs-actual` | Expected vs actual returns |
| `GET` | `/journal/comparative-drawdown` | Comparative drawdown |
| `GET` | `/journal/nav-vs-hwm` | NAV vs High Water Mark |
| `GET` | `/journal/rolling-tracking-error` | Rolling tracking error |

**Enums:**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/journal/enums` | Trade type, style, direction, status options |

#### Market Data Module — `/api/v1/market-data`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/market-data/btc/status` | BTC cache status (dates, price, staleness) |
| `POST` | `/market-data/btc/refresh` | Force-refresh BTC price cache |

---

### Database Architecture

**Dual-database approach:**

| Database | Engine | Purpose |
|----------|--------|---------|
| **SQLite** | WAL mode, file-based | COT data storage (265K+ records) |
| **PostgreSQL 16** | async via asyncpg + SQLAlchemy 2.0 | Auth, users, journal, all new modules |

PostgreSQL runs in Docker (see `docker-compose.yml`). Managed via **Alembic** migrations.

#### PostgreSQL Models (`app/core/models.py`)

| Model | Key Fields |
|-------|------------|
| **User** | email, password_hash (nullable for OAuth), nickname, language, timezone, role (`admin`/`user`), is_active, email_verified |
| **UserPermission** | user_id, permission (`cot`/`journal`), granted_at, granted_by |
| **RefreshToken** | user_id, token_hash (SHA-256), expires_at, revoked |
| **OAuthAccount** | user_id, provider (google/github/linkedin), provider_user_id, provider_email |
| **EmailVerification** | user_id, code_hash (SHA-256), expires_at, used |

#### Journal Models (`app/modules/journal/models.py`)

| Model | Key Fields |
|-------|------------|
| **Portfolio** | user_id, name, initial_capital, description, is_active, timestamps |
| **Trade** | user_id, portfolio_id, date, pair, type (Option/Futures/Crypto), style (Swing/Intraday/Smart Idea), direction (Long/Short), status (TP/SL/BE/Active), risk_amount, profit_amount, rr_ratio, entry_price, exit_price, notes |
| **TradeImage** | trade_id, user_id, filename, storage_path, sort_order, file_size, mime_type, caption |
| **UserJournalSettings** | user_id (PK), initial_balance, risk_free_rate, default_currency, display_mode |

#### Alembic Migrations

| Version | Description |
|---------|-------------|
| `001_initial_auth` | `users`, `user_permissions`, `refresh_tokens` tables |
| `002_journal_tables` | `portfolios`, `trades`, `trade_images`, `user_journal_settings` |
| `003_image_caption` | Add `caption` column to `trade_images` |
| `004_oauth_email_verification` | `oauth_accounts`, `email_verifications` tables; `password_hash` nullable |

#### SQLite Schema (COT)

| Table | Description |
|-------|-------------|
| `cot_data` | COT report rows (UNIQUE: report_type, subtype, date, code) |
| `download_log` | Tracks downloaded years |
| `schema_version` | Migration tracking |

---

### Security & Auth

#### Password Hashing
- **bcrypt** (direct, Python 3.12+ compatible)
- No passlib dependency at runtime

#### JWT Tokens
- Algorithm: HS256
- Access token: 15 min TTL, payload: `sub`, `role`, `perms`, `exp`, `iat`, `type`
- Issued in response body

#### Refresh Tokens
- Opaque: `secrets.token_urlsafe(64)`
- Stored as SHA-256 hash in PostgreSQL
- Delivered via HttpOnly / Secure / SameSite=Lax cookie
- TTL: 7 days

#### OAuth 2.0
- Google, GitHub (LinkedIn config exists, not fully wired)
- Flow: redirect → provider auth → callback → auto-register or login → redirect to frontend

#### Email Verification
- 6-digit code, SHA-256 stored, 10 min TTL
- Sent via Resend.com REST API
- Debug mode: prints to console when `RESEND_API_KEY` is empty

#### Auth Middleware (`middleware/auth.py`)
- `get_current_user` — decode JWT, lookup PostgreSQL
- `get_current_active_user` — verify user is active
- `require_permission(perm)` — dependency factory checking permission
- `require_admin()` — dependency factory checking role == `admin`

---

### Exception Hierarchy

```
AppError (base, HTTP 500)
├── NotFoundError (404)
├── AuthenticationError (401)
├── ForbiddenError (403)
├── ConflictError (409)
├── ValidationError (422)
└── ExternalServiceError (502)
```

All exceptions caught by a single FastAPI handler returning structured JSON:
```json
{
  "detail": "Market 099741 not found"
}
```

---

### COT Data Pipeline

```
┌─────────────┐    ┌──────────┐    ┌──────────┐    ┌────────────┐
│  Downloader  │───▶│  Parser   │───▶│  Storage  │───▶│ Calculator │
│  (CFTC ZIP)  │    │ (CSV→g1-5)│    │  (SQLite) │    │ (Indexes)  │
└─────────────┘    └──────────┘    └──────────┘    └─────┬──────┘
                                                         │
┌─────────────┐    ┌──────────┐                          │
│  Price Svc   │───▶│ Exporter  │◀─────────────────────────┘
│  (Yahoo Fin) │    │  (JSON)   │
└─────────────┘    └──────────┘
```

**Step-by-step:**

1. **Lock acquisition** — File-based lock (`pipeline.lock`) with PID check
2. **For each `report_type × subtype` (6 combinations):**
   - Check `download_log` — skip downloaded years (unless `--force`)
   - Download yearly ZIPs from CFTC.gov
   - Parse CSV → normalize to unified `g1–g5` schema
   - Upsert rows to SQLite
   - Download & parse current week TXT
3. **Download prices** — CFTC codes → Yahoo Finance tickers, ThreadPoolExecutor (4 workers)
4. **Export JSON** — per-market detail, screener data, group definitions
5. **Lock release**

---

### Report Types & Trader Groups

| Report Type | Key | Groups |
|---|---|---|
| **Legacy** | `legacy` | g1: Large Speculators (speculative, has_spread) · g2: Commercials (commercial) · g3: Small Traders (small) |
| **Disaggregated** | `disagg` | g1: Producer/Merchant (commercial) · g2: Swap Dealers (commercial, has_spread) · g3: Managed Money (speculative, has_spread) · g4: Other Reportables (speculative, has_spread) · g5: Non-Reportable (small) |
| **TFF** | `tff` | g1: Dealer/Intermediary (commercial, has_spread) · g2: Asset Manager (speculative, has_spread) · g3: Leveraged Funds (speculative, has_spread) · g4: Other Reportables (speculative, has_spread) · g5: Non-Reportable (small) |

---

### Calculated Indicators & Formulas

#### Per-Week Calculations

| Indicator | Formula |
|-----------|---------|
| **Net Position** | `net = g_k_long - g_k_short` |
| **Net Change** | `net_change = g_k_long_change - g_k_short_change` |
| **% Net/OI** | `pct_net_oi = (net / open_interest) × 100` |
| **OI %** | `oi_pct = (oi_change / open_interest) × 100` |

#### Series-Based Indicators

| Indicator | Lookback | Formula |
|-----------|----------|---------|
| **COT Index 3m** | 13 weeks | `(net - min(window)) / (max(window) - min(window)) × 100` |
| **COT Index 1y** | 52 weeks | Same formula, 52-week window |
| **COT Index 3y** | 156 weeks | Same formula, 156-week window |
| **WCI** (Willco Commitment Index) | 26 weeks | Same formula, 26-week window |

> Returns 50.0 when `min = max` (no range available).

#### Crowded Level

Based on **1Y COT Index** with role-based signal interpretation:

| Trader Role | COT Index ≥ 80 | COT Index ≤ 20 |
|-------------|-----------------|-----------------|
| **Commercial** | `BUY` signal | `SELL` signal |
| **Speculative** | `SELL` signal | `BUY` signal |
| **Small** | `SELL` signal | `BUY` signal |

---

### Caching Architecture

| Cache | TTL | Scope | Description |
|-------|-----|-------|-------------|
| Market detail | 10 min | API router | `/cot/markets/{type}/{subtype}/{code}` |
| Markets list | 10 min | API router | `/cot/markets/{type}/{subtype}` |
| Screener | 5 min | API router | `/cot/screener/{type}/{subtype}` |
| Price data | 23 hours | PriceService class | Yahoo Finance OHLCV per ticker |

All API caches are **thread-safe** (lock-based) with periodic cleanup. Caches invalidated after each pipeline run.

---

### Scheduler Configuration

| Job ID | Schedule | Timezone | Description |
|--------|----------|----------|-------------|
| `weekly_cot_update` | **Friday 23:00** | `Europe/Kyiv` | Full COT pipeline (download + calculate + export) |
| `daily_price_update` | **Daily 00:00** | `Europe/Kyiv` | Yahoo Finance prices → re-export JSON |

Both use APScheduler `CronTrigger` with `misfire_grace_time=3600`.

---

### Image Handling (Journal)

- Auto-compression to **WebP** (max 1920px width, quality 85)
- Auto-thumbnail generation (400px, quality 75)
- Per-user isolation: `uploads/images/{user_id}/{uuid}.webp`
- Max **10 images** per trade, max **5 MB** per upload
- Supports drag-and-drop reordering and captions

---

### CLI Scripts

#### `run_server.py`

```bash
python scripts/run_server.py [--reload]
```

#### `run_pipeline.py`

```bash
python scripts/run_pipeline.py [OPTIONS]

Options:
  --force               Force re-download all years
  --type TYPE           Only process: legacy, disagg, tff
  --subtype SUBTYPE     Only process: fo, co
  --no-prices           Skip price download
  --verbose, -v         Verbose logging
  --log-file PATH       Log to file
```

#### `auto_update.py`

```bash
python scripts/auto_update.py [OPTIONS]

Options:
  --force               Force re-download
  --dry-run             Check health only
  --no-prices           Skip price download
  --type TYPE           Specific report type
  --subtype SUBTYPE     Specific subtype
  --verbose, -v         Verbose logging
```

#### `health_check.py`

```bash
python scripts/health_check.py [--json]
```

---

### Dependencies

**Core:**

| Package | Purpose |
|---------|---------|
| `fastapi` ≥ 0.104 | Web framework |
| `uvicorn[standard]` ≥ 0.24 | ASGI server |
| `sqlalchemy[asyncio]` ≥ 2.0 | Async ORM (PostgreSQL) |
| `asyncpg` | PostgreSQL async driver |
| `alembic` | Database migrations |
| `requests` ≥ 2.31 | HTTP client (CFTC downloads) |
| `apscheduler` ≥ 3.10, < 4 | Background scheduling |
| `yfinance` ≥ 0.2.31 | Yahoo Finance API |
| `pytz` ≥ 2024.1 | Timezone support |

**Auth:**

| Package | Purpose |
|---------|---------|
| `python-jose[cryptography]` | JWT tokens |
| `passlib[bcrypt]` | Password hashing |
| `python-multipart` | File upload support |
| `authlib` ≥ 1.3 | OAuth library |
| `httpx` ≥ 0.25 | Async HTTP client (OAuth, Resend) |
| `resend` ≥ 2.0 | Email service SDK |
| `email-validator` | Email validation |
| `pydantic-settings` | Settings management |

**Journal:**

| Package | Purpose |
|---------|---------|
| `pandas` ≥ 2.2 | Portfolio analytics |
| `numpy` ≥ 1.26 | Portfolio analytics |
| `ccxt` ≥ 4 | Binance BTC benchmark data |
| `aiofiles` | Async file I/O (images) |
| `Pillow` | Image compression/thumbnails (WebP) |

---

### Adding a New Module

1. Create `app/modules/your_module/` with `__init__.py`
2. Add `config.py` for module-specific settings
3. Implement domain logic (storage, service, etc.)
4. Create `router.py` with a FastAPI `APIRouter`
5. Mount the router in `app/main.py`:
   ```python
   from app.modules.your_module.router import router as ym_router
   app.include_router(ym_router, prefix="/api/v1")
   ```
6. If it uses PostgreSQL, create models in `models.py` and add Alembic migration
7. (Optional) Register scheduled jobs in `scheduler.py`

---

<a id="-українська"></a>

## 🇺🇦 Українська

### Огляд

Бекенд — це Python-додаток на **FastAPI**, який надає:

1. **Аутентифікацію** — JWT + refresh-токени, OAuth 2.0 (Google, GitHub), верифікація email
2. **Управління користувачами** — ролі (admin/user), per-module дозволи (`cot`, `journal`)
3. **Торговий журнал** — портфелі, угоди, вкладені зображення, 15+ ендпоінтів аналітики
4. **COT-пайплайн** — завантаження, парсинг, зберігання, розрахунки та експорт даних CFTC COT
5. **Цінові дані** — Yahoo Finance (100+ тікерів) + BTC бенчмарк (Binance/ccxt)
6. **REST API** — з документацією Swagger/ReDoc, TTL кешуванням, структурованою обробкою помилок
7. **Шедулер** — автоматичні оновлення через APScheduler (COT щотижня, ціни щодня)

---

### Швидкий старт

```bash
cd backend

# Створити віртуальне середовище та встановити залежності
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/macOS
pip install -r requirements.txt

# Запустити PostgreSQL (з кореня проекту)
cd .. && docker compose up -d && cd backend

# Запустити Alembic міграції (PostgreSQL)
alembic upgrade head

# Створити початкового адміна
python seed_users.py

# Запустити початковий пайплайн (COT + ціни, ~5 хв)
python scripts/run_pipeline.py --verbose

# Запустити API сервер
python scripts/run_server.py

# Перевірка стану даних
python scripts/health_check.py
```

**Документація API:** http://localhost:8000/api/docs
**ReDoc:** http://localhost:8000/api/redoc

---

### Змінні оточення

| Змінна | За замовч. | Опис |
|--------|-----------|------|
| **Загальні** | | |
| `APP_NAME` | `Market Analytics Platform` | Назва додатку |
| `DEBUG` | `false` | Увімкнути режим відладки |
| `DB_PATH` | `data/app.db` | Шлях до SQLite бази (COT) |
| `JSON_OUTPUT_DIR` | `../frontend/public/data` | Директорія для експорту JSON |
| `LOG_DIR` | `data/logs` | Директорія логів |
| **API Сервер** | | |
| `API_HOST` | `127.0.0.1` | Хост API сервера |
| `API_PORT` | `8000` | Порт API сервера |
| `API_CORS_ORIGINS` | `http://localhost:5173,...` | CORS-дозволені джерела |
| **PostgreSQL** | | |
| `DATABASE_URL` | `postgresql+asyncpg://...` | Async PostgreSQL підключення |
| `POSTGRES_PASSWORD` | `dev_password` | Docker PostgreSQL пароль |
| **JWT** | | |
| `JWT_SECRET_KEY` | `CHANGE-ME-TO-...` | Ключ підпису JWT (**змінити в прод!**) |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | `15` | TTL access-токена |
| `JWT_REFRESH_TOKEN_EXPIRE_DAYS` | `7` | TTL refresh-токена |
| **Email** | | |
| `RESEND_API_KEY` | `""` | API ключ Resend.com (порожній = debug) |
| `EMAIL_FROM` | `noreply@equilibriumm.tech` | Email відправника |
| **OAuth** | | |
| `OAUTH_GOOGLE_CLIENT_ID` | `""` | Google OAuth ID |
| `OAUTH_GOOGLE_CLIENT_SECRET` | `""` | Google OAuth секрет |
| `OAUTH_GITHUB_CLIENT_ID` | `""` | GitHub OAuth ID |
| `OAUTH_GITHUB_CLIENT_SECRET` | `""` | GitHub OAuth секрет |
| `BACKEND_URL` | `http://localhost:8000` | Публічний URL бекенду (OAuth callbacks) |
| **Завантаження** | | |
| `UPLOAD_DIR` | `backend/uploads` | Директорія зображень |
| `MAX_IMAGE_SIZE` | `5242880` | Макс. розмір завантаження (5 МБ) |
| `APP_URL` | `http://localhost:5173` | Публічний URL фронтенду |

---

### API Ендпоінти

#### Auth — `/api/v1/auth`

| Метод | Шлях | Auth | Опис |
|-------|------|------|------|
| `POST` | `/auth/register` | — | Реєстрація (надсилає 6-значний код) |
| `POST` | `/auth/verify-email` | — | Верифікація email → видача JWT |
| `POST` | `/auth/login` | — | Логін → access + HttpOnly refresh cookie |
| `POST` | `/auth/refresh` | Cookie | Оновити access token |
| `POST` | `/auth/logout` | ✅ | Відкликати refresh token |
| `GET` | `/auth/me` | ✅ | Профіль поточного користувача |
| `PUT` | `/auth/me` | ✅ | Оновити профіль |
| `PUT` | `/auth/me/password` | ✅ | Змінити пароль |
| `GET` | `/auth/oauth/{provider}` | — | Ініціювати OAuth (google/github) |

#### Users — `/api/v1/users` (тільки адмін)

| Метод | Шлях | Опис |
|-------|------|------|
| `GET` | `/users` | Список користувачів |
| `GET` | `/users/{id}` | Деталі користувача |
| `PUT` | `/users/{id}` | Оновити (роль, активність, нікнейм) |
| `DELETE` | `/users/{id}` | Деактивувати (soft delete) |
| `POST` | `/users/{id}/permissions` | Видати дозвіл (`cot`/`journal`) |
| `DELETE` | `/users/{id}/permissions/{perm}` | Відкликати дозвіл |

#### COT — `/api/v1/cot`

| Метод | Шлях | Кеш TTL | Опис |
|-------|------|---------|------|
| `GET` | `/cot/markets/{type}/{subtype}` | 10 хв | Список ринків |
| `GET` | `/cot/markets/{type}/{subtype}/{code}` | 10 хв | Повні дані ринку |
| `GET` | `/cot/screener/{type}/{subtype}` | 5 хв | Скринер |
| `GET` | `/cot/groups/{type}` | — | Визначення груп трейдерів |
| `GET` | `/cot/status` | — | Стан системи |

#### Journal — `/api/v1/journal` (потребує дозвіл `journal`)

Підроутери: settings, portfolios, trades, images, analytics, enums.

15+ ендпоінтів аналітики: `/metrics`, `/equity-curve`, `/drawdown`, `/alpha-curve`, `/rolling-metrics`, `/daily-returns`, `/rolling-win-rate`, `/r-multiple-distribution`, `/risk-adjusted-comparison`, `/nav-history`, `/rolling-information-ratio`, `/expected-vs-actual`, `/comparative-drawdown`, `/nav-vs-hwm`, `/rolling-tracking-error`.

---

### Архітектура баз даних

**Дуальний підхід:**

| База даних | Движок | Призначення |
|------------|--------|-------------|
| **SQLite** | WAL, файловий | Дані COT (265K+ записів) |
| **PostgreSQL 16** | async asyncpg + SQLAlchemy 2.0 | Auth, users, journal, всі нові модулі |

PostgreSQL працює в Docker. Керується через **Alembic** міграції (4 версії).

---

### Безпека та Auth

- **bcrypt** для хешування паролів
- **JWT** access-токени (HS256, 15 хв)
- **Opaque refresh-токени** (SHA-256 в БД, HttpOnly cookie, 7 днів)
- **OAuth 2.0** — Google, GitHub
- **Email верифікація** — 6-значний код через Resend.com (10 хв TTL)

---

### COT-пайплайн

```
┌─────────────┐    ┌──────────┐    ┌──────────┐    ┌────────────┐
│  Downloader  │───▶│  Parser   │───▶│  Storage  │───▶│ Calculator │
│  (CFTC ZIP)  │    │ (CSV→g1-5)│    │  (SQLite) │    │ (Індекси)  │
└─────────────┘    └──────────┘    └──────────┘    └─────┬──────┘
                                                         │
┌─────────────┐    ┌──────────┐                          │
│  Price Svc   │───▶│ Exporter  │◀─────────────────────────┘
│ (Yahoo Fin)  │    │  (JSON)   │
└─────────────┘    └──────────┘
```

---

### Обробка зображень (Journal)

- Авто-компресія у **WebP** (макс. 1920px, якість 85)
- Авто-мініатюри (400px, якість 75)
- Ізоляція по користувачах: `uploads/images/{user_id}/{uuid}.webp`
- Макс. **10 зображень** на угоду, **5 МБ** на файл
- Підтримка перетягування та підписів

---

### Шедулер

| Job ID | Розклад | Часовий пояс | Опис |
|--------|---------|-------------|------|
| `weekly_cot_update` | **П'ятниця 23:00** | `Europe/Kyiv` | Повний COT пайплайн |
| `daily_price_update` | **Щоденно 00:00** | `Europe/Kyiv` | Оновлення цін Yahoo Finance |

---

### Залежності

**Core:** fastapi, uvicorn, sqlalchemy[asyncio], asyncpg, alembic, requests, apscheduler, yfinance, pytz

**Auth:** python-jose, passlib[bcrypt], python-multipart, authlib, httpx, resend, email-validator, pydantic-settings

**Journal:** pandas, numpy, ccxt, aiofiles, Pillow

---

### Додавання нового модуля

1. Створити `app/modules/your_module/` з `__init__.py`
2. Додати `config.py` для налаштувань
3. Реалізувати доменну логіку
4. Створити `router.py` з FastAPI `APIRouter`
5. Підключити у `app/main.py`
6. Якщо використовує PostgreSQL — створити моделі та Alembic міграцію
7. (Опціонально) Зареєструвати заплановані задачі
