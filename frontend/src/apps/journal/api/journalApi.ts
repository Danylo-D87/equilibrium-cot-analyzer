/**
 * Journal API functions.
 * Uses the shared fetchJson client with automatic auth header injection.
 */

import { fetchJson, getAccessToken } from '@/lib/api';
import type {
    Trade,
    TradeCreate,
    TradeUpdate,
    Portfolio,
    PortfolioCreate,
    PortfolioUpdate,
    PortfolioMetrics,
    JournalSettings,
    JournalSettingsUpdate,
    EquityCurvePoint,
    AssetsExposureData,
    AlphaCurvePoint,
    DrawdownPoint,
    RollingMetricsPoint,
    DailyReturnPoint,
    RollingWinRatePoint,
    RMultipleDistribution,
    RiskAdjustedComparison,
    NAVHistoryPoint,
    RollingInformationRatioPoint,
    ExpectedVsActualReturn,
    ComparativeDrawdownPoint,
    NAVvsHighWatermarkPoint,
    RollingTrackingErrorPoint,
    TradeFilters,
    OrphanSummary,
    TradeImage,
} from '../types';

const BASE = '/api/v1/journal';

// ── Helper: build query string from filters ────────────

function qs(filters?: TradeFilters): string {
    if (!filters) return '';
    const params = new URLSearchParams();
    if (filters.type?.length) filters.type.forEach(t => params.append('type', t));
    if (filters.style?.length) filters.style.forEach(s => params.append('style', s));
    if (filters.date_from) params.set('date_from', filters.date_from);
    if (filters.date_to) params.set('date_to', filters.date_to);
    if (filters.portfolio_id?.length) filters.portfolio_id.forEach(id => params.append('portfolio_id', id));
    const s = params.toString();
    return s ? `?${s}` : '';
}

// ── Trades ──────────────────────────────────────────────

export async function fetchTrades(filters?: TradeFilters): Promise<Trade[]> {
    const filterPart = qs(filters).replace(/^\?/, '');
    const query = filterPart ? `?limit=500&${filterPart}` : '?limit=500';
    const res = await fetchJson<{ items: Trade[]; total: number; limit: number; offset: number }>(
        `${BASE}/trades${query}`
    );
    return res.items ?? res as unknown as Trade[];
}

export async function fetchTrade(id: string): Promise<Trade> {
    return fetchJson<Trade>(`${BASE}/trades/${id}`);
}

export async function createTrade(data: TradeCreate): Promise<Trade> {
    return fetchJson<Trade>(`${BASE}/trades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}

export async function updateTrade(id: string, data: TradeUpdate): Promise<Trade> {
    return fetchJson<Trade>(`${BASE}/trades/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}

export async function deleteTrade(id: string): Promise<void> {
    await fetchJson<{ message: string }>(`${BASE}/trades/${id}`, { method: 'DELETE' });
}

// ── Orphan trades ─────────────────────────────────

export async function fetchOrphanTrades(): Promise<Trade[]> {
    return fetchJson<Trade[]>(`${BASE}/trades/orphan`);
}

export async function fetchOrphanSummary(): Promise<OrphanSummary> {
    return fetchJson<OrphanSummary>(`${BASE}/trades/orphan/summary`);
}

// ── Images ──────────────────────────────────────────────

export async function uploadTradeImage(tradeId: string, file: File): Promise<TradeImage> {
    const formData = new FormData();
    formData.append('file', file);
    const token = getAccessToken();
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE}/trades/${tradeId}/images`, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'same-origin',
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Upload failed (${res.status})`);
    }
    return res.json();
}

export async function deleteTradeImage(tradeId: string, imageId: string): Promise<void> {
    await fetchJson<{ message: string }>(`${BASE}/trades/${tradeId}/images/${imageId}`, {
        method: 'DELETE',
    });
}

