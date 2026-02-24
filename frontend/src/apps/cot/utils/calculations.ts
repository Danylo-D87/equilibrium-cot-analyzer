/**
 * Dashboard calculations — all formulas from COT_IMPLEMENTATION_PLAN.md
 *
 * Every computation runs on the frontend from raw week arrays
 * returned by the dashboard API. Lookback is configurable.
 */

import type {
    DashboardWeek,
    DashboardPricePoint,
    FlipEvent,
    OISignal,
    OISignalType,
    VelocityPoint,
    SentimentDivergencePoint,
    TripleLookbackRow,
    MarketPowerPoint,
    LongShortBiasPoint,
} from '../types/dashboard';

// ─── Primitive helpers ───────────────────────────────────────

/** Extract a numeric series from weeks by key (keeps null for gaps). */
export function extractSeries(weeks: DashboardWeek[], key: string): (number | null)[] {
    return weeks.map((w) => {
        const v = w[key];
        return typeof v === 'number' ? v : null;
    });
}

/** Extract non-null values from a window slice. */
function valuesInWindow(series: (number | null)[], start: number, length: number): number[] {
    const end = Math.min(start + length, series.length);
    const result: number[] = [];
    for (let i = start; i < end; i++) {
        if (series[i] != null) result.push(series[i]!);
    }
    return result;
}

// ─── 6.2  Percentile Rank ────────────────────────────────────

/**
 * Percentile of `value` within `window` (0–100).
 * Uses the "less than or equal" definition with 0.5 offset, clamped to [1, 99].
 */
export function calcPercentile(value: number, window: number[]): number {
    if (window.length === 0) return 50;
    const n = window.length;
    let count = 0;
    for (const v of window) {
        if (v <= value) count++;
    }
    const pct = ((count - 0.5) / n) * 100;
    return Math.max(1, Math.min(99, Math.round(pct * 10) / 10));
}

// ─── 6.3  Z-Score ────────────────────────────────────────────

export function calcZScore(value: number, window: number[]): number {
    if (window.length < 2) return 0;
    const mean = window.reduce((s, v) => s + v, 0) / window.length;
    const variance = window.reduce((s, v) => s + (v - mean) ** 2, 0) / window.length;
    const std = Math.sqrt(variance);
    if (std === 0) return 0;
    return Math.round(((value - mean) / std) * 100) / 100;
}

// ─── 6.4  COT Index (Min-Max normalisation 0–100) ───────────

export function calcCotIndex(value: number, window: number[]): number {
    if (window.length < 2) return 50;
    const mn = Math.min(...window);
    const mx = Math.max(...window);
    if (mx === mn) return 50;
    return Math.round(((value - mn) / (mx - mn)) * 100 * 10) / 10;
}

// ─── Full metrics for one series at a given lookback ─────────

export interface SeriesMetrics {
    value: number;
    percentile: number;
    zScore: number;
    cotIndex: number;
    weeklyChange: number;
}

/**
 * Compute percentile, Z-score, COT Index for the first (most recent) value
 * of a series over a given lookback window.
 */
export function computeSeriesMetrics(
    series: (number | null)[],
    lookbackWeeks: number,
): SeriesMetrics | null {
    if (series.length === 0 || series[0] == null) return null;
    const current = series[0]!;
    const window = valuesInWindow(series, 0, lookbackWeeks);
    if (window.length < 2) return null;
    const prev = series.length > 1 && series[1] != null ? series[1]! : current;
    return {
        value: current,
        percentile: calcPercentile(current, window),
        zScore: calcZScore(current, window),
        cotIndex: calcCotIndex(current, window),
        weeklyChange: current - prev,
    };
}

// ─── 6.2  Percentile series (for each data point) ───────────

/**
 * For every point in `series`, compute percentile over a rolling lookback window.
 * Returns array same length as series.
 */
export function calcPercentileSeries(
    series: (number | null)[],
    lookbackWeeks: number,
): (number | null)[] {
    return series.map((val, i) => {
        if (val == null) return null;
        const window = valuesInWindow(series, i, lookbackWeeks);
        if (window.length < 2) return null;
        return calcPercentile(val, window);
    });
}

/** Z-Score series */
export function calcZScoreSeries(
    series: (number | null)[],
    lookbackWeeks: number,
): (number | null)[] {
    return series.map((val, i) => {
        if (val == null) return null;
        const window = valuesInWindow(series, i, lookbackWeeks);
        if (window.length < 2) return null;
        return calcZScore(val, window);
    });
}

// ─── 6.7  Position Velocity (second derivative) ─────────────

