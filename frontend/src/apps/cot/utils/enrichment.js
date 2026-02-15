/**
 * Pure function: enrich screener rows with computed columns.
 *
 * Adds per-group totals, short ratios, OI percentages, and
 * all-groups aggregate columns for each row in place.
 *
 * @param {Array<Object>} rows   - Raw screener rows (mutated in place)
 * @param {Array<Object>} groups - Group metadata array (key, name, ...)
 * @returns {Array<Object>} The enriched rows array
 */
export function enrichRows(rows, groups) {
    const gs = groups || [];
    for (const row of rows) {
        const oi = row.open_interest || 0;
        let allLong = 0, allShort = 0, allValid = false;
        let allCL = 0, allCS = 0, allChangeValid = false;

        for (const g of gs) {
            const gk = g.key;
            const l = row[`${gk}_long`];
            const s = row[`${gk}_short`];
            const cl = row[`${gk}_change_long`];
            const cs = row[`${gk}_change_short`];

            row[`${gk}_total`] = (l != null && s != null) ? l + s : null;
            const tot = (l != null && s != null) ? l + s : 0;
            row[`${gk}_short_ratio`] = tot > 0 ? s / tot : null;
            row[`${gk}_change_total`] = (cl != null && cs != null) ? cl + cs : null;

            const total = row[`${gk}_total`];
            row[`${gk}_pct_oi_total`] = (total != null && oi) ? Math.round((total / oi) * 1000) / 10 : null;

            const ct = row[`${gk}_change_total`];
            row[`${gk}_pct_oi_total_change`] = (ct != null && oi) ? Math.round((ct / oi) * 1000) / 10 : null;

            if (l != null && s != null) { allLong += l; allShort += s; allValid = true; }
            if (cl != null && cs != null) { allCL += cl; allCS += cs; allChangeValid = true; }
        }

        row.all_long = allValid ? allLong : null;
        row.all_short = allValid ? allShort : null;
        row.all_change_long = allChangeValid ? allCL : null;
        row.all_change_short = allChangeValid ? allCS : null;

        const allTotal = allValid ? allLong + allShort : 0;
        row.all_short_ratio = allTotal > 0 ? allShort / allTotal : null;
    }
    return rows;
}
