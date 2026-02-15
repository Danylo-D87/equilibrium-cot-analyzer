# Market Analytics Platform

> **CFTC Commitment of Traders data — automated pipeline, live API & interactive dashboard**

🇺🇸 [English](#english) · 🇺🇦 [Українська](#українська)

---

<a id="english"></a>

## 🇺🇸 English

### What is this?

A full-stack platform for downloading, processing, and visualizing the weekly [Commitment of Traders (COT)](https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm) reports published by the U.S. Commodity Futures Trading Commission (CFTC).

CFTC publishes COT data every Friday at 15:30 ET. The platform automates the entire flow — from downloading raw CSV data to serving a live API and an interactive web dashboard with charts, heatmaps, and a multi-market screener.

Designed as a **modular, extensible platform** — COT is the first module, with more to come.

### Features

- **3 report types** — Legacy, Disaggregated, and Traders in Financial Futures (TFF)
- **2 subtypes** — Futures Only (FO) and Futures + Options Combined (CO)
- **500+ markets** across commodities, financials, currencies, energy, metals, agriculture
- **Calculated indicators** — COT Index (3m / 1y / 3y), WCI, Net positions, % of OI, Crowded Level
- **8 COT signals** — Extreme, Crossover, Momentum, Divergence, Flip, WCI, Crowding, Contrarian
- **Interactive charts** — TradingView Lightweight Charts with price overlay (via Yahoo Finance)
- **Multi-market screener** — heatmap with sortable columns and signal filters
- **Bubble chart** — visualize crowding across all markets at a glance
- **Live REST API** — FastAPI with Swagger docs, TTL cache, typed endpoints
- **Built-in auto-updates** — APScheduler runs the pipeline every Friday at 23:00 Kyiv time
- **Bilingual documentation** — built-in docs in English and Ukrainian

### Architecture

```
┌────────────────────────────────────────────────────┐
│                 Backend (Python)                    │
│                                                    │
│  app/core/         → config, database, cache,      │
│                      exceptions, logging, scheduler│
│                                                    │
│  app/modules/cot/  → downloader → parser →         │
│                      storage (SQLite) →             │
│                      calculator → exporter → JSON   │
│                                                    │
│  app/modules/prices/ → Yahoo Finance integration   │
│                                                    │
│  app/main.py       → FastAPI app + APScheduler     │
│  scripts/          → CLI: server, pipeline, health │
├────────────────────────────────────────────────────┤
│        REST API: /api/v1/cot/* (FastAPI)           │
├────────────────────┬───────────────────────────────┘
                     │
┌────────────────────▼───────────────────────────────┐
│               Frontend (React)                      │
│                                                     │
│  CotReportTable — weekly data table                 │
│  ScreenerTable  — multi-market heatmap              │
│  ChartModal     — TradingView charts + prices       │
│  BubbleChartModal — bubble visualization            │
│  DocumentationModal — bilingual docs                │
│                                                     │
│  Vite + Tailwind CSS → dist/                        │
└─────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.10+, FastAPI, APScheduler, SQLite, requests, yfinance, pytz |
| Frontend | React 18, Vite, Tailwind CSS, Recharts, TradingView Lightweight Charts |
| Deployment | nginx, systemd, uvicorn |

### Project Structure

```
cftc/
├── backend/
│   ├── app/
│   │   ├── main.py                # FastAPI app factory + lifespan
│   │   ├── core/                  # Shared infrastructure
│   │   │   ├── config.py          # App settings (env-driven)
│   │   │   ├── database.py        # SQLite connection (WAL mode)
│   │   │   ├── cache.py           # Generic TTL cache
│   │   │   ├── exceptions.py      # Exception hierarchy → HTTP errors
│   │   │   ├── logging.py         # Structured logging setup
│   │   │   └── scheduler.py       # APScheduler wrapper (pytz)
│   │   ├── modules/
│   │   │   ├── cot/               # COT reports module
│   │   │   │   ├── config.py      # COT-specific settings
│   │   │   │   ├── constants.py   # Column mappings for 3 report types
│   │   │   │   ├── storage.py     # SQLite data-access layer
│   │   │   │   ├── downloader.py  # CFTC ZIP/CSV downloader
│   │   │   │   ├── parser.py      # CSV → normalized g1-g5 rows
│   │   │   │   ├── calculator.py  # COT Index, WCI, signals
│   │   │   │   ├── exporter.py    # Static JSON export
│   │   │   │   ├── pipeline.py    # Full pipeline orchestrator
│   │   │   │   ├── service.py     # Read-only API service
│   │   │   │   ├── router.py      # /api/v1/cot/* endpoints
│   │   │   │   ├── dependencies.py# FastAPI DI
│   │   │   │   └── scheduler.py   # Friday 23:00 Kyiv auto-update
│   │   │   └── prices/            # Price data module
│   │   │       ├── config.py      # ~60 CFTC → Yahoo ticker mappings
│   │   │       ├── yahoo.py       # Yahoo Finance downloader
│   │   │       └── service.py     # PriceService
│   │   └── utils/
│   │       └── categories.py      # Market categorization helpers
│   ├── scripts/                   # CLI entry points
│   │   ├── run_server.py          # Start API server
│   │   ├── run_pipeline.py        # Run data pipeline
│   │   ├── auto_update.py         # Cron entry point
│   │   └── health_check.py        # Data diagnostics
│   ├── data/                      # SQLite DB (runtime)
│   ├── tests/                     # Test suite
│   ├── pyproject.toml
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── CotReportTable.jsx
│   │   │   ├── ScreenerTable.jsx
│   │   │   ├── ChartModal.jsx
│   │   │   ├── BubbleChartModal.jsx
│   │   │   ├── MarketSelector.jsx
│   │   │   ├── DocumentationModal.jsx
│   │   │   └── ui/               # ErrorBoundary, Spinner
│   │   ├── hooks/                # useEscapeKey
│   │   └── utils/                # colors, constants, formatters
│   ├── public/data/              # Exported JSON (not committed)
│   ├── package.json
│   └── vite.config.js
├── deploy/
│   ├── DEPLOY.md                 # VM deployment guide
│   ├── setup-vm.sh               # One-command server setup
│   ├── cot-api.service           # Systemd unit for FastAPI
│   └── nginx-cot.conf            # Nginx configuration
└── README.md
```

### Quick Start (Local Development)

**Prerequisites**: Python 3.10+, Node.js 18+

```bash
# 1. Clone
git clone https://github.com/Danylo-D87/equilibrium-cot-analyzer.git
cd equilibrium-cot-analyzer

# 2. Backend — install dependencies and load data
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/macOS
pip install -r requirements.txt
python scripts/run_pipeline.py --verbose

# 3. Start API server (in a separate terminal)
python scripts/run_server.py

# 4. Frontend — install and start dev server
cd ../frontend
npm install
npm run dev
```

Open `http://localhost:5173` — Vite proxies `/api/*` to the backend at `:8000`.

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/cot/markets/{type}/{subtype}` | List all markets |
| `GET` | `/api/v1/cot/markets/{type}/{subtype}/{code}` | Market detail + timeseries |
| `GET` | `/api/v1/cot/screener/{type}/{subtype}` | Screener (latest analytics) |
| `GET` | `/api/v1/cot/groups/{type}` | Group definitions |
| `GET` | `/api/v1/cot/status` | Data freshness & scheduler status |

Swagger docs: `http://localhost:8000/api/docs`

### Production Deployment

See [deploy/DEPLOY.md](deploy/DEPLOY.md) for full VM deployment with nginx, systemd, and auto-updates.

### Data Sources

| Data | Source | Schedule |
|------|--------|----------|
| COT Reports | [CFTC.gov](https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm) | Weekly (Friday 15:30 ET) |
| Price Data | [Yahoo Finance](https://finance.yahoo.com/) via `yfinance` | On pipeline run |

### License

This project is for educational and research purposes. COT data is public domain (U.S. government).

---

<a id="українська"></a>

## 🇺🇦 Українська

### Що це?

Повноцінна платформа для завантаження, обробки та візуалізації щотижневих звітів [Commitment of Traders (COT)](https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm), які публікує Комісія з торгівлі товарними ф'ючерсами США (CFTC).

CFTC публікує дані COT щоп'ятниці о 15:30 ET. Платформа автоматизує весь процес — від завантаження сирих CSV-даних до live API та інтерактивного веб-дашборду з графіками, теплокартами та мульти-ринковим скринером.

Спроектовано як **модульну, розширювану платформу** — COT це перший модуль, далі буде більше.

### Можливості

- **3 типи звітів** — Legacy, Disaggregated та Traders in Financial Futures (TFF)
- **2 підтипи** — Futures Only (FO) та Futures + Options Combined (CO)
- **500+ ринків** — товари, фінанси, валюти, енергоносії, метали, с/г продукція
- **Розрахункові індикатори** — COT Index (3м / 1р / 3р), WCI, нетто-позиції, % від OI, Crowded Level
- **8 COT-сигналів** — Extreme, Crossover, Momentum, Divergence, Flip, WCI, Crowding, Contrarian
- **Інтерактивні графіки** — TradingView Lightweight Charts з накладенням цін (Yahoo Finance)
- **Мульти-ринковий скринер** — теплокарта з сортуванням та фільтрами сигналів
- **Бульбашковий графік** — візуалізація crowding по всіх ринках
- **Live REST API** — FastAPI зі Swagger документацією, TTL кеш, типізовані ендпоінти
- **Вбудовані авто-оновлення** — APScheduler запускає пайплайн щоп'ятниці о 23:00 за Києвом
- **Двомовна документація** — вбудована документація англійською та українською

### Архітектура

```
┌────────────────────────────────────────────────────┐
│                   Бекенд (Python)                   │
│                                                    │
│  app/core/         → конфіг, БД, кеш, логування,  │
│                      шедулер, обробка помилок      │
│                                                    │
│  app/modules/cot/  → downloader → parser →         │
│                      storage (SQLite) →             │
│                      calculator → exporter → JSON   │
│                                                    │
│  app/modules/prices/ → інтеграція з Yahoo Finance  │
│                                                    │
│  app/main.py       → FastAPI додаток + APScheduler │
│  scripts/          → CLI: сервер, пайплайн, хелс  │
├────────────────────────────────────────────────────┤
│        REST API: /api/v1/cot/* (FastAPI)           │
├────────────────────┬───────────────────────────────┘
                     │
┌────────────────────▼───────────────────────────────┐
│               Фронтенд (React)                      │
│                                                     │
│  CotReportTable — таблиця тижневих даних            │
│  ScreenerTable  — мульти-ринкова теплокарта         │
│  ChartModal     — графіки TradingView + ціни        │
│  BubbleChartModal — бульбашкова візуалізація         │
│  DocumentationModal — двомовна документація          │
│                                                     │
│  Vite + Tailwind CSS → dist/                        │
└─────────────────────────────────────────────────────┘
```

### Технології

| Рівень | Технологія |
|--------|-----------|
| Бекенд | Python 3.10+, FastAPI, APScheduler, SQLite, requests, yfinance, pytz |
| Фронтенд | React 18, Vite, Tailwind CSS, Recharts, TradingView Lightweight Charts |
| Деплой | nginx, systemd, uvicorn |

### Швидкий старт (локальна розробка)

**Передумови**: Python 3.10+, Node.js 18+

```bash
# 1. Клонувати
git clone https://github.com/Danylo-D87/equilibrium-cot-analyzer.git
cd equilibrium-cot-analyzer

# 2. Бекенд — встановити залежності та завантажити дані
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/macOS
pip install -r requirements.txt
python scripts/run_pipeline.py --verbose

# 3. Запустити API сервер (в окремому терміналі)
python scripts/run_server.py

# 4. Фронтенд — встановити та запустити dev-сервер
cd ../frontend
npm install
npm run dev
```

Відкрити `http://localhost:5173` — Vite проксує `/api/*` на бекенд `:8000`.

### API ендпоінти

| Метод | Шлях | Опис |
|-------|------|------|
| `GET` | `/api/v1/cot/markets/{type}/{subtype}` | Список всіх ринків |
| `GET` | `/api/v1/cot/markets/{type}/{subtype}/{code}` | Деталі ринку + таймсерія |
| `GET` | `/api/v1/cot/screener/{type}/{subtype}` | Скринер (остання аналітика) |
| `GET` | `/api/v1/cot/groups/{type}` | Визначення груп |
| `GET` | `/api/v1/cot/status` | Стан даних та шедулера |

Swagger документація: `http://localhost:8000/api/docs`

### Деплой на продакшн

Дивіться [deploy/DEPLOY.md](deploy/DEPLOY.md) — повна інструкція деплою на VM з nginx, systemd та авто-оновленнями.

### Джерела даних

| Дані | Джерело | Розклад |
|------|---------|---------|
| Звіти COT | [CFTC.gov](https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm) | Щотижня (п'ятниця 15:30 ET) |
| Цінові дані | [Yahoo Finance](https://finance.yahoo.com/) через `yfinance` | При запуску пайплайну |

### Ліцензія

Цей проект призначений для навчальних та дослідницьких цілей. Дані COT є суспільним надбанням (уряд США).