export function calcVelocity(
    weeks: DashboardWeek[],
    specGroupKey: string,
): VelocityPoint[] {
    const netKey = `${specGroupKey}_net`;
    const result: VelocityPoint[] = [];

    for (let i = 0; i < weeks.length - 2; i++) {
        const net0 = weeks[i][netKey];
        const net1 = weeks[i + 1][netKey];
        const net2 = weeks[i + 2][netKey];
        if (typeof net0 !== 'number' || typeof net1 !== 'number' || typeof net2 !== 'number') continue;

        const delta0 = net0 - net1;
        const delta1 = net1 - net2;
        const velocity = delta0 - delta1;

        // Warning: velocity direction opposes net position
        const warning = (net0 > 0 && velocity < 0) || (net0 < 0 && velocity > 0);

        result.push({
            date: weeks[i].date,
            velocity: Math.round(velocity),
            netPosition: net0,
            warning,
        });
    }
    return result;
}

// ─── 4.7  FLIP Detection ────────────────────────────────────

export function detectFlips(
    weeks: DashboardWeek[],
    prices: DashboardPricePoint[],
    specGroupKey: string,
): FlipEvent[] {
    const netKey = `${specGroupKey}_net`;
    const priceMap = new Map(prices.map((p) => [p.date, p.close]));
    const flips: FlipEvent[] = [];

    for (let i = 0; i < weeks.length - 1; i++) {
        const currNet = weeks[i][netKey];
        const prevNet = weeks[i + 1][netKey];
        if (typeof currNet !== 'number' || typeof prevNet !== 'number') continue;

        if (prevNet <= 0 && currNet > 0) {
            flips.push({
                date: weeks[i].date,
                type: 'LONG',
                magnitude: Math.abs(currNet - prevNet),
                price: priceMap.get(weeks[i].date) ?? null,
                netBefore: prevNet,
                netAfter: currNet,
            });
        } else if (prevNet >= 0 && currNet < 0) {
            flips.push({
                date: weeks[i].date,
                type: 'SHORT',
                magnitude: Math.abs(currNet - prevNet),
                price: priceMap.get(weeks[i].date) ?? null,
                netBefore: prevNet,
                netAfter: currNet,
            });
        }
    }
    return flips;
}

// ─── 6.10  OI Signal Matrix ─────────────────────────────────

export function calcOISignals(
    weeks: DashboardWeek[],
    prices: DashboardPricePoint[],
): OISignal[] {
    const priceMap = new Map(prices.map((p) => [p.date, p.close]));
    const results: OISignal[] = [];

    for (let i = 0; i < weeks.length - 1; i++) {
        const currOi = weeks[i].open_interest;
        const prevOi = weeks[i + 1].open_interest;
        const currPrice = priceMap.get(weeks[i].date);
        const prevPrice = priceMap.get(weeks[i + 1].date);
        if (currOi == null || prevOi == null || currPrice == null || prevPrice == null) continue;

        const priceChange = currPrice - prevPrice;
        const oiChange = currOi - prevOi;

        let signal: OISignalType;
        if (priceChange > 0 && oiChange > 0) signal = 'strong_demand';
        else if (priceChange < 0 && oiChange < 0) signal = 'long_liquidation';
        else if (priceChange > 0 && oiChange < 0) signal = 'short_covering';
        else signal = 'new_supply';

        results.push({ date: weeks[i].date, signal, priceChange, oiChange });
    }
    return results;
}

// ─── 6.8  Sentiment Divergence ──────────────────────────────

export function calcSentimentDivergence(
    weeks: DashboardWeek[],
    specGroupKey: string,
    commGroupKey: string | null,
    lookbackWeeks: number,
): SentimentDivergencePoint[] {
    if (!commGroupKey) return [];

    const specNetKey = `${specGroupKey}_net`;
    const commNetKey = `${commGroupKey}_net`;
    const specSeries = extractSeries(weeks, specNetKey);
    const commSeries = extractSeries(weeks, commNetKey);
    const results: SentimentDivergencePoint[] = [];

    for (let i = 0; i < weeks.length; i++) {
        const specVal = specSeries[i];
        const commVal = commSeries[i];
        if (specVal == null || commVal == null) continue;

        const specWindow = valuesInWindow(specSeries, i, lookbackWeeks);
        const commWindow = valuesInWindow(commSeries, i, lookbackWeeks);
        if (specWindow.length < 2 || commWindow.length < 2) continue;

        const specPct = calcPercentile(specVal, specWindow);
        const commPct = calcPercentile(commVal, commWindow);
        const divergent = (specPct >= 90 && commPct <= 10) || (specPct <= 10 && commPct >= 90);

        results.push({
            date: weeks[i].date,
            specPercentile: specPct,
            commPercentile: commPct,
            divergent,
        });
    }
    return results;
}

// ─── 6.6  Market Power ──────────────────────────────────────

