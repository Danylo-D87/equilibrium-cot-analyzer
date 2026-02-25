# 📊 Equilibrium — Market Analytics Platform

> **Full-stack financial analytics: CFTC COT data pipeline, Trading Journal, Auth system, REST API & interactive dashboard**

🇺🇸 [English](#-english) · 🇺🇦 [Українська](#-українська)

---

## 📚 Documentation / Документація

| Document | Description / Опис |
|----------|-------------------|
| 📖 **[README.md](README.md)** | Main overview / Головний огляд (this file) |
| 🐍 **[backend/BACKEND_README.md](backend/BACKEND_README.md)** | Backend: API, modules, database, auth, configuration |
| ⚛️ **[frontend/FRONTEND_README.md](frontend/FRONTEND_README.md)** | Frontend: components, state, routing, auth, journal, charts |
| 🚀 **[deploy/DEPLOY.md](deploy/DEPLOY.md)** | Deployment: Docker, nginx, systemd, HTTPS, monitoring |

---

<a id="-english"></a>

## 🇺🇸 English

### What is this?

A full-stack financial analytics platform built around three core modules:

1. **COT Analyzer** — automated [CFTC Commitment of Traders](https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm) data pipeline with charts, heatmaps, and a multi-market screener
2. **Trading Journal** — professional trade logging with 15+ analytics charts, portfolio management, and image attachments
3. **Auth System** — JWT authentication with OAuth (Google, GitHub), email verification, role-based access control

Designed as a **modular, extensible platform** with dual-database architecture (SQLite for COT, PostgreSQL for everything else).

### Features

| Category | Details |
|----------|---------|
| **COT Report Types** | Legacy, Disaggregated, Traders in Financial Futures (TFF) |
| **COT Subtypes** | Futures Only (FO), Futures + Options Combined (CO) |
| **Markets** | 500+ across commodities, financials, currencies, energy, metals, agriculture, crypto |
| **COT Indicators** | COT Index (3m / 1y / 3y), WCI (26w), Net positions, % of OI, Crowded Level |
| **COT Signals** | 8 signals — Strong Bullish, Accumulation, Floor Building, Strong Bearish, Distribution, Topping Out, Profit Taking, Liquidation |
| **COT Charts** | TradingView Lightweight Charts with price overlay, Net Positions, Delta Histogram, COT Index + Price overlay |
| **Screener** | Multi-market heatmap with sortable columns, signal & category filters |
| **Bubble Chart** | Visualize crowding across all markets at a glance |
| **Trading Journal** | Portfolio CRUD, trade logging (Option/Futures/Crypto), image attachments with WebP compression |
| **Journal Analytics** | Equity curve, drawdown, alpha curve, rolling metrics, NAV, R-multiple distribution, risk-adjusted comparison, and 10+ more charts |
| **Auth & Roles** | JWT + refresh tokens, OAuth 2.0 (Google, GitHub), email verification (Resend.com), admin / user roles, per-module permissions (`cot`, `journal`) |
| **Admin Panel** | User management, permission grants, registration statistics |
| **API** | FastAPI with Swagger/ReDoc docs, TTL cache, typed endpoints |
| **Auto-Updates** | APScheduler: COT pipeline every Friday 23:00 Kyiv, prices daily at 00:00 |
| **Docs** | Built-in bilingual documentation (English & Ukrainian) |

### Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                       Backend (Python)                        │
│                                                              │
│  app/core/            → config, security (JWT, bcrypt),      │
│                         database (SQLite + PostgreSQL),       │
│                         cache (TTL), email (Resend),         │
│                         logging, scheduler (APScheduler)     │
│                                                              │
│  app/modules/auth/    → register, login, OAuth (Google,      │
│                         GitHub), JWT + refresh tokens,       │
│                         email verification                   │
│                                                              │
│  app/modules/users/   → admin user management, permissions   │
│  app/modules/admin/   → platform statistics                  │
│                                                              │
│  app/modules/cot/     → downloader → parser →                │
│                         storage (SQLite) →                    │
│                         calculator → exporter → JSON          │
│                                                              │
│  app/modules/journal/ → portfolios, trades, images,          │
│                         analytics (15+ chart endpoints),     │
│                         settings (PostgreSQL)                │
│                                                              │
│  app/modules/prices/  → Yahoo Finance (100+ tickers)         │
│  app/modules/market_data/ → BTC benchmark (ccxt/Binance)     │
│                                                              │
│  app/main.py          → FastAPI app + APScheduler            │
│  scripts/             → CLI: server, pipeline, health        │
├──────────────────────────────────────────────────────────────┤
│  REST API: /api/v1/auth/*, /api/v1/cot/*, /api/v1/journal/* │
├─────────────────────────┬────────────────────────────────────┘
                          │  JSON
┌─────────────────────────▼────────────────────────────────────┐
│                     Frontend (React)                          │
│                                                              │
│  Auth Pages         → Login, Register, OAuth callback        │
│  CotApp             → COT report/screener view switcher      │
│  Journal            → Dashboard, trades, analytics charts    │
│  Admin Panel        → User management, stats                 │
│  Landing            → Animated hero + tool cards             │
│                                                              │
│  AuthContext + ProtectedRoute → JWT auth, permission guards  │
│  Zustand + TanStack Query → state & data fetching            │
│  Vite + Tailwind CSS → dist/                                 │
└──────────────────────────────────────────────────────────────┘
│
│  Docker: PostgreSQL 16 (auth + journal data)
│  SQLite: COT data (WAL mode, file-based)
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python 3.10+, FastAPI, SQLAlchemy 2.0 (async), APScheduler 3.x, SQLite (WAL), PostgreSQL 16 (asyncpg), Alembic, python-jose (JWT), Pillow, pandas, numpy, ccxt |
| **Frontend** | React 18, Vite 5, TypeScript, Tailwind CSS 3, Recharts 2, TradingView Lightweight Charts, Zustand 5, TanStack Query 5, React Router 7, @dnd-kit, lucide-react |
| **Infrastructure** | Docker Compose (PostgreSQL), nginx, systemd, uvicorn |
| **Services** | Resend.com (email), Google OAuth, GitHub OAuth, Yahoo Finance, Binance (ccxt) |
| **Design** | Dark luxury theme, Inter + Cinzel fonts, bronze accent (#c4a87c) |

### Project Structure

```
cftc/
├── README.md                              # 📖 Main documentation (this file)
├── INTEGRATION_PLAN.md                    # 📋 Architecture RFC (auth + journal)
├── docker-compose.yml                     # 🐳 Development (PostgreSQL)
├── docker-compose.prod.yml                # 🐳 Production overrides
│
├── backend/                               # 🐍 Python backend
│   ├── BACKEND_README.md                  # 📖 Backend documentation
│   ├── pyproject.toml                     # Project metadata & entry points
│   ├── requirements.txt                   # Dependencies
│   ├── alembic.ini                        # Alembic migration config
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                        # FastAPI app factory + lifespan
│   │   ├── core/                          # Shared infrastructure
│   │   │   ├── config.py                  # App settings (30+ env vars)
│   │   │   ├── database.py                # Dual DB: SQLite + async PostgreSQL
│   │   │   ├── models.py                  # SQLAlchemy models (User, Token, OAuth…)
│   │   │   ├── security.py                # JWT + bcrypt + refresh tokens
│   │   │   ├── email.py                   # Resend.com email service
│   │   │   ├── cache.py                   # Generic TTL cache (thread-safe)
│   │   │   ├── exceptions.py              # Exception hierarchy → HTTP errors
│   │   │   ├── logging.py                 # Structured logging setup
│   │   │   ├── migrations.py              # SQLite version-based migrations
│   │   │   └── scheduler.py               # APScheduler wrapper
│   │   ├── middleware/
│   │   │   └── auth.py                    # JWT auth, permission & admin guards
│   │   ├── modules/
│   │   │   ├── auth/                      # 🔐 Authentication module
│   │   │   │   ├── router.py              # /api/v1/auth/* (11 endpoints)
│   │   │   │   ├── service.py             # Auth business logic
│   │   │   │   ├── schemas.py             # Request/response schemas
│   │   │   │   └── oauth.py               # OAuth 2.0 (Google, GitHub)
│   │   │   ├── users/                     # 👤 User management (admin)
│   │   │   │   ├── router.py              # /api/v1/users/* (7 endpoints)
│   │   │   │   ├── service.py             # User CRUD + permissions
│   │   │   │   └── schemas.py             # Admin schemas
│   │   │   ├── admin/                     # 📊 Admin statistics
│   │   │   │   └── router.py              # /api/v1/admin/stats
│   │   │   ├── cot/                       # 📈 COT reports module
│   │   │   │   ├── config.py              # COT-specific settings
│   │   │   │   ├── constants.py           # Column mappings (3 report types)
│   │   │   │   ├── downloader.py          # CFTC ZIP/CSV downloader
│   │   │   │   ├── parser.py              # CSV → normalized g1–g5 rows
│   │   │   │   ├── storage.py             # SQLite data-access layer
│   │   │   │   ├── calculator.py          # COT Index, WCI, signals
│   │   │   │   ├── exporter.py            # Static JSON export
│   │   │   │   ├── pipeline.py            # Full pipeline orchestrator
│   │   │   │   ├── service.py             # Read-only API service
│   │   │   │   ├── router.py              # /api/v1/cot/* (5 endpoints)
│   │   │   │   ├── dependencies.py        # FastAPI dependency injection
│   │   │   │   └── scheduler.py           # Cron: Fri 23:00 Kyiv
│   │   │   ├── journal/                   # 📓 Trading Journal module
│   │   │   │   ├── models.py              # Portfolio, Trade, TradeImage, Settings
│   │   │   │   ├── schemas.py             # 35+ Pydantic schemas
│   │   │   │   ├── storage.py             # Async SQLAlchemy CRUD
│   │   │   │   ├── service.py             # Business logic bridge
│   │   │   │   ├── analyzer.py            # PortfolioAnalyzer (15+ metrics)
│   │   │   │   ├── image_service.py       # Image upload/compress/serve
│   │   │   │   ├── config.py              # Module settings
│   │   │   │   ├── dependencies.py        # FastAPI dependencies
│   │   │   │   ├── router.py              # Sub-router aggregator
│   │   │   │   └── routers/               # Sub-routers
│   │   │   │       ├── settings.py        # GET/PUT journal settings
│   │   │   │       ├── portfolios.py      # Portfolio CRUD
│   │   │   │       ├── trades.py          # Trade CRUD + filtering
│   │   │   │       ├── images.py          # Image upload/serve/delete
│   │   │   │       ├── analytics.py       # 15+ analytics endpoints
│   │   │   │       └── enums.py           # Trade type/style/direction enums
│   │   │   ├── prices/                    # 💰 Price data module
│   │   │   │   ├── config.py              # CFTC → Yahoo ticker mappings
│   │   │   │   ├── yahoo.py               # Yahoo Finance downloader
│   │   │   │   ├── service.py             # PriceService (ThreadPool, 23h cache)
│   │   │   │   └── scheduler.py           # Cron: daily 00:00 Kyiv
│   │   │   └── market_data/               # 📉 Market benchmark data
│   │   │       ├── router.py              # /api/v1/market-data/btc/*
│   │   │       └── btc_service.py         # BTC price via ccxt (Binance)
│   │   └── utils/
│   │       └── categories.py              # Market categorization helpers
│   ├── alembic/                           # PostgreSQL migrations
│   │   └── versions/                      # 4 migration files
│   ├── scripts/                           # CLI entry points
│   │   ├── run_server.py                  # Start uvicorn server
│   │   ├── run_pipeline.py                # Run COT data pipeline
│   │   ├── auto_update.py                 # Cron/timer entry point
│   │   └── health_check.py               # Data diagnostics
│   ├── data/                              # Runtime data (SQLite + logs)
│   ├── uploads/                           # Journal image storage
│   └── tests/                             # Test suite
│
├── frontend/                              # ⚛️ React frontend
│   ├── FRONTEND_README.md                 # 📖 Frontend documentation
│   ├── package.json                       # Dependencies & scripts
│   ├── vite.config.js                     # Vite config (proxy, aliases)
│   ├── tsconfig.json                      # TypeScript config
│   ├── tailwind.config.js                 # Tailwind CSS config
│   ├── index.html                         # HTML entry point
│   ├── public/data/                       # 📦 Exported COT JSON files
│   └── src/
│       ├── main.tsx                       # React entry + AuthProvider
│       ├── App.tsx                        # Root (QueryProvider + Router)
│       ├── router.tsx                     # Route definitions (protected)
│       ├── index.css                      # Global styles + Tailwind
│       ├── context/
│       │   └── AuthContext.tsx             # Global auth state & methods
│       ├── apps/
│       │   ├── cot/                       # COT Analyzer app
│       │   │   ├── CotApp.tsx             # Main view (tabs, selectors)
│       │   │   ├── store/                 # Zustand store (persisted)
│       │   │   └── components/            # COT components & charts
│       │   └── journal/                   # Trading Journal app
│       │       ├── pages/                 # Dashboard, JournalPage
│       │       ├── components/            # Charts (13+), filters, modals
│       │       ├── hooks/                 # useJournalQueries
│       │       ├── store/                 # useJournalStore
│       │       ├── api/                   # journalApi.ts
│       │       ├── i18n/                  # translations (UK/EN/RU)
│       │       └── types/                 # Journal types
│       ├── components/                    # Shared components
│       │   ├── ui/                        # Badge, Button, Modal, Spinner…
│       │   ├── auth/                      # ProtectedRoute, AdminRoute
│       │   └── landing/                   # Landing page graphics
│       ├── hooks/                         # useClickOutside, useEscapeKey…
│       ├── layouts/                       # AppShell, TopNav, PublicLayout
│       ├── lib/                           # api.ts, queryClient.ts, cn.ts
│       ├── pages/                         # Landing, Login, Register, Admin
│       └── types/                         # TypeScript definitions
│
└── deploy/                                # 🚀 Deployment
    ├── DEPLOY.md                          # 📖 Deployment guide
    ├── full-setup.sh                      # Full server setup from scratch
    ├── update-code.sh                     # Pull code + rebuild + restart
    ├── cot-api.service                    # Systemd unit file
    └── nginx-cot.conf                     # Nginx config (equilibriumm.tech)
```

### Quick Start (Local Development)

**Prerequisites:** Python 3.10+, Node.js 18+, Docker (for PostgreSQL)

```bash
# 1. Clone
git clone https://github.com/Danylo-D87/equilibrium-main.git
cd equilibrium-main

# 2. Start PostgreSQL (Docker)
docker compose up -d

# 3. Backend — install, migrate & load data
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/macOS
pip install -r requirements.txt
alembic upgrade head           # PostgreSQL migrations
python scripts/run_pipeline.py --verbose  # Download COT data

# 4. Start API server (separate terminal)
python scripts/run_server.py

# 5. Frontend — install & dev server
cd ../frontend
npm install
npm run dev
```

Open `http://localhost:5173` — Vite proxies `/api/*` to the backend at `:8000`.

### API Overview

| Module | Method | Path | Description |
|--------|--------|------|-------------|
| **Auth** | `POST` | `/api/v1/auth/register` | Register (sends email verification code) |
| **Auth** | `POST` | `/api/v1/auth/verify-email` | Verify email → issue JWT tokens |
| **Auth** | `POST` | `/api/v1/auth/login` | Login → access token + HttpOnly refresh cookie |
| **Auth** | `POST` | `/api/v1/auth/refresh` | Refresh access token |
| **Auth** | `POST` | `/api/v1/auth/logout` | Revoke refresh token |
| **Auth** | `GET` | `/api/v1/auth/me` | Current user profile |
| **Auth** | `GET` | `/api/v1/auth/oauth/{provider}` | Initiate OAuth (google/github) |
| **COT** | `GET` | `/api/v1/cot/markets/{type}/{subtype}` | List all markets |
| **COT** | `GET` | `/api/v1/cot/markets/{type}/{subtype}/{code}` | Market detail + timeseries + prices |
| **COT** | `GET` | `/api/v1/cot/screener/{type}/{subtype}` | Screener (latest analytics) |
| **COT** | `GET` | `/api/v1/cot/groups/{type}` | Trader group definitions |
| **COT** | `GET` | `/api/v1/cot/status` | Data freshness, DB stats & scheduler |
| **Journal** | `CRUD` | `/api/v1/journal/portfolios` | Portfolio management |
| **Journal** | `CRUD` | `/api/v1/journal/trades` | Trade management + filtering |
| **Journal** | `POST` | `/api/v1/journal/trades/{id}/images` | Image upload |
| **Journal** | `GET` | `/api/v1/journal/metrics` | Portfolio analytics (15+ endpoints) |
| **Users** | `GET` | `/api/v1/users` | List users (admin) |
| **Admin** | `GET` | `/api/v1/admin/stats` | Platform statistics |

📝 **Swagger:** `http://localhost:8000/api/docs` · **ReDoc:** `http://localhost:8000/api/redoc`

> For detailed API documentation → [backend/BACKEND_README.md](backend/BACKEND_README.md)

### Data Sources

| Data | Source | Schedule |
|------|--------|----------|
| COT Reports | [CFTC.gov](https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm) | Weekly (Friday 15:30 ET) |
| Price Data | [Yahoo Finance](https://finance.yahoo.com/) via `yfinance` | Daily at 00:00 Kyiv time |
| BTC Benchmark | [Binance](https://www.binance.com/) via `ccxt` | On-demand (journal analytics) |

### Production Deployment

See [deploy/DEPLOY.md](deploy/DEPLOY.md) for full VM deployment with Docker, nginx, systemd, and auto-updates.

```
Docker Compose
└── PostgreSQL 16 (auth + journal data)

nginx (port 80/443) — equilibriumm.tech
├── /           → frontend/dist (SPA)
├── /api/*      → proxy → FastAPI (port 8000)
└── /data/*     → static JSON (1h cache)

FastAPI backend (uvicorn, single worker)
├── app.main:app           → REST API (6 modules)
├── APScheduler            → Fri 23:00 COT + daily 00:00 prices
├── SQLite (data/app.db)   → 265K+ COT records
└── PostgreSQL             → users, auth, journal, portfolios
```

### License

MIT. COT data is public domain (U.S. government). Price data provided by Yahoo Finance.

---

<a id="-українська"></a>

## 🇺🇦 Українська

### Що це?

Повноцінна фінансово-аналітична платформа побудована навколо трьох основних модулів:

1. **COT Analyzer** — автоматизований пайплайн даних [CFTC Commitment of Traders](https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm) з графіками, теплокартами та мульти-ринковим скринером
2. **Trading Journal** — професійний торговий журнал з 15+ аналітичними графіками, управлінням портфелями та вкладенням зображень
3. **Auth-система** — JWT-аутентифікація з OAuth (Google, GitHub), верифікацією email, рольовим контролем доступу

Спроектовано як **модульну, розширювану платформу** з дуальною архітектурою баз даних (SQLite для COT, PostgreSQL для решти).

### Можливості

| Категорія | Деталі |
|-----------|--------|
| **Типи COT-звітів** | Legacy, Disaggregated, Traders in Financial Futures (TFF) |
| **Підтипи** | Futures Only (FO), Futures + Options Combined (CO) |
| **Ринки** | 500+ — товари, фінанси, валюти, енергоносії, метали, с/г, крипто |
| **COT-індикатори** | COT Index (3м / 1р / 3р), WCI (26т), нетто-позиції, % від OI, Crowded Level |
| **COT-сигнали** | 8 сигналів — Strong Bullish, Accumulation, Floor Building, Strong Bearish, Distribution, Topping Out, Profit Taking, Liquidation |
| **COT-графіки** | TradingView Lightweight Charts з накладенням цін, Net Positions, Delta Histogram, COT Index + Price overlay |
| **Скринер** | Мульти-ринкова теплокарта з сортуванням, фільтрами сигналів та категорій |
| **Бульбашковий графік** | Візуалізація crowding по всіх ринках |
| **Торговий журнал** | CRUD портфелів, логування угод (Option/Futures/Crypto), вкладення зображень з WebP-компресією |
| **Аналітика журналу** | Крива еквіті, просадка, альфа-крива, ковзні метрики, NAV, R-multiple розподіл, ризик-скориговане порівняння та 10+ інших графіків |
| **Auth і ролі** | JWT + refresh-токени, OAuth 2.0 (Google, GitHub), верифікація email (Resend.com), ролі admin/user, per-module дозволи (`cot`, `journal`) |
| **Адмін-панель** | Управління користувачами, видача дозволів, статистика реєстрацій |
| **API** | FastAPI зі Swagger/ReDoc документацією, TTL кеш, типізовані ендпоінти |
| **Авто-оновлення** | APScheduler: COT пайплайн щоп'ятниці 23:00 Київ, ціни щоденно о 00:00 |
| **Документація** | Вбудована двомовна документація (англійська та українська) |

### Архітектура

```
┌──────────────────────────────────────────────────────────────┐
│                       Бекенд (Python)                        │
│                                                              │
│  app/core/            → конфіг, безпека (JWT, bcrypt),       │
│                         БД (SQLite + PostgreSQL),             │
│                         кеш (TTL), email (Resend),           │
│                         логування, шедулер (APScheduler)     │
│                                                              │
│  app/modules/auth/    → реєстрація, логін, OAuth (Google,    │
│                         GitHub), JWT + refresh-токени,       │
│                         верифікація email                    │
│                                                              │
│  app/modules/users/   → адмін-управління користувачами       │
│  app/modules/admin/   → статистика платформи                 │
│                                                              │
│  app/modules/cot/     → downloader → parser →                │
│                         storage (SQLite) →                    │
│                         calculator → exporter → JSON          │
│                                                              │
│  app/modules/journal/ → портфелі, угоди, зображення,         │
│                         аналітика (15+ ендпоінтів),          │
│                         налаштування (PostgreSQL)            │
│                                                              │
│  app/modules/prices/  → Yahoo Finance (100+ тікерів)         │
│  app/modules/market_data/ → BTC бенчмарк (ccxt/Binance)     │
│                                                              │
│  app/main.py          → FastAPI додаток + APScheduler        │
│  scripts/             → CLI: сервер, пайплайн, хелс         │
├──────────────────────────────────────────────────────────────┤
│  REST API: /api/v1/auth/*, /api/v1/cot/*, /api/v1/journal/* │
├─────────────────────────┬────────────────────────────────────┘
                          │  JSON
┌─────────────────────────▼────────────────────────────────────┐
│                     Фронтенд (React)                         │
│                                                              │
│  Auth-сторінки      → Логін, Реєстрація, OAuth callback      │
│  CotApp             → COT report/screener                    │
│  Journal            → Дашборд, угоди, аналітичні графіки     │
│  Адмін-панель       → Управління користувачами, статистика   │
│  Лендінг            → Анімований hero + картки інструментів  │
│                                                              │
│  AuthContext + ProtectedRoute → JWT auth, permission guards  │
│  Zustand + TanStack Query → стан та отримання даних          │
│  Vite + Tailwind CSS → dist/                                 │
└──────────────────────────────────────────────────────────────┘
│
│  Docker: PostgreSQL 16 (auth + journal дані)
│  SQLite: COT дані (WAL режим, файлова БД)
```

### Технології

| Рівень | Технологія |
|--------|-----------|
| **Бекенд** | Python 3.10+, FastAPI, SQLAlchemy 2.0 (async), APScheduler 3.x, SQLite (WAL), PostgreSQL 16 (asyncpg), Alembic, python-jose (JWT), Pillow, pandas, numpy, ccxt |
| **Фронтенд** | React 18, Vite 5, TypeScript, Tailwind CSS 3, Recharts 2, TradingView Lightweight Charts, Zustand 5, TanStack Query 5, React Router 7, @dnd-kit, lucide-react |
| **Інфраструктура** | Docker Compose (PostgreSQL), nginx, systemd, uvicorn |
| **Сервіси** | Resend.com (email), Google OAuth, GitHub OAuth, Yahoo Finance, Binance (ccxt) |
| **Дизайн** | Темна luxury тема, шрифти Inter + Cinzel, бронзовий акцент (#c4a87c) |

### Швидкий старт (локальна розробка)

**Передумови:** Python 3.10+, Node.js 18+, Docker (для PostgreSQL)

```bash
# 1. Клонувати
git clone https://github.com/Danylo-D87/equilibrium-main.git
cd equilibrium-main

# 2. Запустити PostgreSQL (Docker)
docker compose up -d

# 3. Бекенд — встановити, мігрувати та завантажити дані
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/macOS
pip install -r requirements.txt
alembic upgrade head           # Міграції PostgreSQL
python scripts/run_pipeline.py --verbose  # Завантажити COT дані

# 4. Запустити API сервер (окремий термінал)
python scripts/run_server.py

# 5. Фронтенд — встановити та dev-сервер
cd ../frontend
npm install
npm run dev
```

Відкрити `http://localhost:5173` — Vite проксує `/api/*` на бекенд `:8000`.

### Огляд API

| Модуль | Метод | Шлях | Опис |
|--------|-------|------|------|
| **Auth** | `POST` | `/api/v1/auth/register` | Реєстрація (надсилає код верифікації) |
| **Auth** | `POST` | `/api/v1/auth/verify-email` | Верифікація email → видача JWT |
| **Auth** | `POST` | `/api/v1/auth/login` | Логін → access token + HttpOnly refresh cookie |
| **Auth** | `POST` | `/api/v1/auth/refresh` | Оновити access token |
| **Auth** | `POST` | `/api/v1/auth/logout` | Відкликати refresh token |
| **Auth** | `GET` | `/api/v1/auth/me` | Профіль поточного користувача |
| **Auth** | `GET` | `/api/v1/auth/oauth/{provider}` | Ініціювати OAuth (google/github) |
| **COT** | `GET` | `/api/v1/cot/markets/{type}/{subtype}` | Список всіх ринків |
| **COT** | `GET` | `/api/v1/cot/markets/{type}/{subtype}/{code}` | Деталі ринку + таймсерія + ціни |
| **COT** | `GET` | `/api/v1/cot/screener/{type}/{subtype}` | Скринер (остання аналітика) |
| **COT** | `GET` | `/api/v1/cot/groups/{type}` | Визначення груп трейдерів |
| **COT** | `GET` | `/api/v1/cot/status` | Стан даних, БД та шедулера |
| **Journal** | `CRUD` | `/api/v1/journal/portfolios` | Управління портфелями |
| **Journal** | `CRUD` | `/api/v1/journal/trades` | Управління угодами + фільтрація |
| **Journal** | `POST` | `/api/v1/journal/trades/{id}/images` | Завантаження зображень |
| **Journal** | `GET` | `/api/v1/journal/metrics` | Аналітика портфеля (15+ ендпоінтів) |
| **Users** | `GET` | `/api/v1/users` | Список користувачів (адмін) |
| **Admin** | `GET` | `/api/v1/admin/stats` | Статистика платформи |

📝 **Swagger:** `http://localhost:8000/api/docs` · **ReDoc:** `http://localhost:8000/api/redoc`

> Детальна документація API → [backend/BACKEND_README.md](backend/BACKEND_README.md)

### Джерела даних

| Дані | Джерело | Розклад |
|------|---------|---------|
| Звіти COT | [CFTC.gov](https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm) | Щотижня (п'ятниця 15:30 ET) |
| Цінові дані | [Yahoo Finance](https://finance.yahoo.com/) через `yfinance` | Щоденно о 00:00 за Києвом |
| BTC бенчмарк | [Binance](https://www.binance.com/) через `ccxt` | За запитом (аналітика журналу) |

### Деплой на продакшн

Дивіться [deploy/DEPLOY.md](deploy/DEPLOY.md) — повна інструкція деплою на VM з Docker, nginx, systemd та авто-оновленнями.

```
Docker Compose
└── PostgreSQL 16 (auth + journal дані)

nginx (порт 80/443) — equilibriumm.tech
├── /           → frontend/dist (SPA)
├── /api/*      → проксі → FastAPI (порт 8000)
└── /data/*     → статичний JSON (кеш 1 год)

FastAPI бекенд (uvicorn, один воркер)
├── app.main:app           → REST API (6 модулів)
├── APScheduler            → Пт 23:00 COT + щоденно 00:00 ціни
├── SQLite (data/app.db)   → 265K+ записів COT
└── PostgreSQL             → users, auth, journal, portfolios
```

### Ліцензія

MIT. Дані COT є суспільним надбанням (уряд США). Цінові дані надаються Yahoo Finance.
