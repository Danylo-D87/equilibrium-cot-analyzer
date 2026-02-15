// =====================================================
// Centralized API client with error handling
// Falls back to pre-exported static JSON in public/data/
// when the backend is not available.
// =====================================================

import type { Market, MarketData, Group, ScreenerRow, PricePoint, Week } from '../apps/cot/types';

/** Custom API error with status code */
export class ApiError extends Error {
    constructor(
        message: string,
        public status?: number,
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

/**
 * Fetch JSON with automatic error extraction.
 * Throws ApiError on network or HTTP errors.
 */
export async function fetchJson<T>(url: string): Promise<T> {
    let res: Response;
    try {
        res = await fetch(url);
    } catch {
        throw new ApiError('Cannot connect to the server — is the backend running?');
    }

    if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try {
            const body = await res.json();
            if (body?.detail) detail = body.detail;
        } catch {
            /* ignore parse errors */
        }
        throw new ApiError(detail, res.status);
    }

    return res.json() as Promise<T>;
}

/** Silently fetch a static JSON file; returns null on failure. */
async function fetchStatic<T>(url: string): Promise<T | null> {
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        return (await res.json()) as T;
    } catch {
        return null;
    }
}

// =====================================================
// Typed API endpoints (with static-file fallback)
// =====================================================

const BASE = '/api/v1/cot';

/** Fetch market list for a report type + subtype */
export async function fetchMarkets(reportType: string, subtype: string): Promise<Market[]> {
    try {
        return await fetchJson<Market[]>(`${BASE}/markets/${reportType}/${subtype}`);
    } catch {
        const data = await fetchStatic<Market[]>(`/data/markets_${reportType}_${subtype}.json`);
        if (data) return data;
        throw new ApiError('Failed to load market list from both API and static data');
    }
}

/**
 * Fetch full market data (weeks, stats, prices).
 * Static fallback: report-specific file has market/groups/weeks/stats,
 * base market file provides prices.
 */
export async function fetchMarketData(
    reportType: string,
    subtype: string,
    code: string,
): Promise<MarketData> {
    try {
        return await fetchJson<MarketData>(`${BASE}/markets/${reportType}/${subtype}/${code}`);
    } catch {
        // Primary static file: market + groups + weeks + stats (no prices)
        const reportData = await fetchStatic<{
            market: Market;
            groups: Group[];
            weeks: Week[];
            stats: MarketData['stats'];
        }>(`/data/market_${code}_${reportType}_${subtype}.json`);

        if (!reportData) {
            throw new ApiError('Failed to load market data from both API and static data');
        }

        // Base market file provides prices
        const baseData = await fetchStatic<{ prices?: PricePoint[] }>(`/data/market_${code}.json`);

        return {
            market: reportData.market,
            groups: reportData.groups,
            weeks: reportData.weeks,
            stats: reportData.stats,
            prices: baseData?.prices ?? [],
        };
    }
}

/** Fetch screener data (backend wraps rows in `{ items }`) */
export async function fetchScreener(reportType: string, subtype: string): Promise<ScreenerRow[]> {
    try {
        const res = await fetchJson<{ items: ScreenerRow[] } | ScreenerRow[]>(
            `${BASE}/screener/${reportType}/${subtype}`,
        );
        return Array.isArray(res) ? res : res.items;
    } catch {
        const data = await fetchStatic<ScreenerRow[]>(`/data/screener_${reportType}_${subtype}.json`);
        if (data) return data;
        throw new ApiError('Failed to load screener data from both API and static data');
    }
}

/** Fetch group definitions */
export async function fetchGroups(reportType: string): Promise<Group[]> {
    try {
        return await fetchJson<Group[]>(`${BASE}/groups/${reportType}`);
    } catch {
        const data = await fetchStatic<Group[]>(`/data/groups_${reportType}.json`);
        if (data) return data;
        throw new ApiError('Failed to load groups from both API and static data');
    }
}
