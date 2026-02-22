"""
Database connection management.
================================
Provides:
  1. SQLite connections (COT module — unchanged)
  2. Async SQLAlchemy engine + sessions (PostgreSQL — auth, journal)
"""

import sqlite3
import logging
import threading
from contextlib import contextmanager
from pathlib import Path
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────
# 1. SQLite (COT module) — no changes
# ──────────────────────────────────────────────────────────────

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
    conn = sqlite3.connect(path, check_same_thread=False)
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


# ──────────────────────────────────────────────────────────────
# 2. Async PostgreSQL (auth + journal)
# ──────────────────────────────────────────────────────────────

# Engine and session factory — initialised lazily via init_async_engine()
_async_engine: AsyncEngine | None = None
_async_session_factory: async_sessionmaker[AsyncSession] | None = None


def init_async_engine() -> AsyncEngine:
    """
    Create (or return existing) async SQLAlchemy engine.

    Called once during application startup (lifespan).
    """
    global _async_engine, _async_session_factory

    if _async_engine is not None:
        return _async_engine

    _async_engine = create_async_engine(
        settings.database_url,
        echo=settings.debug,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
    )

    _async_session_factory = async_sessionmaker(
        bind=_async_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    logger.info("Async PostgreSQL engine initialised (pool_size=5)")
    return _async_engine


async def dispose_async_engine() -> None:
    """Dispose the async engine (call on shutdown)."""
    global _async_engine, _async_session_factory

    if _async_engine is not None:
        await _async_engine.dispose()
        logger.info("Async PostgreSQL engine disposed")
        _async_engine = None
        _async_session_factory = None


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that yields an AsyncSession.

    Usage::

        @router.get("/items")
        async def list_items(db: AsyncSession = Depends(get_async_session)):
            ...
    """
    if _async_session_factory is None:
        raise RuntimeError("Async engine not initialised — call init_async_engine() first")

    async with _async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
