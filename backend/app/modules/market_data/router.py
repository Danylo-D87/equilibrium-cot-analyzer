"""
Market Data API router — BTC status & refresh.
"""

import logging
from pathlib import Path

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException

from app.core.models import User
from app.middleware.auth import get_current_active_user

from .btc_service import BTCDataService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/market-data", tags=["Market Data"])


def _get_btc_service() -> BTCDataService:
    return BTCDataService()


@router.get("/btc/status")
async def btc_status(
    _user: User = Depends(get_current_active_user),
    svc: BTCDataService = Depends(_get_btc_service),
):
    """Return BTC cache status."""
    from datetime import date as date_type

    cache_file = svc.cache_file
    if not cache_file.exists():
        return {"status": "empty", "message": "BTC cache not found", "needs_refresh": True}

    try:
        cache = pd.read_csv(cache_file)
        cache["date"] = pd.to_datetime(cache["date"])
        first_date = cache["date"].min().date()
        last_date = cache["date"].max().date()
        today = date_type.today()
        needs_refresh = last_date < today
        return {
            "status": "ok" if not needs_refresh else "outdated",
            "first_date": str(first_date),
            "last_date": str(last_date),
            "total_days": len(cache),
            "last_price": round(float(cache["price"].iloc[-1]), 2),
            "needs_refresh": needs_refresh,
            "days_behind": (today - last_date).days if needs_refresh else 0,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.post("/btc/refresh")
async def btc_refresh(
    _user: User = Depends(get_current_active_user),
    svc: BTCDataService = Depends(_get_btc_service),
):
    """Force-refresh BTC cache to today."""
    try:
        svc.force_refresh()
        cache_file = svc.cache_file
        if cache_file.exists():
            cache = pd.read_csv(cache_file)
            return {
                "status": "success",
                "message": "BTC data refreshed",
                "total_days": len(cache),
                "last_date": cache["date"].max(),
            }
        return {"status": "success", "message": "Refreshed, cache not yet populated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"BTC refresh failed: {e}")
