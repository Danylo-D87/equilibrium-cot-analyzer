"""Journal portfolio endpoints."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session
from app.core.models import User
from app.modules.journal import storage
from app.modules.journal.routers._deps import journal_perm
from app.modules.journal.schemas import (
    MessageResponse,
    PortfolioCreate,
    PortfolioResponse,
    PortfolioUpdate,
)

router = APIRouter(tags=["Journal"])


@router.get("/portfolios", response_model=list[PortfolioResponse])
async def list_portfolios(
    user: User = Depends(journal_perm),
    db: AsyncSession = Depends(get_async_session),
):
    """List all portfolios for current user."""
    rows = await storage.list_portfolios(db, user.id)
    return [PortfolioResponse(**r) for r in rows]


@router.get("/portfolios/{portfolio_id}", response_model=PortfolioResponse)
async def get_portfolio(
    portfolio_id: uuid.UUID,
    user: User = Depends(journal_perm),
    db: AsyncSession = Depends(get_async_session),
):
    """Get a single portfolio by ID."""
    row = await storage.get_portfolio(db, user.id, portfolio_id)
    if row is None:
        raise HTTPException(404, "Portfolio not found")
    return PortfolioResponse(**row)


@router.post("/portfolios", response_model=PortfolioResponse, status_code=201)
async def create_portfolio(
    body: PortfolioCreate,
    user: User = Depends(journal_perm),
    db: AsyncSession = Depends(get_async_session),
):
    """Create a new portfolio."""
    portfolio = await storage.create_portfolio(db, user.id, body.model_dump())
    row = await storage.get_portfolio(db, user.id, portfolio.id)
    return PortfolioResponse(**row)


@router.put("/portfolios/{portfolio_id}", response_model=PortfolioResponse)
async def update_portfolio(
    portfolio_id: uuid.UUID,
    body: PortfolioUpdate,
    user: User = Depends(journal_perm),
    db: AsyncSession = Depends(get_async_session),
):
    """Update a portfolio."""
    data = body.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(400, "No fields to update")
    updated = await storage.update_portfolio(db, user.id, portfolio_id, data)
    if not updated:
        raise HTTPException(404, "Portfolio not found")
    row = await storage.get_portfolio(db, user.id, portfolio_id)
    return PortfolioResponse(**row)


@router.delete("/portfolios/{portfolio_id}", response_model=MessageResponse)
async def delete_portfolio(
    portfolio_id: uuid.UUID,
    user: User = Depends(journal_perm),
    db: AsyncSession = Depends(get_async_session),
):
    """Delete a portfolio (and orphan its trades)."""
    deleted = await storage.delete_portfolio(db, user.id, portfolio_id)
    if not deleted:
        raise HTTPException(404, "Portfolio not found")
    return MessageResponse(message="Portfolio deleted")
