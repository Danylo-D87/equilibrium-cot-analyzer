"""
Journal service — business logic layer.
=========================================
Bridges router ↔ storage/analyzer. Handles trade model → schema conversion,
filter application, and orchestration of complex operations.
"""

from __future__ import annotations

import uuid
from datetime import date
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.journal import storage
from app.modules.journal.models import Trade, Portfolio
from app.modules.journal.schemas import (
    TradeResponse,
    TradeImageResponse,
    PortfolioResponse,
    OrphanSummary,
)


# ──────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────

def trade_to_response(trade: Trade) -> TradeResponse:
    """Convert ORM Trade → Pydantic response."""
    return TradeResponse(
        id=trade.id,
        date=trade.date,
        pair=trade.pair,
        type=trade.type,
        style=trade.style,
        direction=trade.direction,
        status=trade.status,
        risk_amount=float(trade.risk_amount) if trade.risk_amount is not None else None,
        profit_amount=float(trade.profit_amount) if trade.profit_amount is not None else None,
        rr_ratio=float(trade.rr_ratio) if trade.rr_ratio is not None else None,
        entry_price=float(trade.entry_price) if trade.entry_price is not None else None,
        exit_price=float(trade.exit_price) if trade.exit_price is not None else None,
        notes=trade.notes,
        portfolio_id=trade.portfolio_id,
        portfolio_name=trade.portfolio.name if trade.portfolio else None,
        portfolio_initial_capital=(
            float(trade.portfolio.initial_capital) if trade.portfolio else None
        ),
        images=[
            TradeImageResponse.model_validate(img) for img in (trade.images or [])
        ],
        created_at=trade.created_at,
        updated_at=trade.updated_at,
    )


def _portfolio_dict_to_response(d: dict) -> PortfolioResponse:
    """Convert storage dict → Pydantic response."""
    return PortfolioResponse(**d)


# ──────────────────────────────────────────────────────────────
# Trade filter kwargs builder
# ──────────────────────────────────────────────────────────────

def build_filter_kwargs(
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
) -> dict:
    """Build kwargs dict for storage.list_trades / get_all_trades_for_analysis."""
    return {
        "trade_type": trade_type,
        "style": style,
        "direction": direction,
        "status": status,
        "pair": pair,
        "date_from": date_from,
        "date_to": date_to,
        "portfolio_id": portfolio_id,
        "include_inactive": include_inactive,
    }


# ──────────────────────────────────────────────────────────────
# Trades for analyzer (converts ORM → dicts for pandas)
# ──────────────────────────────────────────────────────────────

def trades_to_dicts(trades: list[Trade]) -> list[dict]:
    """
    Convert ORM Trade objects to flat dicts compatible with PortfolioAnalyzer.
    Keys match by_alias names from Fundamental's pydantic Trade model.
    """
    result = []
    for t in trades:
        result.append({
            "id": str(t.id),
            "date": t.date,
            "pair": t.pair,
            "type": t.type,
            "style": t.style,
            "direction": t.direction,
            "status": t.status,
            "risk_amount": float(t.risk_amount) if t.risk_amount is not None else 0.0,
            "profit_amount": float(t.profit_amount) if t.profit_amount is not None else 0.0,
            "rr_ratio": float(t.rr_ratio) if t.rr_ratio is not None else 0.0,
            "entry_price": float(t.entry_price) if t.entry_price is not None else None,
            "exit_price": float(t.exit_price) if t.exit_price is not None else None,
            "notes": t.notes,
            "portfolio_id": str(t.portfolio_id) if t.portfolio_id else None,
            "portfolio_name": t.portfolio.name if t.portfolio else None,
            "portfolio_initial_capital": (
                float(t.portfolio.initial_capital) if t.portfolio else None
            ),
        })
    return result


def get_initial_balance_for_trades(
    trades: list[Trade],
    user_settings_balance: float,
    portfolio_ids: list[uuid.UUID] | None = None,
    portfolios: list[dict] | None = None,
) -> float:
    """
    Calculate initial_balance based on selected portfolios.
    Mirrors Fundamental's get_initial_balance_for_portfolios().
    """
    if not portfolios:
        return user_settings_balance

    if not portfolio_ids:
        return sum(p["initial_capital"] for p in portfolios)

    selected = [p for p in portfolios if p["id"] in portfolio_ids]
    if not selected:
        return user_settings_balance

    return sum(p["initial_capital"] for p in selected)


# ──────────────────────────────────────────────────────────────
# Orphan summary
# ──────────────────────────────────────────────────────────────

def orphan_summary(trades: list[Trade]) -> OrphanSummary:
    if not trades:
        return OrphanSummary(count=0, total_profit=0.0, unique_portfolio_ids=[])

    total_profit = sum(
        float(t.profit_amount) for t in trades if t.profit_amount is not None
    )
    unique_ids = list({str(t.portfolio_id) for t in trades if t.portfolio_id})
    return OrphanSummary(
        count=len(trades),
        total_profit=round(total_profit, 2),
        unique_portfolio_ids=unique_ids,
    )
