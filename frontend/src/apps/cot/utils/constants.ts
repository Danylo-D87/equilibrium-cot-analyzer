// =====================================================
// Single source of truth for all shared constants
// =====================================================

// --- Report types ---

export const REPORT_TYPES = [
    { key: 'legacy', label: 'Legacy', shortLabel: 'Legacy' },
    { key: 'disagg', label: 'Disaggregated', shortLabel: 'Disagg' },
    { key: 'tff', label: 'TFF', shortLabel: 'TFF' },
] as const;

export const SUBTYPES = [
    { key: 'fo', label: 'Futures Only', shortLabel: 'FO' },
    { key: 'co', label: 'Combined', shortLabel: 'CO' },
] as const;

// --- Default market codes per report type ---

export const DEFAULT_MARKET_CODES: Record<string, string> = {
    legacy: '099741',
    disagg: '088691',
    tff: '133741',
};

// --- Categories (used by MarketSelector, ScreenerTable, etc.) ---

export const CATEGORY_ORDER = [
    { key: 'all', label: 'All' },
    { key: 'currencies', label: 'FX' },
    { key: 'crypto', label: 'Crypto' },
    { key: 'energy', label: 'Energy' },
    { key: 'metals', label: 'Metals' },
    { key: 'grains', label: 'Grains' },
    { key: 'softs', label: 'Softs' },
    { key: 'indices', label: 'Indices' },
    { key: 'rates', label: 'Rates' },
    { key: 'livestock', label: 'Livestock' },
    { key: 'other', label: 'Other' },
];

/** Category keys only (without 'all') — for MarketSelector ordering */
export const CATEGORY_KEYS = CATEGORY_ORDER
    .filter(c => c.key !== 'all')
    .map(c => c.key);

/** Category key → short label map */
export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
    CATEGORY_ORDER.map(c => [c.key, c.label])
);

// --- Timeframes ---

export const TIMEFRAMES = [
    { key: '6m', label: '6M', weeks: 26 },
    { key: '1y', label: '1Y', weeks: 52 },
    { key: '2y', label: '2Y', weeks: 104 },
    { key: 'all', label: 'ALL', weeks: Infinity },
];

// --- Chart colors ---

export const CHART_COLORS = {
    buy: '#3b82f6',
    sell: '#ef4444',
    mixed: '#8b5cf6',
    oi: '#6366f1',
    grid: '#262626',
    axis: '#525252',
    zero: '#262626',
} as const;

export const GROUP_COLOR_PALETTE = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

// --- 8 COT Signal names ---

export const SIGNAL_NAMES = [
    'Net Position Extreme',
    'Net Position Reversal',
    'Momentum Acceleration',
    'Open Interest Divergence',
    'Small Spec Contrary',
    'Commercial Hedge Pressure',
    'Crowded Trade Unwinding',
    'COT Index Crossover',
];
