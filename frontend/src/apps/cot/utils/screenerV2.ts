/**
 * Screener v2 enrichment: computes per‑row analytics columns
 * (Net Position, Percentile, Z‑Score, WoW Δ, FLIP tag) using
 * the speculative group for the active report type.
 */

import type { ScreenerRow } from '../types';
import { ASSET_CONFIG, backendCategoryToSector, type Sector } from './assetConfig';

// ─── Public types ────────────────────────────────────────────

export interface V2EnrichedRow extends ScreenerRow {
    /** Sector derived from ASSET_CONFIG or backend category. */
    sector: Sector;
    /** Net position of the speculative group (long − short). */
    spec_net: number | null;
    /** 52‑week COT Index (0–100) for the spec group. */
    spec_percentile: number | null;
    /** Approximate Z‑Score derived from the COT Index. */
    spec_zscore: number | null;
    /** Week‑over‑week net change for the spec group. */
    spec_wow: number | null;
    /** OI change as percentage of open interest — OI Trend indicator. */
    oi_trend_pct: number | null;
    /** Human‑readable signal tag. */
    flip_tag: string;
    /** Numeric severity for sorting (5 = FLIP … 0 = Neutral). */
    flip_severity: number;
}

// ─── Internals ───────────────────────────────────────────────

/**
 * Abramowitz & Stegun rational approximation (formula 26.2.23)
 * for the inverse‑normal CDF.  Treats the COT Index (0–100) as a
 * percentile and returns the corresponding z‑value.
 */
function cotIndexToZScore(cotIndex: number | null | undefined): number | null {
    if (cotIndex == null) return null;
    const p = Math.max(0.001, Math.min(0.999, cotIndex / 100));
    if (Math.abs(p - 0.5) < 0.002) return 0;

    const t = p < 0.5
        ? Math.sqrt(-2 * Math.log(p))
        : Math.sqrt(-2 * Math.log(1 - p));

    const c0 = 2.515517, c1 = 0.802853, c2 = 0.010328;
    const d1 = 1.432788, d2 = 0.189269, d3 = 0.001308;
    const z = t - (c0 + c1 * t + c2 * t * t) / (1 + d1 * t + d2 * t * t + d3 * t * t * t);

    return Math.round((p < 0.5 ? -z : z) * 100) / 100;
}

/**
 * Compute the FLIP tag following the plan's algorithm:
 *
 *  1. FLIP 🔄       — net position crossed zero this week
 *  2. Overcrowded ⚠️ — extreme percentile AND |Z| ≥ 2
 *  3. Reversal Watch 👁️ — extreme zone + change against position
 *  4. Extreme        — in the 90/10 zone
 *  5. Pre-Flip       — net shrinking toward zero
 *  6. Neutral        — nothing noteworthy
 */
function computeFlipTag(
    percentile: number | null,
    zScore: number | null,
    wowChange: number | null,
    currNet: number | null,
): { tag: string; severity: number } {
    if (percentile == null || currNet == null) return { tag: 'Neutral', severity: 0 };

    const wow = wowChange ?? 0;
    const z = zScore ?? 0;
    const prevNet = currNet - wow;

    // 1. FLIP: zero crossing
    if (prevNet !== 0 && Math.sign(prevNet) !== Math.sign(currNet)) {
        return { tag: 'FLIP 🔄', severity: 5 };
    }

    // 2. Overcrowded
    if ((percentile >= 95 && z >= 2.0) || (percentile <= 5 && z <= -2.0)) {
        return { tag: 'Overcrowded ⚠️', severity: 4 };
    }

    // 3. Reversal Watch
    if (percentile >= 90 && wow < 0 && currNet > 0) {
        return { tag: 'Reversal Watch 👁️', severity: 3 };
    }
    if (percentile <= 10 && wow > 0 && currNet < 0) {
        return { tag: 'Reversal Watch 👁️', severity: 3 };
    }

    // 4. Extreme
    if (percentile >= 90 || percentile <= 10) {
        return { tag: 'Extreme', severity: 2 };
    }

    // 5. Pre-Flip
    if (prevNet !== 0 && Math.abs(currNet) < Math.abs(prevNet) * 0.3 && Math.abs(wow) > 0) {
        return { tag: 'Pre-Flip', severity: 1 };
    }

    return { tag: 'Neutral', severity: 0 };
}

/** Spec‑group key for a given report type (g1 for legacy, g3 for disagg/tff). */
function getSpecGroup(reportType: string): string {
    return reportType === 'legacy' ? 'g1' : 'g3';
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Enrich raw screener rows with v2 analytics columns.
 *
 * Each row's spec group is resolved from `row.primary_report` when available
 * (screener-v2 path) so that metrics are always computed against the correct
 * report type for that market. Falls back to `fallbackReportType` for legacy
 * single-report-type requests.
 */
export function enrichV2Rows(rows: ScreenerRow[], fallbackReportType = 'legacy'): V2EnrichedRow[] {
    return rows.map(row => {
        // Per-row report type: use primary_report if provided by screener-v2
        const rt = (row.primary_report as string | undefined) || fallbackReportType;
        const specGroup = getSpecGroup(rt);

        // Sector: prefer ASSET_CONFIG, fall back to backend category mapping
        const cfg = ASSET_CONFIG[row.code];
        const sector: Sector = cfg ? cfg.sector : backendCategoryToSector(row.category);

        const specNet = (row[`${specGroup}_net`] as number) ?? null;
        const specPercentile = (row[`cot_${specGroup}_1y`] as number) ?? null;
        const specZScore = cotIndexToZScore(specPercentile);
        const specWow = (row[`${specGroup}_change`] as number) ?? null;

        // OI Trend: oi_change as % of open_interest
        const oiTrendPct = row.open_interest > 0 && row.oi_change != null
            ? Math.round((row.oi_change / row.open_interest) * 10000) / 100
            : null;

        const { tag, severity } = computeFlipTag(specPercentile, specZScore, specWow, specNet);

        return {
            ...row,
            sector,
            spec_net: specNet,
            spec_percentile: specPercentile,
            spec_zscore: specZScore,
            spec_wow: specWow,
            oi_trend_pct: oiTrendPct,
            flip_tag: tag,
            flip_severity: severity,
        };
    });
}
