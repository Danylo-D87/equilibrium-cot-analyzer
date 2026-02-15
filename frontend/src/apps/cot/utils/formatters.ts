// =====================================================
// Shared number & date formatters
// =====================================================

/**
 * Format a large number with thin-space thousands separator.
 * Negative values use a proper minus sign (−).
 * @param {number|null} val
 * @returns {string}
 */
export function formatNumber(val: number | null | undefined): string {
    if (val == null) return '—';
    const num = Math.round(val);
    const sign = num < 0 ? '−' : '';
    const abs = Math.abs(num).toLocaleString('en-US').replace(/,/g, '\u2009');
    return sign + abs;
}

/**
 * Compact number (e.g. 1.2M, 45K).
 * @param {number|null} val
 * @returns {string}
 */
export function formatCompact(val: number | null | undefined): string {
    if (val == null) return '';
    const abs = Math.abs(val);
    if (abs >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
    if (abs >= 1e3) return `${(val / 1e3).toFixed(0)}K`;
    return val.toString();
}

/**
 * Signed number with explicit +/− prefix.
 * @param {number|null} val
 * @returns {string}
 */
export function formatSigned(val: number | null | undefined): string {
    if (val == null) return '—';
    const n = Math.round(val);
    const sign = n > 0 ? '+' : n < 0 ? '−' : '';
    return sign + Math.abs(n).toLocaleString('en-US').replace(/,/g, '\u2009');
}

/**
 * Format percentage (integer).
 * @param {number|null} val
 * @returns {string}
 */
export function formatPct(val: number | null | undefined): string {
    if (val == null) return '—';
    return `${Math.round(val)}%`;
}

/**
 * Format percentage with sign (e.g. +3.2%).
 * @param {number|null} val
 * @returns {string}
 */
export function formatPctSigned(val: number | null | undefined): string {
    if (val == null) return '—';
    const s = val > 0 ? '+' : '';
    return s + val.toFixed(1) + '%';
}

/**
 * Format date YYYY-MM-DD → DD.MM.YYYY
 * @param {string} dateStr
 * @returns {string}
 */
export function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    return `${d}.${m}.${y}`;
}

/**
 * Short date for chart tooltips: DD.MM.YY
 * @param {string} dateStr
 * @returns {string}
 */
export function formatDateShort(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}.${m}.${y.slice(2)}`;
}

/**
 * Tick label for chart X-axis: "Jan 24"
 * @param {string} dateStr
 * @returns {string}
 */
export function formatDateTick(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    const [y, m] = dateStr.split('-');
    const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(m)]} ${y.slice(2)}`;
}
