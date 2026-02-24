/**
 * Shared chart theme, colors, and formatters for all dashboard blocks.
 * Single source of truth — matches COT_IMPLEMENTATION_PLAN.md Appendix B.
 */

import { formatCompact, formatDateTick } from '../../utils/formatters';

// ─── Dashboard color palette (Appendix B) ────────────────────

export const D = {
    // Percentile zones
    extremeLong: '#EF4444',
    extremeShort: '#22C55E',
    aboveAvg: '#F59E0B',
    belowAvg: '#3B82F6',
    neutral: '#6B7280',

    // Lines
    specLine: '#3B82F6',
    commLine: '#F97316',
    priceLine: '#a1a1aa',

    // OI Signal matrix
    strongDemand: '#22C55E',
    longLiquidation: '#EAB308',
    shortCovering: '#3B82F6',
    newSupply: '#EF4444',

    // FLIP bubbles
    flipToLong: '#22C55E',
    flipToShort: '#EF4444',

    // Velocity
    velocityPos: '#22C55E',
    velocityNeg: '#EF4444',

    // Market Power
    lPower: 'rgba(34,197,94,0.35)',
    sPower: 'rgba(239,68,68,0.35)',

    // Misc
    warningDiamond: '#EAB308',
    divergenceFill: 'rgba(124,58,237,0.25)',
    grid: '#1a1a1a',
    axis: '#525252',
    zone5: 'rgba(34,197,94,0.08)',
    zone95: 'rgba(239,68,68,0.08)',
} as const;

// ─── Chart margin defaults ───────────────────────────────────

export const MARGIN = { top: 6, right: 50, bottom: 0, left: 4 } as const;
export const MARGIN_NARROW = { top: 4, right: 44, bottom: 0, left: 4 } as const;

// ─── Formatter aliases ───────────────────────────────────────

export const fmtK = formatCompact;
export const fmtTick = formatDateTick;

/** Short date for tooltips: "Feb 10 '26" */
export function fmtDateShort(d: string | undefined): string {
    if (!d) return '';
    const dt = new Date(d + 'T00:00:00');
    const m = dt.toLocaleString('en', { month: 'short' });
    const day = dt.getDate();
    const y = String(dt.getFullYear()).slice(2);
    return `${m} ${day} '${y}`;
}

// ─── Shared Tooltip style ────────────────────────────────────

export const TOOLTIP_STYLE = {
    contentStyle: {
        background: '#141414',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 6,
        fontSize: 11,
        padding: '8px 12px',
    },
    labelStyle: { color: '#888', fontSize: 10, marginBottom: 4 },
    itemStyle: { padding: 0, fontSize: 11 },
} as const;
