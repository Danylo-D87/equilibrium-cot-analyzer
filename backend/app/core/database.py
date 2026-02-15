"""
SQLite connection management.
==============================
Provides a centralized way to obtain database connections
with consistent PRAGMA settings and connection reuse.
"""

import sqlite3
import logging
import threading
from contextlib import contextmanager
from pathlib import Path

from app.core.config import settings

logger = logging.getLogger(__name__)

# Thread-local storage for connection reuse within a request / pipeline run
_local = threading.local()


def get_connection(db_path: Path | str | None = None) -> sqlite3.Connection:
    """
    Open an SQLite connection with WAL mode and foreign keys enabled.

    Args:
        db_path: Override the default database path.

    Returns:
        An open sqlite3.Connection.
    """
    path = str(db_path or settings.db_path)
    conn = sqlite3.connect(path)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def db_exists(db_path: Path | str | None = None) -> bool:
    """Check whether the database file exists and is non-empty."""
    p = Path(db_path or settings.db_path)
    return p.exists() and p.stat().st_size > 0


@contextmanager
def managed_connection(db_path: Path | str | None = None):
    """
    Context manager providing a single connection for the scope.

    If a managed connection is already active on this thread (nested call),
    the existing connection is reused.  Otherwise a new one is opened and
    closed at the end.

    Usage in FastAPI dependency::

        def get_db():
            with managed_connection() as conn:
                yield conn

    Usage in pipeline scripts::

        with managed_connection() as conn:
            store = CotStorage(conn=conn)
            store.upsert_rows(...)
    """
    existing: sqlite3.Connection | None = getattr(_local, "conn", None)
    if existing is not None:
        # Reuse the connection already opened by an outer scope
        yield existing
        return

    conn = get_connection(db_path)
    _local.conn = conn
    try:
        yield conn
    finally:
        _local.conn = None
        conn.close()
