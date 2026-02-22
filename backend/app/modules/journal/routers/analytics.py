"""
Journal analytics endpoints — metrics, equity curve, assets exposure, and 13 charts.
=====================================================================================
All PortfolioAnalyzer calls run in a thread-pool executor so that the CPU-bound
numpy/pandas work does not block the async event loop.
"""

from __future__ import annotations

import uuid
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session
from app.core.models import User
from app.modules.journal.routers._deps import (
    fetch_chart_data,
    journal_perm,
    run_in_threadpool,
)
from app.modules.journal.schemas import (
    AlphaCurvePoint,
    AssetsExposure,
    ComparativeDrawdownPoint,
    DailyReturnPoint,
    DrawdownPoint,
    EquityCurvePoint,
    ExpectedVsActualReturn,
    NAVHistoryPoint,
    NAVvsHighWatermarkPoint,
    PortfolioMetrics,
    RiskAdjustedComparison,
    RMultipleDistribution,
    RollingInformationRatioPoint,
    RollingMetricsPoint,
    RollingTrackingErrorPoint,
    RollingWinRatePoint,
)

router = APIRouter(tags=["Journal"])

# ---------------------------------------------------------------------------
# Shared filter parameters type alias (for readability in function signatures)
# ---------------------------------------------------------------------------
_TT = Optional[list[str]]    # trade_type
_LS = Optional[list[str]]    # list[str]
_OS = Optional[str]          # optional str
_OD = Optional[date]         # optional date
_UID = Optional[list[uuid.UUID]]


# ---------------------------------------------------------------------------
# METRICS
# ---------------------------------------------------------------------------

@router.get("/metrics", response_model=PortfolioMetrics)
async def get_metrics(
    trade_type: _TT = Query(None, alias="type"),
    style: _LS = Query(None),
    direction: _OS = None,
    status: _LS = Query(None),
    pair: _OS = None,
    date_from: _OD = None,
    date_to: _OD = None,
    portfolio_id: _UID = Query(None),
    include_inactive: bool = False,
    user: User = Depends(journal_perm),
    db: AsyncSession = Depends(get_async_session),
):
    """Calculate portfolio metrics with optional filters."""
    td, analyzer = await fetch_chart_data(
        db, user.id,
        trade_type=trade_type, style=style, direction=direction,
        status=status, pair=pair, date_from=date_from,
        date_to=date_to, portfolio_id=portfolio_id,
        include_inactive=include_inactive,
    )
    return await run_in_threadpool(
        analyzer.calculate_metrics, td, date_from=date_from, date_to=date_to
    )


# ---------------------------------------------------------------------------
# EQUITY CURVE
# ---------------------------------------------------------------------------

@router.get("/equity-curve", response_model=list[EquityCurvePoint])
async def get_equity_curve(
    trade_type: _TT = Query(None, alias="type"),
    style: _LS = Query(None),
    direction: _OS = None,
    status: _LS = Query(None),
    pair: _OS = None,
    date_from: _OD = None,
    date_to: _OD = None,
    portfolio_id: _UID = Query(None),
    include_inactive: bool = False,
    user: User = Depends(journal_perm),
    db: AsyncSession = Depends(get_async_session),
):
    """Get equity curve data (portfolio NAV + benchmark NAV + drawdowns)."""
    td, analyzer = await fetch_chart_data(
        db, user.id,
        trade_type=trade_type, style=style, direction=direction,
        status=status, pair=pair, date_from=date_from,
        date_to=date_to, portfolio_id=portfolio_id,
        include_inactive=include_inactive,
    )
    return await run_in_threadpool(analyzer.get_equity_curve, td)


# ---------------------------------------------------------------------------
# ASSETS EXPOSURE
# ---------------------------------------------------------------------------

