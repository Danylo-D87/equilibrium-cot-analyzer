/**
 * Display value formatters for journal metrics.
 * Ported from Fundamental to TypeScript.
 */

import type { DisplayMode } from '../types';

/** Convert dollar value to percentage of initial balance */
export function dollarToPercentage(value: number, initialBalance: number): number {
    if (!initialBalance || initialBalance === 0) return 0;
    return (value / initialBalance) * 100;
}

/** Format value for display based on display mode */
export function formatDisplayValue(
    value: number,
    displayMode: DisplayMode,
    initialBalance: number,
    opts: { maxFrac?: number; includeSymbol?: boolean } = {},
): string {
    const { maxFrac = 2, includeSymbol = true } = opts;

    if (displayMode === 'percentage') {
        const pct = dollarToPercentage(value, initialBalance);
        return `${pct.toFixed(maxFrac)}${includeSymbol ? '%' : ''}`;
    }

    const formatted = value.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
    return includeSymbol ? `$${formatted}` : formatted;
}

/** Format NAV for display */
export function formatNAV(
    navValue: number,
    displayMode: DisplayMode,
    initialBalance: number,
): string {
    if (displayMode === 'percentage') {
        const pct = ((navValue - initialBalance) / initialBalance) * 100;
        return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
    }
    return `$${navValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
