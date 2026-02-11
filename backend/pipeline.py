"""
COT Multi-Report Pipeline — Orchestrator
=========================================
Coordinates the full download → parse → store → export flow
for all 6 report type × subtype combinations.

Usage:
    python pipeline.py                  # Weekly update (skip existing years)
    python pipeline.py --force          # Full re-download
    python pipeline.py --type legacy    # Only one report type
    python pipeline.py --no-prices      # Skip Yahoo Finance download
"""

import logging
import os
import sys
import time
from datetime import datetime
from pathlib import Path

from config import (
    BASE_DIR, REPORT_TYPES, SUBTYPES,
    REPORT_DISPLAY_NAMES, SUBTYPE_DISPLAY_NAMES,
    YEARS_TO_DOWNLOAD,
)
from downloader import Downloader
from parser import Parser
from storage import DataStore
from exporter import Exporter
from price_downloader import PriceDownloader

logger = logging.getLogger('cot_pipeline')


# =====================================================================
# Lock to prevent concurrent runs
# =====================================================================

class PipelineLock:
    """Simple file lock to prevent concurrent pipeline runs."""

    def __init__(self):
        self.lock_file = BASE_DIR / 'pipeline.lock'

    def acquire(self) -> bool:
        if self.lock_file.exists():
            logger.warning("[LOCK] Lock file exists — another run may be active")
            return False
        with open(self.lock_file, 'w') as f:
            f.write(str(os.getpid()))
        return True

    def release(self):
        try:
            self.lock_file.unlink(missing_ok=True)
        except Exception:
            pass


# =====================================================================
# Logging setup
# =====================================================================

def setup_logging(verbose: bool = False, log_file: str = None):
    level = logging.DEBUG if verbose else logging.INFO
    fmt = '%(asctime)s [%(name)s] %(levelname)s: %(message)s'
    datefmt = '%Y-%m-%d %H:%M:%S'

    handlers = [logging.StreamHandler(sys.stdout)]

    if log_file:
        log_dir = Path(log_file).parent
        log_dir.mkdir(parents=True, exist_ok=True)
        handlers.append(logging.FileHandler(log_file, encoding='utf-8'))

    logging.basicConfig(level=level, format=fmt, datefmt=datefmt, handlers=handlers)

    # Suppress noisy libraries
    logging.getLogger('urllib3').setLevel(logging.WARNING)
    logging.getLogger('yfinance').setLevel(logging.WARNING)


# =====================================================================
# Main pipeline
# =====================================================================