@router.get("/assets-exposure", response_model=list[AssetsExposure])
async def get_assets_exposure(
    trade_type: _TT = Query(None, alias="type"),
    style: _LS = Query(None),
    direction: _OS = None,
    status: _LS = Query(None),
    pair: _OS = None,
    date_from: _OD = None,
    date_to: _OD = None,
    portfolio_id: _UID = Query(None),
    include_inactive: bool = False,
    user: User = Depends(journal_perm),
    db: AsyncSession = Depends(get_async_session),
):
    """Get assets exposure statistics per pair."""
    td, analyzer = await fetch_chart_data(
        db, user.id,
        trade_type=trade_type, style=style, direction=direction,
        status=status, pair=pair, date_from=date_from,
        date_to=date_to, portfolio_id=portfolio_id,
        include_inactive=include_inactive,
    )
    return await run_in_threadpool(analyzer.get_assets_exposure, td)


# ---------------------------------------------------------------------------
# CHARTS (13)
# ---------------------------------------------------------------------------

@router.get("/charts/alpha-curve", response_model=list[AlphaCurvePoint])
async def chart_alpha_curve(
    trade_type: _TT = Query(None, alias="type"),
    style: _LS = Query(None),
    direction: _OS = None,
    status: _LS = Query(None),
    pair: _OS = None,
    date_from: _OD = None,
    date_to: _OD = None,
    portfolio_id: _UID = Query(None),
    include_inactive: bool = False,
    user: User = Depends(journal_perm),
    db: AsyncSession = Depends(get_async_session),
):
    td, a = await fetch_chart_data(db, user.id, trade_type=trade_type, style=style, direction=direction, status=status, pair=pair, date_from=date_from, date_to=date_to, portfolio_id=portfolio_id, include_inactive=include_inactive)
    return await run_in_threadpool(a.get_alpha_curve, td)


@router.get("/charts/drawdown", response_model=list[DrawdownPoint])
async def chart_drawdown(
    trade_type: _TT = Query(None, alias="type"),
    style: _LS = Query(None),
    direction: _OS = None,
    status: _LS = Query(None),
    pair: _OS = None,
    date_from: _OD = None,
    date_to: _OD = None,
    portfolio_id: _UID = Query(None),
    include_inactive: bool = False,
    user: User = Depends(journal_perm),
    db: AsyncSession = Depends(get_async_session),
):
    td, a = await fetch_chart_data(db, user.id, trade_type=trade_type, style=style, direction=direction, status=status, pair=pair, date_from=date_from, date_to=date_to, portfolio_id=portfolio_id, include_inactive=include_inactive)
    return await run_in_threadpool(a.get_drawdown_chart, td)


@router.get("/charts/rolling-metrics", response_model=list[RollingMetricsPoint])
async def chart_rolling_metrics(
    trade_type: _TT = Query(None, alias="type"),
    style: _LS = Query(None),
    direction: _OS = None,
    status: _LS = Query(None),
    pair: _OS = None,
    date_from: _OD = None,
    date_to: _OD = None,
    portfolio_id: _UID = Query(None),
    include_inactive: bool = False,
    window: int = Query(30, ge=5),
    user: User = Depends(journal_perm),
    db: AsyncSession = Depends(get_async_session),
):
    td, a = await fetch_chart_data(db, user.id, trade_type=trade_type, style=style, direction=direction, status=status, pair=pair, date_from=date_from, date_to=date_to, portfolio_id=portfolio_id, include_inactive=include_inactive)
    return await run_in_threadpool(a.get_rolling_metrics, td, window=window)


@router.get("/charts/daily-returns", response_model=list[DailyReturnPoint])
async def chart_daily_returns(
    trade_type: _TT = Query(None, alias="type"),
    style: _LS = Query(None),
    direction: _OS = None,
    status: _LS = Query(None),
    pair: _OS = None,
    date_from: _OD = None,
    date_to: _OD = None,
    portfolio_id: _UID = Query(None),
    include_inactive: bool = False,
    user: User = Depends(journal_perm),
    db: AsyncSession = Depends(get_async_session),
):
    td, a = await fetch_chart_data(db, user.id, trade_type=trade_type, style=style, direction=direction, status=status, pair=pair, date_from=date_from, date_to=date_to, portfolio_id=portfolio_id, include_inactive=include_inactive)
    return await run_in_threadpool(a.get_daily_returns, td)


