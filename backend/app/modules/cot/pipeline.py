"""
COT module — ETL pipeline orchestrator.
=========================================
Coordinates: download → parse → store → export.
"""

import logging
import os
import time
from datetime import datetime
from pathlib import Path

from app.core.config import settings
from app.modules.cot.config import cot_settings
from app.modules.cot.downloader import CotDownloader
from app.modules.cot.parser import CotParser
from app.modules.cot.storage import CotStorage
from app.modules.cot.exporter import CotExporter
from app.modules.prices.service import PriceService

logger = logging.getLogger(__name__)


# =====================================================================
# File-based lock
# =====================================================================

class PipelineLock:
    """Simple file lock to prevent concurrent pipeline runs."""

    def __init__(self) -> None:
        self.lock_file = settings.base_dir / "data" / "pipeline.lock"

    def acquire(self) -> bool:
        if self.lock_file.exists():
            try:
                old_pid = int(self.lock_file.read_text().strip())
                if self._pid_alive(old_pid):
                    logger.warning("Lock file exists — PID %d still running", old_pid)
                    return False
                logger.warning("Stale lock from dead PID %d — recovering", old_pid)
                self.lock_file.unlink(missing_ok=True)
            except (ValueError, OSError):
                logger.warning("Corrupt lock file — removing")
                self.lock_file.unlink(missing_ok=True)

        self.lock_file.parent.mkdir(parents=True, exist_ok=True)
        self.lock_file.write_text(str(os.getpid()))
        return True

    def release(self) -> None:
        try:
            self.lock_file.unlink(missing_ok=True)
        except OSError:
            pass

    @staticmethod
    def _pid_alive(pid: int) -> bool:
        if os.name == "nt":
            # Windows: try opening the process handle (PROCESS_QUERY_LIMITED_INFORMATION)
            try:
                import ctypes
                kernel32 = ctypes.windll.kernel32  # type: ignore[attr-defined]
                PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
                handle = kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, False, pid)
                if handle:
                    kernel32.CloseHandle(handle)
                    return True
                return False
            except (OSError, AttributeError):
                return False
        else:
            # POSIX: signal 0 checks existence without sending a real signal
            try:
                os.kill(pid, 0)
                return True
            except (OSError, ProcessLookupError):
                return False


# =====================================================================
# Pipeline
# =====================================================================

class CotPipeline:
    """Full COT data pipeline: download → parse → store → export."""

    def __init__(self) -> None:
        self.downloader = CotDownloader()
        self.parser = CotParser()
        self.store = CotStorage()

    def run(
        self,
        force_reload: bool = False,
        report_types: list[str] | None = None,
        subtypes: list[str] | None = None,
        skip_prices: bool = False,
    ) -> None:
        types = report_types or list(cot_settings.report_types)
        subs = subtypes or list(cot_settings.subtypes)
        t0 = time.time()

        logger.info("=" * 70)
        logger.info(
            "Pipeline starting — types=%s, subtypes=%s, force=%s, skip_prices=%s",
            types, subs, force_reload, skip_prices,
        )
        logger.info("=" * 70)

        # Step 1: Download + parse + store each variant
        for rt in types:
            for st in subs:
                try:
                    self._process_variant(rt, st, force_reload)
                except (OSError, ValueError, KeyError, RuntimeError) as e:
                    logger.error("Failed %s/%s: %s", rt, st, e, exc_info=True)

        # Step 2: Download prices (once, shared across variants)
        price_data: dict = {}
        all_codes: set[str] = set()
        for rt in types:
            for st in subs:
                for m in self.store.get_all_markets(rt, st):
                    all_codes.add(m["code"])

        if all_codes:
            price_svc = PriceService()

            if not skip_prices:
                # Full download (used on first run or manual trigger)
                try:
                    price_data = price_svc.refresh_all(list(all_codes))
                    logger.info("Downloaded prices for %d markets", len(price_data))
                except (OSError, ValueError, RuntimeError) as e:
                    logger.warning("Price download failed: %s", e)
            else:
                # Use cached prices from the daily 00:00 job
                price_data = price_svc.get_all_cached(list(all_codes))
                logger.info(
                    "Using %d cached price entries (skip_prices=True)",
                    len(price_data),
                )
                # Fallback: if cache is empty (e.g. first run after restart),
                # download anyway so the export isn't price-less.
                if not price_data:
                    logger.info("Cache empty — downloading prices as fallback")
                    try:
                        price_data = price_svc.refresh_all(list(all_codes))
                        logger.info("Fallback downloaded prices for %d markets", len(price_data))
                    except (OSError, ValueError, RuntimeError) as e:
                        logger.warning("Fallback price download failed: %s", e)

        # Step 3: Export
        exporter = CotExporter(self.store, price_service=None)
        for rt in types:
            for st in subs:
                try:
                    exporter.export_all(rt, st, price_data=price_data)
                except (OSError, ValueError, KeyError) as e:
                    logger.error("Export failed %s/%s: %s", rt, st, e, exc_info=True)

        logger.info("Pipeline complete in %.1fs", time.time() - t0)

    def _process_variant(self, report_type: str, subtype: str, force_reload: bool) -> None:
        rt_name = cot_settings.report_display_names[report_type]
        st_name = cot_settings.subtype_display_names[subtype]
        logger.info("Processing: %s — %s", rt_name, st_name)

        if force_reload:
            self.store.delete_report_data(report_type, subtype)

        # Determine which years to skip
        current_year = datetime.now().year
        skip_years: set[int] = set()
        if not force_reload:
            for year in range(current_year - cot_settings.years_to_download + 1, current_year + 1):
                if self.store.is_year_downloaded(year, report_type, subtype):
                    skip_years.add(year)
            if skip_years:
                logger.info("Skipping already-downloaded years: %s", sorted(skip_years))

        # Download + parse yearly data
        yearly_data = self.downloader.download_all_years(report_type, subtype, skip_years=skip_years)
        for year, csv_text in sorted(yearly_data.items()):
            rows = self.parser.parse_yearly_csv(csv_text, report_type, subtype)
            if rows:
                count = self.store.upsert_rows(rows)
                self.store.log_download(report_type, subtype, year, count)
                logger.info("Year %d: stored %d rows", year, count)

        # Download + parse current week
        current_week_text = self.downloader.download_current_week(report_type, subtype)
        if current_week_text:
            rows = self.parser.parse_current_week(current_week_text, report_type, subtype)
            if rows:
                count = self.store.upsert_rows(rows)
                logger.info("Current week: stored %d rows", count)

        stats = self.store.get_db_stats(report_type, subtype)
        logger.info(
            "%s/%s: %d records, %d markets, range %s — %s",
            report_type, subtype,
            stats["total_records"], stats["total_markets"],
            stats["first_date"], stats["last_date"],
        )
