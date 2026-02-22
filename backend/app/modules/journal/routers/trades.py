"""Journal trade CRUD endpoints."""

from __future__ import annotations

import uuid
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session
from app.core.models import User
from app.modules.journal import storage
from app.modules.journal.routers._deps import journal_perm
from app.modules.journal.schemas import (
    MessageResponse,
    OrphanSummary,
    PaginatedTradesResponse,
    TradeCreate,
    TradeResponse,
    TradeUpdate,
)
from app.modules.journal.service import (
    build_filter_kwargs,
    orphan_summary,
    trade_to_response,
)

router = APIRouter(tags=["Journal"])


@router.get("/trades", response_model=PaginatedTradesResponse)
async def list_trades(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    trade_type: Optional[list[str]] = Query(None, alias="type"),
    style: Optional[list[str]] = Query(None),
    direction: Optional[str] = None,
    status: Optional[list[str]] = Query(None),
    pair: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    portfolio_id: Optional[list[uuid.UUID]] = Query(None),
    include_inactive: bool = False,
    user: User = Depends(journal_perm),
    db: AsyncSession = Depends(get_async_session),
):
    """List trades with filters and pagination."""
    filters = build_filter_kwargs(
        trade_type=trade_type,
        style=style,
        direction=direction,
        status=status,
        pair=pair,
        date_from=date_from,
        date_to=date_to,
        portfolio_id=portfolio_id,
        include_inactive=include_inactive,
    )
    trades, total = await storage.list_trades(db, user.id, limit=limit, offset=offset, **filters)
    items = [trade_to_response(t) for t in trades]
    return PaginatedTradesResponse(items=items, total=total, limit=limit, offset=offset)


@router.get("/trades/orphan/summary", response_model=OrphanSummary)
async def get_orphan_summary(
    user: User = Depends(journal_perm),
    db: AsyncSession = Depends(get_async_session),
):
    """Summary statistics for orphan trades."""
    trades = await storage.get_orphan_trades(db, user.id)
    return orphan_summary(trades)


@router.get("/trades/orphan", response_model=list[TradeResponse])
async def get_orphan_trades(
    user: User = Depends(journal_perm),
    db: AsyncSession = Depends(get_async_session),
):
    """Get trades not belonging to any active portfolio."""
    trades = await storage.get_orphan_trades(db, user.id)
    return [trade_to_response(t) for t in trades]


@router.get("/trades/{trade_id}", response_model=TradeResponse)
async def get_trade(
    trade_id: uuid.UUID,
    user: User = Depends(journal_perm),
    db: AsyncSession = Depends(get_async_session),
):
    """Get a single trade by ID."""
    trade = await storage.get_trade(db, user.id, trade_id)
    if trade is None:
        raise HTTPException(404, "Trade not found")
    return trade_to_response(trade)


@router.post("/trades", response_model=TradeResponse, status_code=201)
async def create_trade(
    body: TradeCreate,
    user: User = Depends(journal_perm),
    db: AsyncSession = Depends(get_async_session),
):
    """Create a new trade."""
    if body.portfolio_id:
        portfolio = await storage.get_portfolio(db, user.id, body.portfolio_id)
        if portfolio is None:
            raise HTTPException(404, "Portfolio not found")

    trade = await storage.create_trade(db, user.id, body.model_dump())
    return trade_to_response(trade)


@router.put("/trades/{trade_id}", response_model=TradeResponse)
async def update_trade(
    trade_id: uuid.UUID,
    body: TradeUpdate,
    user: User = Depends(journal_perm),
    db: AsyncSession = Depends(get_async_session),
):
    """Update a trade."""
    data = body.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(400, "No fields to update")

    if "portfolio_id" in data and data["portfolio_id"] is not None:
        portfolio = await storage.get_portfolio(db, user.id, data["portfolio_id"])
        if portfolio is None:
            raise HTTPException(404, "Portfolio not found")

    updated = await storage.update_trade(db, user.id, trade_id, data)
    if not updated:
        raise HTTPException(404, "Trade not found")

    trade = await storage.get_trade(db, user.id, trade_id)
    return trade_to_response(trade)


@router.delete("/trades/{trade_id}", response_model=MessageResponse)
async def delete_trade(
    trade_id: uuid.UUID,
    user: User = Depends(journal_perm),
    db: AsyncSession = Depends(get_async_session),
):
    """Delete a trade and its associated images."""
    from app.modules.journal.image_service import delete_image_file

    trade = await storage.delete_trade(db, user.id, trade_id)
    if trade is None:
        raise HTTPException(404, "Trade not found")

    for img in trade.images or []:
        delete_image_file(img.storage_path)

    return MessageResponse(message="Trade deleted")
