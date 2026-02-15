"""
COT module — Background update scheduler.
============================================
Manages the weekly COT pipeline job and manual triggers.
"""

import logging
import threading
from datetime import datetime, timezone
from typing import Callable

from app.core.config import settings
from app.core import scheduler as core_scheduler

logger = logging.getLogger(__name__)


class CotUpdateManager:
    """Manages COT pipeline execution state and lifecycle callbacks."""

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

    def on_pipeline_complete(self, callback: Callable) -> None:
        """Register a callback to run after a successful pipeline execution."""
        self._on_complete_callbacks.append(callback)

    @property
    def is_running(self) -> bool:
        with self._lock:
            return self._state["running"]

    def get_status(self) -> dict:
        """Return a snapshot of the current update state."""
        with self._lock:
            return self._state.copy()

    def run_pipeline(self, force: bool = False) -> None:
        """Execute the COT pipeline. Called by scheduler or manual trigger."""
        with self._lock:
            if self._state["running"]:
                logger.warning("Pipeline already running, skipping")
                return
            self._state["running"] = True

        t0 = datetime.now(timezone.utc)
        logger.info("COT pipeline job started (force=%s)", force)

        try:
            from app.modules.cot.pipeline import CotPipeline, PipelineLock
            from app.core.logging import setup_logging

            log_file = settings.log_dir / "cot_update.log"
            setup_logging(verbose=False, log_file=log_file)

            lock = PipelineLock()
            if not lock.acquire():
                raise RuntimeError("Could not acquire pipeline lock")

            try:
                pipeline = CotPipeline()
                pipeline.run(force_reload=force, skip_prices=False)
            finally:
                lock.release()

            duration = (datetime.now(timezone.utc) - t0).total_seconds()

            with self._lock:
                self._state.update({
                    "running": False,
                    "last_run": t0.isoformat(),
                    "last_status": "success",
                    "last_error": None,
                    "last_duration_sec": round(duration, 1),
                })

            # Notify listeners (e.g. cache invalidation)
            for cb in self._on_complete_callbacks:
                try:
                    cb()
                except Exception as e:
                    logger.error("Post-pipeline callback failed: %s", e)

            logger.info("COT pipeline completed in %.1fs", duration)

        except Exception as e:
            duration = (datetime.now(timezone.utc) - t0).total_seconds()
            logger.error("COT pipeline failed: %s", e, exc_info=True)

            with self._lock:
                self._state.update({
                    "running": False,
                    "last_run": t0.isoformat(),
                    "last_status": "error",
                    "last_error": str(e),
                    "last_duration_sec": round(duration, 1),
                })


# Module-level singleton
cot_update_manager = CotUpdateManager()


def register_scheduled_job() -> None:
    """Register the weekly COT update cron job — every Friday at 23:00 Kyiv time."""
    core_scheduler.add_cron_job(
        func=cot_update_manager.run_pipeline,
        job_id="weekly_cot_update",
        name="Weekly COT data update",
        day_of_week="fri",
        hour=23,
        minute=0,
        tz="Europe/Kyiv",
        force=False,
    )


def get_update_status() -> dict:
    """Return current update state."""
    state = cot_update_manager.get_status()
    scheduler_info = core_scheduler.get_status()
    return {**scheduler_info, "update": state}
