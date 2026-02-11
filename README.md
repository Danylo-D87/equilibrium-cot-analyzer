# COT Analyzer

> **CFTC Commitment of Traders data — automated pipeline + interactive dashboard**

🇺🇸 [English](#english) · 🇺🇦 [Українська](#українська)

---

<a id="english"></a>

## 🇺🇸 English

### What is this?

**COT Analyzer** is a full-stack tool for downloading, processing, and visualizing the weekly [Commitment of Traders (COT)](https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm) reports published by the U.S. Commodity Futures Trading Commission (CFTC).

The CFTC publishes COT data every Friday at 15:30 ET. This project automates the entire flow — from downloading raw CSV data to serving an interactive web dashboard with charts, heatmaps, and a multi-market screener.

### Why?

COT reports reveal how major market participants (hedgers, speculators, asset managers) are positioned in futures markets. Tracking these positions over time can provide valuable context for macro and trading analysis. Existing COT tools are often outdated, limited to a single report type, or behind paywalls. This project provides a free, self-hosted alternative with all three major report formats.

### Features

- **3 report types** — Legacy, Disaggregated, and Traders in Financial Futures (TFF)
- **2 subtypes** — Futures Only (FO) and Futures + Options Combined (CO)
- **200+ markets** across commodities, financials, currencies, energy, metals, agriculture
- **Calculated indicators** — COT Index (3m / 1y / 3y), WCI, Net positions, % of OI, Crowded Level
- **8 COT signals** — Extreme, Crossover, Momentum, Divergence, Flip, WCI, Crowding, Contrarian
- **Interactive charts** — TradingView Lightweight Charts with price overlay (via Yahoo Finance)
- **Multi-market screener** — heatmap with sortable columns and signal filters
- **Bubble chart** — visualize crowding across all markets at a glance
- **Bilingual documentation** — built-in docs in English and Ukrainian
- **Automatic updates** — cron / systemd timer fetches fresh data weekly
- **No backend server** — static JSON files served by nginx, zero runtime dependencies

### Architecture

```
┌─────────────────────────────────────────────────┐
│                   Backend (Python)               │
│                                                  │
│  downloader.py  → parser.py → storage.py (SQLite)│
│                      ↓                           │
│  calculator.py  → exporter.py → JSON files       │
│  price_downloader.py ↗                           │
│                                                  │
│  pipeline.py  — orchestrator                     │
│  auto_update.py — cron entry point               │
│  data_health_check.py — integrity checks         │
└──────────────────────┬──────────────────────────┘
                       │  static JSON
┌──────────────────────▼──────────────────────────┐
│                 Frontend (React)                  │
│                                                  │
│  CotReportTable — weekly data table              │
│  ScreenerTable  — multi-market heatmap           │
│  ChartModal     — TradingView charts             │
│  BubbleChartModal — bubble visualization         │
│  DocumentationModal — bilingual docs             │
│                                                  │
│  Vite + Tailwind CSS → dist/                     │
└──────────────────────┬──────────────────────────┘
                       │  served by
                    nginx
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.10+, pandas, requests, yfinance |
| Database | SQLite (local, file-based) |
| Frontend | React 18, Vite, Tailwind CSS, Recharts, TradingView Lightweight Charts |
| Deployment | nginx, systemd timer / cron |

### Project Structure

```
cftc/
├── backend/
│   ├── config.py              # All settings, URLs, group definitions
│   ├── downloader.py          # Downloads CSV from CFTC
│   ├── parser.py              # Parses CSV into normalized rows
│   ├── storage.py             # SQLite read/write
│   ├── calculator.py          # COT Index, WCI, signals, stats
│   ├── exporter.py            # Exports JSON for frontend
│   ├── price_downloader.py    # Yahoo Finance price data
│   ├── pipeline.py            # Full pipeline orchestrator
│   ├── auto_update.py         # Cron entry point with health checks
│   ├── data_health_check.py   # Data integrity checker
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Main app with header, tabs, routing
│   │   └── components/
│   │       ├── CotReportTable.jsx
│   │       ├── ScreenerTable.jsx
│   │       ├── ChartModal.jsx
│   │       ├── BubbleChartModal.jsx
│   │       ├── MarketSelector.jsx
│   │       └── DocumentationModal.jsx
│   ├── public/data/           # Generated JSON (not committed)
│   ├── package.json
│   └── vite.config.js
├── deploy/
│   ├── DEPLOY.md              # VM deployment guide
│   ├── setup-vm.sh            # Automated server setup
│   ├── update.sh              # Cron/systemd update script
│   ├── cot-update.service     # Systemd service unit
│   ├── cot-update.timer       # Systemd timer (weekly)
│   ├── crontab                # Alternative cron schedule
│   └── nginx-cot.conf         # Nginx configuration
└── README.md
```

### Quick Start (Local Development)

**Prerequisites**: Python 3.10+, Node.js 18+

```bash
# 1. Clone
git clone https://github.com/Danylo-D87/equilibrium-cot-analyzer.git
cd equilibrium-cot-analyzer

# 2. Backend — install dependencies and run pipeline
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/macOS
pip install -r requirements.txt
python pipeline.py --verbose
cd ..

# 3. Frontend — install and start dev server
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Production Deployment

See [deploy/DEPLOY.md](deploy/DEPLOY.md) for full VM deployment instructions with nginx, systemd timer, and automatic weekly updates.

### Data Sources

| Data | Source | Schedule |
|------|--------|----------|
| COT Reports | [CFTC.gov](https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm) | Weekly (Friday 15:30 ET) |
| Price Data | [Yahoo Finance](https://finance.yahoo.com/) via `yfinance` | On demand |

### License

This project is for educational and research purposes. COT data is public domain (U.S. government).

---

<a id="українська"></a>

## 🇺🇦 Українська

### Що це?

**COT Analyzer** — це повноцінний інструмент для завантаження, обробки та візуалізації щотижневих звітів [Commitment of Traders (COT)](https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm), які публікує Комісія з торгівлі товарними ф'ючерсами США (CFTC).

CFTC публікує дані COT щоп'ятниці о 15:30 ET. Цей проект автоматизує весь процес — від завантаження сирих CSV-даних до інтерактивного веб-дашборду з графіками, теплокартами та мульти-ринковим скринером.

### Навіщо?

Звіти COT показують, як основні учасники ринку (хеджери, спекулянти, керуючі активами) позиціоновані на ф'ючерсних ринках. Відстеження цих позицій у часі дає цінний контекст для макро- та торгового аналізу. Існуючі COT-інструменти часто застарілі, обмежені одним типом звіту або платні. Цей проект — безкоштовна, self-hosted альтернатива з підтримкою всіх трьох основних форматів звітів.

### Можливості

- **3 типи звітів** — Legacy, Disaggregated та Traders in Financial Futures (TFF)
- **2 підтипи** — Futures Only (FO) та Futures + Options Combined (CO)
- **200+ ринків** — товари, фінанси, валюти, енергоносії, метали, с/г продукція
- **Розрахункові індикатори** — COT Index (3м / 1р / 3р), WCI, нетто-позиції, % від OI, Crowded Level
- **8 COT-сигналів** — Extreme, Crossover, Momentum, Divergence, Flip, WCI, Crowding, Contrarian
- **Інтерактивні графіки** — TradingView Lightweight Charts з накладенням цін (Yahoo Finance)
- **Мульти-ринковий скринер** — теплокарта з сортуванням та фільтрами сигналів
- **Бульбашковий графік** — візуалізація crowding по всіх ринках
- **Двомовна документація** — вбудована документація англійською та українською
- **Автоматичні оновлення** — cron / systemd таймер завантажує свіжі дані щотижня
- **Без бекенд-сервера** — статичні JSON-файли через nginx, нуль runtime-залежностей

### Архітектура

```
┌─────────────────────────────────────────────────┐
│                 Бекенд (Python)                  │
│                                                  │
│  downloader.py → parser.py → storage.py (SQLite) │
│                      ↓                           │
│  calculator.py → exporter.py → JSON-файли        │
│  price_downloader.py ↗                           │
│                                                  │
│  pipeline.py  — оркестратор                      │
│  auto_update.py — точка входу для cron           │
│  data_health_check.py — перевірка цілісності     │
└──────────────────────┬──────────────────────────┘
                       │  статичні JSON
┌──────────────────────▼──────────────────────────┐
│               Фронтенд (React)                   │
│                                                  │
│  CotReportTable — таблиця тижневих даних         │
│  ScreenerTable  — мульти-ринкова теплокарта      │
│  ChartModal     — графіки TradingView            │
│  BubbleChartModal — бульбашкова візуалізація      │
│  DocumentationModal — двомовна документація       │
│                                                  │
│  Vite + Tailwind CSS → dist/                     │
└──────────────────────┬──────────────────────────┘
                       │  обслуговує
                    nginx
```

### Технології

| Рівень | Технологія |
|--------|-----------|
| Бекенд | Python 3.10+, pandas, requests, yfinance |
| База даних | SQLite (локальна, файлова) |
| Фронтенд | React 18, Vite, Tailwind CSS, Recharts, TradingView Lightweight Charts |
| Деплой | nginx, systemd timer / cron |

### Структура проекту

```
cftc/
├── backend/
│   ├── config.py              # Налаштування, URL, визначення груп
│   ├── downloader.py          # Завантаження CSV з CFTC
│   ├── parser.py              # Парсинг CSV у нормалізовані рядки
│   ├── storage.py             # Читання/запис SQLite
│   ├── calculator.py          # COT Index, WCI, сигнали, статистика
│   ├── exporter.py            # Експорт JSON для фронтенду
│   ├── price_downloader.py    # Цінові дані Yahoo Finance
│   ├── pipeline.py            # Оркестратор повного пайплайну
│   ├── auto_update.py         # Точка входу cron з перевірками
│   ├── data_health_check.py   # Перевірка цілісності даних
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Головний компонент з хедером, вкладками
│   │   └── components/
│   │       ├── CotReportTable.jsx
│   │       ├── ScreenerTable.jsx
│   │       ├── ChartModal.jsx
│   │       ├── BubbleChartModal.jsx
│   │       ├── MarketSelector.jsx
│   │       └── DocumentationModal.jsx
│   ├── public/data/           # Згенеровані JSON (не комітяться)
│   ├── package.json
│   └── vite.config.js
├── deploy/
│   ├── DEPLOY.md              # Інструкція деплою на VM
│   ├── setup-vm.sh            # Автоматичне налаштування сервера
│   ├── update.sh              # Скрипт оновлення для cron/systemd
│   ├── cot-update.service     # Systemd service unit
│   ├── cot-update.timer       # Systemd таймер (щотижня)
│   ├── crontab                # Альтернативний cron-розклад
│   └── nginx-cot.conf         # Конфігурація nginx
└── README.md
```

### Швидкий старт (локальна розробка)

**Передумови**: Python 3.10+, Node.js 18+

```bash
# 1. Клонувати
git clone https://github.com/Danylo-D87/equilibrium-cot-analyzer.git
cd equilibrium-cot-analyzer

# 2. Бекенд — встановити залежності та запустити пайплайн
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/macOS
pip install -r requirements.txt
python pipeline.py --verbose
cd ..

# 3. Фронтенд — встановити та запустити dev-сервер
cd frontend
npm install
npm run dev
```

Відкрити `http://localhost:5173` у браузері.

### Деплой на продакшн

Дивіться [deploy/DEPLOY.md](deploy/DEPLOY.md) — повна інструкція деплою на VM з nginx, systemd таймером та автоматичними щотижневими оновленнями.

### Джерела даних

| Дані | Джерело | Розклад |
|------|---------|---------|
| Звіти COT | [CFTC.gov](https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm) | Щотижня (п'ятниця 15:30 ET) |
| Цінові дані | [Yahoo Finance](https://finance.yahoo.com/) через `yfinance` | За запитом |

### Ліцензія

Цей проект призначений для навчальних та дослідницьких цілей. Дані COT є суспільним надбанням (уряд США).