@router.get("/charts/rolling-win-rate", response_model=list[RollingWinRatePoint])
async def chart_rolling_win_rate(
    trade_type: _TT = Query(None, alias="type"),
    style: _LS = Query(None),
    direction: _OS = None,
    status: _LS = Query(None),
    pair: _OS = None,
    date_from: _OD = None,
    date_to: _OD = None,
    portfolio_id: _UID = Query(None),
    include_inactive: bool = False,
    window: int = Query(20, ge=5),
    user: User = Depends(journal_perm),
    db: AsyncSession = Depends(get_async_session),
):
    td, a = await fetch_chart_data(db, user.id, trade_type=trade_type, style=style, direction=direction, status=status, pair=pair, date_from=date_from, date_to=date_to, portfolio_id=portfolio_id, include_inactive=include_inactive)
    return await run_in_threadpool(a.get_rolling_win_rate, td, window=window)


@router.get("/charts/r-multiple-distribution", response_model=list[RMultipleDistribution])
async def chart_r_multiple(
    trade_type: _TT = Query(None, alias="type"),
    style: _LS = Query(None),
    direction: _OS = None,
    status: _LS = Query(None),
    pair: _OS = None,
    date_from: _OD = None,
    date_to: _OD = None,
    portfolio_id: _UID = Query(None),
    include_inactive: bool = False,
    user: User = Depends(journal_perm),
    db: AsyncSession = Depends(get_async_session),
):
    td, a = await fetch_chart_data(db, user.id, trade_type=trade_type, style=style, direction=direction, status=status, pair=pair, date_from=date_from, date_to=date_to, portfolio_id=portfolio_id, include_inactive=include_inactive)
    return await run_in_threadpool(a.get_r_multiple_distribution, td)


@router.get("/charts/risk-adjusted-comparison", response_model=list[RiskAdjustedComparison])
async def chart_risk_adjusted(
    trade_type: _TT = Query(None, alias="type"),
    style: _LS = Query(None),
    direction: _OS = None,
    status: _LS = Query(None),
    pair: _OS = None,
    date_from: _OD = None,
    date_to: _OD = None,
    portfolio_id: _UID = Query(None),
    include_inactive: bool = False,
    user: User = Depends(journal_perm),
    db: AsyncSession = Depends(get_async_session),
):
    td, a = await fetch_chart_data(db, user.id, trade_type=trade_type, style=style, direction=direction, status=status, pair=pair, date_from=date_from, date_to=date_to, portfolio_id=portfolio_id, include_inactive=include_inactive)
    return await run_in_threadpool(a.get_risk_adjusted_comparison, td)


@router.get("/charts/nav-history", response_model=list[NAVHistoryPoint])
async def chart_nav_history(
    trade_type: _TT = Query(None, alias="type"),
    style: _LS = Query(None),
    direction: _OS = None,
    status: _LS = Query(None),
    pair: _OS = None,
    date_from: _OD = None,
    date_to: _OD = None,
    portfolio_id: _UID = Query(None),
    include_inactive: bool = False,
    user: User = Depends(journal_perm),
    db: AsyncSession = Depends(get_async_session),
):
    td, a = await fetch_chart_data(db, user.id, trade_type=trade_type, style=style, direction=direction, status=status, pair=pair, date_from=date_from, date_to=date_to, portfolio_id=portfolio_id, include_inactive=include_inactive)
    return await run_in_threadpool(a.get_nav_history, td)


