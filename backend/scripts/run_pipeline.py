#!/usr/bin/env python3
"""
Run the COT data pipeline.
Usage:
    python -m scripts.run_pipeline
    python scripts/run_pipeline.py
    python scripts/run_pipeline.py --force
    python scripts/run_pipeline.py --type legacy --subtype fo
    python scripts/run_pipeline.py --no-prices
"""

import sys
import argparse
import logging
from pathlib import Path

# Ensure the project root (backend/) is on sys.path
_PROJECT_ROOT = str(Path(__file__).resolve().parent.parent)
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

from app.core.config import settings
from app.core.logging import setup_logging
from app.modules.cot.pipeline import CotPipeline, PipelineLock

logger = logging.getLogger(__name__)


def main() -> None:
    ap = argparse.ArgumentParser(description="COT Multi-Report Pipeline")
    ap.add_argument("--force", action="store_true", help="Force full re-download")
    ap.add_argument("--type", dest="report_type", type=str, default=None,
                    help="Only this report type (legacy/disagg/tff)")
    ap.add_argument("--subtype", type=str, default=None,
                    help="Only this subtype (fo/co)")
    ap.add_argument("--no-prices", action="store_true", help="Skip Yahoo Finance download")
    ap.add_argument("--verbose", "-v", action="store_true", help="Debug logging")
    ap.add_argument("--log-file", type=str, default=None, help="Log to file")
    args = ap.parse_args()

    log_file = args.log_file or str(settings.log_dir / "pipeline.log")
    setup_logging(args.verbose, log_file)

    types = [args.report_type] if args.report_type else None
    subs = [args.subtype] if args.subtype else None

    lock = PipelineLock()
    if not lock.acquire():
        logger.error("Another pipeline instance is running. Exiting.")
        sys.exit(1)

    try:
        pipeline = CotPipeline()
        pipeline.run(
            force_reload=args.force,
            report_types=types,
            subtypes=subs,
            skip_prices=args.no_prices,
        )
    except Exception as e:
        logger.error("Pipeline failed: %s", e, exc_info=True)
        sys.exit(1)
    finally:
        lock.release()


if __name__ == "__main__":
    main()