class COTPipeline:
    """Full COT data pipeline: download → parse → store → export."""

    def __init__(self):
        self.downloader = Downloader()
        self.parser = Parser()
        self.store = DataStore()

    def run(self, force_reload: bool = False,
            report_types: list[str] = None,
            subtypes: list[str] = None,
            skip_prices: bool = False):
        """
        Run the full pipeline.
        
        Args:
            force_reload: If True, re-download everything (delete existing data).
            report_types: List of report types to process (default: all).
            subtypes: List of subtypes to process (default: all).
            skip_prices: If True, skip Yahoo Finance price download.
        """
        types = report_types or REPORT_TYPES
        subs = subtypes or SUBTYPES
        t0 = time.time()

        logger.info("=" * 70)
        logger.info(f"[PIPELINE] Starting — types={types}, subtypes={subs}, "
                     f"force={force_reload}, skip_prices={skip_prices}")
        logger.info("=" * 70)

        # Step 1: Download price data once (shared across all report types)
        price_data = {}
        if not skip_prices:
            try:
                pd = PriceDownloader()
                # Collect all market codes from all report types first
                all_codes = set()
                for rt in types:
                    for st in subs:
                        markets = self.store.get_all_markets(rt, st)
                        for m in markets:
                            all_codes.add(m['code'])

                if all_codes:
                    price_data = pd.download_all(list(all_codes))
                    logger.info(f"[PIPELINE] Downloaded prices for {len(price_data)} markets")
            except Exception as e:
                logger.warning(f"[PIPELINE] Price download failed: {e}")

        # Step 2: Process each report_type × subtype
        for rt in types:
            for st in subs:
                try:
                    self._process_variant(rt, st, force_reload)
                except Exception as e:
                    logger.error(f"[PIPELINE] Failed {rt}/{st}: {e}", exc_info=True)

        # Step 3: Export all variants
        for rt in types:
            for st in subs:
                try:
                    exporter = Exporter(self.store, download_prices=False)
                    exporter.export_all(rt, st, price_data=price_data)
                except Exception as e:
                    logger.error(f"[PIPELINE] Export failed {rt}/{st}: {e}", exc_info=True)

        elapsed = time.time() - t0
        logger.info(f"[PIPELINE] Complete in {elapsed:.1f}s")

    def _process_variant(self, report_type: str, subtype: str, force_reload: bool):
        """Download and store data for one report_type/subtype."""
        rt_name = REPORT_DISPLAY_NAMES[report_type]
        st_name = SUBTYPE_DISPLAY_NAMES[subtype]
        logger.info(f"\n{'='*60}")
        logger.info(f"[VARIANT] Processing: {rt_name} — {st_name}")
        logger.info(f"{'='*60}")

        # If force, delete existing data
        if force_reload:
            self.store.delete_report_data(report_type, subtype)

        # Download yearly ZIPs
        current_year = datetime.now().year
        skip_years = set()
        if not force_reload:
            for year in range(current_year - YEARS_TO_DOWNLOAD + 1, current_year + 1):
                if self.store.is_year_downloaded(year, report_type, subtype):
                    skip_years.add(year)
            if skip_years:
                logger.info(f"[VARIANT] Skipping already-downloaded years: {sorted(skip_years)}")

        yearly_data = self.downloader.download_all_years(
            report_type, subtype, skip_years=skip_years)

        # Parse and store yearly data
        for year, csv_text in sorted(yearly_data.items()):
            rows = self.parser.parse_yearly_csv(csv_text, report_type, subtype)
            if rows:
                count = self.store.upsert_rows(rows)
                self.store.log_download(report_type, subtype, year, count)
                logger.info(f"[VARIANT] Year {year}: stored {count} rows")

        # Download current week
        current_week_text = self.downloader.download_current_week(report_type, subtype)
        if current_week_text:
            rows = self.parser.parse_current_week(current_week_text, report_type, subtype)
            if rows:
                count = self.store.upsert_rows(rows)
                logger.info(f"[VARIANT] Current week: stored {count} rows")

        # Summary
        stats = self.store.get_db_stats(report_type, subtype)
        logger.info(f"[VARIANT] {report_type}/{subtype}: "
                     f"{stats['total_records']} records, "
                     f"{stats['total_markets']} markets, "
                     f"range {stats['first_date']} — {stats['last_date']}")


# =====================================================================
# CLI
# =====================================================================

def main():
    import argparse

    ap = argparse.ArgumentParser(description='COT Multi-Report Pipeline')
    ap.add_argument('--force', action='store_true',
                    help='Force full re-download of all years')
    ap.add_argument('--type', dest='report_type', type=str, default=None,
                    help='Process only this report type (legacy/disagg/tff)')
    ap.add_argument('--subtype', type=str, default=None,
                    help='Process only this subtype (fo/co)')
    ap.add_argument('--no-prices', action='store_true',
                    help='Skip Yahoo Finance price download')
    ap.add_argument('--verbose', '-v', action='store_true',
                    help='Verbose debug logging')
    ap.add_argument('--log-file', type=str, default=None,
                    help='Log to file as well')
    args = ap.parse_args()

    log_file = args.log_file or str(BASE_DIR / 'logs' / 'pipeline.log')
    setup_logging(args.verbose, log_file)

    types = [args.report_type] if args.report_type else None
    subs = [args.subtype] if args.subtype else None

    lock = PipelineLock()
    if not lock.acquire():
        logger.error("[LOCK] Another pipeline instance is running. Exiting.")
        sys.exit(1)

    try:
        pipeline = COTPipeline()
        pipeline.run(
            force_reload=args.force,
            report_types=types,
            subtypes=subs,
            skip_prices=args.no_prices,
        )
    except Exception as e:
        logger.error(f"[FATAL] Pipeline failed: {e}", exc_info=True)
        sys.exit(1)
    finally:
        lock.release()


if __name__ == '__main__':
    main()
