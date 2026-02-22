"""
Journal CRUD storage layer (async SQLAlchemy).
===============================================
Every query is scoped by ``user_id`` — data isolation guaranteed at DB level.
"""

from __future__ import annotations

import uuid
from datetime import date
from decimal import Decimal
from typing import Optional, Sequence

from sqlalchemy import delete, func, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.journal.models import (
    Portfolio,
    Trade,
    TradeImage,
    UserJournalSettings,
)


# ──────────────────────────────────────────────────────────────
# Settings
# ──────────────────────────────────────────────────────────────

async def get_settings(db: AsyncSession, user_id: uuid.UUID) -> UserJournalSettings:
    """Return settings for user; create defaults if missing (race-safe upsert)."""
    stmt = (
        pg_insert(UserJournalSettings)
        .values(user_id=user_id)
        .on_conflict_do_nothing(index_elements=["user_id"])
    )
    await db.execute(stmt)
    result = await db.execute(
        select(UserJournalSettings).where(UserJournalSettings.user_id == user_id)
    )
    return result.scalar_one()


async def update_settings(
    db: AsyncSession,
    user_id: uuid.UUID,
    data: dict,
) -> UserJournalSettings:
    """Update journal settings for user."""
    settings = await get_settings(db, user_id)
    for k, v in data.items():
        if v is not None:
            setattr(settings, k, v)
    await db.flush()
    await db.refresh(settings)
    return settings


# ──────────────────────────────────────────────────────────────
# Portfolios
# ──────────────────────────────────────────────────────────────

def _portfolio_base_stmt(user_id: uuid.UUID, portfolio_id: uuid.UUID | None = None):
    """Base SELECT for portfolio(s) with aggregated trade columns."""
    stmt = (
        select(
            Portfolio.id,
            Portfolio.name,
            Portfolio.initial_capital,
            Portfolio.description,
            Portfolio.is_active,
            Portfolio.created_at,
            func.coalesce(func.sum(Trade.profit_amount), 0).label("total_profit"),
            func.count(Trade.id).label("total_trades"),
        )
        .outerjoin(Trade, Trade.portfolio_id == Portfolio.id)
        .where(Portfolio.user_id == user_id)
        .group_by(Portfolio.id)
    )
    if portfolio_id is not None:
        stmt = stmt.where(Portfolio.id == portfolio_id)
    return stmt


def _portfolio_row_to_dict(row) -> dict:
    """Convert a raw portfolio aggregate row to a plain dict."""
    initial_capital = float(row.initial_capital)
    total_profit = float(row.total_profit)
    return {
        "id": row.id,
        "name": row.name,
        "initial_capital": initial_capital,
        "description": row.description,
        "is_active": row.is_active,
        "created_at": row.created_at,
        "total_profit": total_profit,
        "total_trades": row.total_trades,
        "current_capital": initial_capital + total_profit,
    }


