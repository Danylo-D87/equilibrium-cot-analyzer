import type { ScreenerRow, EnrichedScreenerRow, Group } from '../types';

/**
 * Pure function: enrich screener rows with computed columns.
 *
 * Adds per-group totals, short ratios, OI percentages, and
 * all-groups aggregate columns for each row in place.
 */
export function enrichRows(rows: ScreenerRow[], groups: Group[] | null | undefined): EnrichedScreenerRow[] {
    const gs = groups || [];
    for (const row of rows) {
        const oi = row.open_interest || 0;
        let allLong = 0, allShort = 0, allValid = false;
        let allCL = 0, allCS = 0, allChangeValid = false;

        for (const g of gs) {
            const gk = g.key;
            const l = row[`${gk}_long`] as number | null | undefined;
            const s = row[`${gk}_short`] as number | null | undefined;
            const cl = row[`${gk}_change_long`] as number | null | undefined;
            const cs = row[`${gk}_change_short`] as number | null | undefined;

            row[`${gk}_total`] = (l != null && s != null) ? l + s : null;
            const tot = (l != null && s != null) ? l + s : 0;
            row[`${gk}_short_ratio`] = (tot > 0 && s != null) ? s / tot : null;
            row[`${gk}_change_total`] = (cl != null && cs != null) ? cl + cs : null;

            const total = row[`${gk}_total`] as number | null;
            row[`${gk}_pct_oi_total`] = (total != null && oi) ? Math.round((total / oi) * 1000) / 10 : null;

            const ct = row[`${gk}_change_total`] as number | null;
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
    return rows as EnrichedScreenerRow[];
}
