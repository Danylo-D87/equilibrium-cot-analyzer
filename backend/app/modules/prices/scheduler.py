"""
Prices module — Daily price update scheduler.
================================================
Downloads fresh OHLCV data every day at 00:00 Kyiv time
and re-exports all JSON files so the frontend always has
up-to-date price bars without waiting for the weekly COT run.
"""

import logging
import threading
from datetime import datetime, timezone
from typing import Callable

from app.core.config import settings
from app.core import scheduler as core_scheduler

logger = logging.getLogger(__name__)


class PriceUpdateManager:
    """Manages daily price update execution state and lifecycle callbacks."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._state: dict = {
            "running": False,
            "last_run": None,
            "last_status": None,
            "last_error": None,
            "last_duration_sec": None,
        }
        self._on_complete_callbacks: list[Callable] = []

    # ------------------------------------------------------------------
    # Callback registration
    # ------------------------------------------------------------------

    def on_complete(self, callback: Callable) -> None:
        """Register a callback to run after a successful price update."""
        self._on_complete_callbacks.append(callback)

    # ------------------------------------------------------------------
    # State queries
    # ------------------------------------------------------------------

    @property
    def is_running(self) -> bool:
        with self._lock:
            return self._state["running"]

    def get_status(self) -> dict:
        """Return a snapshot of the current update state."""
        with self._lock:
            return self._state.copy()

    # ------------------------------------------------------------------
    # Main job
    # ------------------------------------------------------------------

    def run_price_update(self) -> None:
        """Download all prices, update cache, and re-export JSON files.

        Designed to be called by the scheduler or triggered manually.
        """
        with self._lock:
            if self._state["running"]:
                logger.warning("Price update already running, skipping")
                return
            self._state["running"] = True

        t0 = datetime.now(timezone.utc)
        logger.info("=" * 60)
        logger.info("Daily price update started")
        logger.info("=" * 60)

        try:
            # Lazy imports to avoid circular dependencies at module load
            from app.modules.prices.service import PriceService
            from app.modules.cot.storage import CotStorage
            from app.modules.cot.exporter import CotExporter
            from app.modules.cot.config import cot_settings
            from app.core.logging import setup_logging

            log_file = settings.log_dir / "price_update.log"
            setup_logging(verbose=False, log_file=log_file)

            # 1. Collect all market codes from DB
            store = CotStorage()
            all_codes: set[str] = set()
            for rt in cot_settings.report_types:
                for st in cot_settings.subtypes:
                    for m in store.get_all_markets(rt, st):
                        all_codes.add(m["code"])

            if not all_codes:
                logger.warning("No market codes found in DB — skipping price update")
                self._finish(t0, "skipped", None)
                return

            # 2. Download all prices (populates the class-level cache)
            price_svc = PriceService()
            price_data = price_svc.refresh_all(list(all_codes))
            logger.info("Downloaded prices for %d/%d markets", len(price_data), len(all_codes))

            # 3. Re-export JSON files with fresh prices
            #    COT data stays the same; only the price bars are updated.
            exporter = CotExporter(store, price_service=None)
            for rt in cot_settings.report_types:
                for st in cot_settings.subtypes:
                    try:
                        exporter.export_all(rt, st, price_data=price_data)
                    except (OSError, ValueError, KeyError) as e:
                        logger.error("Export failed %s/%s: %s", rt, st, e, exc_info=True)

            self._finish(t0, "success", None)

            # Notify listeners (e.g. API cache invalidation)
            for cb in self._on_complete_callbacks:
                try:
                    cb()
                except Exception as e:
                    logger.error("Post-price-update callback failed: %s", e)

        except Exception as e:
            logger.error("Daily price update failed: %s", e, exc_info=True)
            self._finish(t0, "error", str(e))

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _finish(self, t0: datetime, status: str, error: str | None) -> None:
        duration = (datetime.now(timezone.utc) - t0).total_seconds()
        with self._lock:
            self._state.update({
                "running": False,
                "last_run": t0.isoformat(),
                "last_status": status,
                "last_error": error,
                "last_duration_sec": round(duration, 1),
            })
        logger.info("Daily price update finished — %s (%.1fs)", status, duration)


# Module-level singleton
price_update_manager = PriceUpdateManager()


def register_daily_price_job() -> None:
    """Register the daily price update cron job — every day at 00:00 Kyiv time."""
    core_scheduler.add_cron_job(
        func=price_update_manager.run_price_update,
        job_id="daily_price_update",
        name="Daily price data update",
        day_of_week=None,  # every day
        hour=0,
        minute=0,
        tz="Europe/Kyiv",
    )


def get_price_update_status() -> dict:
    """Return current price update state."""
    return price_update_manager.get_status()