async def list_portfolios(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> list[dict]:
    """List all portfolios for user with computed aggregate columns."""
    stmt = _portfolio_base_stmt(user_id).order_by(Portfolio.created_at.desc())
    rows = (await db.execute(stmt)).all()
    return [_portfolio_row_to_dict(r) for r in rows]


async def get_portfolio(
    db: AsyncSession,
    user_id: uuid.UUID,
    portfolio_id: uuid.UUID,
) -> dict | None:
    """Single portfolio with aggregates."""
    row = (await db.execute(_portfolio_base_stmt(user_id, portfolio_id))).one_or_none()
    return _portfolio_row_to_dict(row) if row is not None else None


async def create_portfolio(
    db: AsyncSession,
    user_id: uuid.UUID,
    data: dict,
) -> Portfolio:
    """Create a new portfolio."""
    portfolio = Portfolio(
        user_id=user_id,
        name=data["name"],
        initial_capital=data["initial_capital"],
        description=data.get("description"),
        is_active=data.get("is_active", True),
    )
    db.add(portfolio)
    await db.flush()
    await db.refresh(portfolio)
    return portfolio


async def update_portfolio(
    db: AsyncSession,
    user_id: uuid.UUID,
    portfolio_id: uuid.UUID,
    data: dict,
) -> bool:
    """Update portfolio, return True if found and updated."""
    stmt = (
        update(Portfolio)
        .where(Portfolio.user_id == user_id, Portfolio.id == portfolio_id)
        .values(**data)
    )
    result = await db.execute(stmt)
    return result.rowcount > 0


async def delete_portfolio(
    db: AsyncSession,
    user_id: uuid.UUID,
    portfolio_id: uuid.UUID,
) -> bool:
    """Delete portfolio, return True if found."""
    stmt = (
        delete(Portfolio)
        .where(Portfolio.user_id == user_id, Portfolio.id == portfolio_id)
    )
    result = await db.execute(stmt)
    return result.rowcount > 0


# ──────────────────────────────────────────────────────────────
# Trades
# ──────────────────────────────────────────────────────────────

async def list_trades(
    db: AsyncSession,
    user_id: uuid.UUID,
    *,
    limit: int = 100,
    offset: int = 0,
    # Filters
    trade_type: list[str] | None = None,
    style: list[str] | None = None,
    direction: str | None = None,
    status: list[str] | None = None,
    pair: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    portfolio_id: list[uuid.UUID] | None = None,
    include_inactive: bool = False,
) -> tuple[list[Trade], int]:
    """
    List trades with filters + pagination.
    Returns (trades, total_count).
    """
    base = select(Trade).where(Trade.user_id == user_id)

    # Filter by active portfolios (default)
    if not include_inactive:
        active_ids_q = select(Portfolio.id).where(
            Portfolio.user_id == user_id, Portfolio.is_active.is_(True)
        )
        base = base.where(Trade.portfolio_id.in_(active_ids_q))

    if trade_type:
        base = base.where(Trade.type.in_(trade_type))
    if style:
        base = base.where(Trade.style.in_(style))
    if direction:
        base = base.where(Trade.direction == direction)
    if status:
        base = base.where(Trade.status.in_(status))
    if pair:
        base = base.where(Trade.pair == pair)
    if date_from:
        base = base.where(Trade.date >= date_from)
    if date_to:
        base = base.where(Trade.date <= date_to)
    if portfolio_id:
        base = base.where(Trade.portfolio_id.in_(portfolio_id))

    # Total count
    count_stmt = select(func.count()).select_from(base.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0

    # Paginated results with eager-loaded images and portfolio info
    stmt = (
        base
        .options(selectinload(Trade.images), selectinload(Trade.portfolio))
        .order_by(Trade.date.asc())
        .limit(limit)
        .offset(offset)
    )
    rows = (await db.execute(stmt)).scalars().all()
    return list(rows), total


async def get_all_trades_for_analysis(
    db: AsyncSession,
    user_id: uuid.UUID,
    *,
    trade_type: list[str] | None = None,
    style: list[str] | None = None,
    direction: str | None = None,
    status: list[str] | None = None,
    pair: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    portfolio_id: list[uuid.UUID] | None = None,
    include_inactive: bool = False,
) -> list[Trade]:
    """Fetch all matching trades (no pagination) for metrics/charts."""
    base = select(Trade).where(Trade.user_id == user_id)

    if not include_inactive:
        active_ids_q = select(Portfolio.id).where(
            Portfolio.user_id == user_id, Portfolio.is_active.is_(True)
        )
        base = base.where(Trade.portfolio_id.in_(active_ids_q))

    if trade_type:
        base = base.where(Trade.type.in_(trade_type))
    if style:
        base = base.where(Trade.style.in_(style))
    if direction:
        base = base.where(Trade.direction == direction)
    if status:
        base = base.where(Trade.status.in_(status))
    if pair:
        base = base.where(Trade.pair == pair)
    if date_from:
        base = base.where(Trade.date >= date_from)
    if date_to:
        base = base.where(Trade.date <= date_to)
    if portfolio_id:
        base = base.where(Trade.portfolio_id.in_(portfolio_id))

    stmt = base.options(selectinload(Trade.portfolio)).order_by(Trade.date.asc())
    rows = (await db.execute(stmt)).scalars().all()
    return list(rows)


async def get_trade(
    db: AsyncSession,
    user_id: uuid.UUID,
    trade_id: uuid.UUID,
) -> Trade | None:
    """Single trade with images and portfolio."""
    stmt = (
        select(Trade)
        .options(selectinload(Trade.images), selectinload(Trade.portfolio))
        .where(Trade.user_id == user_id, Trade.id == trade_id)
    )
    return (await db.execute(stmt)).scalar_one_or_none()


async def create_trade(
    db: AsyncSession,
    user_id: uuid.UUID,
    data: dict,
) -> Trade:
    """Create a new trade."""
    trade = Trade(user_id=user_id, **data)
    db.add(trade)
    await db.flush()
    await db.refresh(trade, ["images", "portfolio"])
    return trade


async def update_trade(
    db: AsyncSession,
    user_id: uuid.UUID,
    trade_id: uuid.UUID,
    data: dict,
) -> bool:
    """Update trade, return True if found."""
    stmt = (
        update(Trade)
        .where(Trade.user_id == user_id, Trade.id == trade_id)
        .values(**data)
    )
    result = await db.execute(stmt)
    return result.rowcount > 0


async def delete_trade(
    db: AsyncSession,
    user_id: uuid.UUID,
    trade_id: uuid.UUID,
) -> Trade | None:
    """Delete trade; return the trade object (for image cleanup) or None."""
    trade = await get_trade(db, user_id, trade_id)
    if trade is None:
        return None
    await db.delete(trade)
    await db.flush()
    return trade


async def get_orphan_trades(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> list[Trade]:
    """Trades whose portfolio_id is not in active portfolios."""
    active_ids_q = select(Portfolio.id).where(
        Portfolio.user_id == user_id,
    )
    stmt = (
        select(Trade)
        .options(selectinload(Trade.images), selectinload(Trade.portfolio))
        .where(
            Trade.user_id == user_id,
            ~Trade.portfolio_id.in_(active_ids_q),
        )
        .order_by(Trade.date.asc())
    )
    rows = (await db.execute(stmt)).scalars().all()
    return list(rows)


# ──────────────────────────────────────────────────────────────
# Trade Images
# ──────────────────────────────────────────────────────────────

async def add_trade_image(
    db: AsyncSession,
    user_id: uuid.UUID,
    trade_id: uuid.UUID,
    filename: str,
    storage_path: str,
    file_size: int | None = None,
    mime_type: str | None = None,
    caption: str | None = None,
) -> TradeImage:
    """Add an image record to a trade."""
    # Determine next sort_order
    count_stmt = select(func.count()).select_from(TradeImage).where(
        TradeImage.trade_id == trade_id
    )
    count = (await db.execute(count_stmt)).scalar() or 0

    image = TradeImage(
        trade_id=trade_id,
        user_id=user_id,
        filename=filename,
        storage_path=storage_path,
        sort_order=count,
        file_size=file_size,
        mime_type=mime_type,
        caption=caption,
    )
    db.add(image)
    await db.flush()
    await db.refresh(image)
    return image


async def get_trade_images(
    db: AsyncSession,
    trade_id: uuid.UUID,
    user_id: uuid.UUID,
) -> list[TradeImage]:
    """All images for a trade (owned by user)."""
    stmt = (
        select(TradeImage)
        .where(TradeImage.trade_id == trade_id, TradeImage.user_id == user_id)
        .order_by(TradeImage.sort_order)
    )
    return list((await db.execute(stmt)).scalars().all())


async def get_image_by_id(
    db: AsyncSession,
    image_id: uuid.UUID,
    user_id: uuid.UUID,
) -> TradeImage | None:
    """Single image by ID (scoped)."""
    stmt = select(TradeImage).where(
        TradeImage.id == image_id, TradeImage.user_id == user_id
    )
    return (await db.execute(stmt)).scalar_one_or_none()


async def delete_image(
    db: AsyncSession,
    image_id: uuid.UUID,
    user_id: uuid.UUID,
) -> TradeImage | None:
    """Delete a single image record; return it for file cleanup."""
    image = await get_image_by_id(db, image_id, user_id)
    if image is None:
        return None
    await db.delete(image)
    await db.flush()
    return image


async def delete_all_images_for_trade(
    db: AsyncSession,
    trade_id: uuid.UUID,
    user_id: uuid.UUID,
) -> list[TradeImage]:
    """Delete all images for a trade, return list for file cleanup."""
    images = await get_trade_images(db, trade_id, user_id)
    for img in images:
        await db.delete(img)
    await db.flush()
    return images


async def reorder_images(
    db: AsyncSession,
    trade_id: uuid.UUID,
    user_id: uuid.UUID,
    image_ids: list[uuid.UUID],
) -> None:
    """Reorder images for a trade."""
    for idx, img_id in enumerate(image_ids):
        await db.execute(
            update(TradeImage)
            .where(
                TradeImage.id == img_id,
                TradeImage.trade_id == trade_id,
                TradeImage.user_id == user_id,
            )
            .values(sort_order=idx)
        )
    await db.flush()


async def update_image_caption(
    db: AsyncSession,
    image_id: uuid.UUID,
    user_id: uuid.UUID,
    caption: str | None,
) -> TradeImage | None:
    """Update caption for an image."""
    image = await get_image_by_id(db, image_id, user_id)
    if image is None:
        return None
    image.caption = caption
    await db.flush()
    await db.refresh(image)
    return image


# ──────────────────────────────────────────────────────────────
# Clear all journal data for user
# ──────────────────────────────────────────────────────────────

async def clear_user_data(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> dict:
    """Delete all trades, images, portfolios for a user. Return stats."""
    # Count before delete
    trades_count = (await db.execute(
        select(func.count()).select_from(Trade).where(Trade.user_id == user_id)
    )).scalar() or 0
    images_count = (await db.execute(
        select(func.count()).select_from(TradeImage).where(TradeImage.user_id == user_id)
    )).scalar() or 0
    portfolios_count = (await db.execute(
        select(func.count()).select_from(Portfolio).where(Portfolio.user_id == user_id)
    )).scalar() or 0

    # Get image paths for file cleanup
    image_paths_stmt = select(TradeImage.storage_path).where(TradeImage.user_id == user_id)
    image_paths = list((await db.execute(image_paths_stmt)).scalars().all())

    # Delete in order (cascade handles some, but explicit is safer)
    await db.execute(delete(TradeImage).where(TradeImage.user_id == user_id))
    await db.execute(delete(Trade).where(Trade.user_id == user_id))
    await db.execute(delete(Portfolio).where(Portfolio.user_id == user_id))
    await db.flush()

    return {
        "trades_deleted": trades_count,
        "images_deleted": images_count,
        "portfolios_deleted": portfolios_count,
        "image_paths": image_paths,
    }
