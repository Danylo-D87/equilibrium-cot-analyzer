"""
COT module — Payload builder.
================================
Shared logic for building market detail and screener payloads.
Used by both the Exporter (JSON files) and the Service (API responses).
Eliminates the duplication that previously existed between those two layers.
"""

import logging

from app.modules.cot.config import cot_settings
from app.modules.cot.storage import CotStorage
from app.modules.cot.calculator import CotCalculator
from app.utils.categories import categorize_market, build_market_meta, build_screener_row

logger = logging.getLogger(__name__)


class CotPayloadBuilder:
    """Builds unified payloads for market detail and screener views."""

    def __init__(self, store: CotStorage, calc: CotCalculator) -> None:
        self.store = store
        self.calc = calc

    # ------------------------------------------------------------------
    # Single market detail
    # ------------------------------------------------------------------

    def build_market_detail(
        self,
        code: str,
        name: str,
        exchange_code: str,
        report_type: str,
        subtype: str,
        raw_rows: list[dict],
        prices: list[dict] | None = None,
    ) -> dict | None:
        """
        Build a full market detail payload from pre-fetched raw rows.

        Args:
            code: CFTC contract code.
            name: Market name.
            exchange_code: Exchange identifier.
            report_type: e.g. "legacy", "disagg", "tff".
            subtype: e.g. "fo", "co".
            raw_rows: Pre-fetched weekly data rows (newest-first).
            prices: Optional price bars.

        Returns:
            Complete payload dict or None if no computed weeks.
        """
        if not raw_rows:
            return None

        groups = cot_settings.report_groups[report_type]
        computed = self.calc.compute(raw_rows, report_type)
        weeks = computed["weeks"]
        stats = computed["stats"]

        if not weeks:
            return None

        categories = cot_settings.market_categories
        market_meta = build_market_meta(
            code, name, exchange_code, report_type, subtype,
            categories=categories,
            report_display_names=cot_settings.report_display_names,
            subtype_display_names=cot_settings.subtype_display_names,
        )

        payload: dict = {
            "market": market_meta,
            "groups": groups,
            "weeks": weeks,
            "stats": stats,
        }

        if prices:
            payload["prices"] = prices

        return payload

    # ------------------------------------------------------------------
    # Screener row
    # ------------------------------------------------------------------

    def build_screener_entry(
        self,
        code: str,
        name: str,
        exchange_code: str,
        report_type: str,
        raw_rows: list[dict],
    ) -> dict | None:
        """
        Build a single screener row from pre-fetched raw rows.

        Returns:
            Screener row dict or None if no computed weeks.
        """
        if not raw_rows:
            return None

        groups = cot_settings.report_groups[report_type]
        computed = self.calc.compute(raw_rows, report_type)
        weeks = computed["weeks"]

        if not weeks:
            return None

        latest = weeks[0]
        prev = weeks[1] if len(weeks) > 1 else {}
        categories = cot_settings.market_categories
        return build_screener_row(
            code, name, exchange_code, report_type, latest, prev, groups,
            categories=categories,
        )
