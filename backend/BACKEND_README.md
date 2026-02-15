# 🐍 Backend — Market Analytics Platform

> **FastAPI + SQLite + APScheduler — automated CFTC COT data pipeline & REST API**

🇺🇸 [English](#-english) · 🇺🇦 [Українська](#-українська)

← Back to [Main README](../README.md)

---

<a id="-english"></a>

## 🇺🇸 English

### Overview

The backend is a Python application built with **FastAPI** that:

1. **Downloads** weekly COT (Commitment of Traders) reports from CFTC.gov
2. **Parses** raw CSV data and normalizes it into a unified g1–g5 schema
3. **Stores** data in SQLite (WAL mode) with efficient indexing
4. **Calculates** derived analytics — COT Index, WCI, signals, statistics
5. **Exports** static JSON files for the frontend
6. **Serves** a REST API with TTL caching
7. **Schedules** automatic updates via APScheduler

### Architecture

```
backend/
├── app/                        # Application package
│   ├── __init__.py
│   ├── main.py                 # FastAPI app factory + lifespan
│   ├── core/                   # Shared infrastructure
│   │   ├── config.py           # App-level settings (env-driven)
│   │   ├── database.py         # SQLite connection helpers (WAL mode)
│   │   ├── cache.py            # Generic TTL cache (thread-safe, max size)
│   │   ├── exceptions.py       # Exception hierarchy → HTTP errors
│   │   ├── logging.py          # Structured logging (file + console)
│   │   ├── migrations.py       # Version-based DB schema migrations
│   │   └── scheduler.py        # APScheduler wrapper (pytz timezones)
│   │
│   ├── modules/                # Domain modules (plug-in style)
│   │   ├── cot/                # 📊 COT reports module
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
│   │   │   └── scheduler.py    # Cron jobs (Fri 23:00, daily 00:00)
│   │   │
│   │   └── prices/             # 💰 Price data module
│   │       ├── config.py       # 100+ CFTC → Yahoo Finance ticker mappings
│   │       ├── yahoo.py        # Yahoo Finance downloader (yfinance)
│   │       └── service.py      # PriceService (ThreadPoolExecutor, 23h cache)
│   │
│   └── utils/                  # Shared helpers
│       └── categories.py       # Market categorization & meta builders
│
├── scripts/                    # CLI entry points
│   ├── run_server.py           # Start API server (uvicorn)
│   ├── run_pipeline.py         # Run data pipeline
│   ├── auto_update.py          # Cron/timer entry point
│   └── health_check.py         # Data diagnostics
│
├── data/                       # Runtime data
│   ├── app.db                  # SQLite database (generated)
│   ├── ticker_map.json         # CFTC→Yahoo ticker map
│   └── logs/                   # Log files
│
├── tests/                      # Test suite
│   ├── __init__.py
│   └── conftest.py
│
├── pyproject.toml              # Project metadata & tool config
└── requirements.txt            # Pinned dependencies
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
| `DEBUG` | `false` | Enable debug mode (verbose logging) |
| `DB_PATH` | `data/app.db` | SQLite database file path |
| `JSON_OUTPUT_DIR` | `../frontend/public/data` | Directory for exported JSON files |
| `LOG_DIR` | `data/logs` | Directory for log files |
| `API_HOST` | `127.0.0.1` | API server bind host |
| `API_PORT` | `8000` | API server bind port |
| `API_CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated CORS origins |
| `HTTP_TIMEOUT` | `60` | HTTP client timeout (seconds) |
| `HTTP_RETRIES` | `3` | HTTP retry attempts |
| `HTTP_RETRY_BACKOFF` | `2` | Base backoff seconds for retries |
| `DATA_STALE_DAYS` | `10` | Days before data is considered stale |
| `COT_YEARS` | `5` | Years of historical COT data to download |
| `COT_CROWDED_BUY` | `80` | COT Index threshold for BUY crowded signal |
| `COT_CROWDED_SELL` | `20` | COT Index threshold for SELL crowded signal |
| `PRICE_YEARS` | `3` | Years of Yahoo Finance price history |
| `TICKER_MAP_PATH` | `data/ticker_map.json` | Path to custom ticker map JSON |

---

### API Endpoints

All endpoints are prefixed with `/api/v1/cot` and tagged `COT`.

| Method | Path | Cache TTL | Description |
|--------|------|-----------|-------------|
| `GET` | `/markets/{report_type}/{subtype}` | 10 min | List all markets for a report type/subtype |
| `GET` | `/markets/{report_type}/{subtype}/{code}` | 10 min | Full market data: weeks, stats, groups, prices |
| `GET` | `/screener/{report_type}/{subtype}` | 5 min | Screener data with optional `limit` and `offset` params |
| `GET` | `/groups/{report_type}` | — | Trader group definitions for a report type |
| `GET` | `/status` | — | System status: DB stats, scheduler state, data freshness |

**Path parameters:**

| Parameter | Values | Description |
|-----------|--------|-------------|
| `report_type` | `legacy`, `disagg`, `tff` | COT report type |
| `subtype` | `fo`, `co` | Futures Only or Futures + Options Combined |
| `code` | e.g. `099741` | CFTC contract market code |

**Screener query params:**

| Parameter | Default | Description |
|-----------|---------|-------------|
| `limit` | `0` | Number of results (0 = all) |
| `offset` | `0` | Pagination offset |

All caches are **invalidated** after each COT pipeline or price update run.

---

### Data Pipeline

The pipeline is orchestrated by `pipeline.py` and follows this flow:

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

1. **Lock acquisition** — File-based lock (`pipeline.lock`) with PID check prevents concurrent runs
2. **For each `report_type × subtype` combination (6 total):**
   1. Check `download_log` table — skip years already downloaded (unless `--force`)
   2. Download yearly ZIPs from `https://www.cftc.gov/files/dea/history/...{year}.zip`
   3. Extract CSV from ZIP
   4. Parse CSV → normalize columns to unified `g1–g5` schema via `constants.py` mappings
   5. Upsert rows to SQLite (`INSERT OR REPLACE` on unique `report_type + subtype + date + code`)
   6. Log downloaded year to `download_log`
   7. Download & parse current week TXT file (headerless)
   8. Upsert current week rows
3. **Collect all unique market codes** across all variants
4. **Download prices** (unless `--no-prices`):
   - Map CFTC codes → Yahoo Finance tickers via `ticker_map.json`
   - ThreadPoolExecutor with max 8 workers
   - Results cached in class-level dict (23-hour TTL)
5. **Export JSON files** for each `report_type × subtype`:
   - Bulk-load all market data from SQLite
   - Run calculator for each market → weeks + stats
   - Write per-market detail: `market_{code}_{type}_{sub}.json`
   - Write markets list: `markets_{type}_{sub}.json` (if applicable)
   - Write screener data
   - Write group definitions: `groups_{type}.json`
6. **Lock release**

---

### Report Types & Trader Groups

| Report Type | Key | Groups |
|---|---|---|
| **Legacy** | `legacy` | g1: Large Speculators (speculative, has_spread) · g2: Commercials (commercial) · g3: Small Traders (small) |
| **Disaggregated** | `disagg` | g1: Producer/Merchant (commercial) · g2: Swap Dealers (commercial, has_spread) · g3: Managed Money (speculative, has_spread) · g4: Other Reportables (speculative, has_spread) · g5: Non-Reportable (small) |
| **TFF** | `tff` | g1: Dealer/Intermediary (commercial, has_spread) · g2: Asset Manager (speculative, has_spread) · g3: Leveraged Funds (speculative, has_spread) · g4: Other Reportables (speculative, has_spread) · g5: Non-Reportable (small) |

**Subtypes:** `fo` (Futures Only), `co` (Futures + Options Combined)

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

#### Statistics

| Stat | Description |
|------|-------------|
| `max` / `min` | All-time extreme values |
| `max_5y` / `min_5y` | 5-year extremes (260 weeks) |
| `avg_13w` | 13-week moving average |

---

### Database Schema

**SQLite** with WAL mode, foreign keys enabled, version-based migration system.

#### `cot_data` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Auto-increment |
| `report_type` | TEXT | `legacy`, `disagg`, `tff` |
| `subtype` | TEXT | `fo`, `co` |
| `report_date` | TEXT | ISO date (YYYY-MM-DD) |
| `cftc_contract_code` | TEXT | CFTC market code |
| `market_and_exchange` | TEXT | Market name + exchange |
| `cftc_commodity_code` | TEXT | Commodity code |
| `open_interest` | REAL | Total open interest |
| `oi_change` | REAL | Week-over-week OI change |
| `g1_long` ... `g5_short` | REAL | Long/short positions per group |
| `g1_long_change` ... | REAL | Week-over-week changes |
| `g1_spread` ... | REAL | Spreading positions (where applicable) |
| `total_rept_long/short` | REAL | Total reportable positions |

**UNIQUE constraint:** `(report_type, subtype, report_date, cftc_contract_code)`

#### Indexes

| Index | Columns | Purpose |
|-------|---------|---------|
| `idx_cot_rt_st` | `report_type, subtype` | Filter by variant |
| `idx_cot_code_date` | `cftc_contract_code, report_date` | Market timeseries |
| `idx_cot_date` | `report_date` | Date range queries |

#### `download_log` table

Tracks which years have been downloaded to avoid redundant fetches.

| Column | Type | Description |
|--------|------|-------------|
| `report_type` | TEXT | Report type |
| `subtype` | TEXT | Subtype |
| `year` | INTEGER | Downloaded year |
| `downloaded` | TEXT | ISO timestamp |

#### `schema_version` table

Version-based migration tracking.

---

### Caching Architecture

| Cache | TTL | Scope | Description |
|-------|-----|-------|-------------|
| Market detail | 10 min | API router | `/markets/{type}/{subtype}/{code}` |
| Markets list | 10 min | API router | `/markets/{type}/{subtype}` |
| Screener | 5 min | API router | `/screener/{type}/{subtype}` (only when limit=0) |
| Price data | 23 hours | PriceService class | Yahoo Finance OHLCV per ticker |

All API caches are **thread-safe** (lock-based) with periodic cleanup and max size enforcement. Caches are invalidated after each pipeline run.

---

### Scheduler Configuration

Two cron jobs registered at startup:

| Job ID | Schedule | Timezone | Description |
|--------|----------|----------|-------------|
| `weekly_cot_update` | **Friday 23:00** | `Europe/Kyiv` | Full COT pipeline (download + calculate + export) |
| `daily_price_update` | **Daily 00:00** | `Europe/Kyiv` | Yahoo Finance prices → re-export JSON |

Both use APScheduler `CronTrigger` with `misfire_grace_time=3600`. Duplicate concurrent runs are prevented.

**Why Friday 23:00 Kyiv?** CFTC publishes data every Friday ~15:30 ET. By 23:00 Kyiv time the data is always available.

---

### Exception Hierarchy

```
AppError (base, HTTP 500)
├── NotFoundError (404)
├── ConflictError (409)
├── ValidationError (422)
└── ExternalServiceError (502)
```

All exceptions are caught by a single FastAPI exception handler returning structured JSON:
```json
{
  "error": "NotFoundError",
  "message": "Market 099741 not found",
  "status_code": 404
}
```

---

### CLI Scripts

#### `run_server.py`

```bash
python scripts/run_server.py [--reload]
```

Starts uvicorn with settings from `config.py`. `--reload` enables hot reload for development.

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
  --dry-run             Check health only, return exit code 0 (fresh) or 2 (stale)
  --no-prices           Skip price download
  --type TYPE           Specific report type
  --subtype SUBTYPE     Specific subtype
  --verbose, -v         Verbose logging
  --log-file PATH       Log to file
```

#### `health_check.py`

```bash
python scripts/health_check.py [--json]

Checks:
  - Database existence and accessibility
  - Record counts per report_type/subtype
  - Data freshness (latest report_date vs today)
  - Year coverage completeness
  - JSON export file existence per variant
```

---

### Exported JSON Structure

All files exported to `JSON_OUTPUT_DIR` (default: `../frontend/public/data/`).

#### Market Detail — `market_{code}_{type}_{sub}.json`

```json
{
  "market": {
    "code": "099741",
    "name": "GOLD - COMMODITY EXCHANGE INC.",
    "exchange": "COMMODITY EXCHANGE INC.",
    "category": "metals",
    "category_display": "Metals",
    "report_type": "legacy",
    "report_type_display": "Legacy",
    "subtype": "fo",
    "subtype_display": "Futures Only"
  },
  "groups": [
    { "key": "g1", "name": "Large Speculators", "short": "L.S", "role": "speculative", "has_spread": true }
  ],
  "weeks": [
    {
      "date": "2024-01-02",
      "open_interest": 500000,
      "oi_change": 5000,
      "oi_pct": 1.0,
      "g1_long": 250000,
      "g1_short": 100000,
      "g1_net": 150000,
      "g1_change": 5000,
      "g1_pct_net_oi": 30.0,
      "cot_index_g1_3m": 75.5,
      "cot_index_g1_1y": 68.2,
      "cot_index_g1_3y": 55.1,
      "wci_g1": 72.3,
      "crowded_g1": { "value": 68.2, "signal": null }
    }
  ],
  "stats": {
    "max": { "g1_net": 300000 },
    "min": { "g1_net": -50000 },
    "max_5y": { "g1_net": 280000 },
    "min_5y": { "g1_net": -30000 },
    "avg_13w": { "g1_net": 145000 }
  },
  "prices": [
    { "date": "2024-01-02", "open": 2060.5, "high": 2075.0, "low": 2055.0, "close": 2070.2, "volume": 185000 }
  ]
}
```

#### Group Definitions — `groups_{type}.json`

```json
[
  { "key": "g1", "name": "Large Speculators", "short": "L.S", "role": "speculative", "has_spread": true },
  { "key": "g2", "name": "Commercials", "short": "Comm", "role": "commercial", "has_spread": false },
  { "key": "g3", "name": "Small Traders", "short": "S.T", "role": "small", "has_spread": false }
]
```

---

### Market Categories

Markets are automatically categorized by keyword matching on their names:

| Category | Examples |
|----------|---------|
| **Currencies** | EURO FX, JAPANESE YEN, BRITISH POUND |
| **Crypto** | BITCOIN, ETHEREUM, SOLANA |
| **Metals** | GOLD, SILVER, COPPER, PLATINUM |
| **Energy** | CRUDE OIL, NATURAL GAS, HEATING OIL |
| **Grains** | WHEAT, CORN, SOYBEANS |
| **Softs** | COCOA, COFFEE, COTTON, SUGAR |
| **Livestock** | LIVE CATTLE, LEAN HOGS |
| **Indices** | S&P 500, NASDAQ, DOW JONES, VIX |
| **Rates** | 10-YEAR NOTE, 2-YEAR NOTE, EURODOLLAR |
| **Other** | Everything else |

---

### Ticker Mapping

100+ CFTC contract codes mapped to Yahoo Finance tickers. Source: `data/ticker_map.json` with built-in fallback dict in code.

**Coverage:** Crypto (BTC, ETH, SOL, XRP, DOGE...), Currencies (EUR, GBP, JPY, CHF...), Energy (CL, NG, HO...), Grains (ZW, ZC, ZS...), Metals (GC, SI, HG...), Indices (ES, NQ, RTY...), Livestock, Softs, Rates.

---

### Dependencies

**Core:**
| Package | Version | Purpose |
|---------|---------|---------|
| `fastapi` | ≥ 0.104 | Web framework |
| `uvicorn` | ≥ 0.24 | ASGI server |
| `requests` | ≥ 2.31 | HTTP client (CFTC downloads) |
| `apscheduler` | ≥ 3.10, < 4 | Background task scheduling |
| `yfinance` | ≥ 0.2.31 | Yahoo Finance API |
| `pytz` | ≥ 2024.1 | Timezone support |

**Dev (optional):**
| Package | Version | Purpose |
|---------|---------|---------|
| `pytest` | ≥ 7.0 | Testing framework |
| `pytest-asyncio` | ≥ 0.21 | Async test support |
| `httpx` | ≥ 0.25 | Async HTTP client (tests) |
| `ruff` | ≥ 0.1 | Linter & formatter |

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
6. (Optional) Register scheduled jobs in `app/modules/your_module/scheduler.py`

---

<a id="-українська"></a>

## 🇺🇦 Українська

### Огляд

Бекенд — це Python-додаток на **FastAPI**, який:

1. **Завантажує** щотижневі COT-звіти з CFTC.gov
2. **Парсить** сирі CSV-дані та нормалізує в єдину g1–g5 схему
3. **Зберігає** дані в SQLite (WAL режим) з ефективною індексацією
4. **Розраховує** похідну аналітику — COT Index, WCI, сигнали, статистику
5. **Експортує** статичні JSON-файли для фронтенду
6. **Обслуговує** REST API з TTL кешуванням
7. **Планує** автоматичні оновлення через APScheduler

---

### Швидкий старт

```bash
cd backend

# Створити віртуальне середовище та встановити залежності
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/macOS
pip install -r requirements.txt

# Запустити початковий пайплайн (завантажує COT + ціни, ~5 хв)
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
| `DEBUG` | `false` | Увімкнути режим відладки |
| `DB_PATH` | `data/app.db` | Шлях до SQLite бази |
| `JSON_OUTPUT_DIR` | `../frontend/public/data` | Директорія для експорту JSON |
| `LOG_DIR` | `data/logs` | Директорія логів |
| `API_HOST` | `127.0.0.1` | Хост API сервера |
| `API_PORT` | `8000` | Порт API сервера |
| `API_CORS_ORIGINS` | `http://localhost:5173,...` | CORS-дозволені джерела |
| `HTTP_TIMEOUT` | `60` | Таймаут HTTP запитів (сек) |
| `HTTP_RETRIES` | `3` | Кількість повторних спроб |
| `HTTP_RETRY_BACKOFF` | `2` | Базовий backoff (сек) |
| `DATA_STALE_DAYS` | `10` | Днів до позначки "застарілі дані" |
| `COT_YEARS` | `5` | Кількість років COT даних |
| `COT_CROWDED_BUY` | `80` | Поріг COT Index для BUY сигналу |
| `COT_CROWDED_SELL` | `20` | Поріг COT Index для SELL сигналу |
| `PRICE_YEARS` | `3` | Кількість років цінових даних |
| `TICKER_MAP_PATH` | `data/ticker_map.json` | Шлях до маппінгу тікерів |

---

### API Ендпоінти

Всі ендпоінти мають префікс `/api/v1/cot` та тег `COT`.

| Метод | Шлях | Кеш TTL | Опис |
|-------|------|---------|------|
| `GET` | `/markets/{report_type}/{subtype}` | 10 хв | Список ринків за типом/підтипом |
| `GET` | `/markets/{report_type}/{subtype}/{code}` | 10 хв | Повні дані ринку: тижні, статистика, групи, ціни |
| `GET` | `/screener/{report_type}/{subtype}` | 5 хв | Скринер з опціональними `limit` та `offset` |
| `GET` | `/groups/{report_type}` | — | Визначення груп трейдерів |
| `GET` | `/status` | — | Стан системи: БД, шедулер, свіжість даних |

**Параметри шляху:**

| Параметр | Значення | Опис |
|----------|----------|------|
| `report_type` | `legacy`, `disagg`, `tff` | Тип COT-звіту |
| `subtype` | `fo`, `co` | Futures Only або Futures + Options Combined |
| `code` | напр. `099741` | Код контракту CFTC |

Всі кеші **інвалідуються** після кожного запуску пайплайну.

---

### Пайплайн даних

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

**Покроково:**

1. **Блокування** — файловий лок (`pipeline.lock`) з перевіркою PID
2. **Для кожної комбінації `report_type × subtype` (6 разом):**
   1. Перевірка `download_log` — пропуск вже завантажених років (якщо не `--force`)
   2. Завантаження річних ZIP з CFTC.gov
   3. Витягнення CSV з ZIP
   4. Парсинг CSV → нормалізація колонок в `g1–g5` схему
   5. Upsert в SQLite (`INSERT OR REPLACE`)
   6. Запис у лог завантажень
   7. Завантаження та парсинг поточного тижня (TXT)
   8. Upsert поточного тижня
3. **Збір унікальних кодів ринків**
4. **Завантаження цін** (якщо не `--no-prices`):
   - Маппінг CFTC кодів → Yahoo Finance тікери
   - ThreadPoolExecutor (до 8 потоків)
   - Кеш на рівні класу (23 год TTL)
5. **Експорт JSON** для кожного `report_type × subtype`
6. **Зняття блокування**

---

### Типи звітів та групи трейдерів

| Тип звіту | Ключ | Групи |
|-----------|------|-------|
| **Legacy** | `legacy` | g1: Large Speculators (спекулятивна) · g2: Commercials (комерційна) · g3: Small Traders (мала) |
| **Disaggregated** | `disagg` | g1: Producer/Merchant (комерційна) · g2: Swap Dealers (комерційна) · g3: Managed Money (спекулятивна) · g4: Other Reportables (спекулятивна) · g5: Non-Reportable (мала) |
| **TFF** | `tff` | g1: Dealer/Intermediary (комерційна) · g2: Asset Manager (спекулятивна) · g3: Leveraged Funds (спекулятивна) · g4: Other Reportables (спекулятивна) · g5: Non-Reportable (мала) |

---

### Розрахункові індикатори

#### Потижневі розрахунки

| Індикатор | Формула |
|-----------|---------|
| **Нетто-позиція** | `net = g_k_long - g_k_short` |
| **Зміна нетто** | `net_change = g_k_long_change - g_k_short_change` |
| **% Нетто/OI** | `pct_net_oi = (net / open_interest) × 100` |

#### Серійні індикатори

| Індикатор | Вікно | Формула |
|-----------|-------|---------|
| **COT Index 3м** | 13 тижнів | `(net - min) / (max - min) × 100` |
| **COT Index 1р** | 52 тижні | Та сама формула |
| **COT Index 3р** | 156 тижнів | Та сама формула |
| **WCI** | 26 тижнів | Та сама формула |

#### Crowded Level

На основі **1Y COT Index** з інтерпретацією за роллю:

| Роль трейдера | COT Index ≥ 80 | COT Index ≤ 20 |
|---------------|-----------------|-----------------|
| **Комерційна** | `BUY` сигнал | `SELL` сигнал |
| **Спекулятивна** | `SELL` сигнал | `BUY` сигнал |
| **Мала** | `SELL` сигнал | `BUY` сигнал |

---

### Схема бази даних

**SQLite** з WAL режимом, увімкненими зовнішніми ключами та версійною міграцією.

#### Таблиця `cot_data`

| Колонка | Тип | Опис |
|---------|-----|------|
| `id` | INTEGER PK | Автоінкремент |
| `report_type` | TEXT | `legacy`, `disagg`, `tff` |
| `subtype` | TEXT | `fo`, `co` |
| `report_date` | TEXT | ISO дата |
| `cftc_contract_code` | TEXT | Код ринку CFTC |
| `market_and_exchange` | TEXT | Назва ринку + біржа |
| `open_interest` | REAL | Загальний відкритий інтерес |
| `g1_long` ... `g5_short` | REAL | Позиції по групах |

**UNIQUE:** `(report_type, subtype, report_date, cftc_contract_code)`

---

### CLI Скрипти

#### `run_server.py`

```bash
python scripts/run_server.py [--reload]
```

#### `run_pipeline.py`

```bash
python scripts/run_pipeline.py [--force] [--type TYPE] [--subtype SUBTYPE]
                               [--no-prices] [--verbose] [--log-file PATH]
```

#### `auto_update.py`

```bash
python scripts/auto_update.py [--force] [--dry-run] [--no-prices]
                              [--type TYPE] [--subtype SUBTYPE]
                              [--verbose] [--log-file PATH]
```

#### `health_check.py`

```bash
python scripts/health_check.py [--json]
```

---

### Шедулер

| Job ID | Розклад | Часовий пояс | Опис |
|--------|---------|-------------|------|
| `weekly_cot_update` | **П'ятниця 23:00** | `Europe/Kyiv` | Повний COT пайплайн |
| `daily_price_update` | **Щоденно 00:00** | `Europe/Kyiv` | Оновлення цін Yahoo Finance |

**Чому п'ятниця 23:00 Київ?** CFTC публікує дані щоп'ятниці ~15:30 ET. До 23:00 за Києвом дані завжди доступні.

---

### Додавання нового модуля

1. Створити `app/modules/your_module/` з `__init__.py`
2. Додати `config.py` для налаштувань модуля
3. Реалізувати доменну логіку (storage, service, etc.)
4. Створити `router.py` з FastAPI `APIRouter`
5. Підключити роутер в `app/main.py`:
   ```python
   from app.modules.your_module.router import router as ym_router
   app.include_router(ym_router, prefix="/api/v1")
   ```
6. (Опціонально) Зареєструвати заплановані задачі в `scheduler.py`
