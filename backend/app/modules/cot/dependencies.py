"""
COT module — FastAPI dependency injection.
============================================
"""

import sqlite3
from functools import lru_cache

from fastapi import Depends

from app.core.database import get_connection
from app.modules.cot.storage import CotStorage
from app.modules.cot.calculator import CotCalculator
from app.modules.cot.service import CotService
from app.modules.prices.service import PriceService


def get_db_connection():
    """Yield a single SQLite connection for the entire request lifecycle."""
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()


@lru_cache()
def get_cot_calculator() -> CotCalculator:
    """Singleton CotCalculator instance."""
    return CotCalculator()


@lru_cache()
def get_price_service() -> PriceService:
    """Singleton PriceService instance."""
    return PriceService()


def get_cot_store(
    conn: sqlite3.Connection = Depends(get_db_connection),
) -> CotStorage:
    """CotStorage instance using the request-scoped connection."""
    return CotStorage(conn=conn)


def get_cot_service(
    store: CotStorage = Depends(get_cot_store),
    calc: CotCalculator = Depends(get_cot_calculator),
    price_service: PriceService = Depends(get_price_service),
) -> CotService:
    """Build CotService per request with shared singletons."""
    return CotService(store, calc, price_service)
