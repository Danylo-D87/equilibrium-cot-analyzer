#!/usr/bin/env python3
"""
COT Auto-Update — Production Cron Entry Point
==============================================
Designed to be called by cron/systemd timer every Saturday morning.
Supports all 6 report variants (3 report types × 2 subtypes).

What it does:
  1. Acquires file lock (prevents concurrent runs)
  2. Checks data freshness in SQLite DB
  3. If stale: downloads current week for all report variants
  4. Re-downloads price data from Yahoo Finance
  5. Re-exports all JSON for the frontend
  6. Runs health check and logs results
  7. Returns proper exit code (0 = ok, 1 = error)

Usage:
  python auto_update.py              # Normal weekly update
  python auto_update.py --force      # Force full re-download of all years
  python auto_update.py --dry-run    # Check health only, don't update
  python auto_update.py --type legacy --subtype fo  # Single variant

Cron example (every Saturday 06:00 UTC):
  0 6 * * 6  cd /opt/cftc/backend && /opt/cftc/venv/bin/python auto_update.py

Systemd timer: see deploy/cot-update.timer
"""

import sys
import os
import logging
from datetime import datetime, date

# Ensure we're running from the backend directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

from config import BASE_DIR, DATA_STALE_DAYS
from pipeline import COTPipeline, PipelineLock, setup_logging
from storage import DataStore

logger = logging.getLogger('cot_pipeline.auto_update')

LOG_DIR = BASE_DIR / 'logs'


def check_data_health(store: DataStore) -> dict:
    """
    Check current state of data in the SQLite DB (across all report types).
    Returns dict with health status.
    """
    health = {
        'db_exists': store.db_exists(),
        'total_records': 0,
        'total_markets': 0,
        'latest_date': None,
        'days_old': None,
        'is_fresh': False,
        'needs_update': False,
        'reason': '',
    }

    if not health['db_exists']:
        health['needs_update'] = True
        health['reason'] = 'Database does not exist or is empty'
        return health

    stats = store.get_db_stats()
    health['total_records'] = stats['total_records']
    health['total_markets'] = stats['total_markets']
    health['latest_date'] = stats['last_date']

    if not stats['last_date']:
        health['needs_update'] = True
        health['reason'] = 'No data in database'
        return health

    latest = datetime.strptime(stats['last_date'], '%Y-%m-%d').date()
    health['days_old'] = (date.today() - latest).days
    health['is_fresh'] = health['days_old'] <= DATA_STALE_DAYS

    if not health['is_fresh']:
        health['needs_update'] = True
        health['reason'] = f"Data is {health['days_old']} days old (threshold: {DATA_STALE_DAYS})"
    else:
        health['reason'] = f"Data is fresh ({health['days_old']} days old)"

    return health


def main():
    import argparse

    ap = argparse.ArgumentParser(description='COT Auto-Update (cron entry point)')
    ap.add_argument('--force', action='store_true',
                    help='Force full re-download of all years + prices')
    ap.add_argument('--dry-run', action='store_true',
                    help='Only check health, do not update')
    ap.add_argument('--verbose', '-v', action='store_true',
                    help='Verbose debug logging')
    ap.add_argument('--no-prices', action='store_true',
                    help='Skip Yahoo Finance price download (faster)')
    ap.add_argument('--type', dest='report_type', type=str, default=None,
                    help='Process only this report type (legacy/disagg/tff)')
    ap.add_argument('--subtype', type=str, default=None,
                    help='Process only this subtype (fo/co)')
    ap.add_argument('--log-file', type=str, default=None,
                    help='Override log file path')
    args = ap.parse_args()

    # Setup logging — always log to file in production
    log_file = args.log_file or str(LOG_DIR / 'auto_update.log')
    setup_logging(args.verbose, log_file)

    logger.info("=" * 70)
    logger.info(f"[START] COT Auto-Update — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info("=" * 70)

    # Step 1: Health check
    store = DataStore()
    health = check_data_health(store)

    logger.info(f"[HEALTH] DB exists: {health['db_exists']}")
    logger.info(f"[HEALTH] Records: {health['total_records']}, Markets: {health['total_markets']}")
    logger.info(f"[HEALTH] Latest: {health['latest_date']}, Days old: {health['days_old']}")
    logger.info(f"[HEALTH] Fresh: {health['is_fresh']}, Needs update: {health['needs_update']}")
    logger.info(f"[HEALTH] Reason: {health['reason']}")

    if args.dry_run:
        logger.info("[DRY-RUN] Health check complete. No updates performed.")
        print(f"\nHealth: {'OK' if health['is_fresh'] else 'STALE'}")
        print(f"Latest: {health['latest_date']} ({health['days_old']} days old)")
        print(f"Records: {health['total_records']}, Markets: {health['total_markets']}")
        return 0 if health['is_fresh'] else 2

    if not args.force and not health['needs_update']:
        logger.info("[SKIP] Data is fresh, no update needed. Exiting.")
        return 0

    # Step 2: Acquire lock
    lock = PipelineLock()
    if not lock.acquire():
        logger.error("[LOCK] Another pipeline instance is running. Exiting.")
        return 1

    types = [args.report_type] if args.report_type else None
    subs = [args.subtype] if args.subtype else None

    exit_code = 0
    try:
        pipeline = COTPipeline()

        if args.force:
            logger.info("[MODE] Force full reload...")
            pipeline.run(force_reload=True, report_types=types,
                        subtypes=subs, skip_prices=args.no_prices)
        else:
            logger.info("[MODE] Weekly update...")
            pipeline.run(force_reload=False, report_types=types,
                        subtypes=subs, skip_prices=args.no_prices)

        # Step 3: Post-update health check
        new_health = check_data_health(store)
        logger.info(f"[POST] Latest: {new_health['latest_date']}, "
                     f"Days old: {new_health['days_old']}, "
                     f"Markets: {new_health['total_markets']}")

        if new_health['latest_date'] and (
            not health['latest_date'] or new_health['latest_date'] > health['latest_date']
        ):
            logger.info(f"[OK] Data updated: {health['latest_date']} → {new_health['latest_date']}")
        elif health['latest_date'] == new_health['latest_date']:
            logger.info("[INFO] No new CFTC data available yet (same date as before)")

        logger.info("[OK] Auto-update completed successfully")

    except Exception as e:
        logger.error(f"[FATAL] Auto-update failed: {e}", exc_info=True)
        exit_code = 1
    finally:
        lock.release()
        logger.debug("[LOCK] Released")

    logger.info("=" * 70)
    logger.info(f"[END] Exit code: {exit_code}")
    logger.info("=" * 70)

    return exit_code


if __name__ == '__main__':
    sys.exit(main())
