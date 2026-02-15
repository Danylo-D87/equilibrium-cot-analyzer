"""
Background scheduler wrapper.
===============================
Thin wrapper around APScheduler that any module can register jobs with.
"""

import logging
import threading
from datetime import datetime, timezone

import pytz
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

logger = logging.getLogger(__name__)

# Scheduler singleton — default UTC, individual jobs can override with pytz tz
_scheduler = BackgroundScheduler(timezone="UTC")
_lock = threading.Lock()


def get_scheduler() -> BackgroundScheduler:
    """Return the global scheduler instance."""
    return _scheduler


def start() -> None:
    """Start the background scheduler (idempotent)."""
    if not _scheduler.running:
        _scheduler.start()
        logger.info("Background scheduler started")


def shutdown() -> None:
    """Gracefully stop the scheduler."""
    if _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Background scheduler stopped")


def add_cron_job(
    func,
    job_id: str,
    name: str,
    day_of_week: str = "fri",
    hour: int = 23,
    minute: int = 0,
    tz: str = "Europe/Kyiv",
    **kwargs,
) -> None:
    """
    Register a weekly cron job.

    Args:
        func: Callable to execute.
        job_id: Unique identifier.
        name: Human-readable job name.
        day_of_week: Cron day (default Friday).
        hour / minute: Execution time in the given timezone.
        tz: pytz timezone name (default Europe/Kyiv).
        **kwargs: Extra keyword arguments passed to the job.
    """
    job_tz = pytz.timezone(tz)
    _scheduler.add_job(
        func,
        trigger=CronTrigger(day_of_week=day_of_week, hour=hour, minute=minute, timezone=job_tz),
        id=job_id,
        name=name,
        replace_existing=True,
        kwargs=kwargs,
    )
    logger.info("Registered cron job '%s' (%s %02d:%02d %s)", name, day_of_week, hour, minute, tz)


def run_in_background(func, name: str = "background-task", **kwargs) -> tuple[bool, str]:
    """
    Run a function in a daemon thread. Returns (success, message).
    Prevents duplicate runs of the same named task.
    """
    for t in threading.enumerate():
        if t.name == name and t.is_alive():
            return False, f"Task '{name}' is already running"

    thread = threading.Thread(target=func, kwargs=kwargs, name=name, daemon=True)
    thread.start()
    return True, f"Task '{name}' started in background"


def get_status() -> dict:
    """Return scheduler state and registered jobs."""
    jobs = []
    if _scheduler.running:
        for job in _scheduler.get_jobs():
            jobs.append({
                "id": job.id,
                "name": job.name,
                "next_run": job.next_run_time.isoformat() if job.next_run_time else None,
            })

    return {
        "scheduler_running": _scheduler.running,
        "jobs": jobs,
    }
