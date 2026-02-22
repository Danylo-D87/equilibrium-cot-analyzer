# ⚛️ Frontend — Equilibrium Market Analytics Platform

> **React + Vite + TypeScript — auth, trading journal, COT dashboard with charts, screener & heatmaps**

🇺🇸 [English](#-english) · 🇺🇦 [Українська](#-українська)

← Back to [Main README](../README.md)

---

<a id="-english"></a>

## 🇺🇸 English

### Overview

The frontend is a **React 18** single-page application built with **Vite** and **TypeScript**. It provides:

- **Authentication** — login, registration, email verification, OAuth (Google, GitHub)
- **COT Report Table** — weekly positioning data with heatmap coloring and statistics
- **Multi-Market Screener** — all markets at a glance with category/signal filters
- **Interactive Charts** — TradingView Lightweight Charts, Net Positions, Delta Histogram, COT Index overlays
- **Bubble Chart** — crowding visualization across all markets
- **Trading Journal** — portfolio dashboard with 13+ analytics charts, trade management, image attachments
- **Admin Panel** — user management, permission grants, registration stats
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
    ├── main.tsx                   # React entry (StrictMode + AuthProvider)
    ├── App.tsx                    # Root: QueryClientProvider + RouterProvider
    ├── router.tsx                 # Route definitions (protected + public)
    ├── index.css                  # Global styles + Tailwind directives
    │
    ├── context/                   # Global context providers
    │   └── AuthContext.tsx         # Auth state: user, login, register,
    │                               # verifyEmail, logout, hasPermission, isAdmin
    │
    ├── apps/                      # Feature applications
    │   ├── cot/                   # 📊 COT Analyzer
    │   │   ├── CotApp.tsx         # Main view: tabs, selectors, layout
    │   │   ├── store/
    │   │   │   └── useCotStore.ts # Zustand store (persisted to localStorage)
    │   │   ├── hooks/
    │   │   │   └── useMarketQueries.ts  # TanStack Query hooks
    │   │   ├── types/             # Market, screener, signal types
    │   │   ├── utils/             # Colors, constants, formatters, signals, enrichment
    │   │   └── components/
    │   │       ├── CotReportTable.tsx      # Weekly data table
    │   │       ├── ScreenerTable.tsx       # Multi-market screener
    │   │       ├── MarketSelector.tsx      # Search + category dropdown
    │   │       ├── DocumentationModal.tsx  # Docs modal (lazy loaded)
    │   │       ├── charts/                # Chart components
    │   │       │   ├── BubbleChartModal.tsx    # Bubble crowding viz
    │   │       │   ├── BubbleFallbackChart.tsx # Recharts fallback
    │   │       │   ├── NetPositionsChart.tsx   # Net positions timeseries
    │   │       │   ├── DeltaHistogram.tsx      # Weekly change histogram
    │   │       │   ├── IndicatorChart.tsx      # COT Index / WCI chart
    │   │       │   ├── IndicatorPriceChart.tsx # Indicator + price overlay
    │   │       │   ├── PriceBubbleChart.tsx    # Price bubble chart
    │   │       │   └── chartConstants.ts       # Chart color/style constants
    │   │       └── documentation/         # Doc content components
    │   │           ├── ReportDocContent.tsx    # Report tab docs
    │   │           ├── ChartsDocContent.tsx    # Charts tab docs
    │   │           ├── ScreenerDocContent.tsx  # Screener tab docs
    │   │           ├── DocComponents.tsx       # Shared doc blocks
    │   │           └── sections.ts            # Section defs (UA/EN)
    │   │
    │   └── journal/               # 📓 Trading Journal
    │       ├── pages/
    │       │   ├── Dashboard.tsx       # Journal dashboard (charts + metrics)
    │       │   └── JournalPage.tsx     # Orphan trade management
    │       ├── components/
    │       │   ├── MetricsGrid.tsx     # Key metrics cards
    │       │   ├── FilterSidebar.tsx   # Date/portfolio/pair filters
    │       │   ├── AssetsExposure.tsx  # Assets distribution chart
    │       │   ├── LiveAssetsExposure.tsx
    │       │   ├── ChartCardModal.tsx  # Chart container with fullscreen
    │       │   ├── MetricCardModal.tsx # Metric detail modal
    │       │   ├── MetricInfoModal.tsx # Metric info/help
    │       │   └── charts/            # 13+ analytics chart components
    │       │       ├── EquityCurveChart.tsx
    │       │       ├── DrawdownChart.tsx
    │       │       ├── AlphaCurveChart.tsx
    │       │       ├── DailyReturnsChart.tsx
    │       │       ├── RollingMetricsChart.tsx
    │       │       ├── RollingWinRateChart.tsx
    │       │       ├── RollingTrackingErrorChart.tsx
    │       │       ├── RollingInformationRatioChart.tsx
    │       │       ├── RMultipleChart.tsx
    │       │       ├── NAVHistoryChart.tsx
    │       │       ├── ComparativeDrawdownChart.tsx
    │       │       ├── NAVvsHWMChart.tsx
    │       │       └── ExpectedVsActualChart.tsx
    │       ├── hooks/
    │       │   ├── useJournalQueries.ts  # TanStack Query hooks
    │       │   └── useAnimatedValue.ts   # Smooth number animation
    │       ├── store/
    │       │   └── useJournalStore.ts    # Zustand store
    │       ├── api/
    │       │   └── journalApi.ts         # API client functions
    │       ├── i18n/
    │       │   └── translations.ts       # UK/EN/RU translations
    │       ├── types/
    │       │   └── index.ts
    │       └── utils/
    │           ├── formatters.ts
    │           └── constants.ts
    │
    ├── components/                # Shared components
    │   ├── ui/                    # Design system primitives
    │   │   ├── Badge.tsx          # Semantic label (7 variants)
    │   │   ├── Button.tsx         # Button (3 variants, 3 sizes)
    │   │   ├── ErrorBoundary.tsx  # Error boundary with retry
    │   │   ├── Modal.tsx          # Portal modal (focus trap, Esc, scroll lock)
    │   │   └── Spinner.tsx        # Loading spinner with message
    │   ├── auth/                  # Auth route guards
    │   │   ├── ProtectedRoute.tsx # Permission-based route guard
    │   │   └── AdminRoute.tsx     # Admin-only route guard
    │   └── landing/               # Landing page visualizations
    │       ├── ViscousBackground.tsx  # Animated liquid background
    │       ├── WaveformVisualization.tsx
    │       ├── SwotVisualization.tsx
    │       ├── RadarVisualization.tsx
    │       └── GridVisualization.tsx
    │
    ├── hooks/                     # Custom React hooks
    │   ├── useClickOutside.ts     # Click outside detection
    │   ├── useEscapeKey.ts        # Escape key handler
    │   └── useLocalStorage.ts     # JSON localStorage (typed)
    │
    ├── layouts/                   # Layout components
    │   ├── AppShell.tsx           # Full-height flex container (authed pages)
    │   ├── TopNav.tsx             # Top navigation bar (brand + links)
    │   └── PublicLayout.tsx       # Public pages layout (animated background)
    │
    ├── lib/                       # Libraries & configuration
    │   ├── api.ts                 # API client + static JSON fallback
    │   ├── queryClient.ts         # TanStack Query configuration
    │   └── cn.ts                  # clsx + tailwind-merge utility
    │
    ├── pages/                     # Page components
    │   ├── Landing.tsx            # Landing page (hero + tool cards)
    │   ├── LoginPage.tsx          # Email/password login + OAuth buttons
    │   ├── RegisterPage.tsx       # Registration + email verification code
    │   ├── OAuthCallbackPage.tsx  # OAuth redirect handler
    │   └── admin/
    │       ├── AdminPanel.tsx     # Admin dashboard with tabs
    │       └── tabs/
    │           ├── UsersTab.tsx   # User management list
    │           └── StatsTab.tsx   # Registration statistics
    │
    └── types/                     # TypeScript type definitions
        ├── index.ts               # Shared types
        └── auth.ts                # UserProfile, LoginResponse, AuthState
```

---

### Quick Start

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api/*` to the backend at `http://127.0.0.1:8000`.

> **Note:** The COT module can work without the backend running — it falls back to static JSON files in `public/data/`. Auth and Journal features require the backend.

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

| Path | Component | Auth | Permission | Description |
|------|-----------|------|------------|-------------|
| `/` | `Landing` | — | — | Landing page — hero, about, tool cards |
| `/login` | `LoginPage` | — | — | Sign-in (email/password + OAuth) |
| `/register` | `RegisterPage` | — | — | Registration + email verification flow |
| `/auth/callback` | `OAuthCallbackPage` | — | — | OAuth redirect handler |
| `/cot` | `CotApp` | ✅ | `cot` | COT Analyzer — Report view |
| `/cot/screener` | `CotApp` | ✅ | `cot` | COT Analyzer — Screener view |
| `/journal` | `JournalDashboard` | ✅ | `journal` | Trading Journal — Dashboard |
| `/journal/orphan` | `JournalPage` | ✅ | `journal` | Trading Journal — Orphan trades |
| `/admin` | `AdminPanel` | ✅ | admin role | Admin panel |

**Route guards:**
- `ProtectedRoute` — checks auth + specific `permission` (shows styled access-denied modal if denied)
- `AdminRoute` — checks auth + admin `role`
- Public pages use `PublicLayout` with persistent animated background
- Authenticated pages use `AppShell` with `TopNav`

---

### Authentication

#### AuthContext (`context/AuthContext.tsx`)

Global auth state wrapping the entire application:

| Property/Method | Type | Description |
|-----------------|------|-------------|
| `user` | `UserProfile \| null` | Current user object |
| `isAuthenticated` | `boolean` | Whether user is logged in |
| `isLoading` | `boolean` | Initial auth check in progress |
| `login(email, password)` | `async` | Login → stores access token in memory |
| `register(email, password, nickname)` | `async` | Register → returns pending state |
| `verifyEmail(email, code)` | `async` | Verify → stores access token |
| `logout()` | `async` | Revoke token, clear state |
| `hasPermission(perm)` | `boolean` | Check user permission |
| `isAdmin` | `boolean` | Check admin role |

**Token storage strategy:**
- Access token: **in-memory only** (never localStorage)
- Refresh token: **HttpOnly cookie** (set by backend)
- `localStorage` only stores `auth.hasRefresh` boolean marker (no secrets)
- On mount: silent refresh attempt via HttpOnly cookie → restores session

---

### State Management

#### COT Store (`apps/cot/store/useCotStore.ts`)

Persisted to `localStorage` under key `cot-settings`:

| State | Type | Persisted | Description |
|-------|------|-----------|-------------|
| `reportType` | `'legacy' \| 'disagg' \| 'tff'` | ✅ | Selected report type |
| `subtype` | `'fo' \| 'co'` | ✅ | Selected subtype |
| `marketCode` | `string` | ✅ | Selected market code |
| `view` | `'report' \| 'screener'` | ❌ | Current view (derived from URL) |
| `chartOpen` | `boolean` | ❌ | Chart modal state |
| `docsOpen` | `boolean` | ❌ | Documentation modal state |

#### Journal Store (`apps/journal/store/useJournalStore.ts`)

| State | Type | Description |
|-------|------|-------------|
| Filters | portfolio ID, date range, pair | Active filter state |
| UI state | selected chart, modals | UI interaction state |

---

### Data Fetching

#### TanStack React Query Configuration

| Setting | Value | Reason |
|---------|-------|--------|
| `staleTime` | 60 min | COT data updates weekly |
| `gcTime` | 4 hours | Keep data in cache longer |
| `retry` | 2 | Retry failed requests |
| `refetchOnWindowFocus` | `false` | Avoid unnecessary refetches |

#### COT API Client (`lib/api.ts`)

| Function | Endpoint | Fallback |
|----------|----------|----------|
| `fetchMarkets` | `GET /api/v1/cot/markets/{type}/{sub}` | Static JSON |
| `fetchMarketDetail` | `GET /api/v1/cot/markets/{type}/{sub}/{code}` | Static JSON |
| `fetchScreener` | `GET /api/v1/cot/screener/{type}/{sub}` | — |
| `fetchGroups` | `GET /api/v1/cot/groups/{type}` | Static JSON |
| `fetchStatus` | `GET /api/v1/cot/status` | — |

**Static JSON Fallback:** If the API is unavailable, the COT client automatically falls back to static JSON files in `/data/`.

#### Journal API Client (`apps/journal/api/journalApi.ts`)

Full CRUD for portfolios, trades, images + 15+ analytics endpoints. All requests include JWT access token via Authorization header.

#### Custom Hooks

| Hook | Location | Purpose |
|------|----------|---------|
| `useMarkets` | `apps/cot/hooks/` | Fetch COT market list |
| `useMarketDetail` | `apps/cot/hooks/` | Fetch full market data |
| `useScreener` | `apps/cot/hooks/` | Fetch screener data |
| `useJournalQueries` | `apps/journal/hooks/` | Journal data + analytics hooks |
| `useAnimatedValue` | `apps/journal/hooks/` | Smooth number animation |
| `useClickOutside` | `hooks/` | Click outside detection |
| `useEscapeKey` | `hooks/` | Escape key handler |
| `useLocalStorage` | `hooks/` | Type-safe localStorage |

---

### Component Details

#### Auth Pages

| Component | Description |
|-----------|-------------|
| `LoginPage` | Email/password form + Google & GitHub OAuth buttons |
| `RegisterPage` | Two-step: registration form → 6-digit email verification code entry |
| `OAuthCallbackPage` | Processes OAuth redirect, extracts access token from URL params |

#### `CotApp` — COT Analyzer

The root component of the COT module. Renders:
- **Header bar** with report type selector (Legacy / Disagg / TFF), subtype toggle (FO / CO)
- **View tabs** — Report and Screener
- **Market Selector** — search + category-grouped dropdown
- **Action buttons** — Charts, Bubble Chart, Documentation
- **Content area** — `CotReportTable` or `ScreenerTable`

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

#### Journal Dashboard

Full trading journal analytics dashboard:
- **MetricsGrid** — key portfolio metrics (total trades, win rate, P&L, Sharpe, etc.)
- **13+ chart components** — equity curve, drawdown, alpha, rolling metrics, NAV, R-multiple distribution, etc.
- **FilterSidebar** — portfolio, date range, pair/asset filters
- **ChartCardModal** — fullscreen chart view with screenshot capability
- Supports **3 languages** (English, Ukrainian, Russian)

#### Admin Panel

Tab-based admin interface:
- **UsersTab** — list users, grant/revoke permissions (`cot`, `journal`), activate/deactivate
- **StatsTab** — registration statistics with date range picker and charts

#### Chart Components (COT)

| Component | Description |
|-----------|-------------|
| `BubbleChartModal` | All markets as bubbles, sized by OI, colored by crowded signal |
| `NetPositionsChart` | Net positions timeseries (Recharts area chart) |
| `DeltaHistogram` | Weekly net change as histogram bars |
| `IndicatorChart` | COT Index or WCI line chart with threshold zones |
| `IndicatorPriceChart` | Indicator line overlaid with TradingView price chart |
| `PriceBubbleChart` | Price series with bubble sizing |

#### Chart Components (Journal)

| Component | Description |
|-----------|-------------|
| `EquityCurveChart` | Portfolio equity over time |
| `DrawdownChart` | Drawdown periods and depth |
| `AlphaCurveChart` | Alpha vs BTC benchmark |
| `DailyReturnsChart` | Daily returns distribution |
| `RollingMetricsChart` | Rolling Sharpe, Sortino, etc. |
| `RollingWinRateChart` | Rolling win rate over time |
| `RMultipleChart` | R-multiple distribution histogram |
| `NAVHistoryChart` | Net Asset Value history |
| `NAVvsHWMChart` | NAV vs High Water Mark |
| `ComparativeDrawdownChart` | Portfolio vs benchmark drawdown |
| `ExpectedVsActualChart` | Expected vs actual returns |
| `RollingInformationRatioChart` | Rolling information ratio |
| `RollingTrackingErrorChart` | Rolling tracking error |

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

Implemented in `src/apps/cot/utils/cotSignals.ts` → `detectSignal()`.

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

Fonts loaded via Google Fonts in `index.html`. Color tokens as CSS custom properties extended in `tailwind.config.js`.

**Brand:** "Equilibrium" with chess rook favicon (`/rook.ico`).

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
| `@dnd-kit/core` | 6 | Drag-and-drop (image reorder) |
| `@dnd-kit/sortable` | 10 | Sortable DnD |
| `lucide-react` | — | Icon library |
| `date-fns` | 4 | Date formatting & manipulation |
| `modern-screenshot` | 4 | Screenshot capture (chart export) |
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

### Static JSON Fallback (COT only)

The COT module can operate fully **without a running backend**. When API requests fail, it falls back to static JSON files in `public/data/`:

```
public/data/
├── groups_legacy.json
├── groups_disagg.json
├── groups_tff.json
├── market_099741.json
├── market_099741_legacy_fo.json
└── ...
```

These files are generated by the backend pipeline (`exporter.py`).

> **Note:** Auth, Journal, and Admin features always require a running backend + PostgreSQL.

---

<a id="-українська"></a>

## 🇺🇦 Українська

### Огляд

Фронтенд — це **React 18** односторінковий додаток на **Vite** та **TypeScript**. Він надає:

- **Аутентифікацію** — логін, реєстрація, верифікація email, OAuth (Google, GitHub)
- **Таблиця COT-звітів** — щотижневі дані позиціонування з теплокартою та статистикою
- **Мульти-ринковий скринер** — всі ринки з фільтрами категорій та сигналів
- **Інтерактивні графіки** — TradingView, Net Positions, Delta Histogram, COT Index overlay
- **Бульбашковий графік** — візуалізація crowding по всіх ринках
- **Торговий журнал** — дашборд портфеля з 13+ аналітичними графіками, управління угодами, зображення
- **Адмін-панель** — управління користувачами, дозволи, статистика реєстрацій
- **Двомовна документація** — вбудовані доки англійською та українською
- **Лендінг** — анімована hero-секція з картками інструментів

---

### Швидкий старт

```bash
cd frontend
npm install
npm run dev
```

Відкрити `http://localhost:5173`. Vite проксує `/api/*` на бекенд `http://127.0.0.1:8000`.

> **Примітка:** COT-модуль може працювати без бекенду (фоллбек на статичний JSON). Auth та Journal потребують бекенд.

---

### NPM Скрипти

| Скрипт | Команда | Опис |
|--------|---------|------|
| `dev` | `vite` | Dev-сервер (порт 5173, HMR) |
| `build` | `vite build` | Продакшн збірка → `dist/` |
| `preview` | `vite preview` | Перегляд збірки |
| `typecheck` | `tsc --noEmit` | Перевірка TypeScript |
| `lint` | `eslint src/` | Лінтинг |
| `lint:fix` | `eslint src/ --fix` | Автовиправлення |
| `format` | `prettier --write src/` | Форматування |
| `codegen` | `openapi-typescript ...` | Генерація TS типів |

---

### Маршрутизація

| Шлях | Компонент | Auth | Дозвіл | Опис |
|------|-----------|------|--------|------|
| `/` | `Landing` | — | — | Лендінг |
| `/login` | `LoginPage` | — | — | Логін (email + OAuth) |
| `/register` | `RegisterPage` | — | — | Реєстрація + верифікація email |
| `/auth/callback` | `OAuthCallbackPage` | — | — | OAuth callback |
| `/cot` | `CotApp` | ✅ | `cot` | COT Analyzer — звіти |
| `/cot/screener` | `CotApp` | ✅ | `cot` | COT Analyzer — скринер |
| `/journal` | `JournalDashboard` | ✅ | `journal` | Торговий журнал — дашборд |
| `/journal/orphan` | `JournalPage` | ✅ | `journal` | Торговий журнал — orphan угоди |
| `/admin` | `AdminPanel` | ✅ | admin | Адмін-панель |

**Route guards:**
- `ProtectedRoute` — перевіряє auth + дозвіл (стилізована модалка відмови)
- `AdminRoute` — перевіряє auth + роль admin
- Публічні сторінки — `PublicLayout` з анімованим фоном
- Авторизовані — `AppShell` з `TopNav`

---

### Аутентифікація

#### AuthContext

Глобальний контекст авторизації:

| Метод | Опис |
|-------|------|
| `login(email, pwd)` | Логін → access token в пам'яті |
| `register(email, pwd, name)` | Реєстрація → pending стан |
| `verifyEmail(email, code)` | Верифікація → access token |
| `logout()` | Відкликання, очищення стану |
| `hasPermission(perm)` | Перевірка дозволу |
| `isAdmin` | Перевірка ролі admin |

**Стратегія збереження токенів:**
- Access token: **тільки в пам'яті** (ніколи localStorage)
- Refresh token: **HttpOnly cookie** (встановлюється бекендом)
- `localStorage` зберігає тільки `auth.hasRefresh` (boolean, без секретів)
- При завантаженні: тиха спроба оновлення через cookie

---

### Управління станом

#### COT Store (Zustand, `localStorage`)

| Стан | Зберігається | Опис |
|------|-------------|------|
| `reportType` | ✅ | Тип звіту (legacy/disagg/tff) |
| `subtype` | ✅ | Підтип (fo/co) |
| `marketCode` | ✅ | Код ринку |
| `view` | ❌ | Поточний вид (з URL) |

#### Journal Store (Zustand)

Фільтри (portfolio, дати, актив), стан UI (обрані графіки, модалки).

---

### Компоненти

#### Auth-сторінки

| Компонент | Опис |
|-----------|------|
| `LoginPage` | Email/пароль + OAuth кнопки (Google, GitHub) |
| `RegisterPage` | Два кроки: реєстрація → введення 6-значного коду |
| `OAuthCallbackPage` | Обробка OAuth редіректу |

#### COT-компоненти

| Компонент | Опис |
|-----------|------|
| `CotApp` | Головний COT Analyzer (вкладки, селектори, layout) |
| `CotReportTable` | Таблиця з теплокартою, статистикою |
| `ScreenerTable` | Мульти-ринковий скринер з фільтрами |
| `MarketSelector` | Пошук + категоризований дропдаун |
| `BubbleChartModal` | Бульбашки: розмір=OI, колір=crowded |

#### Journal-компоненти

| Компонент | Опис |
|-----------|------|
| `Dashboard` | Аналітичний дашборд (13+ графіків) |
| `MetricsGrid` | Ключові метрики портфеля |
| `FilterSidebar` | Фільтри по портфелю, датах, активах |
| 13+ Chart компонентів | Equity, Drawdown, Alpha, Rolling, NAV… |

#### Адмін-панель

| Tab | Опис |
|-----|------|
| `UsersTab` | Список користувачів, дозволи, активація |
| `StatsTab` | Статистика реєстрацій з графіками |

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

---

### Дизайн-система

| Токен | Значення | Використання |
|-------|----------|-------------|
| **Фон** | `#050505` | Фон додатку |
| **Акцент** | `#c4a87c` (бронзовий) | Акцентний колір |
| **Sans** | Inter | Основний текст |
| **Serif** | Cinzel | Заголовки |
| **Mono** | JetBrains Mono | Код / числа |
| **Тема** | Тільки темна | Без світлого режиму |

**Бренд:** "Equilibrium" з шаховою турою як фавіконкою.

---

### Залежності

#### Runtime

| Пакет | Призначення |
|-------|-------------|
| `react` | UI бібліотека |
| `react-router-dom` | Клієнтська маршрутизація |
| `@tanstack/react-query` | Серверний стан |
| `@tanstack/react-virtual` | Віртуалізовані списки |
| `zustand` | Клієнтський стан |
| `recharts` | Графіки |
| `lightweight-charts` | TradingView графіки |
| `@dnd-kit/core` + `sortable` | Drag-and-drop (зображення) |
| `lucide-react` | Іконки |
| `date-fns` | Форматування дат |
| `modern-screenshot` | Скріншоти графіків |
| `clsx` + `tailwind-merge` | CSS утиліти |

#### Development

| Пакет | Призначення |
|-------|-------------|
| `vite` | Збірник та dev-сервер |
| `typescript` | Перевірка типів |
| `tailwindcss` | Utility-first CSS |
| `eslint` | Лінтинг коду |
| `prettier` | Форматування коду |
| `openapi-typescript` | OpenAPI → TS типи |
