// =====================================================
// Centralized API client with auth support.
//
// Access token is stored in-memory (never localStorage).
// Refresh token is an HttpOnly cookie (managed by backend).
// On 401, a silent refresh is attempted once before failing.
// =====================================================

import type { Market, MarketData, Group, ScreenerRow } from '../apps/cot/types';

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

// ── In-memory access token management ──────────────────────

let _accessToken: string | null = null;

export function setAccessToken(token: string) {
    _accessToken = token;
}

export function clearAccessToken() {
    _accessToken = null;
}

export function getAccessToken(): string | null {
    return _accessToken;
}

// ── Core fetch with auth ───────────────────────────────────

interface FetchJsonInit extends RequestInit {
    /** Internal flag — do not set manually */
    _retry?: boolean;
}

/**
 * Fetch JSON with automatic auth header injection and 401 refresh.
 */
export async function fetchJson<T>(
    url: string,
    init?: FetchJsonInit,
): Promise<T> {
    const headers = new Headers(init?.headers);

    // Attach access token if available
    if (_accessToken && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${_accessToken}`);
    }

    let res: Response;
    try {
        res = await fetch(url, {
            ...init,
            headers,
            credentials: init?.credentials ?? 'same-origin',
        });
    } catch {
        throw new ApiError('Cannot connect to the server — is the backend running?');
    }

    // Auto-refresh on 401 (once), but not for auth endpoints that legitimately return 401
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/verify-email') || url.includes('/auth/refresh');
    if (res.status === 401 && !init?._retry && !isAuthEndpoint) {
        try {
            const refreshRes = await fetch('/api/v1/auth/refresh', {
                method: 'POST',
                credentials: 'include',
            });
            if (refreshRes.ok) {
                const data = await refreshRes.json();
                setAccessToken(data.access_token);
                return fetchJson<T>(url, { ...init, _retry: true });
            }
        } catch {
            // refresh failed — fall through
        }
        clearAccessToken();
        throw new ApiError('Session expired — please log in again', 401);
    }

    if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try {
            const body = await res.json();
            console.error(`[API ${res.status}] ${res.url}`, body);
            if (body?.detail) {
                detail = Array.isArray(body.detail)
                    ? body.detail.map((e: { loc?: unknown[]; msg?: string }) =>
                          `${(e.loc ?? []).slice(1).join('.')}: ${e.msg ?? e}`
                      ).join(' | ')
                    : String(body.detail);
            }
        } catch {
            /* ignore parse errors */
        }
        throw new ApiError(detail, res.status);
    }

    return res.json() as Promise<T>;
}

// ── COT-specific API functions ─────────────────────────────

const BASE = '/api/v1/cot';

/** Fetch market list for a report type + subtype */
export async function fetchMarkets(reportType: string, subtype: string): Promise<Market[]> {
    return fetchJson<Market[]>(`${BASE}/markets/${reportType}/${subtype}`);
}

/** Fetch full market data (weeks, stats, prices). */
export async function fetchMarketData(
    reportType: string,
    subtype: string,
    code: string,
): Promise<MarketData> {
    return fetchJson<MarketData>(`${BASE}/markets/${reportType}/${subtype}/${code}`);
}

/** Fetch screener data */
export async function fetchScreener(reportType: string, subtype: string): Promise<ScreenerRow[]> {
    const res = await fetchJson<{ items: ScreenerRow[] } | ScreenerRow[]>(
        `${BASE}/screener/${reportType}/${subtype}`,
    );
    return Array.isArray(res) ? res : res.items;
}

/** Fetch group definitions */
export async function fetchGroups(reportType: string): Promise<Group[]> {
    return fetchJson<Group[]>(`${BASE}/groups/${reportType}`);
}
