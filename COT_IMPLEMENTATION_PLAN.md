# COT Reports — Повний план реалізації

> **Документ**: Архітектура, формули, принципи та план реалізації  
> **Версія**: 1.0  
> **Дата**: 2026-02-23

---

## Зміст

1. [Загальна структура навігації](#1-загальна-структура-навігації)
2. [Маппінг активів: який звіт для якого ринку](#2-маппінг-активів-який-звіт-для-якого-ринку)
3. [Сторінка 1: Скрінер (Screener / Watchlist)](#3-сторінка-1-скрінер)
4. [Сторінка 2: Дашборд активу (Asset Detail View)](#4-сторінка-2-дашборд-активу)
5. [Сторінка 3: Таблиця репорту (Report Table)](#5-сторінка-3-таблиця-репорту)
6. [Формули та розрахунки](#6-формули-та-розрахунки)
7. [Управління діапазоном (Lookback)](#7-управління-діапазоном-lookback)
8. [Дані: що потрібно з бекенду](#8-дані-що-потрібно-з-бекенду)
9. [Технічний план реалізації](#9-технічний-план-реалізації)

---

## 1. Загальна структура навігації

```
Landing Page
  └─ Кнопка "COT Reports" → /cot/screener
        │
        ▼
  ┌─────────────────────────┐
  │     SCREENER (Watchlist) │  ← Головна сторінка COT
  │  /cot/screener           │
  │                         │
  │  Клік на актив →        │
  └─────────┬───────────────┘
            │
            ▼
  ┌─────────────────────────┐
  │   DASHBOARD (Asset View) │  ← Аналітичний дашборд
  │  /cot/dashboard/:code    │
  │                         │
  │  Кнопка "Table" →      │
  └─────────┬───────────────┘
            │
            ▼
  ┌─────────────────────────┐
  │    REPORT TABLE          │  ← Існуюча таблиця
  │  /cot/report/:code       │
  │                         │
  │  Перемикання FO/CO       │
  │  Перемикання звітів      │
  └─────────────────────────┘
```

### Ключові зміни маршрутизації

| Поточний маршрут | Новий маршрут | Компонент |
|---|---|---|
| `/cot` | `/cot/screener` | `ScreenerPage` |
| `/cot/screener` | `/cot/screener` | `ScreenerPage` |
| — (новий) | `/cot/dashboard/:code` | `DashboardPage` |
| `/cot` (report tab) | `/cot/report/:code` | `ReportPage` |

**Редірект**: `/cot` → `/cot/screener`

---

## 2. Маппінг активів: який звіт для якого ринку

### Фундаментальне правило

Для кожного активу є **один основний звіт** (primary) з якого беруться дані для аналітики скрінера та дашборда. Користувач може перемикатись між усіма доступними звітами в таблиці репорту.

### Таблиця маппінгу

| Сектор | Активи | Primary Report | Спекулянти (Smart Money) | Commercials/Хеджери |
|---|---|---|---|---|
| **FX (Валюти)** | EUR, GBP, JPY, CAD, CHF, AUD, MXN, BRL, NZD | **TFF** | Leveraged Funds (`g3`) | Dealer/Intermediary (`g1`) |
| **Equity Indices** | S&P 500, Nasdaq 100, Dow Jones, Russell 2000, VIX | **TFF** | Leveraged Funds (`g3`) | Asset Manager (`g2`) |
| **Bonds** | 2Y, 5Y, 10Y, 30Y Treasury | **TFF** | Leveraged Funds (`g3`) | Dealer/Intermediary (`g1`) |
| **Metals** | Gold, Silver, Copper, Platinum | **Disagg** | Managed Money (`g3`) | Producer/Merchant (`g1`) |
| **Energy** | Crude Oil WTI, Natural Gas, Heating Oil, Gasoline RBOB, Ethanol | **Disagg** | Managed Money (`g3`) | Producer/Merchant (`g1`) |
| **Grains** | Corn, Soybeans, Wheat SRW, Wheat HRW, Soybean Meal, Soybean Oil | **Disagg** | Managed Money (`g3`) | Producer/Merchant (`g1`) |
| **Softs** | Sugar, Coffee, Cocoa | **Disagg** | Managed Money (`g3`) | Producer/Merchant (`g1`) |
| **Livestock** | Live Cattle, Lean Hogs, Feeder Cattle | **Disagg** | Managed Money (`g3`) | Producer/Merchant (`g1`) |
| **Crypto (CME BTC)** | Bitcoin (CME 5 BTC) | **TFF** | Leveraged Funds (`g3`) | Other Reportables (`g4`) |
| **Crypto (Nano BTC)** | Nano Bitcoin Perp Style | **Legacy** | Non-Commercial (`g1`) | — (Commercial = 0) |
| **Crypto (Micro ETH)** | Micro Ethereum | **TFF** | Leveraged Funds (`g3`) | — |

### CFTC коди по категоріях

> **Загалом в базі:** Legacy — 508 маркетів, Disaggregated — 401, TFF — 106.  
> Нижче перераховані **ключові ринки** по категоріях з Yahoo-тікерами (де є).  
> Маркети без Yahoo-тікера працюють без графіка ціни, але COT-дані доступні.

```typescript
const ASSET_CONFIG: Record<string, AssetConfig> = {

  // ═══════════════ FX (13 markets) ═══════════════
  '099741': { name: 'Euro FX',             sector: 'FX',        primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: '6E=F' },
  '096742': { name: 'British Pound',       sector: 'FX',        primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: '6B=F' },
  '097741': { name: 'Japanese Yen',        sector: 'FX',        primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: '6J=F' },
  '090741': { name: 'Canadian Dollar',     sector: 'FX',        primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: '6C=F' },
  '092741': { name: 'Swiss Franc',         sector: 'FX',        primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: '6S=F' },
  '232741': { name: 'Australian Dollar',   sector: 'FX',        primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: '6A=F' },
  '095741': { name: 'Mexican Peso',        sector: 'FX',        primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: '6M=F' },
  '102741': { name: 'Brazilian Real',      sector: 'FX',        primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: '6L=F' },
  '112741': { name: 'New Zealand Dollar',  sector: 'FX',        primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: '6N=F' },
  '089741': { name: 'Russian Ruble',       sector: 'FX',        primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: null },
  '082744': { name: 'Chinese Yuan (CNH)',  sector: 'FX',        primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: null },
  '098662': { name: 'USD Index',           sector: 'FX',        primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: 'DX=F' },
  '299741': { name: 'Euro/British Pound',  sector: 'FX',        primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: null },
  '399741': { name: 'Euro/Japanese Yen',   sector: 'FX',        primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: null },

  // ═══════════════ Metals (11 markets) ═══════════════
  '088691': { name: 'Gold',                sector: 'Metals',    primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'GC=F' },
  '084691': { name: 'Silver',              sector: 'Metals',    primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'SI=F' },
  '085692': { name: 'Copper',              sector: 'Metals',    primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'HG=F' },
  '076651': { name: 'Platinum',            sector: 'Metals',    primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'PL=F' },
  '075651': { name: 'Palladium',           sector: 'Metals',    primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'PA=F' },
  '191691': { name: 'Aluminum',            sector: 'Metals',    primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'ALI=F' },
  '191693': { name: 'Aluminum MWP',        sector: 'Metals',    primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: null },
  '088695': { name: 'Micro Gold',          sector: 'Metals',    primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'MGC=F' },
  '084695': { name: 'Micro Silver',        sector: 'Metals',    primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'SIL=F' },
  '085694': { name: 'Micro Copper',        sector: 'Metals',    primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: null },
  '088FM1': { name: 'FREX Gold',           sector: 'Metals',    primaryReport: 'legacy', specGroup: 'g1', commGroup: 'g2', yahoo: null },

  // ═══════════════ Energy (14 markets) ═══════════════
  '067651': { name: 'Crude Oil WTI',       sector: 'Energy',    primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'CL=F' },
  '067411': { name: 'WTI Crude ICE',       sector: 'Energy',    primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: null },
  '06765A': { name: 'WTI Financial',       sector: 'Energy',    primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: null },
  '06741Q': { name: 'WTI 1st Line',        sector: 'Energy',    primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: null },
  '023655': { name: 'Natural Gas',         sector: 'Energy',    primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'NG=F' },
  '022651': { name: 'Heating Oil',         sector: 'Energy',    primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'HO=F' },
  '111416': { name: 'RBOB Gasoline',       sector: 'Energy',    primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'RB=F' },
  '025651': { name: 'Ethanol',             sector: 'Energy',    primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: null },

  // ═══════════════ Equity Indices (29 markets) ═══════════════
  '13874A': { name: 'E-Mini S&P 500',      sector: 'Indices',   primaryReport: 'tff', specGroup: 'g3', commGroup: 'g2', yahoo: 'ES=F' },
  '13874+': { name: 'S&P 500 Consolidated',sector: 'Indices',   primaryReport: 'tff', specGroup: 'g3', commGroup: 'g2', yahoo: 'ES=F' },
  '13874U': { name: 'Micro E-Mini S&P',    sector: 'Indices',   primaryReport: 'tff', specGroup: 'g3', commGroup: 'g2', yahoo: 'MES=F' },
  '209742': { name: 'E-Mini Nasdaq 100',   sector: 'Indices',   primaryReport: 'tff', specGroup: 'g3', commGroup: 'g2', yahoo: 'NQ=F' },
  '20974+': { name: 'Nasdaq 100 Consolidated', sector: 'Indices', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g2', yahoo: 'NQ=F' },
  '209747': { name: 'Micro Nasdaq 100',    sector: 'Indices',   primaryReport: 'tff', specGroup: 'g3', commGroup: 'g2', yahoo: 'MNQ=F' },
  '124603': { name: 'DJIA x $5',           sector: 'Indices',   primaryReport: 'tff', specGroup: 'g3', commGroup: 'g2', yahoo: 'YM=F' },
  '12460+': { name: 'DJIA Consolidated',   sector: 'Indices',   primaryReport: 'tff', specGroup: 'g3', commGroup: 'g2', yahoo: 'YM=F' },
  '124608': { name: 'Micro DJIA',          sector: 'Indices',   primaryReport: 'tff', specGroup: 'g3', commGroup: 'g2', yahoo: 'MYM=F' },
  '239742': { name: 'E-Mini Russell 2000', sector: 'Indices',   primaryReport: 'tff', specGroup: 'g3', commGroup: 'g2', yahoo: 'RTY=F' },
  '239747': { name: 'Micro Russell 2000',  sector: 'Indices',   primaryReport: 'tff', specGroup: 'g3', commGroup: 'g2', yahoo: null },
  '1170E1': { name: 'VIX Futures',         sector: 'Indices',   primaryReport: 'tff', specGroup: 'g3', commGroup: 'g2', yahoo: 'VX=F' },
  '240741': { name: 'Nikkei Stock Average', sector: 'Indices',  primaryReport: 'tff', specGroup: 'g3', commGroup: 'g2', yahoo: 'NIY=F' },
  '240743': { name: 'Nikkei/USD',          sector: 'Indices',   primaryReport: 'tff', specGroup: 'g3', commGroup: 'g2', yahoo: null },
  // + S&P sector indices (XAK, XAU, XAB, XAF...), Russell Growth/Value, BBG Commodity, MSCI EAFE/EM

  // ═══════════════ Rates / Bonds (10 markets) ═══════════════
  '042601': { name: '2-Year Treasury',     sector: 'Bonds',     primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: 'ZT=F' },
  '044601': { name: '5-Year Treasury',     sector: 'Bonds',     primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: 'ZF=F' },
  '043602': { name: '10-Year Treasury',    sector: 'Bonds',     primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: 'ZN=F' },
  '020601': { name: '30-Year Treasury',    sector: 'Bonds',     primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: 'ZB=F' },
  '043607': { name: 'Ultra 10-Year Note',  sector: 'Bonds',     primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: 'TN=F' },
  '020604': { name: 'Ultra T-Bond',        sector: 'Bonds',     primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: 'UB=F' },
  '134741': { name: 'SOFR 3-Month',        sector: 'Bonds',     primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: 'SR3=F' },
  '134742': { name: 'SOFR 1-Month',        sector: 'Bonds',     primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: null },
  '132741': { name: 'Eurodollars',         sector: 'Bonds',     primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: null },
  '045601': { name: 'Fed Funds 30-Day',    sector: 'Bonds',     primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: 'ZQ=F' },

  // ═══════════════ Grains (14 markets) ═══════════════
  '002602': { name: 'Corn',                sector: 'Grains',    primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'ZC=F' },
  '005602': { name: 'Soybeans',            sector: 'Grains',    primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'ZS=F' },
  '001602': { name: 'Wheat SRW',           sector: 'Grains',    primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'ZW=F' },
  '001612': { name: 'Wheat HRW (KC)',      sector: 'Grains',    primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'KE=F' },
  '001626': { name: 'Wheat HRSpring',      sector: 'Grains',    primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'MWE=F' },
  '026603': { name: 'Soybean Meal',        sector: 'Grains',    primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'ZM=F' },
  '007601': { name: 'Soybean Oil',         sector: 'Grains',    primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'ZL=F' },
  '004603': { name: 'Oats',                sector: 'Grains',    primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'ZO=F' },
  '039601': { name: 'Rough Rice',          sector: 'Grains',    primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'ZR=F' },
  '135731': { name: 'Canola',              sector: 'Grains',    primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: null },
  // + Mini Soybeans, Black Sea Wheat

  // ═══════════════ Softs (8 markets) ═══════════════
  '080732': { name: 'Sugar #11',           sector: 'Softs',     primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'SB=F' },
  '083731': { name: 'Coffee C',            sector: 'Softs',     primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'KC=F' },
  '073732': { name: 'Cocoa',               sector: 'Softs',     primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'CC=F' },
  '033661': { name: 'Cotton No. 2',        sector: 'Softs',     primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'CT=F' },
  '040701': { name: 'Frozen OJ',           sector: 'Softs',     primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'OJ=F' },
  '058644': { name: 'Lumber',              sector: 'Softs',     primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'LBS=F' },
  '058643': { name: 'Random Length Lumber', sector: 'Softs',    primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: null },

  // ═══════════════ Livestock (3 markets) ═══════════════
  '057642': { name: 'Live Cattle',         sector: 'Livestock',  primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'LE=F' },
  '054642': { name: 'Lean Hogs',           sector: 'Livestock',  primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'HE=F' },
  '061641': { name: 'Feeder Cattle',       sector: 'Livestock',  primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'GF=F' },

  // ═══════════════ Crypto (33 markets, key ones below) ═══════════════
  // — CME (TFF report) —
  '133741': { name: 'Bitcoin (CME 5 BTC)',  sector: 'Crypto',   primaryReport: 'tff',    specGroup: 'g3', commGroup: 'g4', yahoo: 'BTC=F' },
  '133742': { name: 'Micro Bitcoin',        sector: 'Crypto',   primaryReport: 'tff',    specGroup: 'g3', commGroup: 'g4', yahoo: 'MBT=F' },
  '146021': { name: 'Ether',               sector: 'Crypto',    primaryReport: 'tff',    specGroup: 'g3', commGroup: 'g4', yahoo: 'ETH=F' },
  '146022': { name: 'Micro Ether',         sector: 'Crypto',    primaryReport: 'tff',    specGroup: 'g3', commGroup: 'g4', yahoo: null },
  '176740': { name: 'XRP',                 sector: 'Crypto',    primaryReport: 'tff',    specGroup: 'g3', commGroup: 'g4', yahoo: null },
  '176741': { name: 'Micro XRP',           sector: 'Crypto',    primaryReport: 'tff',    specGroup: 'g3', commGroup: 'g4', yahoo: null },
  '177741': { name: 'SOL',                 sector: 'Crypto',    primaryReport: 'tff',    specGroup: 'g3', commGroup: 'g4', yahoo: null },
  '177742': { name: 'Micro SOL',           sector: 'Crypto',    primaryReport: 'tff',    specGroup: 'g3', commGroup: 'g4', yahoo: null },

  // — FREX Exchange Nano Perps (Legacy report — немає TFF/Disagg) —
  '133LM1': { name: 'Nano BTC Perp',       sector: 'Crypto',   primaryReport: 'legacy', specGroup: 'g1', commGroup: null, yahoo: null },
  '146LM1': { name: 'Nano Ether Perp',     sector: 'Crypto',   primaryReport: 'legacy', specGroup: 'g1', commGroup: null, yahoo: null },
  '177LM1': { name: 'Nano SOL Perp',       sector: 'Crypto',   primaryReport: 'legacy', specGroup: 'g1', commGroup: null, yahoo: null },
  '176LM1': { name: 'Nano XRP Perp',       sector: 'Crypto',   primaryReport: 'legacy', specGroup: 'g1', commGroup: null, yahoo: null },
  '174LM1': { name: 'Dogecoin Perp',       sector: 'Crypto',   primaryReport: 'legacy', specGroup: 'g1', commGroup: null, yahoo: null },
  '178LM1': { name: 'Litecoin Perp',       sector: 'Crypto',   primaryReport: 'legacy', specGroup: 'g1', commGroup: null, yahoo: null },
  '179LM1': { name: 'Chainlink Perp',      sector: 'Crypto',   primaryReport: 'legacy', specGroup: 'g1', commGroup: null, yahoo: null },
  '180LM1': { name: 'Polkadot Perp',       sector: 'Crypto',   primaryReport: 'legacy', specGroup: 'g1', commGroup: null, yahoo: null },
  '181LM1': { name: 'Avalanche Perp',      sector: 'Crypto',   primaryReport: 'legacy', specGroup: 'g1', commGroup: null, yahoo: null },
  '182LM1': { name: 'Cardano Perp',        sector: 'Crypto',   primaryReport: 'legacy', specGroup: 'g1', commGroup: null, yahoo: null },
  '183LM1': { name: 'Hedera Perp',         sector: 'Crypto',   primaryReport: 'legacy', specGroup: 'g1', commGroup: null, yahoo: null },
  '184LM1': { name: 'Stellar Perp',        sector: 'Crypto',   primaryReport: 'legacy', specGroup: 'g1', commGroup: null, yahoo: null },
  '185LM1': { name: 'SUI Perp',            sector: 'Crypto',   primaryReport: 'legacy', specGroup: 'g1', commGroup: null, yahoo: null },
  '186LM1': { name: 'SHIB Perp',           sector: 'Crypto',   primaryReport: 'legacy', specGroup: 'g1', commGroup: null, yahoo: null },
  '187LM1': { name: 'BCH Perp',            sector: 'Crypto',   primaryReport: 'legacy', specGroup: 'g1', commGroup: null, yahoo: null },

  // ═══════════════ Other / Niche (373+ markets, major ones below) ═══════════════
  // — Dairy —
  '063642': { name: 'Class III Milk',      sector: 'Other',     primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: null },
  '022A01': { name: 'Non-Fat Dry Milk',    sector: 'Other',     primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: null },
  '023A01': { name: 'Dry Whey',            sector: 'Other',     primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: null },
  '029A01': { name: 'Butter (Cash)',       sector: 'Other',     primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: null },
  // — Power/Carbon/RECs — сотні контрактів, динамічно підтягуються з API
  // — Fertilizer, Steel, Cobalt, Lithium тощо
};
```

**Підсумок по категоріях (загальна кількість):**

| Сектор | Ключових у конфігу | Всього в базі | З Yahoo-тікером |
|---|---|---|---|
| FX (Валюти) | 14 | 13 | 10 |
| Metals (Метали) | 11 | 11 | 8 |
| Energy (Енергетика) | 8 | 14 | 5 |
| Indices (Індекси) | 14 | 29 | 12 |
| Bonds / Rates (Ставки) | 10 | 10 | 7 |
| Grains (Зернові) | 10 | 14 | 9 |
| Softs (М'які товари) | 7 | 8 | 6 |
| Livestock (Тваринництво) | 3 | 3 | 3 |
| Crypto (Крипто) | 23 | 33 | ~3 |
| Other (Інші) | 4+ | ~373 | ~20 |
| **Разом** | **~104** | **~508** | **~85** |

> **Примітка**: Маркети з категорії "Other" (power, carbon, RECs, dairy, fertilizer тощо) 
> підтягуються динамічно з бекенду. Для них зазвичай немає Yahoo-тікера, але COT-аналітика працює повністю.

### Логіка визначення specGroup / commGroup

```
IF primaryReport == 'tff':
    specGroup = 'g3' (Leveraged Funds)
    commGroup = 'g1' (Dealer/Intermediary) або 'g2' (Asset Manager для індексів)
    
ELIF primaryReport == 'disagg':
    specGroup = 'g3' (Managed Money)
    commGroup = 'g1' (Producer/Merchant/Processor/User)
    
ELIF primaryReport == 'legacy':
    specGroup = 'g1' (Non-Commercial / Large Speculators)
    commGroup = 'g2' (Commercials)
    # Для FREX Perps: commGroup = null (Commercial = 0)
```

---

## 3. Сторінка 1: Скрінер

### Призначення

Скрінер — це радар. Він показує де ринковий натовп зайшов надто далеко і де формується структурна крихкість. Не дає сигналів на вхід.

### Фільтри та навігація

**Секторні фільтри** (chip-кнопки з лічильниками):
- All
- FX (Валюти) — 14 ринків
- Metals (Метали) — 11 ринків
- Energy (Енергетика) — 8+ ринків
- Indices (Індекси) — 14+ ринків
- Bonds/Rates (Ставки) — 10 ринків
- Grains (Зернові) — 10+ ринків
- Softs (М'які товари) — 7 ринків
- Livestock (Тваринництво) — 3 ринки
- Crypto (Крипто) — 23+ ринки
- Other (Інші) — 373+ ринки (power, carbon, dairy...)

**Текстовий пошук** по назві активу.

### Структура колонок Data Grid

> **Важливо**: Дані для скрінера беруться з **primary report** кожного активу. Тобто для EUR — з TFF (g3 = Leveraged Funds), для Gold — з Disagg (g3 = Managed Money), для Nano BTC — з Legacy (g1 = Non-Commercial).

| # | Колонка | Опис | Джерело даних | Візуалізація |
|---|---|---|---|---|
| 1 | **Asset** | Назва, тікер, сектор-бейдж | `market.name`, `market.exchange_code`, `market.category` | Назва + кольоровий chip сектора |
| 2 | **Net Position** | Чиста позиція спекулянтів (Longs − Shorts) у контрактах | `week[specGroup + '_net']` | Число з кольором (зелений +, червоний −) |
| 3 | **104-Week Percentile** | Де знаходиться поточна позиція відносно 2 років | `COT_Index_1y` (52w) або custom 104w | **Колірна шкала**: <5% = 🟢 (капітуляція), >95% = 🔴 (перегрів), решта — сірий/нейтральний. Прогрес-бар. |
| 4 | **Z-Score** | Відхилення від середнього у стандартних відхиленнях | Розрахувати за обраний lookback | Число з ⚠️ алертом при > +2.0 або < −2.0 |
| 5 | **1-Week Change (WoW)** | Зміна нетто-позиції за тиждень | `week[specGroup + '_change_net']` | Число зі стрілкою ▲/▼ та кольором |
| 6 | **Open Interest Trend** | Зміна відкритого інтересу | `week.oi_change`, `week.oi_pct` | Число + ▲/▼ + процент |
| 7 | **FLIP** | Статус-тег на основі комбінації сигналів | Алгоритм нижче | Текстовий тег: "Overcrowded" / "Reversal Watch" / "Pre-Flip" / "Neutral" / "Extreme" |

### Алгоритм FLIP-тегів

```python
def get_flip_tag(percentile, z_score, wow_change, prev_net, curr_net):
    """
    Повертає текстовий тег стану активу.
    """
    # Flip: перетин нуля — найсильніший сигнал
    if sign(prev_net) != sign(curr_net) and prev_net != 0:
        return "FLIP 🔄"
    
    # Overcrowded: >95 percentile або <5% + Z > |2.0|
    if (percentile >= 95 and z_score >= 2.0) or (percentile <= 5 and z_score <= -2.0):
        return "Overcrowded ⚠️"
    
    # Reversal Watch: >90% але change йде проти позиції
    if percentile >= 90 and wow_change < 0 and curr_net > 0:
        return "Reversal Watch 👁️"
    if percentile <= 10 and wow_change > 0 and curr_net < 0:
        return "Reversal Watch 👁️"
    
    # Extreme: просто в зоні екстремуму
    if percentile >= 90 or percentile <= 10:
        return "Extreme"
    
    # Pre-Flip: позиція близька до нуля і активно рухається
    if abs(curr_net) < abs(prev_net) * 0.3 and abs(wow_change) > 0:
        return "Pre-Flip"
    
    return "Neutral"
```

### Дія при кліку

Клік на рядок → навігація до `/cot/dashboard/{code}` — дашборд активу.

---

## 4. Сторінка 2: Дашборд активу

### Загальна структура

```
┌──────────────────────────────────────────────────────┐
│  HEADER SNAPSHOT                                       │
│  Тікер | Назва | Data As Of | Current State            │
│  [← Screener]  [Table →]  [Lookback: 2Y ▼]           │
├──────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────────┐  ┌──────────────────┐           │
│  │ Block 1.1        │  │ Block 1.2        │           │
│  │ NET LONG +       │  │ NET SHORT +      │           │
│  │ Percentile Zones │  │ Percentile Zones │           │
│  └──────────────────┘  └──────────────────┘           │
│                                                        │
│  ┌──────────────────────────────────────────┐         │
│  │ Block 2: Divergence Chart                 │         │
│  │ Price vs Positioning (Non-Comm + Comm)    │         │
│  └──────────────────────────────────────────┘         │
│                                                        │
│  ┌──────────────────────────────────────────┐         │
│  │ Block 3: Open Interest Analysis           │         │
│  └──────────────────────────────────────────┘         │
│                                                        │
│  ┌──────────────────────────────────────────┐         │
│  │ Block 4: Historical Distribution          │         │
│  └──────────────────────────────────────────┘         │
│                                                        │
│  ┌──────────────────────────────────────────┐         │
│  │ Block 5: Sector-Specific Sidebar          │         │
│  └──────────────────────────────────────────┘         │
│                                                        │
│  ┌──────────────────────────────────────────┐         │
│  │ Block 6: FLIP Detection                   │         │
│  └──────────────────────────────────────────┘         │
│                                                        │
│ ═══ ADVANCED INDICATORS ═══                            │
│                                                        │
│  ┌──────────────────────────────────────────┐         │
│  │ Indicator 1: Market Power                 │         │
│  └──────────────────────────────────────────┘         │
│                                                        │
│  ┌──────────────────────────────────────────┐         │
│  │ Indicator 2: Position Velocity            │         │
│  └──────────────────────────────────────────┘         │
│                                                        │
│  ┌──────────────────────────────────────────┐         │
│  │ Indicator 3: Sentiment Divergence         │         │
│  └──────────────────────────────────────────┘         │
│                                                        │
│  ┌───────────────┐  ┌───────────────┐                 │
│  │ Indicator 4:  │  │ Indicator 5:  │                 │
│  │ Concentration │  │ Triple        │                 │
│  │ Ratio (Gauge) │  │ Lookback      │                 │
│  └───────────────┘  └───────────────┘                 │
└──────────────────────────────────────────────────────┘
```

---

### 4.0 Header Snapshot

| Елемент | Зміст |
|---|---|
| **Тікер + Назва** | `{exchange_code} — {name}` (напр. "GC — Gold") |
| **Data As Of** | Дата фіксації (вівторок) + дата публікації (п'ятниця). Формат: "Data as of Tue, Feb 11 · Published Fri, Feb 14" |
| **Current State** | Швидке зведення: "{percentile}th Percentile \| Z-Score: {z} \| {label}" де label = "Extreme Net Long" / "Extreme Net Short" / "Neutral" |
| **Кнопки** | `← Back to Screener` \| `View Report Table →` |
| **Lookback selector** | Dropdown/pills для вибору діапазону |

---

### 4.1 Block 1.1: Net Long Analysis

**Структура**: Три панелі вертикально.

#### Верхня панель — Лінійний графік ціни
- **Тип**: Line chart
- **Дані**: `prices[].close` (з бекенду — Yahoo Finance)
- **X-axis**: Дата
- **Y-axis**: Ціна активу

#### Середня панель — Net Long + Percentile Zones
- **Тип**: Line chart з заливкою зон
- **Дані**: Нетто-позиція спекулянтів (specGroup `_long` − specGroup `_short`)  
  ⚠️ **Тут показуємо тільки LONG сторону**: `specGroup_long` контракти
- **Зони** (горизонтальні):
  - Лінія 95-го перцентилю від значень longs за lookback → зона вище = **червона** (перегрів лонгів)
  - Лінія 5-го перцентилю від значень longs за lookback → зона нижче = **зелена** (капітуляція лонгів)
- **Y-axis**: Кількість long-контрактів

#### Нижня панель — Z-Score для Longs
- **Тип**: Line chart
- **Дані**: Z-Score від серії long-позицій
- **Горизонтальні лінії**: +2.0 та −2.0 (пунктирні)
- **Y-axis**: Z-Score value

**Формула Z-Score**:
$$Z_t = \frac{Long_t - \overline{Long}_{lookback}}{\sigma_{Long,lookback}}$$

---

### 4.2 Block 1.2: Net Short Analysis

Аналогічна структура до Block 1.1, але для **SHORT** сторони:

#### Верхня панель — Лінійний графік ціни (той самий)

#### Середня панель — Shorts + Percentile Zones
- **Дані**: `specGroup_short` контракти
- **Зони**: 95-й перцентиль shorts = багато шортів (зелена — потенційний short squeeze), 5-й = мало шортів (червона — мало хеджу)

#### Нижня панель — Z-Score для Shorts
$$Z_t = \frac{Short_t - \overline{Short}_{lookback}}{\sigma_{Short,lookback}}$$

---

### 4.3 Block 2: Графік Дивергенції (Price vs. Positioning)

> **Серце дашборда**. Показує невідповідність між ціною та позиціонуванням.

#### Верхня панель — Лінійний графік ціни
- Line chart ціни активу

#### Нижня панель — Net Position двох категорій
- **Лінія 1 (синя)**: Net Position спекулянтів (specGroup)  
  `Net_spec = specGroup_long − specGroup_short`
- **Лінія 2 (помаранчева)**: Net Position commercials (commGroup)  
  `Net_comm = commGroup_long − commGroup_short`
- Їх поведінка **дзеркальна** → коли розрив досягає максимуму, ринок наближається до точки розлому

#### Бічна панель (sidebar widget)
- **Spread Percentile**: Поточний перцентиль різниці `|Net_spec − Net_comm|`
- **10th Percentile line**: Горизонтальна пунктирна лінія на нижній панелі, що відмічає 10-й перцентиль ширини розриву (мінімальна розбіжність)

**Формула ширини розриву (Spread)**:
$$Spread_t = Net_{spec,t} - Net_{comm,t}$$

**Percintile Spread**:
$$P_{spread} = \frac{|\{Spread_i \leq Spread_t, \; i \in lookback\}|}{N_{lookback}} \times 100$$

---

### 4.4 Block 3: Пульс Тренду (Open Interest Analysis)

#### Графік
- **Верхня панель**: Лінійний графік ціни активу, **де лінія ціни розфарбована** відповідно до матриці інтерпретації
- **Нижня панель**: Area chart відкритого інтересу (`open_interest`)

#### Матриця інтерпретації (Auto-Tag)

| Ціна | Open Interest | Інтерпретація | Колір лінії ціни |
|---|---|---|---|
| ↑ Росте | ↑ Росте | Сильний попит, наявність тренду | 🟢 **Зелений** |
| ↓ Падає | ↓ Падає | Закриття лонг-позицій (вимушене) | 🟡 **Жовтий** |
| ↑ Росте | ↓ Падає | Закриття шорт-позицій | 🔵 **Синій** |
| ↓ Падає | ↑ Росте | Поява пропозиції, відкриття шортів | 🔴 **Червоний** |

**Визначення напрямку** (week-over-week):
```python
price_direction = 'up' if price[t] > price[t-1] else 'down'
oi_direction    = 'up' if oi[t] > oi[t-1] else 'down'
```

---

### 4.5 Block 4: Історичний Контекст (Distribution)

- **Тип**: Histogram (гістограма розподілу)
- **Дані**: Усі значення Net Position спекулянтів за lookback period (104 тижні)
- **Bins**: 20–30 бінів
- **Відмітка**: Вертикальна лінія поточного тижня із значенням та percentile
- **Кольори**: Бін, в якому знаходиться поточне значення = яскравий, решта = приглушені

Це візуально підтверджує Z-Score: якщо поточне значення на хвості розподілу — це видно одразу.

---

### 4.6 Block 5: Специфічний фундаментальний контекст (Sidebar)

**Залежно від сектора активу**:

| Сектор | Метрики | Джерело |
|---|---|---|
| **FX** | Carry Trade метрики: різниця процентних ставок (interest rate differential); короткий текстовий контекст ЦБ | Статичні дані або зовнішній API |
| **Grains/Softs** | Сезонний індикатор: цикли посіву/збору; тижневий seasonal chart (5Y average vs current) | Розраховується зі статичних даних |
| **Bonds** | Розподіл по кривій прибутковості: стан позицій по 2Y, 5Y, 10Y, 30Y одночасно; steep/flat/inverted label | Дані з інших markets у bonds category |
| **Energy** | Crack spread (якщо є дані), seasonal demand chart | Розраховується |
| **Metals** | Gold/Silver ratio, промислове vs safe-haven позиционування | Cross-market дані |
| **Indices** | VIX vs Equity inverse relationship | Cross-market дані |
| **Crypto** | Funding rate chart (для Nano BTC Perp), spot premium/discount | Зовнішнє API або примітка |

> **Примітка**: Цей блок **опціональний** (v2). Можна починати як текстові підказки і потім додавати інтерактивні віджети.

---

### 4.7 Block 6: FLIP Detection

> **Flip** — математичне перетинання нульової позначки показником нетто-позиції.

#### Візуалізація: Bubble Chart на ціновому графіку

- **Основа**: Лінійний графік ціни
- **Bubbles (бульбашки)**: Відображаються в точках, де сталось перетинання нуля
  - 🟢 **Зелена бульбашка**: Flip з Short → Long (нетто стала додатньою)
  - 🔴 **Червона бульбашка**: Flip з Long → Short (нетто стала від'ємною)
- **Позиція**: На рівні ціни в момент flip
- **Розмір бульбашки**: Пропорційний до абсолютного значення зміни нетто-позиції за тиждень flip-у

#### Алгоритм детекції Flip
```python
def detect_flips(weeks):
    flips = []
    for i in range(1, len(weeks)):
        prev_net = weeks[i-1].spec_net
        curr_net = weeks[i].spec_net
        
        if prev_net <= 0 and curr_net > 0:
            flips.append({
                'date': weeks[i].date,
                'type': 'LONG',  # Перехід в net long
                'magnitude': curr_net - prev_net,
                'price': prices[weeks[i].date]
            })
        elif prev_net >= 0 and curr_net < 0:
            flips.append({
                'date': weeks[i].date,
                'type': 'SHORT',  # Перехід в net short
                'magnitude': abs(curr_net - prev_net),
                'price': prices[weeks[i].date]
            })
    
    return flips
```

#### Додатково: Long vs Short Bias Chart
- **Тип**: Stacked area / 100% stacked bar
- **Формула**:
$$Long\% = \frac{Longs}{Longs + Shorts} \times 100$$
$$Short\% = \frac{Shorts}{Longs + Shorts} \times 100$$
- Flip видно як точка перетину де одна частка падає нижче 50%

---

### 4.8 Indicator 1: Market Power (Стиснення ліквідності)

> Головний "підвальний" індикатор під ціновим графіком.

#### Тип графіка: Stacked Area Chart

#### Формули

$$L\_Power_t = \frac{Longs_{spec,t}}{OI_t} \times 100\%$$

$$S\_Power_t = \frac{Shorts_{spec,t}}{OI_t} \times 100\%$$

#### Візуалізація
- Верхня частина (зелена зона): $L\_Power$
- Нижня частина (червона зона): $S\_Power$
- **Горизонтальні пунктирні лінії** на рівні **30%** (критичний поріг)

#### Тригер (Alert)
```python
if S_Power > 30:
    # На основному ціновому графіку вертикальний фон блідо-червоним
    # → попередження про зону можливого SHORT SQUEEZE
    highlight_price_bg('light-red')

if L_Power > 30:
    # Аномально високий long → ризик ліквідації
    highlight_price_bg('light-green')
```

> Коли одна з зон перетинає 30%, на основному ціновому графіку фон вертикально підсвічується блідим кольором (блідо-червоний для аномальних шортів, блідо-зелений для аномальних лонгів).

---

### 4.9 Indicator 2: Position Velocity (Осцилятор швидкості)

> Pre-Flip індикатор та дивергенцій.

#### Тип графіка: Гістограма осцилятора (стиль MACD Histogram)

#### Формула

$$Velocity_t = \Delta Pos_t - \Delta Pos_{t-1}$$

де:
$$\Delta Pos_t = Net_{spec,t} - Net_{spec,t-1}$$

Тобто Velocity — це **друга похідна** нетто-позиції (прискорення зміни позиції).

#### Візуалізація
- **Центральна лінія**: нуль
- **Стовпчики вище нуля (Solid fill)**: прискорення покупок/скорочення продажів
- **Стовпчики, що спадають до нуля (Hollow/transparent)**: темп падає — зона **Pre-Flip**
- **Кольори**: Зелені при позитивному velocity (наростання), червоні при від'ємному

#### Тригер (Сигнал)
```python
# Коли гістограма швидкості йде проти напрямку загальної позиції
if net_spec > 0 and velocity < 0:
    # Фонди ще в лонгу, але гістограма вже негативна
    show_warning_icon('yellow-diamond', position='above_price_candle')
    
elif net_spec < 0 and velocity > 0:
    # Фонди в шорті, але velocity позитивна — шорти вичерпуються
    show_warning_icon('yellow-diamond', position='above_price_candle')
```

> **Жовтий ромб** (⬥) малюється над поточною ціною як попередження.

---

### 4.10 Indicator 3: Sentiment Divergence (Конфлікт інтересів)

> Наочний індикатор перегріву та конфлікту між учасниками.

#### Тип графіка: Dual Line Chart (0 to 100 scale)

#### Формули

Обидві лінії нормалізуються до шкали 0–100 через перцентильний ранг:

$$Line_{spec,t} = Percentile(Net_{spec,t}, lookback)$$
$$Line_{comm,t} = Percentile(Net_{comm,t}, lookback)$$

#### Візуалізація
- **Лінія Leveraged Funds / Managed Money** (синя): від 0 до 100
- **Лінія Commercials** (помаранчева): від 0 до 100
- **Зони екстремумів**: 
  - Верхня: 90–100 (затінена горизонтальна смуга)
  - Нижня: 0–10 (затінена горизонтальна смуга)

#### Divergence Zone
```python
if line_spec >= 90 and line_comm <= 10:
    # Простір між двома лініями зафарбовується ЧЕРВОНИМ/ФІОЛЕТОВИМ
    fill_between(line_spec, line_comm, color='red/purple', alpha=0.3)
    
elif line_spec <= 10 and line_comm >= 90:
    # Зворотна дивергенція
    fill_between(line_comm, line_spec, color='green', alpha=0.3)
```

#### Тригер
```
Коли дивергенція активна → у куті блоку банер:
"⚠️ Crowded Trade Detected. Smart Money vs Crowd Conflict"
```

---

### 4.11 Indicator 4: Concentration Ratio (Детектор китів)

> Метрика "тут і зараз" — частка ТОП-4 трейдерів.

#### Тип графіка: Gauge Meter (Спідометр) або Horizontal Bar

#### Дані
CFTC публікує % позицій, що належать Top-4 та Top-8 трейдерам у кожній категорії (Long Format report). 

> **Примітка**: Ці дані доступні не з усіх звітів. Якщо недоступні — блок відображається у спрощеному вигляді або ховається.

#### Шкала
| Зона | Діапазон | Колір | Інтерпретація |
|---|---|---|---|
| Здорова | 0–40% | 🟢 Зелений | Диверсифікований ринок |
| Підвищена | 40–60% | 🟡 Жовтий | Помірна концентрація |
| Небезпечна | >60% | 🔴 Червоний | Високий ризик маніпуляцій; рух тримається на 1–2 гравцях |

#### Як читати
> Якщо бачиш сильний рух ціни і сигнал на покупку в інших блоках, кинь погляд на цей віджет. Якщо стрілка в червоній зоні — рух тримається на 1–2 крупних гравцях і може бути штучним.

---

### 4.12 Indicator 5: Triple Lookback (Адаптивність)

> Мультитаймфреймовий аналіз у формі теплової карти.

#### Тип графіка: Multi-timeframe Heatmap (Теплова карта-матриця)

#### Структура

| | Net Position | Percentile | Z-Score |
|---|---|---|---|
| **1 Year (52w)** | значення | клітинка | клітинка |
| **3 Years (156w)** | значення | клітинка | клітинка |
| **5 Years (252w)** | значення | клітинка | клітинка |

#### Кольори клітинок
| Стан | Колір |
|---|---|
| Нейтральний (25–75 percentile) | ⬜ Сірий |
| Long Extremum (>90 percentile) | 🟢 Яскраво-зелений |
| Short Extremum (<10 percentile) | 🔴 Яскраво-червоний |
| Помірний (75–90 або 10–25) | Помірний відтінок |

#### Тригер: Alignment
```python
if all(percentile > 90 for percentile in [p_1y, p_3y, p_5y]):
    alert("🚨 Historic Reversal Zone Reached — All timeframes aligned at Long Extreme")
    
elif all(percentile < 10 for percentile in [p_1y, p_3y, p_5y]):
    alert("🚨 Historic Reversal Zone Reached — All timeframes aligned at Short Extreme")
```

> Коли поточна позиція стає екстремумом одразу для всіх трьох періодів, система генерує потужний алерт.

---

## 5. Сторінка 3: Таблиця репорту

### Навігація на сторінку

З дашборда: кнопка `View Report Table →` → `/cot/report/{code}`

### Перемикачі

1. **Subtype**: Futures Only (FO) / Combined Futures + Options (CO)
   - Default: **FO** (Futures Only)
   
2. **Report Type**: Залежно від доступності для активу
   - Для EUR: TFF (primary, default) + Legacy (якщо доступний)
   - Для Gold: Disagg (primary, default) + Legacy (якщо доступний)
   - Default: **primary report** з конфігу активу

### Вміст

Існуюча `CotReportTable` — без змін. Вона вже відображає:
- Тижневі дані по всіх групах
- COT Index (3m, 1y, 3y)
- WCI (26w)
- Crowded Level з BUY/SELL сигналами
- Heatmaps, stat rows

---

## 6. Формули та розрахунки

### 6.1 Net Position (Чиста позиція)

$$Net_t = Longs_t - Shorts_t$$

Для кожної групи: `g{i}_long - g{i}_short = g{i}_net`

### 6.2 Percentile Rank (Перцентильний ранг)

$$P_t = \frac{|\{Net_i \leq Net_t, \; i \in [t-N, t]\}| - 0.5}{N} \times 100$$

де $N$ — кількість тижнів у lookback window. Результат обмежується [1, 99].

**Lookback periods**:
- 52w (1 рік) — для тактичних сигналів
- 104w (2 роки) — стандарт (основний)
- 156w (3 роки) — для підтвердження
- 260w (5 років) — для структурних режимів

### 6.3 Z-Score

$$Z_t = \frac{Net_t - \bar{Net}_{lookback}}{\sigma_{Net,lookback}}$$

де:
- $\bar{Net}_{lookback}$ — середнє значення Net за lookback period
- $\sigma_{Net,lookback}$ — стандартне відхилення Net за lookback period

**Інтерпретація**:
| Z-Score | Значення |
|---|---|
| 0 | На середньому рівні |
| ±1.0 | Помірне відхилення (~84-й перцентиль) |
| ±2.0 | Статистично незвичне (~97-й перцентиль) |
| ±3.0 | Екстремальне (~99.7-й перцентиль) |

### 6.4 COT Index (Min-Max нормалізація)

$$COT\_Index_t = \frac{Net_t - Min_{lookback}}{Max_{lookback} - Min_{lookback}} \times 100$$

- 0 = позиція на мінімумі lookback
- 100 = позиція на максимумі lookback
- \>80 = екстремальний лонг
- <20 = екстремальний шорт

### 6.5 Weekly Change (WoW)

$$\Delta Net_t = Net_t - Net_{t-1}$$

### 6.6 Market Power

$$L\_Power_t = \frac{Longs_{spec,t}}{OI_t} \times 100\%$$
$$S\_Power_t = \frac{Shorts_{spec,t}}{OI_t} \times 100\%$$

### 6.7 Position Velocity (Друга похідна)

$$\Delta Pos_t = Net_t - Net_{t-1}$$
$$Velocity_t = \Delta Pos_t - \Delta Pos_{t-1}$$

Еквівалентно:
$$Velocity_t = Net_t - 2 \cdot Net_{t-1} + Net_{t-2}$$

### 6.8 Sentiment Divergence Index

Нормалізація обох ліній до шкали 0–100 через перцентиль:
$$SDI_{spec,t} = Percentile(Net_{spec,t}, lookback)$$
$$SDI_{comm,t} = Percentile(Net_{comm,t}, lookback)$$

**Divergence Zone**: $SDI_{spec} \geq 90$ AND $SDI_{comm} \leq 10$ (або навпаки)

### 6.9 Long/Short Bias (для Flip визначення)

$$Long\%_t = \frac{Longs_t}{Longs_t + Shorts_t} \times 100$$
$$Short\%_t = 100 - Long\%_t$$

Flip = момент коли $Long\%$ перетинає 50%.

### 6.10 OI-Based Signal Matrix

```
Δprice = price[t] - price[t-1]
ΔOI    = OI[t] - OI[t-1]

if Δprice > 0 and ΔOI > 0:  signal = "Strong Demand"     color = green
if Δprice < 0 and ΔOI < 0:  signal = "Long Liquidation"  color = yellow
if Δprice > 0 and ΔOI < 0:  signal = "Short Covering"    color = blue
if Δprice < 0 and ΔOI > 0:  signal = "New Supply"        color = red
```

### 6.11 Spread Percentile (Block 2)

$$Spread_t = |Net_{spec,t} - Net_{comm,t}|$$
$$P_{spread,t} = Percentile(Spread_t, lookback)$$

---

## 7. Управління діапазоном (Lookback)

### На кожному чарті та блоці — дві групи кнопок:

#### Група 1: Статичний діапазон (Calendar Range)
Показує дані за фіксований календарний період від сьогодні:

| Кнопка | Період | Тижнів (≈) |
|---|---|---|
| 1M | 1 місяць | 4 |
| 3M | 3 місяці | 13 |
| 6M | 6 місяців | 26 |
| 1Y | 1 рік | 52 |
| 2Y | 2 роки | 104 |
| 3Y | 3 роки | 156 |
| 5Y | 5 років | 260 |

Це впливає на **відображення** графіка (X-axis range).

#### Група 2: Rolling Lookback (для розрахунків)
Перемикач для зміни **вікна розрахунків** (percentile, Z-score, COT Index):

| Кнопка | Rolling Window |
|---|---|
| 30D | 30 днів (~4 тижні) |
| 90D | 90 днів (~13 тижнів) |
| 180D | 180 днів (~26 тижнів) |
| 365D | 365 днів (~52 тижні) |

**Важливо**: Коли змінюється rolling lookback, **всі** percentile та Z-score значення перераховуються за цей новий період. Це дозволяє бачити чи позиція екстремальна в короткостроковій перспективі (30D) навіть якщо в довгостроковій (365D) вона нормальна.

### Реалізація на бекенді

```python
# Параметри запиту
GET /api/v1/cot/dashboard/{code}?
    report_type=tff&
    subtype=fo&
    display_range=2Y&      # скільки показувати на графіку
    lookback=365            # rolling window для розрахунків (днів)
```

**Альтернативний підхід (фронтенд-розрахунки)**:
Бекенд віддає максимальний набір даних (5Y), а фронтенд сам обрізає видимий діапазон і перераховує percentile/Z-score для обраного lookback window. Це може бути ефективніше, бо не потребує нових запитів при зміні lookback.

---

## 8. Дані: що потрібно з бекенду

### 8.1 Новий ендпоінт для дашборда

```
GET /api/v1/cot/dashboard/{code}
```

**Query Params**:
- `report_type` — (optional, default = primary для активу)
- `subtype` — (optional, default = 'fo')

**Response**:
```json
{
  "market": {
    "code": "099741",
    "name": "Euro FX",
    "exchange_code": "EUR",
    "sector": "FX",
    "primary_report": "tff",
    "spec_group": "g3",
    "comm_group": "g1",
    "available_reports": ["tff", "legacy"]
  },
  "groups": [...],
  "weeks": [
    {
      "date": "2026-02-10",
      "open_interest": 650000,
      "oi_change": 12500,
      "g3_long": 250000,
      "g3_short": 180000,
      "g3_net": 70000,
      "g3_change_long": 5000,
      "g3_change_short": -2000,
      "g3_change_net": 7000,
      "g1_long": 180000,
      "g1_short": 350000,
      "g1_net": -170000,
      "g1_change_net": -8000,
      // ... інші групи
    }
    // ... 260+ тижнів (5Y) для повного lookback
  ],
  "prices": [
    { "date": "2026-02-10", "close": 1.0850 }
    // weekly closes aligned with COT dates
  ],
  "concentration": {
    "top4_long_pct": 35.2,
    "top4_short_pct": 48.7,
    "top8_long_pct": 52.1,
    "top8_short_pct": 67.3
  },
  "meta": {
    "data_as_of": "2026-02-10",
    "published_at": "2026-02-13",
    "latest_week_index": 0
  }
}
```

### 8.2 Розрахунки на фронтенді

Усі наступні метрики **розраховуються на фронтенді** з сирих даних weeks[]:

| Метрика | Розрахунок | Lookback-залежна? |
|---|---|---|
| Net Position | `g_long - g_short` | Ні |
| Weekly Change | `net[t] - net[t-1]` | Ні |
| Percentile | Rank серед lookback values | **Так** |
| Z-Score | `(val - mean) / std` | **Так** |
| COT Index | `(val - min) / (max - min) * 100` | **Так** |
| Market Power | `longs / OI * 100` | Ні |
| Position Velocity | `Δnet[t] - Δnet[t-1]` | Ні |
| Sentiment Divergence | Percentile of spec + comm | **Так** |
| Spread Percentile | Percentile of spread | **Так** |
| Flip Detection | Sign change of net | Ні |
| OI Signal Matrix | Direction of price Δ + OI Δ | Ні |

### 8.3 Дані для Screener

Модифікувати існуючий screener ендпоінт або додати новий:

```
GET /api/v1/cot/screener-v2
```

Для кожного активу скрінер автоматично використовує primaryReport і specGroup.

**Response row**:
```json
{
  "code": "099741",
  "name": "Euro FX",
  "exchange_code": "EUR",
  "sector": "FX",
  "primary_report": "tff",
  "date": "2026-02-10",
  "net_position": 70000,
  "percentile_104w": 89,
  "z_score_104w": 1.85,
  "wow_change": 7000,
  "open_interest": 650000,
  "oi_change": 12500,
  "oi_change_pct": 1.96,
  "flip_tag": "Neutral",
  "prev_net": 63000
}
```

---

## 9. Технічний план реалізації

### Фаза 1: Інфраструктура (Тиждень 1)

| # | Задача | Деталі |
|---|---|---|
| 1.1 | **Конфігурація активів** | Створити `assetConfig.ts` з маппінгом code → sector, primaryReport, specGroup, commGroup |
| 1.2 | **Маршрутизація** | Оновити `router.tsx`: додати `/cot/dashboard/:code`, `/cot/report/:code`, редірект `/cot` → `/cot/screener` |
| 1.3 | **Store** | Розширити `useCotStore`: додати `displayRange`, `lookbackDays`, dashboard-related state |
| 1.4 | **Types** | Додати нові типи: `DashboardData`, `AssetConfig`, `ScreenerV2Row`, `FlipEvent`, `OISignal` |
| 1.5 | **Бекенд: dashboard endpoint** | Новий endpoint `/api/v1/cot/dashboard/{code}` що повертає 5Y raw data |
| 1.6 | **Бекенд: screener-v2** | Новий endpoint або модифікація існуючого, з auto-detect primaryReport |

### Фаза 2: Скрінер (Тиждень 2)

| # | Задача | Деталі |
|---|---|---|
| 2.1 | **ScreenerPage** | Нова сторінка-обгортка (`/cot/screener`) з header, filters, table |
| 2.2 | **ScreenerTable v2** | Переробити колонки: Net Position, Percentile bar, Z-Score, WoW Change, OI Trend, FLIP tag |
| 2.3 | **Sector filters** | Chip-кнопки з актуальними категоріями та лічильниками |
| 2.4 | **Row click** | Навігація до `/cot/dashboard/{code}` |
| 2.5 | **Landing integration** | Кнопка COT Reports на лендінгу → `/cot/screener` |

### Фаза 3: Дашборд — базові блоки (Тижні 3–4)

| # | Задача | Деталі |
|---|---|---|
| 3.1 | **DashboardPage layout** | Scaffold сторінки з header snapshot, grid layout, navigation |
| 3.2 | **Hooks: useAssetDashboard** | React Query hook + фронтенд-розрахунки (percentile, Z-score, etc.) |
| 3.3 | **Utility: calculations.ts** | Функції: `calcPercentile()`, `calcZScore()`, `calcCOTIndex()`, `detectFlips()`, `calcVelocity()` |
| 3.4 | **Block 1.1 + 1.2** | Net Long / Net Short з percentile zones та Z-Score підвалом |
| 3.5 | **Block 2** | Divergence chart (Price vs specGroup + commGroup net) з spread sidebar |
| 3.6 | **Block 3** | OI Analysis з кольоровою лінією ціни за матрицею |
| 3.7 | **Block 4** | Distribution histogram |
| 3.8 | **Block 6** | FLIP bubbles на ціновому графіку |

### Фаза 4: Дашборд — advanced індикатори (Тижні 5–6)

| # | Задача | Деталі |
|---|---|---|
| 4.1 | **Indicator 1** | Market Power (stacked area) + price background alerts |
| 4.2 | **Indicator 2** | Position Velocity oscillator + yellow diamond warnings |
| 4.3 | **Indicator 3** | Sentiment Divergence dual line + fill divergence zones |
| 4.4 | **Indicator 4** | Concentration Ratio gauge widget |
| 4.5 | **Indicator 5** | Triple Lookback heatmap matrix |

### Фаза 5: Lookback System + Report Page (Тиждень 7)

| # | Задача | Деталі |
|---|---|---|
| 5.1 | **RangeSelector** | Компонент з двома рядками кнопок (display range + rolling lookback) |
| 5.2 | **Інтеграція** | Вбудувати RangeSelector у кожен блок; при зміні lookback перераховувати метрики |
| 5.3 | **ReportPage** | Окрема сторінка `/cot/report/:code` з існуючою CotReportTable + перемикачі FO/CO + report type |
| 5.4 | **Report Type switcher** | Показувати лише доступні звіти для активу (напр. TFF + Legacy для EUR) |

### Фаза 6: Block 5 + Polish (Тижні 8+)

| # | Задача | Деталі |
|---|---|---|
| 6.1 | **Block 5: Sector sidebar** | Реалізація per-sector контексту (FX carry, seasonal, yield curve) |
| 6.2 | **Responsive design** | Адаптація під мобільні / планшетні розміри |
| 6.3 | **Performance** | Мемоізація розрахунків, virtualization для довгих серій |
| 6.4 | **Testing** | E2E тести, перевірка формул на реальних даних |
| 6.5 | **Documentation** | Оновлення DocumentationModal з описом нових блоків |

---

## Додаток A: Бібліотека графіків

### Рекомендована: Recharts (вже в проекті) або Lightweight Charts (TradingView)

| Блок | Тип чарту | Бібліотека |
|---|---|---|
| Price charts | Line | Recharts / Lightweight Charts |
| Percentile zones | Area with reference lines | Recharts |
| Z-Score | Line with thresholds | Recharts |
| Distribution histogram | Bar chart | Recharts |
| OI Analysis | Multi-type (line + area) | Recharts |
| Stacked Area (Market Power) | Stacked Area | Recharts |
| Velocity Oscillator | Bar chart | Recharts |
| Gauge Meter | Custom SVG | Custom component |
| Heatmap Matrix | Grid of cells | Custom component (CSS Grid) |
| Bubble Chart (FLIP) | Scatter + Line | Recharts ComposedChart |

---

## Додаток B: Кольорова схема

```typescript
const DASHBOARD_COLORS = {
  // Percentile zones
  extreme_long:     '#EF4444',  // Red — перегрів
  extreme_short:    '#22C55E',  // Green — капітуляція
  above_avg:        '#F59E0B',  // Amber
  below_avg:        '#3B82F6',  // Blue
  neutral:          '#6B7280',  // Gray
  
  // Lines
  spec_line:        '#3B82F6',  // Blue — speculators
  comm_line:        '#F97316',  // Orange — commercials
  price_line:       '#E5E7EB',  // Light gray
  
  // OI Signal matrix
  strong_demand:    '#22C55E',  // Green
  long_liquidation: '#EAB308',  // Yellow
  short_covering:   '#3B82F6',  // Blue
  new_supply:       '#EF4444',  // Red
  
  // FLIP bubbles
  flip_to_long:     '#22C55E',
  flip_to_short:    '#EF4444',
  
  // Velocity
  velocity_pos:     '#22C55E',
  velocity_neg:     '#EF4444',
  velocity_hollow:  'transparent',
  
  // Market Power
  l_power:          '#22C55E80', // Green with alpha
  s_power:          '#EF444480', // Red with alpha
  
  // Alerts
  warning_diamond:  '#EAB308',  // Yellow
  divergence_fill:  '#7C3AED40', // Purple with alpha
  
  // Background highlights
  short_squeeze_bg: '#EF444410',
  long_squeeze_bg:  '#22C55E10',
};
```

---

## Додаток C: Existing Codebase Integration Points

### Файли які треба модифікувати

| Файл | Зміна |
|---|---|
| `frontend/src/router.tsx` | Нові маршрути: dashboard/:code, report/:code, redirect |
| `frontend/src/apps/cot/CotApp.tsx` | Спростити — тепер це layout wrapper, не main component |
| `frontend/src/apps/cot/store/useCotStore.ts` | Додати displayRange, lookbackDays state |
| `frontend/src/apps/cot/utils/constants.ts` | Додати ASSET_CONFIG, SECTORS, FLIP_TAGS |
| `frontend/src/apps/cot/types/` | Нові типи для дашборда |
| `frontend/src/pages/Landing.tsx` | Кнопка → /cot/screener |
| `backend/app/modules/cot/router.py` | Новий endpoint dashboard |
| `backend/app/modules/cot/calculator.py` | Розширити розрахунки |
| `backend/app/modules/cot/config.py` | Додати asset config |

### Нові файли

| Файл | Призначення |
|---|---|
| `frontend/src/apps/cot/pages/ScreenerPage.tsx` | Обгортка скрінера |
| `frontend/src/apps/cot/pages/DashboardPage.tsx` | Дашборд конкретного активу |
| `frontend/src/apps/cot/pages/ReportPage.tsx` | Таблиця репорту |
| `frontend/src/apps/cot/utils/assetConfig.ts` | Маппінг активів |
| `frontend/src/apps/cot/utils/calculations.ts` | Фронтенд-калькулятор |
| `frontend/src/apps/cot/hooks/useDashboard.ts` | React Query + розрахунки |
| `frontend/src/apps/cot/components/dashboard/` | Директорія з компонентами блоків |
| `frontend/src/apps/cot/components/dashboard/HeaderSnapshot.tsx` | Шапка |
| `frontend/src/apps/cot/components/dashboard/NetAnalysisChart.tsx` | Block 1.1 / 1.2 |
| `frontend/src/apps/cot/components/dashboard/DivergenceChart.tsx` | Block 2 |
| `frontend/src/apps/cot/components/dashboard/OIAnalysisChart.tsx` | Block 3 |
| `frontend/src/apps/cot/components/dashboard/DistributionHistogram.tsx` | Block 4 |
| `frontend/src/apps/cot/components/dashboard/SectorContext.tsx` | Block 5 |
| `frontend/src/apps/cot/components/dashboard/FlipChart.tsx` | Block 6 |
| `frontend/src/apps/cot/components/dashboard/MarketPower.tsx` | Indicator 1 |
| `frontend/src/apps/cot/components/dashboard/PositionVelocity.tsx` | Indicator 2 |
| `frontend/src/apps/cot/components/dashboard/SentimentDivergence.tsx` | Indicator 3 |
| `frontend/src/apps/cot/components/dashboard/ConcentrationGauge.tsx` | Indicator 4 |
| `frontend/src/apps/cot/components/dashboard/TripleLookback.tsx` | Indicator 5 |
| `frontend/src/apps/cot/components/shared/RangeSelector.tsx` | Lookback/Range picker |
| `backend/app/modules/cot/dashboard_service.py` | Dashboard-specific logic |

---

## Додаток D: Data Validation Checklist

Перед продакшеном — перевірити на реальних даних:

- [ ] Percentile 99th для AUD (очікуємо >33,000 net long)
- [ ] Z-Score >2.0 для CAD (очікуємо ~2.58)
- [ ] FLIP detection: пошук історичних flips у EUR за 2024–2025
- [ ] OI Signal Matrix: перевірити кольори лінії ціни на Gold
- [ ] Market Power: S_Power для Natural Gas (очікуємо значний % шортів)
- [ ] Velocity: знайти Pre-Flip зони де velocity від'ємна при лонговій позиції
- [ ] Concentration: Top-4 % для Nano BTC (очікуємо > 60%)
- [ ] Triple Lookback: перевірити що 5Y дані доступні для основних ринків
- [ ] Divergence: перевірити дзеркальність spec vs comm для Gold
