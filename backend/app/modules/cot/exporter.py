"""
COT module — Static JSON exporter.
=====================================
Exports calculated data to JSON files for the frontend.
"""

import json
import logging
from pathlib import Path

from app.core.config import settings
from app.modules.cot.config import cot_settings
from app.modules.cot.storage import CotStorage
from app.modules.cot.calculator import CotCalculator
from app.modules.cot.builder import CotPayloadBuilder
from app.modules.prices.service import PriceService
from app.utils.categories import build_market_meta

logger = logging.getLogger(__name__)

# Log progress every N markets during export
PROGRESS_LOG_INTERVAL = 20


class CotExporter:
    """Exports COT data from SQLite to JSON files for the frontend."""

    def __init__(
        self,
        store: CotStorage | None = None,
        price_service: PriceService | None = None,
    ):
        self.store = store or CotStorage()
        self.calc = CotCalculator()
        self.price_service = price_service
        self._builder = CotPayloadBuilder(self.store, self.calc)
        self.output_dir = Path(settings.json_output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def export_all(
        self,
        report_type: str,
        subtype: str,
        price_data: dict | None = None,
    ) -> None:
        """
        Export all markets for a single report_type/subtype.
        Creates markets, screener, per-market detail, and group JSON files.
        """
        groups = cot_settings.report_groups[report_type]
        markets = self.store.get_all_markets(report_type, subtype)

        if not markets:
            logger.warning("No markets found for %s/%s", report_type, subtype)
            return

        logger.info("Exporting %d markets for %s/%s...", len(markets), report_type, subtype)

        # Download prices if needed
        if price_data is None and self.price_service:
            codes = [m["code"] for m in markets]
            price_data = self.price_service.download_all(codes)
        elif price_data is None:
            price_data = {}

        # Bulk-load all rows in one query instead of per-market N+1
        all_market_data = self.store.get_all_market_data_bulk(report_type, subtype)

        market_list: list[dict] = []
        screener_rows: list[dict] = []
        categories = cot_settings.market_categories
        report_dn = cot_settings.report_display_names
        subtype_dn = cot_settings.subtype_display_names

        for i, mkt in enumerate(markets, 1):
            code = mkt["code"]
            name = mkt["name"] or code
            exchange_code = mkt.get("exchange_code", "")

            try:
                raw_rows = all_market_data.get(code, [])
                if not raw_rows:
                    continue

                prices = price_data.get(code, [])
                payload = self._builder.build_market_detail(
                    code, name, exchange_code, report_type, subtype,
                    raw_rows, prices or None,
                )
                if payload is None:
                    continue

                market_meta = build_market_meta(
                    code, name, exchange_code, report_type, subtype,
                    categories=categories,
                    report_display_names=report_dn,
                    subtype_display_names=subtype_dn,
                )
                market_list.append(market_meta)
                self._write_json(f"market_{code}_{report_type}_{subtype}.json", payload)

                screener_entry = self._builder.build_screener_entry(
                    code, name, exchange_code, report_type, raw_rows,
                )
                if screener_entry:
                    screener_rows.append(screener_entry)
            except (OSError, ValueError, KeyError, TypeError) as e:
                logger.error("Export failed for market %s (%s): %s", code, name, e)

            if i % PROGRESS_LOG_INTERVAL == 0:
                logger.info("  %d/%d done...", i, len(markets))

        self._write_json(f"markets_{report_type}_{subtype}.json", market_list)
        self._write_json(f"screener_{report_type}_{subtype}.json", screener_rows)
        self._write_json(f"groups_{report_type}.json", groups)

        logger.info(
            "Done: %d markets, %d screener rows for %s/%s",
            len(market_list), len(screener_rows), report_type, subtype,
        )

    def _write_json(self, filename: str, data) -> None:
        path = self.output_dir / filename
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
        logger.debug("Wrote %s", path)
