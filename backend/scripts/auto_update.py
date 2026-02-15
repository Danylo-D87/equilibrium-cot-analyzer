#!/usr/bin/env python3
"""
COT Auto-Update — Production cron entry point.
Designed to be called by cron/systemd or the built-in APScheduler (Friday 23:00 Kyiv).

Usage:
    python -m scripts.auto_update
    python scripts/auto_update.py --force
    python scripts/auto_update.py --dry-run
"""

import sys
import logging
from datetime import datetime, date
from pathlib import Path

# Ensure the project root (backend/) is on sys.path
_PROJECT_ROOT = str(Path(__file__).resolve().parent.parent)
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

from app.core.config import settings
from app.core.logging import setup_logging
from app.modules.cot.pipeline import CotPipeline, PipelineLock
from app.modules.cot.storage import CotStorage

logger = logging.getLogger(__name__)


def check_data_health(store: CotStorage) -> dict:
    """Check current state of data in the SQLite DB."""
    health: dict = {
        "db_exists": store.db_exists(),
        "total_records": 0,
        "total_markets": 0,
        "latest_date": None,
        "days_old": None,
        "is_fresh": False,
        "needs_update": False,
        "reason": "",
    }

    if not health["db_exists"]:
        health["needs_update"] = True
        health["reason"] = "Database does not exist or is empty"
        return health

    stats = store.get_db_stats()
    health["total_records"] = stats["total_records"]
    health["total_markets"] = stats["total_markets"]
    health["latest_date"] = stats["last_date"]

    if not stats["last_date"]:
        health["needs_update"] = True
        health["reason"] = "No data in database"
        return health

    latest = datetime.strptime(stats["last_date"], "%Y-%m-%d").date()
    health["days_old"] = (date.today() - latest).days
    health["is_fresh"] = health["days_old"] <= settings.data_stale_days

    if not health["is_fresh"]:
        health["needs_update"] = True
        health["reason"] = f"Data is {health['days_old']} days old (threshold: {settings.data_stale_days})"
    else:
        health["reason"] = f"Data is fresh ({health['days_old']} days old)"

    return health


def main() -> int:
    import argparse

    ap = argparse.ArgumentParser(description="COT Auto-Update (cron entry point)")
    ap.add_argument("--force", action="store_true", help="Force full re-download")
    ap.add_argument("--dry-run", action="store_true", help="Check health only")
    ap.add_argument("--verbose", "-v", action="store_true", help="Debug logging")
    ap.add_argument("--no-prices", action="store_true", help="Skip price download")
    ap.add_argument("--type", dest="report_type", type=str, default=None)
    ap.add_argument("--subtype", type=str, default=None)
    ap.add_argument("--log-file", type=str, default=None)
    args = ap.parse_args()

    log_file = args.log_file or str(settings.log_dir / "auto_update.log")
    setup_logging(args.verbose, log_file)

    logger.info("=" * 70)
    logger.info("COT Auto-Update — %s", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    logger.info("=" * 70)

    store = CotStorage()
    health = check_data_health(store)

    logger.info("DB: %s | Records: %d | Latest: %s | Days old: %s",
                "OK" if health["db_exists"] else "MISSING",
                health["total_records"], health["latest_date"], health["days_old"])

    if args.dry_run:
        logger.info("Dry-run complete.")
        print(f"\nHealth: {'OK' if health['is_fresh'] else 'STALE'}")
        print(f"Latest: {health['latest_date']} ({health['days_old']} days old)")
        print(f"Records: {health['total_records']}, Markets: {health['total_markets']}")
        return 0 if health["is_fresh"] else 2

    if not args.force and not health["needs_update"]:
        logger.info("Data is fresh, no update needed.")
        return 0

    lock = PipelineLock()
    if not lock.acquire():
        logger.error("Another pipeline instance is running. Exiting.")
        return 1

    types = [args.report_type] if args.report_type else None
    subs = [args.subtype] if args.subtype else None
    exit_code = 0

    try:
        pipeline = CotPipeline()
        pipeline.run(
            force_reload=args.force,
            report_types=types,
            subtypes=subs,
            skip_prices=args.no_prices,
        )

        new_health = check_data_health(store)
        logger.info(
            "Post-update: Latest=%s, Days old=%s, Markets=%d",
            new_health["latest_date"], new_health["days_old"], new_health["total_markets"],
        )
        logger.info("Auto-update completed successfully")

    except Exception as e:
        logger.error("Auto-update failed: %s", e, exc_info=True)
        exit_code = 1
    finally:
        lock.release()

    return exit_code


if __name__ == "__main__":
    sys.exit(main())