@router.get("/charts/rolling-information-ratio", response_model=list[RollingInformationRatioPoint])
async def chart_rolling_ir(
    trade_type: _TT = Query(None, alias="type"),
    style: _LS = Query(None),
    direction: _OS = None,
    status: _LS = Query(None),
    pair: _OS = None,
    date_from: _OD = None,
    date_to: _OD = None,
    portfolio_id: _UID = Query(None),
    include_inactive: bool = False,
    window: int = Query(20, ge=5),
    user: User = Depends(journal_perm),
    db: AsyncSession = Depends(get_async_session),
):
    td, a = await fetch_chart_data(db, user.id, trade_type=trade_type, style=style, direction=direction, status=status, pair=pair, date_from=date_from, date_to=date_to, portfolio_id=portfolio_id, include_inactive=include_inactive)
    return await run_in_threadpool(a.get_rolling_information_ratio, td, window=window)


@router.get("/charts/expected-vs-actual-return", response_model=list[ExpectedVsActualReturn])
async def chart_expected_vs_actual(
    trade_type: _TT = Query(None, alias="type"),
    style: _LS = Query(None),
    direction: _OS = None,
    status: _LS = Query(None),
    pair: _OS = None,
    date_from: _OD = None,
    date_to: _OD = None,
    portfolio_id: _UID = Query(None),
    include_inactive: bool = False,
    user: User = Depends(journal_perm),
    db: AsyncSession = Depends(get_async_session),
):
    td, a = await fetch_chart_data(db, user.id, trade_type=trade_type, style=style, direction=direction, status=status, pair=pair, date_from=date_from, date_to=date_to, portfolio_id=portfolio_id, include_inactive=include_inactive)
    return await run_in_threadpool(a.get_expected_vs_actual_return, td)


@router.get("/charts/comparative-drawdown", response_model=list[ComparativeDrawdownPoint])
async def chart_comparative_drawdown(
    trade_type: _TT = Query(None, alias="type"),
    style: _LS = Query(None),
    direction: _OS = None,
    status: _LS = Query(None),
    pair: _OS = None,
    date_from: _OD = None,
    date_to: _OD = None,
    portfolio_id: _UID = Query(None),
    include_inactive: bool = False,
    user: User = Depends(journal_perm),
    db: AsyncSession = Depends(get_async_session),
):
    td, a = await fetch_chart_data(db, user.id, trade_type=trade_type, style=style, direction=direction, status=status, pair=pair, date_from=date_from, date_to=date_to, portfolio_id=portfolio_id, include_inactive=include_inactive)
    return await run_in_threadpool(a.get_comparative_drawdown, td)


@router.get("/charts/nav-vs-high-watermark", response_model=list[NAVvsHighWatermarkPoint])
async def chart_nav_vs_hwm(
    trade_type: _TT = Query(None, alias="type"),
    style: _LS = Query(None),
    direction: _OS = None,
    status: _LS = Query(None),
    pair: _OS = None,
    date_from: _OD = None,
    date_to: _OD = None,
    portfolio_id: _UID = Query(None),
    include_inactive: bool = False,
    user: User = Depends(journal_perm),
    db: AsyncSession = Depends(get_async_session),
):
    td, a = await fetch_chart_data(db, user.id, trade_type=trade_type, style=style, direction=direction, status=status, pair=pair, date_from=date_from, date_to=date_to, portfolio_id=portfolio_id, include_inactive=include_inactive)
    return await run_in_threadpool(a.get_nav_vs_high_watermark, td)


@router.get("/charts/rolling-tracking-error", response_model=list[RollingTrackingErrorPoint])
async def chart_rolling_te(
    trade_type: _TT = Query(None, alias="type"),
    style: _LS = Query(None),
    direction: _OS = None,
    status: _LS = Query(None),
    pair: _OS = None,
    date_from: _OD = None,
    date_to: _OD = None,
    portfolio_id: _UID = Query(None),
    include_inactive: bool = False,
    window: int = Query(20, ge=5),
    user: User = Depends(journal_perm),
    db: AsyncSession = Depends(get_async_session),
):
    td, a = await fetch_chart_data(db, user.id, trade_type=trade_type, style=style, direction=direction, status=status, pair=pair, date_from=date_from, date_to=date_to, portfolio_id=portfolio_id, include_inactive=include_inactive)
    return await run_in_threadpool(a.get_rolling_tracking_error, td, window=window)
