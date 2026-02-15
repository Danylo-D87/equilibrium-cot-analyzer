/**
 * 8-signal COT matrix: Price × Longs × Shorts.
 *
 * Each signal represents a unique combination of directional changes in price,
 * commercial longs, and commercial shorts during a reporting period.
 */

export const COT_SIGNALS = [
    // Bullish
    { key: 'strongBullish',  num: 1, label: 'Strong Bullish',  desc: 'Price↑ Long↑ Short↓', color: '#22c55e', group: 'bullish' },
    { key: 'accumulation',   num: 2, label: 'Accumulation',    desc: 'Price↓ Long↑ Short↓', color: '#10b981', group: 'bullish' },
    { key: 'floorBuilding',  num: 3, label: 'Floor Building',  desc: 'Price↓ Long↑ Short↑', color: '#84cc16', group: 'bullish' },
    // Bearish
    { key: 'strongBearish',  num: 4, label: 'Strong Bearish',  desc: 'Price↓ Long↓ Short↑', color: '#ef4444', group: 'bearish' },
    { key: 'distribution',   num: 5, label: 'Distribution',    desc: 'Price↑ Long↓ Short↑', color: '#dc2626', group: 'bearish' },
    { key: 'toppingOut',     num: 6, label: 'Topping Out',     desc: 'Price↑ Long↑ Short↑', color: '#f97316', group: 'bearish' },
    // Exhaustion
    { key: 'profitTaking',   num: 7, label: 'Profit Taking',   desc: 'Price↑ Long↓ Short↓', color: '#38bdf8', group: 'exhaustion' },
    { key: 'liquidation',    num: 8, label: 'Liquidation',     desc: 'Price↓ Long↓ Short↓', color: '#a855f7', group: 'exhaustion' },
];

/**
 * Detect COT signal from directional booleans.
 *
 * @param {boolean} priceUp  - True if price increased this period
 * @param {boolean} longsUp  - True if net longs increased (change_long >= 0)
 * @param {boolean} shortsUp - True if net shorts increased (change_short >= 0)
 * @returns {string} Signal key matching one of COT_SIGNALS[].key
 */
export function detectCotSignal(priceUp, longsUp, shortsUp) {
    if (priceUp && longsUp && !shortsUp)   return 'strongBullish';
    if (!priceUp && longsUp && !shortsUp)  return 'accumulation';
    if (!priceUp && longsUp && shortsUp)   return 'floorBuilding';
    if (!priceUp && !longsUp && shortsUp)  return 'strongBearish';
    if (priceUp && !longsUp && shortsUp)   return 'distribution';
    if (priceUp && longsUp && shortsUp)    return 'toppingOut';
    if (priceUp && !longsUp && !shortsUp)  return 'profitTaking';
    return 'liquidation';
}