export function calcMarketPower(
    weeks: DashboardWeek[],
    specGroupKey: string,
): MarketPowerPoint[] {
    const longKey = `${specGroupKey}_long`;
    const shortKey = `${specGroupKey}_short`;

    return weeks.flatMap((w) => {
        const l = w[longKey];
        const s = w[shortKey];
        if (typeof l !== 'number' || typeof s !== 'number' || w.open_interest <= 0) return [];
        return [{
            date: w.date,
            longPower: Math.round((l / w.open_interest) * 1000) / 10,
            shortPower: Math.round((s / w.open_interest) * 1000) / 10,
        }];
    });
}

// ─── 4.12  Triple Lookback ──────────────────────────────────

export function calcTripleLookback(
    series: (number | null)[],
): TripleLookbackRow[] {
    const periods: [string, number][] = [
        ['1 Year', 52],
        ['3 Years', 156],
        ['5 Years', 260],
    ];

    return periods.map(([label, lookbackWeeks]) => {
        const val = series[0];
        if (val == null) {
            return { label, lookbackWeeks, netPosition: 0, percentile: 50, zScore: 0 };
        }
        const window = valuesInWindow(series, 0, lookbackWeeks);
        return {
            label,
            lookbackWeeks,
            netPosition: val,
            percentile: window.length >= 2 ? calcPercentile(val, window) : 50,
            zScore: window.length >= 2 ? calcZScore(val, window) : 0,
        };
    });
}

// ─── 6.11  Spread Percentile ─────────────────────────────────

export function calcSpreadPercentile(
    weeks: DashboardWeek[],
    specGroupKey: string,
    commGroupKey: string | null,
    lookbackWeeks: number,
): number | null {
    if (!commGroupKey) return null;

    const specNetKey = `${specGroupKey}_net`;
    const commNetKey = `${commGroupKey}_net`;

    const spreads: (number | null)[] = weeks.map((w) => {
        const s = w[specNetKey];
        const c = w[commNetKey];
        if (typeof s !== 'number' || typeof c !== 'number') return null;
        return Math.abs(s - c);
    });

    const current = spreads[0];
    if (current == null) return null;
    const window = valuesInWindow(spreads, 0, lookbackWeeks);
    if (window.length < 2) return null;
    return calcPercentile(current, window);
}

// ─── 6.2  Percentile threshold lines ─────────────────────────

/** Get the value at a given percentile threshold for a series window. */
export function getPercentileThreshold(
    series: (number | null)[],
    startIdx: number,
    lookbackWeeks: number,
    percentile: number,
): number | null {
    const window = valuesInWindow(series, startIdx, lookbackWeeks);
    if (window.length < 2) return null;
    window.sort((a, b) => a - b);
    const idx = Math.min(Math.floor((percentile / 100) * window.length), window.length - 1);
    return window[idx];
}

// ─── Distribution histogram bins ────────────────────────────

export interface HistogramBin {
    min: number;
    max: number;
    count: number;
    isCurrent: boolean;
}

export function buildHistogram(
    series: (number | null)[],
    lookbackWeeks: number,
    binCount = 25,
): HistogramBin[] {
    const values = valuesInWindow(series, 0, lookbackWeeks);
    if (values.length < 2) return [];

    const currentVal = series[0];
    const mn = Math.min(...values);
    const mx = Math.max(...values);
    if (mn === mx) return [{ min: mn, max: mx, count: values.length, isCurrent: true }];

    const step = (mx - mn) / binCount;
    const bins: HistogramBin[] = Array.from({ length: binCount }, (_, i) => ({
        min: mn + step * i,
        max: mn + step * (i + 1),
        count: 0,
        isCurrent: false,
    }));

    for (const v of values) {
        const idx = Math.min(Math.floor((v - mn) / step), binCount - 1);
        bins[idx].count++;
    }

    // Mark bin containing current value
    if (currentVal != null) {
        const idx = Math.min(Math.floor((currentVal - mn) / step), binCount - 1);
        bins[idx].isCurrent = true;
    }

    return bins;
}

// ─── 6.9  Long/Short Bias ───────────────────────────────────

export function calcLongShortBias(
    weeks: DashboardWeek[],
    specGroupKey: string,
): LongShortBiasPoint[] {
    const longKey = `${specGroupKey}_long`;
    const shortKey = `${specGroupKey}_short`;

    return weeks.flatMap((w) => {
        const l = w[longKey];
        const s = w[shortKey];
        if (typeof l !== 'number' || typeof s !== 'number') return [];
        const total = l + s;
        if (total <= 0) return [];
        const longPct = Math.round((l / total) * 1000) / 10;
        return [{
            date: w.date,
            longPct,
            shortPct: Math.round((100 - longPct) * 10) / 10,
        }];
    });
}
