// =====================================================
// Market & COT report data types
// =====================================================

/** Market metadata (from /api/v1/cot/markets/:report/:subtype) */
export interface Market {
    code: string;
    name: string;
    exchange: string;
    exchange_code: string;
    category: string;
    category_display: string;
}

/** Group definition (from /api/v1/cot/groups/:report) */
export interface Group {
    key: string;
    name: string;
    short: string;
    role: 'commercial' | 'speculative' | 'small';
    has_spread: boolean;
}

/** Crowded level object */
export interface CrowdedLevel {
    value: number;
    signal: 'BUY' | 'SELL' | null;
}

/** Single weekly COT data row */
export interface Week {
    date: string;
    open_interest: number;
    oi_change: number;
    oi_pct: number;
    [key: string]: number | string | CrowdedLevel | null | undefined;
}

/** Statistical summary row */
export interface StatRow {
    [key: string]: number | null;
}

/** Price data point */
export interface PricePoint {
    date: string;
    close: number;
}

/** Full market data response (from /api/v1/cot/markets/:report/:subtype/:code) */
export interface MarketData {
    market: Market;
    groups: Group[];
    weeks: Week[];
    stats: {
        max: StatRow;
        min: StatRow;
        max_5y: StatRow;
        min_5y: StatRow;
        avg_13w: StatRow;
    };
    prices: PricePoint[];
}
