// =====================================================
// Screener data types
// =====================================================

/** Raw screener row from API */
export interface ScreenerRow {
    code: string;
    name: string;
    exchange_code: string;
    category: string;
    category_display: string;
    date: string;
    open_interest: number;
    oi_change: number;
    [key: string]: string | number | null | undefined;
}

/** Enriched screener row (after client-side computation) */
export interface EnrichedScreenerRow extends ScreenerRow {
    all_long: number | null;
    all_short: number | null;
    all_change_long: number | null;
    all_change_short: number | null;
    all_short_ratio: number | null;
}
