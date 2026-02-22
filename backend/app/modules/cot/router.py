"""
COT module — API routes.
==========================
All /api/v1/cot/ endpoints.
"""

import asyncio
import logging
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException

from app.modules.cot.dependencies import get_cot_service
from app.modules.cot.service import CotService
from app.modules.cot.scheduler import get_update_status, cot_update_manager
from app.modules.prices.scheduler import price_update_manager, get_price_update_status
from app.modules.cot.schemas import (
    MarketMeta, MarketDetailResponse, ScreenerRow,
    GroupDef, StatusResponse, PaginatedResponse,
)
from app.core.cache import TTLCache
from app.middleware.auth import require_permission

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/cot",
    tags=["COT"],
    dependencies=[Depends(require_permission("cot"))],
)

# ------------------------------------------------------------------
# Module-level caches
# ------------------------------------------------------------------

MARKET_CACHE_TTL = 600       # 10 min — individual market detail
SCREENER_CACHE_TTL = 300     # 5 min — screener table
MARKETS_LIST_CACHE_TTL = 600 # 10 min — markets list

_market_cache = TTLCache(name="cot.market", default_ttl=MARKET_CACHE_TTL)
_screener_cache = TTLCache(name="cot.screener", default_ttl=SCREENER_CACHE_TTL)
_markets_list_cache = TTLCache(name="cot.markets_list", default_ttl=MARKETS_LIST_CACHE_TTL)


def invalidate_cot_caches() -> None:
    """Called after a pipeline update to clear all COT caches."""
    _market_cache.invalidate()
    _screener_cache.invalidate()
    _markets_list_cache.invalidate()
    logger.info("All COT caches invalidated")


# Register so scheduler can trigger cache invalidation without importing router
cot_update_manager.on_pipeline_complete(invalidate_cot_caches)
price_update_manager.on_complete(invalidate_cot_caches)


# ------------------------------------------------------------------
# Type aliases
# ------------------------------------------------------------------

ReportType = Literal["legacy", "disagg", "tff"]
SubType = Literal["fo", "co"]


# ==================================================================
# Endpoints
# ==================================================================

@router.get("/markets/{report_type}/{subtype}", response_model=list[MarketMeta])
async def list_markets(
    report_type: ReportType,
    subtype: SubType,
    service: CotService = Depends(get_cot_service),
):
    """List all markets for a given report type / subtype."""
    cache_key = f"markets:{report_type}:{subtype}"
    cached = _markets_list_cache.get(cache_key)
    if cached is not None:
        return cached

    markets = await asyncio.to_thread(service.get_markets, report_type, subtype)
    if not markets:
        raise HTTPException(status_code=404, detail="No markets found for this combination")

    _markets_list_cache.set(cache_key, markets)
    return markets


@router.get("/markets/{report_type}/{subtype}/{code}", response_model=MarketDetailResponse)
async def get_market(
    report_type: ReportType,
    subtype: SubType,
    code: str,
    service: CotService = Depends(get_cot_service),
):
    """Get full data for a single market."""
    cache_key = f"market:{code}:{report_type}:{subtype}"
    cached = _market_cache.get(cache_key)
    if cached is not None:
        return cached

    data = await asyncio.to_thread(service.get_market_detail, code, report_type, subtype)
    if data is None:
        raise HTTPException(status_code=404, detail=f"Market '{code}' not found")

    _market_cache.set(cache_key, data)
    return data


@router.get("/screener/{report_type}/{subtype}", response_model=PaginatedResponse)
async def get_screener(
    report_type: ReportType,
    subtype: SubType,
    limit: int = 0,
    offset: int = 0,
    service: CotService = Depends(get_cot_service),
):
    """Get screener data for all markets with optional pagination.

    Args:
        limit: Max rows to return. 0 = all (backwards compatible).
        offset: Number of rows to skip.

    When limit > 0, uses SQL-level pagination (only processes the
    requested page of markets). When limit = 0, loads everything
    into cache and returns all rows.
    """
    # SQL-paginated path: only load the requested page of markets
    if limit > 0:
        rows, total = await asyncio.to_thread(
            service.get_screener_page, report_type, subtype, limit, offset,
        )
        if not rows and total == 0:
            raise HTTPException(status_code=404, detail="No screener data for this combination")
        return PaginatedResponse(items=rows, total=total, limit=limit, offset=offset)

    # Full-cache path (limit=0): load everything, cache it
    cache_key = f"screener:{report_type}:{subtype}"
    cached = _screener_cache.get(cache_key)
    if cached is not None:
        rows = cached
    else:
        rows = await asyncio.to_thread(service.get_screener, report_type, subtype)
        if not rows:
            raise HTTPException(status_code=404, detail="No screener data for this combination")
        _screener_cache.set(cache_key, rows)

    return PaginatedResponse(items=rows, total=len(rows), limit=0, offset=0)


@router.get("/groups/{report_type}", response_model=list[GroupDef])
async def get_groups(
    report_type: ReportType,
    service: CotService = Depends(get_cot_service),
):
    """Get group definitions (metadata) for a report type."""
    groups = await asyncio.to_thread(service.get_groups, report_type)
    if not groups:
        raise HTTPException(status_code=404, detail=f"No groups for report type '{report_type}'")
    return groups


# ------------------------------------------------------------------
# System / admin endpoints
# ------------------------------------------------------------------

@router.get("/status", response_model=StatusResponse)
async def get_status(service: CotService = Depends(get_cot_service)):
    """System status: DB stats, scheduler status, last update info."""
    return {
        "data": await asyncio.to_thread(service.get_status),
        "scheduler": get_update_status(),
        "price_update": get_price_update_status(),
    }


