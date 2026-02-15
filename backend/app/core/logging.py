"""
Centralized logging configuration.
====================================
Call setup_logging() once at application startup.
"""

import sys
import logging
from pathlib import Path

from app.core.config import settings


def setup_logging(
    verbose: bool = False,
    log_file: str | Path | None = None,
) -> None:
    """
    Configure the root logger with console and optional file output.

    Args:
        verbose: If True, set level to DEBUG; otherwise INFO.
        log_file: Optional path for a log file.
    """
    level = logging.DEBUG if verbose else logging.INFO
    fmt = "%(asctime)s [%(name)s] %(levelname)s: %(message)s"
    datefmt = "%Y-%m-%d %H:%M:%S"

    handlers: list[logging.Handler] = [logging.StreamHandler(sys.stdout)]

    if log_file:
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)
        handlers.append(logging.FileHandler(str(log_path), encoding="utf-8"))

    logging.basicConfig(level=level, format=fmt, datefmt=datefmt, handlers=handlers)

    # Suppress noisy third-party loggers
    for noisy in ("urllib3", "yfinance", "apscheduler.executors"):
        logging.getLogger(noisy).setLevel(logging.WARNING)
