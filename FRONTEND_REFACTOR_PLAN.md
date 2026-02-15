# 🎨 Frontend Refactor Plan

> **Створено:** 2026-02-15  
> **Базова оцінка:** 7.4/10  
> **Ціль:** Перетворити single-app SPA на мульти-аплікаційну платформу, готову до масштабування

---

## Контекст

Зараз **Equilibrium** — це один додаток (COT Analyzer). Але в планах додати ще декілька аплікацій (інструментів). Це **фундаментально змінює** підхід до архітектури:

- Потрібен **роутинг** з окремими URL для кожної аплікації
- Потрібна **головна сторінка** (landing) з навігацією між аплікаціями
- Потрібна **shared UI бібліотека** — кнопки, модалки, tooltips мають бути спільними
- Потрібні **ізольовані stores** — кожна аплікація має свій стейт
- Потрібна **feature-based структура** — а не flat list компонентів

Цей план написаний з урахуванням мультиаплікаційної архітектури. Кожне рішення обґрунтовано з точки зору масштабування на 3-5+ аплікацій.

---

## Зміст

1. [React Router та мульти-аплікаційна оболонка](#1-react-router-та-мульти-аплікаційна-оболонка)
2. [Головна сторінка (Landing)](#2-головна-сторінка-landing)
3. [Feature-based реструктуризація папок](#3-feature-based-реструктуризація-папок)
4. [Shared UI бібліотека компонентів](#4-shared-ui-бібліотека-компонентів)
5. [Розбити BubbleChartModal на підкомпоненти](#5-розбити-bubblechartmodal-на-підкомпоненти)
6. [Винести контент DocumentationModal в дані](#6-винести-контент-documentationmodal-в-дані)
7. [Замінити хардкоджені кольори на Tailwind tokens](#7-замінити-хардкоджені-кольори-на-tailwind-tokens)
8. [Міграція на TypeScript](#8-міграція-на-typescript)
9. [Розділити Zustand store](#9-розділити-zustand-store)
10. [Витягнути бізнес-логіку з компонентів](#10-витягнути-бізнес-логіку-з-компонентів)
11. [ESLint + Prettier](#11-eslint--prettier)
12. [Віртуалізація таблиць](#12-віртуалізація-таблиць)

---

## 1. React Router та мульти-аплікаційна оболонка

**Файли:** `src/App.jsx`, `src/main.jsx` + **НОВІ:** `src/router.tsx`, `src/layouts/AppShell.tsx`

### Проблема

Зараз весь додаток — один `App.jsx` з `activeTab` у Zustand store:

```jsx
// App.jsx — зараз
{activeTab === 'report' ? <CotReportTable ... /> : <ScreenerTable ... />}
```

Це означає:
- **Немає URL** — користувач не може поділитись посиланням на screener чи конкретний ринок
- **Немає навігації між аплікаціями** — при додаванні нового інструменту, його нікуди вставити
- **History API не працює** — кнопка «назад» у браузері не має ефекту
- **Неможливий code splitting по сторінках** — все один bundle

### Рішення

Встановити `react-router-dom` та створити маршрутизацію:

```
/                     → Landing page (головна)
/cot                  → COT Analyzer (report tab)
/cot/screener         → COT Screener
/cot/market/:code     → Конкретний ринок (опціонально, на майбутнє)
/app-2                → Наступна аплікація (заглушка)
/app-3                → Ще одна (заглушка)
```

```tsx
// src/router.tsx
import { createBrowserRouter } from 'react-router-dom';
import AppShell from '@/layouts/AppShell';
import LandingPage from '@/pages/Landing';

const CotApp  = lazy(() => import('@/apps/cot/CotApp'));

export const router = createBrowserRouter([
  {
    element: <AppShell />,            // ← спільна оболонка для всіх
    children: [
      { path: '/',            element: <LandingPage /> },
      { path: '/cot/*',       element: <CotApp /> },
      // { path: '/sentiment/*', element: <SentimentApp /> },   // майбутнє
    ],
  },
]);
```

```tsx
// src/layouts/AppShell.tsx
export default function AppShell() {
    return (
        <div className="h-screen bg-background flex flex-col overflow-hidden">
            {/* Мінімальна глобальна навігація — логотип + посилання на аплікації */}
            <TopNav />
            <Outlet />   {/* ← сюди рендериться активна аплікація */}
        </div>
    );
}
```

```tsx
// src/main.tsx
import { RouterProvider } from 'react-router-dom';
import { router } from './router';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
        </QueryClientProvider>
    </StrictMode>
);
```

### Чому `react-router-dom`, а не TanStack Router

- **React Router** — де-факто стандарт, 50М+ downloads/week, зрілий API
- **TanStack Router** — файловий роутинг, typed routes — круто, але додає complexity
- Для мульти-аплікаційної платформи з 3-5 аплікаціями React Router більш ніж достатній
- Мінімальний learning curve — все що потрібно це `<Route>`, `<Outlet>`, `<Link>`, `useNavigate`
- Якщо пізніше захочеш перейти на TanStack Router — це легша міграція ніж з нуля

### Чому не залишити `activeTab` у Zustand

- **URL — це UI state**, не application state. Коли юзер натискає «назад», він очікує повернутися на попередній таб
- Без URL ти не зможеш зробити глибокі посилання (`/cot/screener?sort=oi`) — а для screener це критично
- Zustand `persist` зберігає `activeTab` у localStorage — це означає що при відкритті нового вікна юзер бачить останній таб, а не домашню сторінку
- React Router дає `lazy()` per-route — кожна аплікація завантажується окремим chunk

### Що відбувається з існуючим `App.jsx`

`AppInner` стає `CotApp` і переїжджає в `src/apps/cot/CotApp.tsx`. Header цієї аплікації залишається всередині неї, але бренд та навігація між аплікаціями переходять в `AppShell`.

### Обсяг роботи
- Встановити `react-router-dom` (~1 команда)
- Створити `src/router.tsx` (~30 рядків)
- Створити `src/layouts/AppShell.tsx` (~40 рядків)
- Перемістити `AppInner` → `src/apps/cot/CotApp.tsx`
- Оновити `src/main.tsx` (~10 рядків)
- Видалити `activeTab` з Zustand store

---

## 2. Головна сторінка (Landing)

**Файли:** **НОВІ:** `src/pages/Landing.tsx`

### Проблема

Без головної сторінки немає точки входу для навігації між аплікаціями. Зараз при відкритті сайту юзер одразу потрапляє в COT Analyzer — коли з'явиться другий інструмент, буде незрозуміло як між ними переключатись.

### Рішення

Створити просту, мінімалістичну landing page:

```tsx
// src/pages/Landing.tsx
export default function LandingPage() {
    return (
        <main className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-2xl w-full space-y-12">
                {/* Hero */}
                <div className="space-y-3">
                    <h1 className="text-2xl font-semibold tracking-tight text-primary">
                        Equilibrium
                    </h1>
                    <p className="text-sm text-muted leading-relaxed max-w-md">
                        Набір аналітичних інструментів для дослідження ринкових даних.
                        Оберіть інструмент нижче для початку роботи.
                    </p>
                </div>

                {/* App cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <AppCard
                        to="/cot"
                        title="COT Analyzer"
                        description="Аналіз звітів CFTC Commitments of Traders.
                            Report, screener, сигнали."
                        status="active"
                    />
                    <AppCard
                        to="#"
                        title="Coming Soon"
                        description="Наступний інструмент в розробці."
                        status="soon"
                    />
                </div>
            </div>
        </main>
    );
}
```

### Чому просту, а не складну

- Landing — це **навігаційний хаб**, а не маркетинговий сайт
- Юзер має потрапити до потрібної аплікації за 1 клік
- Складна landing з анімаціями буде заважати, а не допомагати
- По мірі додавання аплікацій — просто додаємо нову `<AppCard>`
- Мінімалізм відповідає загальному дизайн-стилю (dark, monochrome)

### Чому не sidebar/tab navigation

- При 2-3 аплікаціях sidebar — overkill, він з'їдає простір
- `AppShell` має мінімальний `<TopNav>` з логотипом та посиланнями
- Коли буде 5+ аплікацій — можна додати sidebar. Зараз landing + topnav достатньо
- Кожна аплікація може мати свою внутрішню навігацію (COT вже має report/screener таби)

### Обсяг роботи
- `src/pages/Landing.tsx` — ~60 рядків
- `src/components/ui/AppCard.tsx` — ~30 рядків (reusable card з `to`, `title`, `description`, `status`)

---

## 3. Feature-based реструктуризація папок

**Файли:** вся `src/` структура

### Проблема

Зараз flat структура:

```
src/
├── components/         ← 5 великих файлів, все в одній папці
│   ├── BubbleChartModal.jsx
│   ├── CotReportTable.jsx
│   ├── DocumentationModal.jsx
│   ├── MarketSelector.jsx
│   ├── ScreenerTable.jsx
│   └── ui/
├── hooks/              ← 5 файлів, мікс загальних та COT-специфічних
├── store/              ← 1 store для всього
├── lib/                ← API client з /api/v1/cot хардкодом
├── types/              ← мікс загальних та COT-специфічних типів
└── utils/              ← мікс загальних та COT-специфічних утиліт
```

При додаванні другої аплікації (наприклад, Sentiment) — куди покласти її компоненти? В `components/SentimentChart.jsx` поруч з `CotReportTable.jsx`? А її типи — в `types/sentiment.ts` поруч з `types/market.ts`? Це не масштабується.

### Рішення

```
src/
├── apps/                           ← кожна аплікація — ізольований модуль
│   └── cot/
│       ├── CotApp.tsx              ← entry point (було AppInner)
│       ├── components/
│       │   ├── CotHeader.tsx       ← header з report/screener/subtype/etc
│       │   ├── ReportView/
│       │   │   ├── CotReportTable.tsx
│       │   │   ├── cellRenderers.tsx
│       │   │   └── columnDefs.ts
│       │   ├── ScreenerView/
│       │   │   ├── ScreenerTable.tsx
│       │   │   ├── PositionBar.tsx
│       │   │   └── enrichment.ts
│       │   ├── MarketSelector/
│       │   │   └── MarketSelector.tsx
│       │   ├── Charts/
│       │   │   ├── BubbleChartModal.tsx
│       │   │   ├── PriceBubbleChart.tsx
│       │   │   ├── NetPositionsChart.tsx
│       │   │   ├── IndicatorChart.tsx
│       │   │   ├── DeltaHistogram.tsx
│       │   │   └── tooltips.tsx
│       │   └── Documentation/
│       │       ├── DocumentationModal.tsx
│       │       └── content/
│       │           ├── ua.ts
│       │           └── en.ts
│       ├── hooks/
│       │   └── useMarketQueries.ts
│       ├── store/
│       │   └── useCotStore.ts
│       ├── types/
│       │   ├── market.ts
│       │   ├── screener.ts
│       │   └── signals.ts
│       └── utils/
│           ├── constants.ts
│           ├── colors.ts
│           ├── formatters.ts
│           └── cotSignals.ts       ← бізнес-логіка сигналів (з BubbleChartModal)
│
├── components/                     ← SHARED UI (використовується всіма аплікаціями)
│   └── ui/
│       ├── Button.tsx
│       ├── Modal.tsx
│       ├── Tooltip.tsx
│       ├── Badge.tsx
│       ├── Spinner.tsx
│       ├── ErrorBoundary.tsx
│       └── AppCard.tsx
│
├── hooks/                          ← SHARED hooks
│   ├── useClickOutside.ts
│   ├── useEscapeKey.ts
│   └── useLocalStorage.ts
│
├── layouts/                        ← Layout оболонки
│   ├── AppShell.tsx
│   └── TopNav.tsx
│
├── pages/                          ← Глобальні сторінки (landing, 404)
│   └── Landing.tsx
│
├── lib/                            ← SHARED infrastructure
│   ├── api.ts                      ← fetchJson<T> (базова функція)
│   └── queryClient.ts
│
├── router.tsx
├── main.tsx
└── index.css
```

### Чому `apps/` а не `features/` чи `modules/`

- **`features/`** — зазвичай означає feature slice (cart, auth, profile). Наші «аплікації» — це цілі окремі інструменти з власною навігацією, store, API. Це більше ніж feature
- **`modules/`** — вже використовується в бекенді для іншого значення, буде плутанина
- **`apps/`** — чітко відображає intent: кожна папка — це самостійна аплікація яка може жити незалежно
- Бонус: `apps/cot/`, `apps/sentiment/`, `apps/portfolio/` — зрозуміло навіть новому розробнику

### Чому shared UI в корні `components/ui/`, а не в `packages/` чи `lib/ui/`

- **Monorepo з packages** (наприклад Turborepo) — overkill для одного Vite проєкту
- `components/ui/` — стандартна конвенція яку використовує shadcn/ui і яку впізнає будь-який React розробник
- Якщо проєкт виросте до 10+ аплікацій — тоді можна виділити в окремий пакет. Зараз це premature

### Чому `apps/cot/utils/` замість глобальних `utils/`

- `formatters.ts`, `colors.ts`, `constants.ts` — всі містять COT-специфічну логіку
- `REPORT_TYPES`, `SUBTYPES`, `CATEGORY_ORDER` — не мають сенсу для Sentiment аплікації
- `getColorBySign()`, `getColorCentered()` — heatmap утиліти специфічні для COT таблиць
- Спільні утиліти (якщо з'являться) можна покласти в `src/utils/`

### Правило залежностей

```
apps/cot/ → може імпортувати з:  components/ui/,  hooks/,  lib/
apps/cot/ → НЕ може імпортувати з:  apps/sentiment/
components/ui/ → НЕ може імпортувати з:  apps/*
```

Це той самий принцип що і в бекенді: `core/ ← utils/ ← modules/`.

### Обсяг роботи
- Перемістити файли (~25 файлів)
- Оновити всі import paths (~50 рядків)
- `@/` alias вже працює, тому шляхи типу `@/components/ui/Spinner` працюватимуть одразу
- Це **структурний рефакторинг** — жодна логіка не міняється

---

## 4. Shared UI бібліотека компонентів

**Файли:** **НОВІ:** `src/components/ui/Modal.tsx`, `Button.tsx`, `Tooltip.tsx`, `Badge.tsx`

### Проблема

Зараз в проєкті **тільки 2 shared UI компоненти**: `ErrorBoundary` та `Spinner`. Все інше — інлайнове:

- **Модалки** — `DocumentationModal` і `BubbleChartModal` кожна створює свій backdrop + container + close кнопку + Escape обробник. Це ~40 рядків дублікованого layout-коду в кожній модалці
- **Кнопки** — кожна `<button>` в `App.jsx` має 15+ tailwind класів інлайново:
  ```jsx
  <button className="h-7 w-7 flex items-center justify-center rounded-sm text-[#404040] hover:text-[#e5e5e5] hover:bg-[#141414] transition-colors duration-200">
  ```
- **Tooltips** — `BubbleChartModal` має 5 різних tooltip компонентів (`BubbleTooltip`, `DeltaTooltip`, `NetPosTooltip`, `IndicatorTooltip`, `IndicatorPriceTooltip`). Кожен — свій layout

При додаванні нової аплікації, розробнику доведеться або копіювати ці стилі, або «підглядати» як зроблено в COT. Це гарантія візуальної неконсистентності.

### Рішення

Створити базові UI primitives:

```tsx
// components/ui/Modal.tsx
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, size = 'lg', children }: ModalProps) {
    useEscapeKey(onClose);
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                 onClick={onClose} />
            {/* Content */}
            <div className={cn(
                "relative bg-surface border border-border rounded-sm shadow-2xl",
                "animate-modalSlideIn",
                SIZE_MAP[size]
            )}>
                {title && <ModalHeader title={title} onClose={onClose} />}
                {children}
            </div>
        </div>,
        document.body
    );
}
```

```tsx
// components/ui/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'ghost' | 'outline' | 'solid';
    size?: 'sm' | 'md' | 'icon';
}

export function Button({ variant = 'ghost', size = 'md', className, ...props }: ButtonProps) {
    return <button className={cn(VARIANT_MAP[variant], SIZE_MAP[size], className)} {...props} />;
}
```

```tsx
// components/ui/Badge.tsx
interface BadgeProps {
    variant?: 'default' | 'success' | 'destructive' | 'muted';
    children: React.ReactNode;
}
```

### Чому не використовувати shadcn/ui або Radix

- **shadcn/ui** — чудова бібліотека, але вона тягне за собою Radix primitives, `class-variance-authority`, `clsx`, `tailwind-merge` — це 4 нових залежності
- Наш дизайн **вже є** — dark monochrome, мінімалістичний, з конкретними кольорами і spacing. shadcn/ui потребує кастомізації для відповідності
- Краще **витягнути наші існуючі pattern-и** в переиспользовувані компоненти, ніж адаптувати чужу бібліотеку
- Якщо пізніше станемо більші — можна мігрувати на Radix для accessibility. Зараз це overkill

### Чому `cn()` utility

Єдина додаткова утиліта — `cn()` для об'єднання tailwind класів:

```ts
// lib/utils.ts
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(...inputs));
```

Це **2 мікро-залежності** (`clsx` + `tailwind-merge`, разом <5KB), але вони вирішують реальну проблему: коли компонент приймає `className` ззовні, tailwind класи можуть конфліктувати. `twMerge` це вирішує.

### Як це змінить існуючі компоненти

```tsx
// До:
<div className="fixed inset-0 z-50" onClick={onClose}>
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
    <div className="absolute inset-4 bg-[#0a0a0a] border border-[#262626] rounded-sm ...">
        <header className="h-10 border-b border-[#262626] flex items-center px-4">
            <button onClick={onClose}>✕</button>
        </header>
        {/* content */}
    </div>
</div>

// Після:
<Modal isOpen={isOpen} onClose={onClose} title="Charts" size="full">
    {/* тільки content — layout вже є */}
</Modal>
```

Це зменшує `BubbleChartModal` на ~50 рядків, `DocumentationModal` на ~40 рядків, і гарантує ідентичну поведінку модалок (escape, backdrop click, animation).

### Обсяг роботи
- Встановити `clsx` + `tailwind-merge` (~1 команда)
- Створити `cn()` utility (~5 рядків)
- `Modal.tsx` (~60 рядків)
- `Button.tsx` (~40 рядків)
- `Tooltip.tsx` (~50 рядків)
- `Badge.tsx` (~25 рядків)
- Рефактор `BubbleChartModal`, `DocumentationModal` — замінити інлайновий layout на `<Modal>`
- Рефактор `App.jsx` — замінити інлайнові кнопки на `<Button variant="ghost" size="icon">`

---

## 5. Розбити BubbleChartModal на підкомпоненти

**Файли:** `src/components/BubbleChartModal.jsx` (1176 рядків) → 8+ файлів

### Проблема

Один файл містить **10+ компонентів**, **8 сигнальних функцій**, та **складні data transformations**:

```
BubbleChartModal.jsx (1176 рядків):
├── BubbleTooltip              (рядки ~40-80)
├── DeltaTooltip               (рядки ~80-120)
├── NetPosTooltip              (рядки ~120-150)
├── IndicatorTooltip           (рядки ~150-185)
├── IndicatorPriceTooltip      (рядки ~185-220)
├── NetPositionsChart          (рядки ~220-380)
├── IndicatorChart             (рядки ~380-520)
├── IndicatorPriceChart        (рядки ~520-700)
├── PriceBubbleChart           (рядки ~700-850)
├── DeltaHistogram             (рядки ~850-950)
├── BubbleFallbackChart        (рядки ~950-1000)
├── COT Signal Detection logic (рядки ~1000-1100)
└── BubbleChartModal (main)    (рядки ~1000-1176)
```

Проблеми:
- **Code review** — при зміні одного графіка потрібно навігувати 1176-рядковим файлом
- **Testing** — неможливо тестити `NetPositionsChart` окремо
- **Tree shaking** — якщо в майбутньому один з chart types стане опціональним, він все одно буде в bundle
- **HMR** — зміна tooltip тригерить re-parse всього файлу

### Рішення

```
apps/cot/components/Charts/
├── index.tsx                   ← re-export BubbleChartModal (default)
├── BubbleChartModal.tsx        ← тільки оболонка: tabs, signal panel, вибір графіка (~150 рядків)
├── PriceBubbleChart.tsx        ← bubble scatter + tooltip
├── NetPositionsChart.tsx       ← stacked area chart
├── IndicatorChart.tsx          ← single indicator line chart
├── IndicatorPriceChart.tsx     ← indicator + price dual axis
├── DeltaHistogram.tsx          ← bar chart delta
├── BubbleFallbackChart.tsx     ← fallback коли немає price
└── tooltips/
    ├── BubbleTooltip.tsx
    ├── DeltaTooltip.tsx
    ├── NetPosTooltip.tsx
    └── IndicatorTooltip.tsx
```

### Чому не просто розбити на 2-3 файли

- Кожен chart — це **самостійний візуальний блок** з власним tooltip, data transformation (useMemo), і Recharts конфігурацією
- При об'єднанні 2-3 chart-ів в один файл — все ще матимеш 300-400 рядків на файл
- Окремий файл per chart дозволяє **lazy loading**: якщо юзер дивиться тільки Bubble chart, решта chart-ів не обов'язково завантажувати
- Tooltips винесені окремо бо вони **найчастіше змінюються** (формат чисел, додаткові поля)

### Що залишається в основному BubbleChartModal.tsx

```tsx
// BubbleChartModal.tsx — після (~150 рядків замість 1176)
export default function BubbleChartModal({ isOpen, onClose, data }: Props) {
    const [viewMode, setViewMode] = useState<ViewMode>('bubbles');
    const [timeframe, setTimeframe] = useState<Timeframe>('1y');
    const signals = useCotSignals(data);  // ← hook, не інлайн логіка

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="full">
            <ChartHeader viewMode={viewMode} onViewChange={setViewMode}
                         timeframe={timeframe} onTimeframeChange={setTimeframe} />

            <div className="flex-1 overflow-hidden flex">
                <div className="flex-1">
                    {viewMode === 'bubbles'    && <PriceBubbleChart data={data} timeframe={timeframe} />}
                    {viewMode === 'net'        && <NetPositionsChart data={data} timeframe={timeframe} />}
                    {viewMode === 'indicators' && <IndicatorPriceChart data={data} timeframe={timeframe} />}
                </div>

                <SignalPanel signals={signals} />
            </div>
        </Modal>
    );
}
```

### Обсяг роботи
- Створити 8 нових файлів
- Перемістити код з `BubbleChartModal.jsx` (copy-paste + cleanup imports)
- Замінити основний файл на ~150 рядків orchestrator
- Перевірити що `React.lazy(() => import('./Charts'))` все ще працює

---

## 6. Винести контент DocumentationModal в дані

**Файли:** `src/components/DocumentationModal.jsx` (1288 рядків / 102KB)

### Проблема

102KB файл де ~90% — це хардкоджений JSX контент з білінгвальними перекладами:

```jsx
// DocumentationModal.jsx — зараз
const T = {
    ua: {
        title: 'Документація',
        sections: [
            {
                id: 'what-is-cot',
                title: 'Що таке COT?',
                content: (
                    <>
                        <p>Commitments of Traders (COT) — це щотижневий звіт...</p>
                        <p>Звіт публікується щоп'ятниці...</p>
                        {/* ще 50 рядків JSX */}
                    </>
                ),
            },
            // ... ще 10 секцій по 50-100 рядків кожна
        ],
    },
    en: { /* те саме англійською */ },
};
```

Проблеми:
- **102KB** в одному chunk — це більше ніж вся решта аплікації разом
- Зміна одного слова вимагає навігації по 1300-рядковому файлі
- Контент не може бути **lazy loaded** окремо від компонента
- **Немає markdown** — весь текст загорнутий в `<p>`, `<strong>`, `<h3>` вручну
- При додаванні третьої мови — розмір файлу подвоюється

### Рішення

Розділити на **компонент** (layout/navigation) та **контент** (дані):

```
apps/cot/components/Documentation/
├── DocumentationModal.tsx       ← layout + sidebar navigation (~100 рядків)
├── DocSection.tsx               ← рендерер однієї секції (~30 рядків)
└── content/
    ├── ua.ts                    ← масив секцій українською
    └── en.ts                    ← масив секцій англійською
```

```ts
// content/ua.ts
export interface DocSection {
    id: string;
    title: string;
    articles: DocArticle[];
}

export interface DocArticle {
    title: string;
    badges?: string[];
    paragraphs: string[];      // plain text, не JSX
}

export const sections: DocSection[] = [
    {
        id: 'what-is-cot',
        title: 'Що таке COT?',
        articles: [
            {
                title: 'Загальна інформація',
                paragraphs: [
                    'Commitments of Traders (COT) — це щотижневий звіт...',
                    'Звіт публікується щоп\'ятниці...',
                ],
            },
        ],
    },
    // ...
];
```

### Чому plain text замість MDX

- **MDX** потребує `@mdx-js/react` + loader configuration + JSX compilation at runtime
- Наша документація — це прості параграфи з **bold** та *italic*. MDX overkill
- Plain text масиви + мінімальний markdown-like рендерер (`**bold**` → `<strong>`) — простіше та швидше
- Якщо пізніше документація стане складнішою (таблиці, діаграми) — тоді міграція на MDX
- Бонус: контент файли можна lazy import: `const { sections } = await import('./content/ua')`

### Чому не i18n бібліотека (react-intl, i18next)

- Зараз білінгвальність — **тільки в документації**. Решта UI — англійська
- `react-intl` / `i18next` вирішують проблему коли **весь** UI перекладений
- Тягнути 50KB бібліотеку для одного компонента — не виправдано
- Якщо при масштабуванні весь UI стане білінгвальним — тоді додаємо i18n

### Обсяг роботи
- Створити `content/ua.ts` та `content/en.ts` — перенести текст з JSX (~1200 рядків → 2 файли по ~400 рядків тексту)
- Створити `DocSection.tsx` рендерер (~30 рядків)
- Скоротити `DocumentationModal.tsx` до ~100 рядків (тільки layout + sidebar)

---

## 7. Замінити хардкоджені кольори на Tailwind tokens

**Файли:** `src/App.jsx`, `src/components/*.jsx`, `tailwind.config.js`, `src/index.css`

### Проблема

В `tailwind.config.js` вже визначені семантичні кольори через CSS variables:

```js
// tailwind.config.js — вже є!
colors: {
    background: 'var(--color-background)',      // #050505
    surface: { DEFAULT: 'var(--color-surface)' }, // #0a0a0a
    border: { DEFAULT: 'var(--color-border)' },   // #262626
    primary: { DEFAULT: 'var(--color-primary)' }, // #e5e5e5
    muted: 'var(--color-text-muted)',             // #525252
}
```

Але в компонентах **жоден з цих tokens не використовується**. Замість цього:

```jsx
// App.jsx — зараз (40+ хардкоджених кольорів)
<div className="h-screen bg-[#050505] flex flex-col">          // ← має бути bg-background
<header className="border-b border-[#262626] bg-[#0a0a0a]">   // ← має бути border-border bg-surface
<span className="text-[#e5e5e5]">                              // ← має бути text-primary
<span className="text-[#525252]">                              // ← має бути text-muted
<span className="text-[#404040]">                              // ← має бути text-border-hover
<div className="bg-[#1a1a1a]">                                 // ← має бути bg-surface-hover
```

Це означає:
- **Зміна теми неможлива** — потрібно замінити hex в 40+ місцях
- **Light mode** — неможливий без переписування всіх компонентів
- **Нова аплікація** — розробник не знає які кольори використовувати, копіює hex

### Рішення

**Крок 1:** Доповнити `tailwind.config.js` відсутніми рівнями:

```js
// tailwind.config.js — доповнити
colors: {
    background: 'var(--color-background)',
    surface: {
        DEFAULT: 'var(--color-surface)',
        hover: 'var(--color-surface-hover)',
        highlight: 'var(--color-surface-highlight)',
    },
    border: {
        DEFAULT: 'var(--color-border)',
        hover: 'var(--color-border-hover)',
    },
    text: {
        primary: 'var(--color-text-primary)',
        secondary: 'var(--color-text-secondary)',
        muted: 'var(--color-text-muted)',
    },
    primary: {
        DEFAULT: 'var(--color-primary)',
        hover: 'var(--color-primary-hover)',
        foreground: 'var(--color-primary-foreground)',
    },
    success: {
        DEFAULT: 'var(--color-success)',
        bg: 'var(--color-success-bg)',
        fg: 'var(--color-success-fg)',
    },
    destructive: {
        DEFAULT: 'var(--color-destructive)',
        bg: 'var(--color-destructive-bg)',
        fg: 'var(--color-destructive-fg)',
    },
},
```

**Крок 2:** Масова заміна в компонентах:

| Хардкод | Token | Використання |
|---------|-------|-------------|
| `bg-[#050505]` | `bg-background` | Фон сторінки |
| `bg-[#0a0a0a]` | `bg-surface` | Фон header/cards |
| `bg-[#121212]` | `bg-surface-hover` | Hover стан |
| `bg-[#171717]` | `bg-surface-highlight` | Highlight стан |
| `bg-[#1a1a1a]` | `bg-surface-hover` | Активні елементи |
| `border-[#262626]` | `border-border` | Стандартні рамки |
| `border-[#404040]` | `border-border-hover` | Hover рамки |
| `text-[#e5e5e5]` | `text-primary` | Основний текст |
| `text-[#a3a3a3]` | `text-text-secondary` | Вторинний текст |
| `text-[#525252]` | `text-muted` | Приглушений текст |
| `text-[#404040]` | `text-border-hover` | Ще приглушеніший |
| `text-[#f87171]` | `text-destructive-fg` | Помилки |

### Чому не CSS-in-JS або style objects

- Tailwind **вже працює** і його токени **вже визначені** — потрібно просто використовувати їх
- CSS-in-JS (Emotion, styled-components) — додаткова залежність, runtime cost, інший DX
- Inline `style={{}}` (як зараз в ScreenerTable) — неможливість responsive, hover, focus
- Tailwind tokens → CSS variables → одне місце для зміни всієї теми

### Чому за один прохід, а не поступово

- Це **find-and-replace** операція — `bg-[#050505]` → `bg-background` по всьому проєкту
- Поступова заміна = неконсистентність: частина компонентів на tokens, частина на hex
- Новий розробник не зрозуміє яку конвенцію використовувати
- Один PR, один code review, один merge — чисто і зрозуміло

### Обсяг роботи
- `tailwind.config.js` — додати 10 рядків tokens
- `index.css` — можливо додати 2-3 нові CSS variables
- `App.jsx` — ~40 замін
- `CotReportTable.jsx` — ~15 замін
- `ScreenerTable.jsx` — ~25 замін + замінити inline `style={{}}` де можливо
- `BubbleChartModal.jsx` — ~20 замін
- `DocumentationModal.jsx` — ~10 замін
- `MarketSelector.jsx` — ~15 замін

---

## 8. Міграція на TypeScript

**Файли:** всі `.jsx` → `.tsx`, всі `.js` → `.ts`

### Проблема

Зараз мікс розширень:

| Тип | Файли |
|-----|-------|
| `.tsx` | 0 |
| `.jsx` | 7 (всі компоненти) |
| `.ts` | 7 (store, hooks, lib, types) |
| `.js` | 4 (hooks, utils) |

Це означає:
- **Компоненти без типів** — props не перевіряються компілятором
- **`useMarketQueries.js`** — найважливіший hook для data fetching, але без типізації return values
- **`formatters.js`**, **`colors.js`** — утиліти без типів параметрів

При цьому `tsconfig.json` вже має `"strict": true` — але це не допомагає для `.jsx` файлів.

### Рішення

Перейменувати всі файли та додати типи:

```tsx
// Приклад: MarketSelector.jsx → MarketSelector.tsx
interface MarketSelectorProps {
    markets: Market[];
    selected: Market | null;
    onChange: (market: Market) => void;
}

export default function MarketSelector({ markets, selected, onChange }: MarketSelectorProps) {
    // ... решта коду залишається як є, TypeScript підхопить типи
}
```

### Чому все одразу, а не поступово

- `"allowJs": true` в tsconfig дозволяє мікс — але це **не перевага**, це компроміс
- При поступовій міграції — частина коду типізована, частина ні. Props між ними не перевіряються
- Наш проєкт маленький (15 файлів) — мігрувати все можна за 1-2 години
- Після міграції можна прибрати `"allowJs": true` і отримати strict перевірку для всього

### Чому не окремий `types.d.ts` для кожного файлу

- Типи мають жити **поруч з кодом** — це TypeScript best practice
- `interface Props` на початку файлу — документація яку IDE використовує для автокомпліту
- Зовнішні `.d.ts` — тільки для бібліотек без TypeScript

### Обсяг роботи
- Перейменувати 11 файлів (7 `.jsx` + 4 `.js`)
- Додати `interface Props` до кожного компонента (~5 рядків на файл)
- Додати типи параметрів до утиліт (~2-3 рядки на функцію)
- Прибрати `"allowJs": true` з `tsconfig.json`

---

## 9. Розділити Zustand store

**Файли:** `src/store/useAppStore.ts` → `src/apps/cot/store/useCotStore.ts` + `src/store/useGlobalStore.ts` (опціонально)

### Проблема

Зараз один store тримає **все**:

```ts
interface AppState {
    reportType: ReportType;        // COT-специфічне
    subtype: Subtype;              // COT-специфічне
    selectedMarketCode: string;    // COT-специфічне
    activeTab: TabType;            // COT-специфічне (report/screener)
    fitMode: boolean;              // COT-специфічне
    docsOpen: boolean;             // COT-специфічне
    chartOpen: boolean;            // COT-специфічне
}
```

При додаванні Sentiment аплікації — куди додати `sentimentPeriod`, `sentimentSource`, `sentimentView`? В той самий store? Тоді:

- Store стає "God Object" — знає про все
- `persist` зберігає все в одному localStorage ключі — при баґу одної аплікації, ламається інша
- Компоненти COT ре-рендеряться коли змінюється Sentiment state (і навпаки)

### Рішення

```
src/
├── apps/cot/store/
│   └── useCotStore.ts     ← тільки COT state, persist ключ: 'cot-store'
└── store/ (якщо потрібен — необов'язково)
    └── useGlobalStore.ts  ← глобальні налаштування (тема, мова — якщо будуть)
```

```ts
// apps/cot/store/useCotStore.ts
interface CotState {
    reportType: ReportType;
    subtype: Subtype;
    selectedMarketCode: string | null;
    fitMode: boolean;
    docsOpen: boolean;
    chartOpen: boolean;
    // Actions
    setReportType: (rt: ReportType) => void;
    // ...
}

export const useCotStore = create<CotState>()(
    persist(
        (set) => ({ /* ... */ }),
        {
            name: 'equilibrium-cot',  // ← ізольований ключ
            partialize: (s) => ({
                reportType: s.reportType,
                subtype: s.subtype,
                selectedMarketCode: s.selectedMarketCode,
            }),
        },
    ),
);
```

### Чому не один store з slices (як Redux Toolkit)

- **Zustand slices** — це pattern де один store складається з декількох «шматків». Але:
  - Всі slices все ще в **одному** `create()` — один re-render scope
  - `persist` все ще один localStorage ключ
  - Imports стають заплутаними: `useAppStore(s => s.cot.reportType)` vs `useCotStore(s => s.reportType)`
- **Окремі stores** — простіший mental model: кожна аплікація знає тільки про свій store
- Zustand stores — це просто hooks. Немає performance penalty від кількох stores

### Що робити з `activeTab`

`activeTab` (`'report'` | `'screener'`) **не повинен бути в store** після додавання React Router. Він стає частиною URL: `/cot` = report, `/cot/screener` = screener. Компонент просто читає `useLocation()` замість `useCotStore(s => s.activeTab)`.

### Обсяг роботи
- Перейменувати `useAppStore.ts` → `useCotStore.ts`
- Перемістити в `apps/cot/store/`
- Видалити `activeTab` (замінити на React Router)
- Змінити persist name: `'cot-app-store'` → `'equilibrium-cot'`
- Оновити imports в ~5 файлах

---

## 10. Витягнути бізнес-логіку з компонентів

**Файли:** `BubbleChartModal.jsx`, `ScreenerTable.jsx`

### Проблема

Два блоки бізнес-логіки живуть всередині React компонентів:

**1. COT Signal Detection** — 8 сигнальних правил в `BubbleChartModal.jsx` (рядки ~1000-1100):

```jsx
// Всередині компонента — зараз
const signals = useMemo(() => {
    if (!data?.weeks?.length) return [];
    const latest = data.weeks[0];
    const prev = data.weeks[1];
    const results = [];

    // Signal 1: Extreme positioning
    if (latest.g1_net_pct !== undefined) {
        if (latest.g1_net_pct > 90) results.push({ name: 'Extreme Long', type: 'SELL' });
        if (latest.g1_net_pct < 10) results.push({ name: 'Extreme Short', type: 'BUY' });
    }
    // ... ще 7 сигналів
}, [data]);
```

**2. Screener Row Enrichment** — обчислення derived колонок в `ScreenerTable.jsx`:

```jsx
function enrichRows(rows) {
    for (const row of rows) {
        row.oi_change = row.oi_current - row.oi_prev;
        row.oi_change_pct = row.oi_prev ? (row.oi_change / row.oi_prev) * 100 : 0;
        // ... ще 10 обчислень
    }
    return rows;
}
```

Ці функції — **бізнес-логіка**, не UI логіка. Вони:
- Не залежать від React
- Можуть (і повинні) бути unit-тестовані
- Будуть переиспользовуватись (наприклад, сигнали можуть бути потрібні в screener tooltip)

### Рішення

```ts
// apps/cot/utils/cotSignals.ts
export interface CotSignal {
    name: string;
    type: 'BUY' | 'SELL';
    description: string;
    confidence: number;    // 0-1, для майбутнього sorting
}

export function detectCotSignals(weeks: Week[]): CotSignal[] {
    if (!weeks?.length) return [];
    const latest = weeks[0];
    const prev = weeks[1];
    const signals: CotSignal[] = [];
    // ... 8 правил, чисті функції без React
    return signals;
}
```

```ts
// apps/cot/utils/enrichment.ts
export function enrichScreenerRow(row: ScreenerRow): EnrichedScreenerRow {
    return {
        ...row,  // ← immutable, не мутує вхідний об'єкт
        oi_change: row.oi_current - row.oi_prev,
        oi_change_pct: row.oi_prev ? ((row.oi_current - row.oi_prev) / row.oi_prev) * 100 : 0,
        // ...
    };
}

export function enrichScreenerRows(rows: ScreenerRow[]): EnrichedScreenerRow[] {
    return rows.map(enrichScreenerRow);
}
```

### Чому immutable enrichment

Зараз `enrichRows()` **мутує** вхідні об'єкти (`row[...] = ...`). Хоча масив копіюється (`[...screenerData]`), inner objects — ті самі references. Це може спричинити:
- React не бачить зміни при shallow comparison
- StrictMode подвійний рендеринг може подвоїти мутацію
- Баги при кешуванні (React Query може повернути закешований мутований об'єкт)

`enrichScreenerRow` повертає **новий об'єкт** — предсказуваний, тестований, безпечний.

### Обсяг роботи
- Створити `apps/cot/utils/cotSignals.ts` (~80 рядків)
- Створити `apps/cot/utils/enrichment.ts` (~40 рядків)
- В `BubbleChartModal` — замінити inline useMemo на `useMemo(() => detectCotSignals(data.weeks), [data])`
- В `ScreenerTable` — замінити `enrichRows()` на `enrichScreenerRows()` import
- Створити `useCotSignals` hook як wrapper (~5 рядків)

---

## 11. ESLint + Prettier

**Файли:** **НОВІ:** `.eslintrc.cjs`, `.prettierrc`, `package.json`

### Проблема

Немає жодного linting чи formatting tool:
- Відступи та стиль коду залежать від настрою розробника
- Unused imports не ловляться автоматично
- React hooks rules (exhaustive deps) не перевіряються
- При pull request-ах — шум від formatting змін

### Рішення

```js
// .eslintrc.cjs
module.exports = {
    root: true,
    env: { browser: true, es2024: true },
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint', 'react-hooks'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react-hooks/recommended',
        'prettier',    // ← вимикає ESLint formatting rules (Prettier бере на себе)
    ],
    rules: {
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        'react-hooks/exhaustive-deps': 'warn',
    },
};
```

```json
// .prettierrc
{
    "semi": true,
    "singleQuote": true,
    "trailingComma": "all",
    "tabWidth": 4,
    "printWidth": 100
}
```

### Чому ESLint + Prettier, а не тільки ESLint

- **ESLint** — ловить **логічні** помилки (unused vars, missing deps, type errors)
- **Prettier** — форматує **стиль** (відступи, quotes, trailing commas)
- Без Prettier — ESLint formatting rules конфліктують з editor auto-format
- `eslint-config-prettier` вимикає стилістичні правила ESLint → Prettier єдиний formatter

### Чому не Biome

- **Biome** — чудовий all-in-one (lint + format), швидший за ESLint
- Але: менша ecosystem плагінів, немає react-hooks plugin рівня ESLint
- Для нашого проєкту ESLint + Prettier — перевірений стек з максимальною документацією
- Міграція на Biome — можлива в майбутньому як окремий крок

### Скрипт в package.json

```json
"scripts": {
    "lint": "eslint src/ --ext .ts,.tsx",
    "lint:fix": "eslint src/ --ext .ts,.tsx --fix",
    "format": "prettier --write src/"
}
```

### Обсяг роботи
- Встановити 5 dev dependencies (~1 команда)
- Створити `.eslintrc.cjs` (~20 рядків)
- Створити `.prettierrc` (~7 рядків)
- Додати 3 скрипти в `package.json`
- Запустити `npm run format` та `npm run lint:fix` один раз для існуючого коду
- Виправити warnings після першого запуску (~15-30 хв)

---

## 12. Віртуалізація таблиць

**Файли:** `CotReportTable.jsx`, `ScreenerTable.jsx`

### Проблема

**CotReportTable** рендерить **всі 260 тижнів** (5 років) × 25+ колонок = **6500+ `<td>` елементів** у DOM. При скролі — всі елементи вже в DOM, але вони спричиняють:
- Повільний initial render (~200-300ms)
- Високе споживання пам'яті
- Повільний re-render при зміні `fitMode`

**ScreenerTable** рендерить 150-200 рядків × 20+ колонок = **3000-4000+ `<td>`**. Зараз це терпимо, але при додаванні нових ринків — деградує.

### Рішення

Встановити `@tanstack/react-virtual` (7KB gzip) і рендерити тільки видимі рядки:

```tsx
// CotReportTable.tsx — після
import { useVirtualizer } from '@tanstack/react-virtual';

function CotReportTable({ data, fitMode }: Props) {
    const parentRef = useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
        count: data.weeks.length,       // 260
        getScrollElement: () => parentRef.current,
        estimateSize: () => 28,         // row height in px
        overscan: 15,                   // extra rows above/below viewport
    });

    return (
        <div ref={parentRef} className="overflow-auto h-full">
            <table>
                <thead>{/* sticky header — як зараз */}</thead>
                <tbody style={{ height: rowVirtualizer.getTotalSize() }}>
                    {rowVirtualizer.getVirtualItems().map((vRow) => {
                        const week = data.weeks[vRow.index];
                        return (
                            <tr key={week.date}
                                style={{ transform: `translateY(${vRow.start}px)`, position: 'absolute' }}>
                                {/* cells */}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
```

### Чому `@tanstack/react-virtual`, а не `react-window`

- **`react-window`** — стара бібліотека (2019), wrapper-based API, потребує `FixedSizeList`
- **`@tanstack/react-virtual`** — від автора React Query (TanStack), headless (без wrapper), працює з будь-яким контейнером
- Headless підхід = працює з нашим `<table>` без зміни HTML структури
- Вже використовуємо TanStack React Query — консистентна екосистема
- 7KB gzip — мінімальний overhead

### Чому не зараз, а останнім пунктом

- Віртуалізація змінює **рендеринг таблиці** — це впливає на sticky headers, column resize, fitMode
- Краще спочатку:
  1. Розбити компоненти (пункти #3, #5)
  2. Мігрувати на TypeScript (пункт #8)
  3. Витягнути бізнес-логіку (пункт #10)
- І тільки потім додавати віртуалізацію до вже чистих, типізованих компонентів

### Обсяг роботи
- Встановити `@tanstack/react-virtual` (~1 команда)
- Рефактор `CotReportTable` — обгорнути tbody у virtualizer (~30 рядків змін)
- Рефактор `ScreenerTable` — аналогічно (~30 рядків змін)
- Тестування sticky headers та scroll behavior

---

## 📊 Порядок виконання

Зміни згруповані за залежностями. Кожна група може виконуватись послідовно, але всередині групи — паралельно:

```
Група A — Фундамент (потрібно зробити першим):
├── #1  React Router + AppShell              ← 1.5 год, critical path
├── #2  Landing page                         ← 30 хв (після #1)
└── #11 ESLint + Prettier                    ← 30 хв, незалежно

Група B — Структурний рефакторинг (залежить від A):
├── #3  Feature-based папки                  ← 1 год (перемістити файли)
├── #9  Розділити Zustand store              ← 30 хв (разом з #3)
└── #7  Tailwind tokens заміна               ← 1 год, незалежно від #3

Група C — Компонентний рефакторинг (залежить від B):
├── #5  Розбити BubbleChartModal             ← 1.5 год
├── #6  DocumentationModal → дані            ← 1 год
├── #4  Shared UI бібліотека                 ← 1.5 год
└── #10 Витягнути бізнес-логіку              ← 1 год

Група D — Фінальний polish (залежить від C):
├── #8  Міграція на TypeScript               ← 2 год (всі файли вже на місцях)
└── #12 Віртуалізація таблиць                ← 1 год
```

**Загальний час:** ~12 годин активної роботи (~2-3 дні)

---

## ⚠️ Що НЕ входить в цей план

| Пункт | Причина |
|-------|---------|
| Server-Side Rendering (Next.js) | Аплікація dashboard-типу, SSR не потрібен |
| State machine (XState) | Overkill для поточної складності UI |
| Monorepo (Turborepo/Nx) | Один frontend package — monorepo не потрібен |
| E2E тести (Playwright/Cypress) | Окремий етап, після стабілізації структури |
| Unit тести (Vitest) | Окремий етап, але план враховує testability |
| PWA / Service Worker | Не критично для desktop-first dashboard |
| Accessibility (WCAG) | Окремий етап, потребує UX аудиту |
| Light mode / themeing | Після #7 (tokens) це стане тривіальним — окремий етап |
| i18n (react-intl / i18next) | Тільки якщо весь UI стане білінгвальним |

---

## 🔗 Зв'язок з Backend Refactor Plan

Деякі пункти фронтенду залежать від бекенду:

| Frontend | Backend | Зв'язок |
|----------|---------|---------|
| #1 React Router | #6 Пагінація screener | URL query params для сторінки |
| #10 COT Signals | #1 Pydantic schemas | Сигнали можуть переїхати на бекенд |
| #12 Віртуалізація | #6 Пагінація | Або віртуалізація, або пагінація — не обидва |

**Рекомендація:** Спочатку зробити бекенд (менший scope, ~3.5 год), потім фронтенд. Бекенд пагінація (пункт #6) може зробити фронтенд віртуалізацію (#12) непотрібною для ScreenerTable.
