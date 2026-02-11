"""
COT Multi-Report Pipeline — Calculator
=======================================
Computes derived analytics on generic g1–g5 group columns:
  - Net positions per group
  - Net changes per group  
  - % net / OI per group
  - COT Index (3m, 1y, 3y) per group
  - WCI (26w) per group
  - Crowded Level per group (with BUY/SELL signals)
  - Aggregate net positions
  - Stats (max, min, max_5y, min_5y, avg_13w)
"""

import logging

from config import (
    REPORT_GROUPS,
    COT_INDEX_3M, COT_INDEX_1Y, COT_INDEX_3Y,
    WCI_LOOKBACK,
    MAX_MIN_5Y_WEEKS, AVG_13W_WEEKS,
    CROWDED_BUY_THRESHOLD, CROWDED_SELL_THRESHOLD,
)

logger = logging.getLogger('cot_pipeline.calculator')


class Calculator:
    """Computes all derived COT analytics for any report type."""

    def compute(self, rows: list[dict], report_type: str) -> dict:
        """
        Takes sorted rows (newest first) and computes everything.
        Returns { weeks: [...], stats: {...} }.
        """
        groups = REPORT_GROUPS[report_type]

        # Compute per-row derived fields
        weeks = []
        for row in rows:
            w = self._build_week(row, groups)
            weeks.append(w)

        # Compute COT Index, WCI, Crowded Level (need full series)
        self._compute_indices(weeks, groups)

        # Compute stats
        stats = self._compute_stats(weeks, groups)

        return {'weeks': weeks, 'stats': stats}

    # ------------------------------------------------------------------
    # Per-row: net, change, % net/OI
    # ------------------------------------------------------------------

    def _build_week(self, row: dict, groups: list[dict]) -> dict:
        w = {
            'date': row.get('report_date'),
            'open_interest': row.get('open_interest'),
            'oi_change': row.get('oi_change'),
        }

        oi = row.get('open_interest') or 0

        # OI % change (week-over-week is handled via oi_change / OI)
        if oi and row.get('oi_change') is not None:
            w['oi_pct'] = round((row['oi_change'] / oi) * 100, 1) if oi != 0 else None
        else:
            w['oi_pct'] = None

        # Per-group: net, change, pct, change_long, change_short
        total_net = 0
        for g in groups:
            gk = g['key']  # g1, g2, etc.

            g_long = row.get(f'{gk}_long')
            g_short = row.get(f'{gk}_short')
            g_long_change = row.get(f'{gk}_long_change')
            g_short_change = row.get(f'{gk}_short_change')

            net = None
            if g_long is not None and g_short is not None:
                net = g_long - g_short
                total_net += net

            net_change = None
            if g_long_change is not None and g_short_change is not None:
                net_change = g_long_change - g_short_change

            pct_net_oi = None
            if net is not None and oi and oi != 0:
                pct_net_oi = round((net / oi) * 100, 1)

            w[f'{gk}_net'] = round(net) if net is not None else None
            w[f'{gk}_change'] = round(net_change) if net_change is not None else None
            w[f'{gk}_change_long'] = round(g_long_change) if g_long_change is not None else None
            w[f'{gk}_change_short'] = round(g_short_change) if g_short_change is not None else None
            w[f'{gk}_pct_net_oi'] = pct_net_oi

        return w

    # ------------------------------------------------------------------
    # Series-based: COT Index, WCI, Crowded Level
    # ------------------------------------------------------------------

    def _compute_indices(self, weeks: list[dict], groups: list[dict]):
        """Compute COT Index, WCI, and Crowded Level for each group in-place."""
        n = len(weeks)

        for g in groups:
            gk = g['key']
            net_key = f'{gk}_net'

            # Build net series (newest-first order)
            nets = [w.get(net_key) for w in weeks]

            for i in range(n):
                if nets[i] is None:
                    # COT indices
                    weeks[i][f'cot_index_{gk}_3m'] = None
                    weeks[i][f'cot_index_{gk}_1y'] = None
                    weeks[i][f'cot_index_{gk}_3y'] = None
                    weeks[i][f'wci_{gk}'] = None
                    weeks[i][f'crowded_{gk}'] = {'value': None, 'signal': None}
                    continue

                # COT Index = (Current - Min) / (Max - Min) × 100
                for suffix, lookback in [('3m', COT_INDEX_3M), ('1y', COT_INDEX_1Y), ('3y', COT_INDEX_3Y)]:
                    window = nets[i:i + lookback]
                    valid = [v for v in window if v is not None]
                    if len(valid) >= 2:
                        mn, mx = min(valid), max(valid)
                        if mx != mn:
                            idx = ((nets[i] - mn) / (mx - mn)) * 100
                            weeks[i][f'cot_index_{gk}_{suffix}'] = round(idx, 1)
                        else:
                            weeks[i][f'cot_index_{gk}_{suffix}'] = 50.0
                    else:
                        weeks[i][f'cot_index_{gk}_{suffix}'] = None

                # WCI (Willco Commercial Index) — same formula, 26w lookback
                wci_window = nets[i:i + WCI_LOOKBACK]
                valid_wci = [v for v in wci_window if v is not None]
                if len(valid_wci) >= 2:
                    mn, mx = min(valid_wci), max(valid_wci)
                    if mx != mn:
                        wci = ((nets[i] - mn) / (mx - mn)) * 100
                        weeks[i][f'wci_{gk}'] = round(wci, 1)
                    else:
                        weeks[i][f'wci_{gk}'] = 50.0
                else:
                    weeks[i][f'wci_{gk}'] = None

                # Crowded Level — based on 1Y COT Index
                cot_1y = weeks[i].get(f'cot_index_{gk}_1y')
                role = g['role']

                if cot_1y is not None:
                    signal = None
                    if role == 'commercial':
                        # Commercials: high = BUY, low = SELL
                        if cot_1y >= CROWDED_BUY_THRESHOLD:
                            signal = 'BUY'
                        elif cot_1y <= CROWDED_SELL_THRESHOLD:
                            signal = 'SELL'
                    elif role in ('speculative', 'small'):
                        # Speculators/Small: high = SELL, low = BUY (inverted)
                        if cot_1y >= CROWDED_BUY_THRESHOLD:
                            signal = 'SELL'
                        elif cot_1y <= CROWDED_SELL_THRESHOLD:
                            signal = 'BUY'

                    weeks[i][f'crowded_{gk}'] = {
                        'value': round(cot_1y, 1),
                        'signal': signal,
                    }
                else:
                    weeks[i][f'crowded_{gk}'] = {'value': None, 'signal': None}

    # ------------------------------------------------------------------
    # Stats: max, min, max_5y, min_5y, avg_13w
    # ------------------------------------------------------------------

    def _compute_stats(self, weeks: list[dict], groups: list[dict]) -> dict:
        """Compute summary stats for stat rows above the table."""
        if not weeks:
            return {}

        # Keys we want stats for
        stat_keys = ['open_interest', 'oi_change', 'oi_pct']
        pct_keys = {'oi_pct'}
        for g in groups:
            gk = g['key']
            stat_keys.extend([
                f'{gk}_net', f'{gk}_change',
                f'{gk}_change_long', f'{gk}_change_short',
                f'{gk}_pct_net_oi',
            ])
            pct_keys.add(f'{gk}_pct_net_oi')

        stats = {}

        # Max/Min over all data
        stats['max'] = self._extreme(weeks, stat_keys, max, pct_keys)
        stats['min'] = self._extreme(weeks, stat_keys, min, pct_keys)

        # Max/Min 5-year
        w5y = weeks[:MAX_MIN_5Y_WEEKS]
        stats['max_5y'] = self._extreme(w5y, stat_keys, max, pct_keys)
        stats['min_5y'] = self._extreme(w5y, stat_keys, min, pct_keys)

        # Avg 13 weeks
        w13 = weeks[:AVG_13W_WEEKS]
        stats['avg_13w'] = self._avg(w13, stat_keys, pct_keys)

        return stats

    @staticmethod
    def _extreme(weeks, keys, fn, pct_keys=None):
        result = {}
        for k in keys:
            vals = [w.get(k) for w in weeks if w.get(k) is not None]
            if vals:
                v = fn(vals)
                result[k] = round(v, 1) if (pct_keys and k in pct_keys) else round(v)
            else:
                result[k] = None
        return result

    @staticmethod
    def _avg(weeks, keys, pct_keys=None):
        result = {}
        for k in keys:
            vals = [w.get(k) for w in weeks if w.get(k) is not None]
            if vals:
                v = sum(vals) / len(vals)
                result[k] = round(v, 1) if (pct_keys and k in pct_keys) else round(v)
            else:
                result[k] = None
        return result
