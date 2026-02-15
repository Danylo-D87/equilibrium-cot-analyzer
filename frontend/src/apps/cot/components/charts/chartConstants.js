/**
 * Shared constants, helpers, and formatter aliases for all COT chart components.
 */
import { formatNumber, formatCompact, formatSigned, formatDateShort, formatDateTick } from '../../utils/formatters';
import { CHART_COLORS, GROUP_COLOR_PALETTE } from '../../utils/constants';

// ---------------------------------------------------------------------------
// Formatter aliases (brevity inside chart files)
// ---------------------------------------------------------------------------

export const fmtCompact = formatCompact;
export const fmtNum = formatNumber;
export const fmtSigned = formatSigned;
export const fmtDate = formatDateShort;
export const fmtTick = formatDateTick;

// ---------------------------------------------------------------------------
// Chart color tokens (passed to Recharts stroke / fill — must be plain hex)
// ---------------------------------------------------------------------------

export const COLORS = CHART_COLORS;

// ---------------------------------------------------------------------------
// Group helpers
// ---------------------------------------------------------------------------

const GROUPS_FALLBACK = [
    { key: 'g1', label: 'G1', full: 'Group 1', color: '#10b981' },
    { key: 'g2', label: 'G2', full: 'Group 2', color: '#f59e0b' },
    { key: 'g3', label: 'G3', full: 'Group 3', color: '#ef4444' },
];

export function buildGroupsMeta(dataGroups) {
    if (!dataGroups || !dataGroups.length) return GROUPS_FALLBACK;
    return dataGroups.map((g, i) => ({
        key: g.key,
        label: g.short,
        full: g.name,
        color: GROUP_COLOR_PALETTE[i] || GROUP_COLOR_PALETTE[i % GROUP_COLOR_PALETTE.length],
    }));
}

export function buildGroupColors(groupsMeta) {
    const colors = {};
    for (const g of groupsMeta) colors[g.key] = g.color;
    return colors;
}

// ---------------------------------------------------------------------------
// 8-signal COT matrix: Price × Longs × Shorts (canonical source: utils/cotSignals.js)
// ---------------------------------------------------------------------------

export { COT_SIGNALS, detectCotSignal } from '../../utils/cotSignals';

// ---------------------------------------------------------------------------
// Indicator sub-tab options
// ---------------------------------------------------------------------------

export const COT_INDEX_PERIODS = [
    { key: '3m', label: '3M' },
    { key: '1y', label: '1Y' },
    { key: '3y', label: '3Y' },
];

export const INDICATOR_TYPES = [
    { key: 'cot_index', label: 'COT Index' },
    { key: 'wci', label: 'WCI' },
];
