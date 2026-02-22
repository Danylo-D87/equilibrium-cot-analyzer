/** Journal module constants */

export const TRADE_TYPES = ['Option', 'Futures', 'Crypto'] as const;
export const TRADE_STYLES = ['Swing', 'Intraday', 'Smart Idea'] as const;
export const TRADE_DIRECTIONS = ['Long', 'Short'] as const;
export const TRADE_STATUSES = ['TP', 'SL', 'BE', 'Active'] as const;

/** Calculate profit from risk, RR ratio and status */
export function calculateProfit(
    riskAmount: number,
    rrRatio: number,
    status: string,
): number {
    switch (status) {
        case 'TP':
            return riskAmount * rrRatio;
        case 'SL':
            return -riskAmount;
        case 'BE':
        case 'Active':
        default:
            return 0;
    }
}

/** Kyiv timezone helpers */
const KYIV_TZ = 'Europe/Kiev';

export function getTodayKyiv(): string {
    const now = new Date();
    const kyiv = new Date(now.toLocaleString('en-US', { timeZone: KYIV_TZ }));
    const y = kyiv.getFullYear();
    const m = String(kyiv.getMonth() + 1).padStart(2, '0');
    const d = String(kyiv.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export function getNowKyiv(): Date {
    return new Date(new Date().toLocaleString('en-US', { timeZone: KYIV_TZ }));
}

export function formatDateLocal(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}
