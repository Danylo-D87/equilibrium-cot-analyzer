"""
Shared FastAPI dependencies for journal sub-routers.
=====================================================
Centralises: permission checks, PortfolioAnalyzer construction,
the chart-data fetcher, and the thread-pool runner for CPU-bound analysis.
"""

from __future__ import annotations

import asyncio
import functools
import uuid
from datetime import date
from typing import Optional

from fastapi import Depends, Query, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session
from app.core.exceptions import AuthenticationError, ForbiddenError
from app.core.models import User
from app.core.security import decode_access_token
from app.middleware.auth import require_permission
from app.modules.journal import storage
from app.modules.journal.analyzer import PortfolioAnalyzer
from app.modules.journal.service import (
    build_filter_kwargs,
    get_initial_balance_for_trades,
    trades_to_dicts,
)

# ── Permission dependencies ──────────────────────────────────

# Standard: requires Authorization header
journal_perm = require_permission("journal")


async def journal_perm_or_token(
    request: Request,
    token: Optional[str] = Query(None, include_in_schema=False),
    db: AsyncSession = Depends(get_async_session),
) -> User:
    """Allow auth via Authorization header OR ?token= query param (for <img src>)."""
    auth_header = request.headers.get("authorization", "")
    jwt_token = None
    if auth_header.startswith("Bearer "):
        jwt_token = auth_header[7:]
    elif token:
        jwt_token = token

    if not jwt_token:
        raise AuthenticationError("Not authenticated")

    payload = decode_access_token(jwt_token)
    user_id = payload.get("sub")
    if not user_id:
        raise AuthenticationError("Invalid token")

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    found_user = result.scalar_one_or_none()
    if not found_user:
        raise AuthenticationError("User not found")
    if not found_user.is_active:
        raise ForbiddenError("Account deactivated")
    if not found_user.has_permission("journal"):
        raise ForbiddenError("Permission 'journal' required")
    return found_user


# ── Analyzer helpers ─────────────────────────────────────────

async def build_analyzer(
    db: AsyncSession,
    user_id: uuid.UUID,
    portfolio_ids: list[uuid.UUID] | None = None,
) -> PortfolioAnalyzer:
    """Build PortfolioAnalyzer loaded with the user's persisted settings."""
    settings = await storage.get_settings(db, user_id)
    portfolios = await storage.list_portfolios(db, user_id)
    initial_balance = get_initial_balance_for_trades(
        [],
        float(settings.initial_balance),
        portfolio_ids,
        portfolios,
    )
    return PortfolioAnalyzer(
        initial_balance=initial_balance,
        risk_free_rate=float(settings.risk_free_rate),
    )


async def fetch_chart_data(
    db: AsyncSession,
    user_id: uuid.UUID,
    *,
    trade_type: list[str] | None,
    style: list[str] | None,
    direction: str | None,
    status: list[str] | None,
    pair: str | None,
    date_from: date | None,
    date_to: date | None,
    portfolio_id: list[uuid.UUID] | None,
    include_inactive: bool,
) -> tuple[list[dict], PortfolioAnalyzer]:
    """Fetch trades + build analyzer — shared by all analytics/chart endpoints."""
    filters = build_filter_kwargs(
        trade_type=trade_type, style=style, direction=direction,
        status=status, pair=pair, date_from=date_from,
        date_to=date_to, portfolio_id=portfolio_id,
        include_inactive=include_inactive,
    )
    trades_orm = await storage.get_all_trades_for_analysis(db, user_id, **filters)
    trade_dicts = trades_to_dicts(trades_orm)
    analyzer = await build_analyzer(db, user_id, portfolio_id)
    return trade_dicts, analyzer


async def run_in_threadpool(fn, *args, **kwargs):
    """Run a synchronous CPU-bound function in the default thread-pool executor.

    Prevents PortfolioAnalyzer (numpy/pandas) from blocking the async event loop.
    """
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, functools.partial(fn, *args, **kwargs))
