"""
Market categorization and shared data-shaping utilities.
==========================================================
Used by both the static Exporter and the live API Service
to produce identical output shapes.

IMPORTANT: This module must NOT import from app.modules.*
to keep the dependency direction correct:
    core/ ← utils/ ← modules/
"""

# Default display names — can be overridden by callers
_DEFAULT_REPORT_DISPLAY = {
    "legacy": "Legacy",
    "disagg": "Disaggregated",
    "tff": "Traders in Financial Futures",
}
_DEFAULT_SUBTYPE_DISPLAY = {
    "fo": "Futures Only",
    "co": "Futures + Options Combined",
}


def categorize_market(
    name: str,
    categories: dict[str, dict] | None = None,
) -> tuple[str, str]:
    """
    Determine category key and display name from a market name.

    Args:
        name: Market name (e.g. "GOLD - COMEX").
        categories: Dict of {key: {"keywords": [...], "display": "..."}}.
                    If None, returns ("other", "Other").

    Returns:
        (category_key, category_display) — e.g. ("metals", "Metals")
    """
    if categories is None:
        return "other", "Other"

    upper = name.upper()
    for cat_key, cat_info in categories.items():
        for kw in cat_info["keywords"]:
            if kw in upper:
                return cat_key, cat_info["display"]
    return "other", "Other"


def build_market_meta(
    code: str,
    name: str,
    exchange: str,
    report_type: str,
    subtype: str,
    categories: dict[str, dict] | None = None,
    report_display_names: dict[str, str] | None = None,
    subtype_display_names: dict[str, str] | None = None,
) -> dict:
    """Build a standardized market metadata dict."""
    cat_key, cat_display = categorize_market(name, categories)
    rd = report_display_names or _DEFAULT_REPORT_DISPLAY
    sd = subtype_display_names or _DEFAULT_SUBTYPE_DISPLAY
    return {
        "code": code,
        "name": name,
        "exchange": exchange,
        "category": cat_key,
        "category_display": cat_display,
        "report_type": report_type,
        "report_type_display": rd.get(report_type, report_type),
        "subtype": subtype,
        "subtype_display": sd.get(subtype, subtype),
    }


def build_screener_row(
    code: str,
    name: str,
    exchange_code: str,
    report_type: str,
    latest: dict,
    prev: dict,
    groups: list[dict] | None = None,
    categories: dict[str, dict] | None = None,
) -> dict:
    """
    Build a single screener row from the latest and previous week data.
    Shared between the Exporter and the API Service.
    """
    cat_key, cat_display = categorize_market(name, categories)

    if groups is None:
        groups = []

    screener_row: dict = {
        "code": code,
        "name": name,
        "exchange_code": exchange_code,
        "category": cat_key,
        "category_display": cat_display,
        "date": latest.get("date"),
        "open_interest": latest.get("open_interest"),
        "oi_change": latest.get("oi_change"),
    }

    for g in groups:
        gk = g["key"]
        screener_row[f"{gk}_long"] = latest.get(f"{gk}_long")
        screener_row[f"{gk}_short"] = latest.get(f"{gk}_short")
        screener_row[f"{gk}_net"] = latest.get(f"{gk}_net")
        screener_row[f"{gk}_change"] = latest.get(f"{gk}_change")
        screener_row[f"{gk}_change_long"] = latest.get(f"{gk}_change_long")
        screener_row[f"{gk}_change_short"] = latest.get(f"{gk}_change_short")
        screener_row[f"{gk}_pct_oi"] = latest.get(f"{gk}_pct_net_oi")

        # Delta % OI
        cur_pct = latest.get(f"{gk}_pct_net_oi")
        prev_pct = prev.get(f"{gk}_pct_net_oi")
        if cur_pct is not None and prev_pct is not None:
            screener_row[f"{gk}_pct_oi_change"] = round(cur_pct - prev_pct, 1)
        else:
            screener_row[f"{gk}_pct_oi_change"] = None

        screener_row[f"cot_{gk}_1y"] = latest.get(f"cot_index_{gk}_1y")
        screener_row[f"crowded_{gk}"] = latest.get(f"crowded_{gk}", {}).get("value")
        screener_row[f"signal_{gk}"] = latest.get(f"crowded_{gk}", {}).get("signal")

    # Aggregate signals
    signals: list[dict] = []
    for g in groups:
        gk = g["key"]
        sig = latest.get(f"crowded_{gk}", {}).get("signal")
        if sig:
            signals.append({"group": g["short"], "signal": sig})
    screener_row["signals"] = signals

    return screener_row
