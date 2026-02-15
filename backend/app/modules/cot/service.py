"""
COT module — API service (business logic layer).
==================================================
Read-only service that computes API responses from SQLite data.
Delegates payload construction to CotPayloadBuilder.
"""

import logging

from app.modules.cot.config import cot_settings
from app.modules.cot.storage import CotStorage
from app.modules.cot.calculator import CotCalculator
from app.modules.cot.builder import CotPayloadBuilder
from app.modules.prices.service import PriceService
from app.utils.categories import build_market_meta

logger = logging.getLogger(__name__)


class CotService:
    """Read-only service for COT API responses."""

    def __init__(
        self,
        store: CotStorage,
        calc: CotCalculator,
        price_service: PriceService | None = None,
    ):
        self.store = store
        self.calc = calc
        self.price_service = price_service or PriceService()
        self._builder = CotPayloadBuilder(store, calc)

    # ------------------------------------------------------------------
    # Markets list
    # ------------------------------------------------------------------

    def get_markets(self, report_type: str, subtype: str) -> list[dict]:
        markets = self.store.get_all_markets(report_type, subtype)
        categories = cot_settings.market_categories
        report_dn = cot_settings.report_display_names
        subtype_dn = cot_settings.subtype_display_names
        return [
            build_market_meta(
                m["code"], m["name"] or m["code"],
                m.get("exchange_code", ""), report_type, subtype,
                categories=categories,
                report_display_names=report_dn,
                subtype_display_names=subtype_dn,
            )
            for m in markets
        ]

    # ------------------------------------------------------------------
    # Single market detail
    # ------------------------------------------------------------------

    def get_market_detail(self, code: str, report_type: str, subtype: str) -> dict | None:
        raw_rows = self.store.get_market_data(code, report_type, subtype)
        if not raw_rows:
            return None

        first = raw_rows[0]
        name = first.get("market_and_exchange") or code
        exchange_code = first.get("exchange_code", "")

        # Prices
        prices = None
        if self.price_service and self.price_service.has_ticker(code):
            prices = self.price_service.download_prices(code)
            if not prices:
                prices = None

        return self._builder.build_market_detail(
            code, name, exchange_code, report_type, subtype, raw_rows, prices,
        )

    # ------------------------------------------------------------------
    # Screener
    # ------------------------------------------------------------------

    def get_screener(self, report_type: str, subtype: str) -> list[dict]:
        all_data = self.store.get_all_market_data_bulk(report_type, subtype)
        if not all_data:
            return []

        screener_rows: list[dict] = []
        for code, raw_rows in all_data.items():
            if not raw_rows:
                continue

            name = raw_rows[0].get("market_and_exchange") or code
            exchange_code = raw_rows[0].get("exchange_code", "")

            entry = self._builder.build_screener_entry(
                code, name, exchange_code, report_type, raw_rows,
            )
            if entry:
                screener_rows.append(entry)

        return screener_rows

    # ------------------------------------------------------------------
    # Groups metadata
    # ------------------------------------------------------------------

    def get_groups(self, report_type: str) -> list[dict]:
        return cot_settings.report_groups.get(report_type, [])

    # ------------------------------------------------------------------
    # System status
    # ------------------------------------------------------------------

    def get_status(self) -> dict:
        overall = self.store.get_db_stats()
        variants = {}
        for rt in cot_settings.report_types:
            for st in cot_settings.subtypes:
                variants[f"{rt}_{st}"] = self.store.get_db_stats(rt, st)
        return {"overall": overall, "variants": variants}
