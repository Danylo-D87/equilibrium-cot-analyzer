# ⚛️ Frontend — Market Analytics Platform

> **React + Vite + TypeScript — interactive COT data dashboard with charts, screener & heatmaps**

🇺🇸 [English](#-english) · 🇺🇦 [Українська](#-українська)

← Back to [Main README](../README.md)

---

<a id="-english"></a>

## 🇺🇸 English

### Overview

The frontend is a **React 18** single-page application built with **Vite** and **TypeScript**. It provides:

- **COT Report Table** — weekly positioning data with heatmap coloring and statistics
- **Multi-Market Screener** — all markets at a glance with category/signal filters
- **Interactive Charts** — TradingView Lightweight Charts, Net Positions, Delta Histogram, COT Index overlays
- **Bubble Chart** — crowding visualization across all markets
- **Bilingual Documentation** — built-in docs in English and Ukrainian
- **Landing Page** — animated hero section with tool cards

### Architecture

```
frontend/
├── package.json                   # Dependencies & npm scripts
├── vite.config.js                 # Dev server, proxy, path aliases
├── tsconfig.json                  # TypeScript configuration
├── tailwind.config.js             # Tailwind CSS (custom tokens)
├── postcss.config.js              # PostCSS config
├── eslint.config.js               # ESLint 9 flat config
├── index.html                     # HTML entry point
│
├── public/
│   └── data/                      # 📦 Static JSON (exported by backend)
│       ├── market_{code}.json              # Per-market detail
│       ├── market_{code}_{type}_{sub}.json # Per-variant detail
│       └── groups_{type}.json              # Group definitions
│
└── src/
    ├── main.tsx                   # React entry point (StrictMode)
    ├── App.tsx                    # Root: QueryClientProvider + RouterProvider
    ├── router.tsx                 # Route definitions
    ├── index.css                  # Global styles + Tailwind directives
    │
    ├── apps/                      # Feature applications
    │   └── cot/                   # 📊 COT Analyzer
    │       ├── CotApp.tsx         # Main view: tabs, selectors, layout
    │       ├── store.ts           # Zustand store (persisted to localStorage)
    │       └── components/
    │           ├── CotReportTable.tsx      # Weekly data table
    │           ├── ScreenerTable.tsx       # Multi-market screener
    │           ├── MarketSelector.tsx      # Search + category dropdown
    │           ├── DocumentationModal.tsx  # Docs modal (lazy loaded)
    │           ├── charts/                # Chart components
    │           │   ├── BubbleChartModal.tsx    # Bubble crowding viz
    │           │   ├── NetPositionsChart.tsx   # Net positions timeseries
    │           │   ├── DeltaHistogram.tsx      # Weekly change histogram
    │           │   ├── IndicatorChart.tsx      # COT Index / WCI chart
    │           │   ├── IndicatorPriceChart.tsx # Indicator + price overlay
    │           │   └── PriceBubbleChart.tsx    # Price bubble chart
    │           └── documentation/         # Doc content components
    │               ├── ReportDocContent.tsx    # Report tab docs
    │               ├── ChartsDocContent.tsx    # Charts tab docs
    │               ├── ScreenerDocContent.tsx  # Screener tab docs
    │               ├── DocComponents.tsx       # Shared doc blocks
    │               └── docSections.ts          # Section defs (UA/EN)
    │
    ├── components/                # Shared components
    │   ├── ui/                    # Design system primitives
    │   │   ├── Badge.tsx          # Semantic label (7 variants)
    │   │   ├── Button.tsx         # Button (3 variants, 3 sizes)
    │   │   ├── ErrorBoundary.tsx  # Error boundary with retry
    │   │   ├── Modal.tsx          # Portal modal (focus trap, Esc, scroll lock)
    │   │   └── Spinner.tsx        # Loading spinner with message
    │   └── landing/               # Landing page visualizations
    │       ├── LiquidBg.tsx       # Animated liquid background
    │       ├── WaveformGraphic.tsx # Waveform animation
    │       ├── SwotGraphic.tsx    # SWOT-style graphic
    │       ├── RadarGraphic.tsx   # Radar chart animation
    │       └── GridGraphic.tsx    # Grid-based animation
    │
    ├── hooks/                     # Custom React hooks
    │   ├── useClickOutside.ts     # Click outside detection
    │   ├── useEscapeKey.ts        # Escape key handler
    │   ├── useLocalStorage.ts     # JSON localStorage (typed)
    │   └── useLocalStorageString.ts # String localStorage
    │
    ├── layouts/                   # Layout components
    │   ├── AppShell.tsx           # Full-height flex container
    │   └── TopNav.tsx             # Top navigation bar (brand + links)
    │
    ├── lib/                       # Libraries & configuration
    │   ├── api.ts                 # API client + static JSON fallback
    │   ├── queryClient.ts         # TanStack Query configuration
    │   └── cn.ts                  # clsx + tailwind-merge utility
    │
    ├── pages/                     # Page components
    │   └── Landing.tsx            # Landing page (hero + tool cards)
    │
    └── types/                     # TypeScript type definitions
```

---

### Quick Start

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api/*` to the backend at `http://127.0.0.1:8000`.

> **Note:** The frontend can work without the backend running — it falls back to static JSON files in `public/data/`.

---

### NPM Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Start dev server (port 5173, HMR) |
| `build` | `vite build` | Production build → `dist/` |
| `preview` | `vite preview` | Preview production build locally |
| `typecheck` | `tsc --noEmit` | TypeScript type checking |
| `lint` | `eslint src/` | Lint source files |
| `lint:fix` | `eslint src/ --fix` | Auto-fix lint issues |
| `format` | `prettier --write src/` | Format code |
| `format:check` | `prettier --check src/` | Check formatting |
| `codegen` | `openapi-typescript ...` | Generate TS types from OpenAPI schema |

---

### Routing

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `Landing` | Landing page — hero, about section, tool cards |
| `/cot` | `CotApp` | COT Analyzer — Report view (default tab) |
| `/cot/screener` | `CotApp` | COT Analyzer — Screener view |

The active view (report vs screener) is derived from the current URL pathname. The `CotApp` component renders inside `AppShell` layout with `TopNav`.

---

### State Management

#### Zustand Store (`apps/cot/store.ts`)

Persisted to `localStorage` under key `cot-settings`:

| State | Type | Persisted | Description |
|-------|------|-----------|-------------|
| `reportType` | `'legacy' \| 'disagg' \| 'tff'` | ✅ | Selected report type |
| `subtype` | `'fo' \| 'co'` | ✅ | Selected subtype |
| `marketCode` | `string` | ✅ | Selected market code (e.g. `"099741"`) |
| `view` | `'report' \| 'screener'` | ❌ | Current view (derived from URL) |
| `chartOpen` | `boolean` | ❌ | Chart modal state |
| `docsOpen` | `boolean` | ❌ | Documentation modal state |

---

### Data Fetching

#### TanStack React Query Configuration

| Setting | Value | Reason |
|---------|-------|--------|
| `staleTime` | 60 min | COT data updates weekly |
| `gcTime` | 4 hours | Keep data in cache longer |
| `retry` | 2 | Retry failed requests |
| `refetchOnWindowFocus` | `false` | Avoid unnecessary refetches |

#### API Client (`lib/api.ts`)

The API client provides these data-fetching functions:

| Function | Endpoint | Fallback |
|----------|----------|----------|
| `fetchMarkets` | `GET /api/v1/cot/markets/{type}/{sub}` | Static JSON |
| `fetchMarketDetail` | `GET /api/v1/cot/markets/{type}/{sub}/{code}` | Static JSON |
| `fetchScreener` | `GET /api/v1/cot/screener/{type}/{sub}` | — |
| `fetchGroups` | `GET /api/v1/cot/groups/{type}` | Static JSON |
| `fetchStatus` | `GET /api/v1/cot/status` | — |

**Static JSON Fallback:** If the API is unavailable, the client automatically falls back to static JSON files in `/data/`. This means the frontend can serve the complete app without a running backend.

#### Custom Hooks

| Hook | Purpose |
|------|---------|
| `useMarkets` | Fetches market list (with React Query) |
| `useMarketDetail` | Fetches full market data |
| `useScreener` | Fetches screener data |

---

### Component Details

#### `CotApp` — Main COT Analyzer

The root component of the COT module. Renders:
- **Header bar** with report type selector (Legacy / Disagg / TFF), subtype toggle (FO / CO)
- **View tabs** — Report and Screener
- **Market Selector** — search + category-grouped dropdown
- **Action buttons** — Charts, Bubble Chart, Documentation
- **Content area** — `CotReportTable` or `ScreenerTable` based on active tab

#### `CotReportTable` — Weekly Data Table

Displays weekly COT positioning data in a scrollable table:
- Columns per trader group: Long, Short, Net, Change, % of OI, COT Index (3m/1y/3y), WCI, Crowded
- **Heatmap coloring** — cells colored by value intensity
- **Statistics row** — max, min, 5Y max/min, 13W average
- Click on row → open Chart modal

#### `ScreenerTable` — Multi-Market Screener

All markets in one table with:
- **Category filters** — Currencies, Metals, Energy, Grains, etc.
- **Signal filters** — filter by crowded signal type
- **Sortable columns** — click headers to sort
- **Heatmap coloring** — COT Index, Net Change, Crowded signals
- Click on row → navigate to that market's Report view

#### `MarketSelector` — Market Picker

Searchable dropdown grouped by category:
- Type-ahead search with fuzzy matching
- Markets organized into collapsible category groups
- Keyboard navigation support

#### Chart Components

| Component | Description |
|-----------|-------------|
| `BubbleChartModal` | All markets as bubbles, sized by OI, colored by crowded signal |
| `NetPositionsChart` | Net positions timeseries (Recharts area chart) |
| `DeltaHistogram` | Weekly net change as histogram bars |
| `IndicatorChart` | COT Index or WCI line chart with threshold zones |
| `IndicatorPriceChart` | Indicator line overlaid with TradingView price chart |
| `PriceBubbleChart` | Price series with bubble sizing |

#### UI Components

| Component | Variants | Description |
|-----------|----------|-------------|
| `Badge` | default, success, destructive, warning, muted, blue, purple | Semantic label/tag |
| `Button` | ghost, outline, solid · sm, md, icon | Shared button |
| `Modal` | sm, md, lg, xl, full | Portal-based modal with focus trap, Esc close, scroll lock |
| `ErrorBoundary` | — | React error boundary with retry button |
| `Spinner` | — | Animated loading indicator with optional message |

---

### 8 COT Signals (Client-Side Detection)

The frontend computes COT signals based on directional changes in Price, Longs, and Shorts:

| # | Signal | Price | Longs | Shorts | Category |
|---|--------|-------|-------|--------|----------|
| 1 | **Strong Bullish** | ↑ | ↑ | ↓ | 🟢 Bullish |
| 2 | **Accumulation** | ↓ | ↑ | ↓ | 🟢 Bullish |
| 3 | **Floor Building** | ↓ | ↑ | ↑ | 🟢 Bullish |
| 4 | **Strong Bearish** | ↓ | ↓ | ↑ | 🔴 Bearish |
| 5 | **Distribution** | ↑ | ↓ | ↑ | 🔴 Bearish |
| 6 | **Topping Out** | ↑ | ↑ | ↑ | 🔴 Bearish |
| 7 | **Profit Taking** | ↑ | ↓ | ↓ | 🟡 Exhaustion |
| 8 | **Liquidation** | ↓ | ↓ | ↓ | 🟡 Exhaustion |

Implemented in `src/apps/cot/utils/signals.ts` → `detectSignal()` function.

---

### Utility Modules

| Module | Path | Purpose |
|--------|------|---------|
| `constants.ts` | `apps/cot/utils/` | Report types, subtypes, default codes, category ordering, timeframes, chart colors, signal names |
| `formatters.ts` | `apps/cot/utils/` | Number formatting: `formatNumber`, `formatPercent`, `formatPrice`, `formatDate`, `formatCompact`, `formatSignal` |
| `colors.ts` | `apps/cot/utils/` | Heatmap color functions: `getHeatmapColor`, `getCotIndexColor`, `getCrowdedColor`, `getChangeColor`; category color palette |
| `signals.ts` | `apps/cot/utils/` | 8-signal COT matrix detection: `detectSignal()` |
| `screener.ts` | `apps/cot/utils/` | `enrichScreenerData()` — adds computed columns (totals, ratios, OI %) |

---

### Design System

| Token | Value | Usage |
|-------|-------|-------|
| **Background** | `#050505` | App background |
| **Surface** | CSS variable | Card/panel backgrounds |
| **Accent** | `#c4a87c` (bronze) | Primary accent color |
| **Font Sans** | Inter | Body text |
| **Font Serif** | Cinzel | Headings |
| **Font Mono** | JetBrains Mono | Code / numbers |
| **Theme** | Dark only | No light mode |

Fonts loaded via Google Fonts in `index.html`. Color tokens defined as CSS custom properties and extended in `tailwind.config.js`.

**Brand:** "Equilibrium Capital" with chess rook favicon (`/rook.ico`).

---

### Vite Configuration

| Setting | Value | Description |
|---------|-------|-------------|
| Dev port | `5173` | Default Vite port |
| API proxy | `/api` → `http://127.0.0.1:8000` | Backend proxy with `changeOrigin` |
| Path alias | `@` → `./src` | Import shorthand |
| App type | `spa` | Single-page application |
| Plugin | `@vitejs/plugin-react` | React Fast Refresh |

---

### Dependencies

#### Runtime

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | 18 | UI library |
| `react-dom` | 18 | React DOM renderer |
| `react-router-dom` | 7 | Client-side routing |
| `@tanstack/react-query` | 5 | Server state management |
| `@tanstack/react-virtual` | 3 | Virtualized lists (performance) |
| `zustand` | 5 | Client state management (persisted) |
| `recharts` | 2 | Charting library |
| `lightweight-charts` | — | TradingView charts |
| `clsx` | 2 | Conditional CSS classes |
| `tailwind-merge` | 3 | Tailwind class deduplication |

#### Development

| Package | Version | Purpose |
|---------|---------|---------|
| `vite` | 5 | Build tool & dev server |
| `@vitejs/plugin-react` | 4 | React HMR & JSX |
| `typescript` | 5 | Type checking |
| `tailwindcss` | 3 | Utility-first CSS |
| `postcss` | 8 | CSS processing |
| `autoprefixer` | 10 | CSS vendor prefixes |
| `eslint` | 9 | Code linting |
| `prettier` | 3 | Code formatting |
| `openapi-typescript` | 7 | OpenAPI → TS types codegen |

---

### Static JSON Fallback

The frontend can operate fully **without a running backend**. When API requests fail, it falls back to static JSON files in `public/data/`:

```
public/data/
├── groups_legacy.json         # Legacy trader groups
├── groups_disagg.json         # Disaggregated trader groups
├── groups_tff.json            # TFF trader groups
├── market_099741.json         # Market detail (default format)
├── market_099741_legacy_fo.json  # Market detail (specific variant)
├── market_099741_legacy_co.json
└── ...
```

These files are generated by the backend pipeline (`exporter.py`) and should be committed or deployed alongside the frontend.

---

<a id="-українська"></a>

## 🇺🇦 Українська

### Огляд

Фронтенд — це **React 18** односторінковий додаток на **Vite** та **TypeScript**. Він надає:

- **Таблиця COT звітів** — щотижневі дані позиціонування з теплокартою та статистикою
- **Мульти-ринковий скринер** — всі ринки в одній таблиці з фільтрами категорій та сигналів
- **Інтерактивні графіки** — TradingView Lightweight Charts, Net Positions, Delta Histogram, COT Index overlay
- **Бульбашковий графік** — візуалізація crowding по всіх ринках
- **Двомовна документація** — вбудовані доки англійською та українською
- **Лендінг** — анімована hero секція з картками інструментів

---

### Швидкий старт

```bash
cd frontend
npm install
npm run dev
```

Відкрити `http://localhost:5173`. Vite проксує `/api/*` на бекенд `http://127.0.0.1:8000`.

> **Примітка:** Фронтенд може працювати без бекенду — він автоматично переключається на статичні JSON-файли в `public/data/`.

---

### NPM Скрипти

| Скрипт | Команда | Опис |
|--------|---------|------|
| `dev` | `vite` | Dev-сервер (порт 5173, HMR) |
| `build` | `vite build` | Продакшн збірка → `dist/` |
| `preview` | `vite preview` | Перегляд збірки локально |
| `typecheck` | `tsc --noEmit` | Перевірка TypeScript типів |
| `lint` | `eslint src/` | Лінтинг |
| `lint:fix` | `eslint src/ --fix` | Автовиправлення лінтера |
| `format` | `prettier --write src/` | Форматування коду |
| `codegen` | `openapi-typescript ...` | Генерація TS типів з OpenAPI |

---

### Маршрутизація

| Шлях | Компонент | Опис |
|------|-----------|------|
| `/` | `Landing` | Лендінг — hero, секція про, картки інструментів |
| `/cot` | `CotApp` | COT Analyzer — перегляд звітів (вкладка за замовч.) |
| `/cot/screener` | `CotApp` | COT Analyzer — скринер |

---

### Управління станом

#### Zustand Store (`apps/cot/store.ts`)

Зберігається в `localStorage` під ключем `cot-settings`:

| Стан | Тип | Зберігається | Опис |
|------|-----|-------------|------|
| `reportType` | `'legacy' \| 'disagg' \| 'tff'` | ✅ | Вибраний тип звіту |
| `subtype` | `'fo' \| 'co'` | ✅ | Вибраний підтип |
| `marketCode` | `string` | ✅ | Код обраного ринку |
| `view` | `'report' \| 'screener'` | ❌ | Поточний вид (з URL) |
| `chartOpen` | `boolean` | ❌ | Стан модалки графіків |
| `docsOpen` | `boolean` | ❌ | Стан модалки документації |

---

### Отримання даних

#### TanStack React Query

| Налаштування | Значення | Причина |
|-------------|----------|---------|
| `staleTime` | 60 хв | COT дані оновлюються щотижня |
| `gcTime` | 4 години | Тримати дані в кеші довше |
| `retry` | 2 | Повторні спроби при помилці |
| `refetchOnWindowFocus` | `false` | Уникнення зайвих запитів |

#### Фоллбек на статичний JSON

Якщо API недоступний, клієнт автоматично завантажує дані зі статичних JSON-файлів у `/data/`. Це означає, що фронтенд може повноцінно працювати **без запущеного бекенду**.

---

### Компоненти

#### `CotApp` — Головний COT Analyzer

- Панель заголовка з вибором типу звіту та підтипу
- Вкладки перегляду — Report та Screener
- Вибір ринку — пошук + категоризований дропдаун
- Кнопки дій — Графіки, Бульбашковий графік, Документація

#### `CotReportTable` — Таблиця тижневих даних

- Колонки по групах трейдерів: Long, Short, Net, Change, % of OI, COT Index, WCI, Crowded
- **Теплокарта** — кольорове кодування за інтенсивністю значень
- **Рядок статистики** — max, min, 5Y max/min, 13W average

#### `ScreenerTable` — Мульти-ринковий скринер

- **Фільтри категорій** — Валюти, Метали, Енергоносії, Зернові тощо
- **Фільтри сигналів** — за типом crowded сигналу
- **Сортування** — клік по заголовку колонки
- **Теплокарта** — COT Index, зміни, crowded сигнали

#### Графіки

| Компонент | Опис |
|-----------|------|
| `BubbleChartModal` | Всі ринки як бульбашки, розмір = OI, колір = crowded сигнал |
| `NetPositionsChart` | Таймсерія нетто-позицій (Recharts area chart) |
| `DeltaHistogram` | Гістограма тижневих змін |
| `IndicatorChart` | COT Index / WCI лінійний графік із зонами порогів |
| `IndicatorPriceChart` | Індикатор з накладенням ціни (TradingView) |

---

### 8 COT-Сигналів

| # | Сигнал | Ціна | Лонги | Шорти | Категорія |
|---|--------|------|-------|-------|-----------|
| 1 | **Strong Bullish** | ↑ | ↑ | ↓ | 🟢 Бичачий |
| 2 | **Accumulation** | ↓ | ↑ | ↓ | 🟢 Бичачий |
| 3 | **Floor Building** | ↓ | ↑ | ↑ | 🟢 Бичачий |
| 4 | **Strong Bearish** | ↓ | ↓ | ↑ | 🔴 Ведмежий |
| 5 | **Distribution** | ↑ | ↓ | ↑ | 🔴 Ведмежий |
| 6 | **Topping Out** | ↑ | ↑ | ↑ | 🔴 Ведмежий |
| 7 | **Profit Taking** | ↑ | ↓ | ↓ | 🟡 Виснаження |
| 8 | **Liquidation** | ↓ | ↓ | ↓ | 🟡 Виснаження |

Реалізовано в `src/apps/cot/utils/signals.ts` → функція `detectSignal()`.

---

### Дизайн-система

| Токен | Значення | Використання |
|-------|----------|-------------|
| **Фон** | `#050505` | Фон додатку |
| **Акцент** | `#c4a87c` (бронзовий) | Первинний акцентний колір |
| **Шрифт Sans** | Inter | Основний текст |
| **Шрифт Serif** | Cinzel | Заголовки |
| **Шрифт Mono** | JetBrains Mono | Код / числа |
| **Тема** | Тільки темна | Без світлого режиму |

**Бренд:** "Equilibrium Capital" з шаховою турою як фавіконкою.

---

### Залежності

#### Runtime

| Пакет | Версія | Призначення |
|-------|--------|-------------|
| `react` | 18 | UI бібліотека |
| `react-dom` | 18 | React DOM рендерер |
| `react-router-dom` | 7 | Клієнтська маршрутизація |
| `@tanstack/react-query` | 5 | Управління серверним станом |
| `@tanstack/react-virtual` | 3 | Віртуалізовані списки |
| `zustand` | 5 | Управління клієнтським станом |
| `recharts` | 2 | Бібліотека графіків |
| `lightweight-charts` | — | TradingView графіки |
| `clsx` | 2 | Умовні CSS класи |
| `tailwind-merge` | 3 | Дедуплікація Tailwind класів |

#### Development

| Пакет | Версія | Призначення |
|-------|--------|-------------|
| `vite` | 5 | Збірник та dev-сервер |
| `typescript` | 5 | Перевірка типів |
| `tailwindcss` | 3 | Utility-first CSS |
| `eslint` | 9 | Лінтинг коду |
| `prettier` | 3 | Форматування коду |
| `openapi-typescript` | 7 | OpenAPI → TS типи |
