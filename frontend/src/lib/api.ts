// =====================================================
// Centralized API client with error handling
// =====================================================

import type { Market, MarketData, Group, ScreenerRow } from '../types';

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

// =====================================================
// Typed API endpoints
// =====================================================

const BASE = '/api/v1/cot';

/** Fetch market list for a report type + subtype */
export function fetchMarkets(reportType: string, subtype: string): Promise<Market[]> {
    return fetchJson<Market[]>(`${BASE}/markets/${reportType}/${subtype}`);
}

/** Fetch full market data (weeks, stats, prices) */
export function fetchMarketData(reportType: string, subtype: string, code: string): Promise<MarketData> {
    return fetchJson<MarketData>(`${BASE}/markets/${reportType}/${subtype}/${code}`);
}

/** Fetch screener data */
export function fetchScreener(reportType: string, subtype: string): Promise<ScreenerRow[]> {
    return fetchJson<ScreenerRow[]>(`${BASE}/screener/${reportType}/${subtype}`);
}

/** Fetch group definitions */
export function fetchGroups(reportType: string): Promise<Group[]> {
    return fetchJson<Group[]>(`${BASE}/groups/${reportType}`);
}
