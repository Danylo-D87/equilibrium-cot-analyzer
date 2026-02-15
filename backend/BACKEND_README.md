# CFTC Analyzer — Backend

Financial data analytics platform.  
Currently provides **COT (Commitments of Traders)** reports analysis; designed for easy extension with new modules.

---

## Architecture

```
backend/
├── app/                    # Application package
│   ├── main.py             # FastAPI app factory + lifespan
│   ├── core/               # Shared infrastructure
│   │   ├── config.py       # App-level settings (env-driven)
│   │   ├── database.py     # SQLite connection helpers
│   │   ├── cache.py        # Generic TTL cache
│   │   ├── exceptions.py   # Exception hierarchy → HTTP errors
│   │   ├── logging.py      # Structured logging setup
│   │   └── scheduler.py    # APScheduler wrapper
│   │
│   ├── modules/            # Domain modules (plug-in style)
│   │   ├── cot/            # COT reports
│   │   │   ├── config.py   # COT-specific settings
│   │   │   ├── constants.py # Column mappings & names
│   │   │   ├── storage.py  # SQLite data-access layer
│   │   │   ├── downloader.py
│   │   │   ├── parser.py
│   │   │   ├── calculator.py
│   │   │   ├── exporter.py
│   │   │   ├── pipeline.py
│   │   │   ├── service.py  # Read-only API service
│   │   │   ├── dependencies.py
│   │   │   ├── router.py   # /api/v1/cot/*
│   │   │   └── scheduler.py
│   │   │
│   │   └── prices/         # Yahoo Finance prices
│   │       ├── config.py
│   │       ├── yahoo.py
│   │       └── service.py
│   │
│   └── utils/              # Shared helpers
│       └── categories.py   # Market categorization & meta builders
│
├── scripts/                # CLI entry points
│   ├── run_server.py       # Start API server
│   ├── run_pipeline.py     # Run data pipeline
│   ├── auto_update.py      # Cron/timer entry point
│   └── health_check.py     # Data diagnostics
│
├── tests/                  # Test suite
├── data/                   # Runtime data (SQLite DB, downloads)
├── logs/                   # Log files
├── pyproject.toml          # Project metadata & tool config
└── requirements.txt        # Pinned dependencies
```

---

## Quick Start

```bash
cd backend

# Create venv & install
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -e ".[dev]"

# Run initial pipeline
python -m scripts.run_pipeline

# Start API server
python -m scripts.run_server

# Health check
python -m scripts.health_check
```

**API docs:** http://localhost:8000/api/docs

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DB_PATH` | `data/app.db` | SQLite database location |
| `JSON_OUTPUT_DIR` | `../frontend/public/data` | Static JSON export dir |
| `LOG_DIR` | `data/logs` | Log files directory |
| `API_HOST` | `127.0.0.1` | API bind host |
| `API_PORT` | `8000` | API bind port |
| `API_CORS_ORIGINS` | `http://localhost:5173,...` | Comma-separated CORS origins |
| `DATA_STALE_DAYS` | `10` | Days before data is considered stale |
| `DEBUG` | `false` | Enable debug mode |
| `HTTP_TIMEOUT` | `60` | HTTP client timeout (seconds) |
| `HTTP_RETRIES` | `3` | HTTP retry attempts |
| `COT_YEARS` | `5` | Number of years to download |
| `PRICE_YEARS` | `3` | Years of price history |

---

## Adding a New Module

1. Create `app/modules/your_module/` with `__init__.py`
2. Add `config.py` for module-specific settings
3. Implement your domain logic (storage, service, etc.)
4. Create `router.py` with a FastAPI `APIRouter`
5. Mount the router in `app/main.py`:
   ```python
   from app.modules.your_module.router import router as ym_router
   app.include_router(ym_router, prefix="/api/v1")
   ```
6. (Optional) Register scheduled jobs in `app/modules/your_module/scheduler.py`

---

## API Endpoints (v1)

### COT Module — `/api/v1/cot`

| Method | Path | Description |
|---|---|---|
| `GET` | `/markets/{report_type}/{subtype}` | List all markets |
| `GET` | `/markets/{report_type}/{subtype}/{code}` | Market detail + full timeseries |
| `GET` | `/screener/{report_type}/{subtype}` | Screener (latest analytics per market) |
| `GET` | `/groups/{report_type}` | Market group definitions |
| `GET` | `/status` | Data freshness, DB stats & scheduler info |