export async function reorderTradeImages(tradeId: string, imageIds: string[]): Promise<void> {
    await fetchJson<{ message: string }>(`${BASE}/trades/${tradeId}/images/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_ids: imageIds }),
    });
}

export async function updateImageCaption(imageId: string, caption: string | null): Promise<TradeImage> {
    return fetchJson<TradeImage>(`${BASE}/images/${imageId}/caption`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption }),
    });
}

export function getImageUrl(imageId: string): string {
    const token = getAccessToken();
    const q = token ? `?token=${encodeURIComponent(token)}` : '';
    return `${BASE}/images/${imageId}${q}`;
}

export function getThumbnailUrl(imageId: string): string {
    const token = getAccessToken();
    const q = token ? `?token=${encodeURIComponent(token)}` : '';
    return `${BASE}/images/${imageId}/thumbnail${q}`;
}

// ── Portfolios ──────────────────────────────────────────

export async function fetchPortfolios(): Promise<Portfolio[]> {
    return fetchJson<Portfolio[]>(`${BASE}/portfolios`);
}

export async function createPortfolio(data: PortfolioCreate): Promise<Portfolio> {
    return fetchJson<Portfolio>(`${BASE}/portfolios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}

export async function updatePortfolio(id: string, data: PortfolioUpdate): Promise<Portfolio> {
    return fetchJson<Portfolio>(`${BASE}/portfolios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}

export async function deletePortfolio(id: string): Promise<void> {
    await fetchJson<{ message: string }>(`${BASE}/portfolios/${id}`, { method: 'DELETE' });
}

// ── Metrics ─────────────────────────────────────────────

export async function fetchMetrics(filters?: TradeFilters): Promise<PortfolioMetrics> {
    return fetchJson<PortfolioMetrics>(`${BASE}/metrics${qs(filters)}`);
}

export async function fetchEquityCurve(filters?: TradeFilters): Promise<EquityCurvePoint[]> {
    return fetchJson<EquityCurvePoint[]>(`${BASE}/equity-curve${qs(filters)}`);
}

export async function fetchAssetsExposure(filters?: TradeFilters): Promise<AssetsExposureData[]> {
    return fetchJson<AssetsExposureData[]>(`${BASE}/assets-exposure${qs(filters)}`);
}

// ── Chart endpoints ─────────────────────────────────────

export async function fetchAlphaCurve(f?: TradeFilters): Promise<AlphaCurvePoint[]> {
    return fetchJson<AlphaCurvePoint[]>(`${BASE}/charts/alpha-curve${qs(f)}`);
}

export async function fetchDrawdown(f?: TradeFilters): Promise<DrawdownPoint[]> {
    return fetchJson<DrawdownPoint[]>(`${BASE}/charts/drawdown${qs(f)}`);
}

export async function fetchRollingMetrics(f?: TradeFilters): Promise<RollingMetricsPoint[]> {
    return fetchJson<RollingMetricsPoint[]>(`${BASE}/charts/rolling-metrics${qs(f)}`);
}

export async function fetchDailyReturns(f?: TradeFilters): Promise<DailyReturnPoint[]> {
    return fetchJson<DailyReturnPoint[]>(`${BASE}/charts/daily-returns${qs(f)}`);
}

export async function fetchRollingWinRate(f?: TradeFilters): Promise<RollingWinRatePoint[]> {
    return fetchJson<RollingWinRatePoint[]>(`${BASE}/charts/rolling-win-rate${qs(f)}`);
}

export async function fetchRMultipleDistribution(f?: TradeFilters): Promise<RMultipleDistribution[]> {
    return fetchJson<RMultipleDistribution[]>(`${BASE}/charts/r-multiple-distribution${qs(f)}`);
}

export async function fetchRiskAdjustedComparison(f?: TradeFilters): Promise<RiskAdjustedComparison[]> {
    return fetchJson<RiskAdjustedComparison[]>(`${BASE}/charts/risk-adjusted-comparison${qs(f)}`);
}

export async function fetchNAVHistory(f?: TradeFilters): Promise<NAVHistoryPoint[]> {
    return fetchJson<NAVHistoryPoint[]>(`${BASE}/charts/nav-history${qs(f)}`);
}

export async function fetchRollingInformationRatio(f?: TradeFilters): Promise<RollingInformationRatioPoint[]> {
    return fetchJson<RollingInformationRatioPoint[]>(`${BASE}/charts/rolling-information-ratio${qs(f)}`);
}

export async function fetchExpectedVsActualReturn(f?: TradeFilters): Promise<ExpectedVsActualReturn[]> {
    return fetchJson<ExpectedVsActualReturn[]>(`${BASE}/charts/expected-vs-actual-return${qs(f)}`);
}

export async function fetchComparativeDrawdown(f?: TradeFilters): Promise<ComparativeDrawdownPoint[]> {
    return fetchJson<ComparativeDrawdownPoint[]>(`${BASE}/charts/comparative-drawdown${qs(f)}`);
}

export async function fetchNAVvsHighWatermark(f?: TradeFilters): Promise<NAVvsHighWatermarkPoint[]> {
    return fetchJson<NAVvsHighWatermarkPoint[]>(`${BASE}/charts/nav-vs-high-watermark${qs(f)}`);
}

export async function fetchRollingTrackingError(f?: TradeFilters): Promise<RollingTrackingErrorPoint[]> {
    return fetchJson<RollingTrackingErrorPoint[]>(`${BASE}/charts/rolling-tracking-error${qs(f)}`);
}

// ── Settings ────────────────────────────────────────────

export async function fetchSettings(): Promise<JournalSettings> {
    return fetchJson<JournalSettings>(`${BASE}/settings`);
}

export async function updateSettings(data: JournalSettingsUpdate): Promise<JournalSettings> {
    return fetchJson<JournalSettings>(`${BASE}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}

// ── Enums ────────────────────────────────────────────────

export async function fetchEnumTypes(): Promise<string[]> {
    return fetchJson<string[]>(`${BASE}/enums/types`);
}

export async function fetchEnumStyles(): Promise<string[]> {
    return fetchJson<string[]>(`${BASE}/enums/styles`);
}

export async function fetchEnumDirections(): Promise<string[]> {
    return fetchJson<string[]>(`${BASE}/enums/directions`);
}

export async function fetchEnumStatuses(): Promise<string[]> {
    return fetchJson<string[]>(`${BASE}/enums/statuses`);
}


