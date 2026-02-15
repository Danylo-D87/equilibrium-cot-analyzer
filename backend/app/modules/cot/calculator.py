"""
COT module — Analytics calculator.
=====================================
Computes derived analytics on the generic g1–g5 group columns:
  - Net positions, changes, % net/OI
  - COT Index (3m, 1y, 3y)
  - WCI (26w)
  - Crowded Level with BUY/SELL signals
  - Summary statistics
"""

import logging

from app.modules.cot.config import cot_settings

logger = logging.getLogger(__name__)


class CotCalculator:
    """Computes all derived COT analytics for any report type."""

    INDEX_MIDPOINT_DEFAULT = 50.0  # Default COT Index / WCI when min == max

    def compute(self, rows: list[dict], report_type: str) -> dict:
        """
        Takes sorted rows (newest first) and computes everything.

        Returns:
            {"weeks": [...], "stats": {...}}
        """
        groups = cot_settings.report_groups[report_type]

        weeks = [self._build_week(row, groups) for row in rows]
        self._compute_indices(weeks, groups)
        stats = self._compute_stats(weeks, groups)

        return {"weeks": weeks, "stats": stats}

    # ------------------------------------------------------------------
    # Per-row: net, change, % net/OI
    # ------------------------------------------------------------------

    def _build_week(self, row: dict, groups: list[dict]) -> dict:
        oi = row.get("open_interest") or 0

        w: dict = {
            "date": row.get("report_date"),
            "open_interest": row.get("open_interest"),
            "oi_change": row.get("oi_change"),
            "oi_pct": (
                round((row["oi_change"] / oi) * 100, 1)
                if oi and row.get("oi_change") is not None and oi != 0
                else None
            ),
        }

        for g in groups:
            gk = g["key"]
            g_long = row.get(f"{gk}_long")
            g_short = row.get(f"{gk}_short")
            g_long_change = row.get(f"{gk}_long_change")
            g_short_change = row.get(f"{gk}_short_change")

            net = (g_long - g_short) if (g_long is not None and g_short is not None) else None
            net_change = (
                (g_long_change - g_short_change)
                if (g_long_change is not None and g_short_change is not None)
                else None
            )
            pct_net_oi = round((net / oi) * 100, 1) if (net is not None and oi and oi != 0) else None

            w[f"{gk}_long"] = round(g_long) if g_long is not None else None
            w[f"{gk}_short"] = round(g_short) if g_short is not None else None
            w[f"{gk}_net"] = round(net) if net is not None else None
            w[f"{gk}_change"] = round(net_change) if net_change is not None else None
            w[f"{gk}_change_long"] = round(g_long_change) if g_long_change is not None else None
            w[f"{gk}_change_short"] = round(g_short_change) if g_short_change is not None else None
            w[f"{gk}_pct_net_oi"] = pct_net_oi

        return w

    # ------------------------------------------------------------------
    # Series-based: COT Index, WCI, Crowded Level
    # ------------------------------------------------------------------

    def _compute_indices(self, weeks: list[dict], groups: list[dict]) -> None:
        """Compute COT Index, WCI, and Crowded Level for each group in-place."""
        n = len(weeks)
        cfg = cot_settings

        lookbacks = [
            ("3m", cfg.cot_index_3m),
            ("1y", cfg.cot_index_1y),
            ("3y", cfg.cot_index_3y),
        ]

        for g in groups:
            gk = g["key"]
            nets = [w.get(f"{gk}_net") for w in weeks]

            for i in range(n):
                if nets[i] is None:
                    for suffix, _ in lookbacks:
                        weeks[i][f"cot_index_{gk}_{suffix}"] = None
                    weeks[i][f"wci_{gk}"] = None
                    weeks[i][f"crowded_{gk}"] = {"value": None, "signal": None}
                    continue

                # COT Index for each lookback
                for suffix, lookback in lookbacks:
                    window = [v for v in nets[i : i + lookback] if v is not None]
                    if len(window) >= 2:
                        mn, mx = min(window), max(window)
                        idx = ((nets[i] - mn) / (mx - mn)) * 100 if mx != mn else self.INDEX_MIDPOINT_DEFAULT
                        weeks[i][f"cot_index_{gk}_{suffix}"] = round(idx, 1)
                    else:
                        weeks[i][f"cot_index_{gk}_{suffix}"] = None

                # WCI
                wci_window = [v for v in nets[i : i + cfg.wci_lookback] if v is not None]
                if len(wci_window) >= 2:
                    mn, mx = min(wci_window), max(wci_window)
                    wci = ((nets[i] - mn) / (mx - mn)) * 100 if mx != mn else self.INDEX_MIDPOINT_DEFAULT
                    weeks[i][f"wci_{gk}"] = round(wci, 1)
                else:
                    weeks[i][f"wci_{gk}"] = None

                # Crowded Level — based on 1Y COT Index
                cot_1y = weeks[i].get(f"cot_index_{gk}_1y")
                if cot_1y is not None:
                    signal = self._determine_signal(cot_1y, g["role"])
                    weeks[i][f"crowded_{gk}"] = {"value": round(cot_1y, 1), "signal": signal}
                else:
                    weeks[i][f"crowded_{gk}"] = {"value": None, "signal": None}

    @staticmethod
    def _determine_signal(cot_index: float, role: str) -> str | None:
        """Determine BUY/SELL signal based on COT index and trader role."""
        buy = cot_settings.crowded_buy_threshold
        sell = cot_settings.crowded_sell_threshold

        if role == "commercial":
            if cot_index >= buy:
                return "BUY"
            if cot_index <= sell:
                return "SELL"
        elif role in ("speculative", "small"):
            if cot_index >= buy:
                return "SELL"
            if cot_index <= sell:
                return "BUY"
        return None

    # ------------------------------------------------------------------
    # Stats: max, min, max_5y, min_5y, avg_13w
    # ------------------------------------------------------------------

    def _compute_stats(self, weeks: list[dict], groups: list[dict]) -> dict:
        if not weeks:
            return {}

        stat_keys = ["open_interest", "oi_change", "oi_pct"]
        pct_keys = {"oi_pct"}

        for g in groups:
            gk = g["key"]
            stat_keys.extend([
                f"{gk}_net", f"{gk}_change",
                f"{gk}_change_long", f"{gk}_change_short",
                f"{gk}_pct_net_oi",
            ])
            pct_keys.add(f"{gk}_pct_net_oi")

        cfg = cot_settings
        return {
            "max": self._extreme(weeks, stat_keys, max, pct_keys),
            "min": self._extreme(weeks, stat_keys, min, pct_keys),
            "max_5y": self._extreme(weeks[: cfg.max_min_5y_weeks], stat_keys, max, pct_keys),
            "min_5y": self._extreme(weeks[: cfg.max_min_5y_weeks], stat_keys, min, pct_keys),
            "avg_13w": self._avg(weeks[: cfg.avg_13w_weeks], stat_keys, pct_keys),
        }

    @staticmethod
    def _extreme(weeks: list, keys: list, fn, pct_keys: set | None = None) -> dict:
        result: dict = {}
        for k in keys:
            vals = [w.get(k) for w in weeks if w.get(k) is not None]
            if vals:
                v = fn(vals)
                result[k] = round(v, 1) if (pct_keys and k in pct_keys) else round(v)
            else:
                result[k] = None
        return result

    @staticmethod
    def _avg(weeks: list, keys: list, pct_keys: set | None = None) -> dict:
        result: dict = {}
        for k in keys:
            vals = [w.get(k) for w in weeks if w.get(k) is not None]
            if vals:
                v = sum(vals) / len(vals)
                result[k] = round(v, 1) if (pct_keys and k in pct_keys) else round(v)
            else:
                result[k] = None
        return result
