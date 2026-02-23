"""
Pydantic schemas for the Journal module.
=========================================
Request/response schemas for trades, portfolios, images, settings, metrics,
and all 13 chart endpoints.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal

# Alias to avoid field-name-shadows-type-annotation bug with `from __future__ import annotations`
DateType = date
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ──────────────────────────────────────────────────────────────
# Enums
# ──────────────────────────────────────────────────────────────

class TradeType(str, Enum):
    OPTION = "Option"
    FUTURES = "Futures"


class TradeStyle(str, Enum):
    SWING = "Swing"
    INTRADAY = "Intraday"
    SMART_IDEA = "Smart Idea"


class TradeDirection(str, Enum):
    LONG = "Long"
    SHORT = "Short"


class TradeStatus(str, Enum):
    TP = "TP"
    SL = "SL"
    BE = "BE"
    ACTIVE = "Active"


# ──────────────────────────────────────────────────────────────
# Settings
# ──────────────────────────────────────────────────────────────

class JournalSettingsResponse(BaseModel):
    initial_balance: float = 100000.0
    risk_free_rate: float = 0.04
    default_currency: str = "USD"
    display_mode: str = "currency"
    nickname: Optional[str] = None

    model_config = {"from_attributes": True}


class JournalSettingsUpdate(BaseModel):
    initial_balance: Optional[float] = Field(None, ge=0)
    risk_free_rate: Optional[float] = Field(None, ge=0, le=1)
    default_currency: Optional[str] = Field(None, max_length=10)
    display_mode: Optional[str] = Field(None, pattern=r"^(currency|percentage)$")
    nickname: Optional[str] = Field(None, max_length=100)


# ──────────────────────────────────────────────────────────────
# Portfolios
# ──────────────────────────────────────────────────────────────

class PortfolioCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    initial_capital: float = Field(..., ge=0)
    description: Optional[str] = None
    is_active: bool = True


class PortfolioUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    initial_capital: Optional[float] = Field(None, ge=0)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class PortfolioResponse(BaseModel):
    id: uuid.UUID
    name: str
    initial_capital: float
    description: Optional[str] = None
    is_active: bool
    total_profit: float = 0.0
    total_trades: int = 0
    current_capital: float = 0.0
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────────────────────────
# Trade Images
# ──────────────────────────────────────────────────────────────

class TradeImageResponse(BaseModel):
    id: uuid.UUID
    filename: str
    storage_path: str
    sort_order: int
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    caption: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ImageReorderRequest(BaseModel):
    image_ids: list[uuid.UUID] = Field(..., description="Image IDs in desired order")


class ImageCaptionUpdate(BaseModel):
    caption: Optional[str] = Field(None, max_length=2000, description="Image caption/comment")


# ──────────────────────────────────────────────────────────────
# Trades
# ──────────────────────────────────────────────────────────────

class TradeCreate(BaseModel):
    date: DateType
    pair: str = Field(..., min_length=1, max_length=50)
    type: Optional[TradeType] = None
    style: Optional[TradeStyle] = None
    direction: Optional[TradeDirection] = None
    status: Optional[TradeStatus] = None
    risk_amount: float = Field(0, ge=0)
    profit_amount: Optional[float] = 0
    rr_ratio: float = Field(0, ge=0)
    notes: Optional[str] = None
    portfolio_id: uuid.UUID
    entry_price: Optional[float] = None
    exit_price: Optional[float] = None

    model_config = {"populate_by_name": True}


class TradeUpdate(BaseModel):
    date: Optional[DateType] = None
    pair: Optional[str] = Field(None, min_length=1, max_length=50)
    type: Optional[TradeType] = None
    style: Optional[TradeStyle] = None
    direction: Optional[TradeDirection] = None
    status: Optional[TradeStatus] = None
    risk_amount: Optional[float] = Field(None, ge=0)
    profit_amount: Optional[float] = None
    rr_ratio: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None
    portfolio_id: Optional[uuid.UUID] = None
    entry_price: Optional[float] = None
    exit_price: Optional[float] = None

    model_config = {"populate_by_name": True}


class TradeResponse(BaseModel):
    id: uuid.UUID
    date: DateType
    pair: str
    type: Optional[str] = None
    style: Optional[str] = None
    direction: Optional[str] = None
    status: Optional[str] = None
    risk_amount: Optional[float] = None
    profit_amount: Optional[float] = None
    rr_ratio: Optional[float] = None
    entry_price: Optional[float] = None
    exit_price: Optional[float] = None
    notes: Optional[str] = None
    portfolio_id: Optional[uuid.UUID] = None
    portfolio_name: Optional[str] = None
    portfolio_initial_capital: Optional[float] = None
    images: list[TradeImageResponse] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PaginatedTradesResponse(BaseModel):
    items: list[TradeResponse]
    total: int
    limit: int
    offset: int


class OrphanSummary(BaseModel):
    count: int
    total_profit: float
    unique_portfolio_ids: list[str]


# ──────────────────────────────────────────────────────────────
# Metrics
# ──────────────────────────────────────────────────────────────

class PortfolioMetrics(BaseModel):
    # Basic
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    # NAV
    initial_balance: float
    current_nav: float
    total_profit: float
    portfolio_return: float
    high_watermark: float
    # Benchmark
    benchmark_return: float
    excess_return: float
    # Drawdown
    max_drawdown_portfolio: float
    max_drawdown_benchmark: float
    drawdown_outperformance: float
    # Risk
    beta: float
    expected_return: float
    information_ratio: float
    tracking_error: float
    sharpe_ratio: float
    sortino_ratio: Optional[float] = None
    # 30D Rolling
    correlation_30d: float
    excess_return_30d_annualized: float
    sharpe_30d: float
    sortino_30d: Optional[float] = None
    # R-metrics
    total_r: float
    average_r: float
    # Interpretation
    ir_interpretation: str
    risk_level: str


# ──────────────────────────────────────────────────────────────
# Chart data points
# ──────────────────────────────────────────────────────────────

class EquityCurvePoint(BaseModel):
    date: date
    portfolio_nav: float
    benchmark_nav: float
    portfolio_drawdown: float
    benchmark_drawdown: float


class AssetsExposure(BaseModel):
    pair: str
    long_count: int
    short_count: int
    long_profit: float
    short_profit: float
    total_profit: float
    win_rate: float
    total_trades: int


class AlphaCurvePoint(BaseModel):
    date: date
    cumulative_alpha: float


class DrawdownPoint(BaseModel):
    date: date
    portfolio_drawdown: float
    benchmark_drawdown: float


class RollingMetricsPoint(BaseModel):
    date: date
    rolling_beta: Optional[float] = None
    rolling_correlation: Optional[float] = None
    rolling_sharpe: Optional[float] = None


class DailyReturnPoint(BaseModel):
    date: date
    portfolio_return: float
    benchmark_return: float


class RollingWinRatePoint(BaseModel):
    date: date
    win_rate: float
    winning_trades: int
    total_trades: int


class RMultipleDistribution(BaseModel):
    r_bucket: str
    count: int
    percentage: float


class RiskAdjustedComparison(BaseModel):
    metric_name: str
    portfolio_value: float
    benchmark_value: float


class NAVHistoryPoint(BaseModel):
    date: date
    nav: float


class RollingInformationRatioPoint(BaseModel):
    date: date
    information_ratio: float


class ExpectedVsActualReturn(BaseModel):
    metric_name: str
    return_value: float


class ComparativeDrawdownPoint(BaseModel):
    date: date
    portfolio_drawdown: float
    btc_drawdown: float


class NAVvsHighWatermarkPoint(BaseModel):
    date: date
    nav: float
    high_watermark: float


class RollingTrackingErrorPoint(BaseModel):
    date: date
    tracking_error: float


# ──────────────────────────────────────────────────────────────
# Generic
# ──────────────────────────────────────────────────────────────

class MessageResponse(BaseModel):
    message: str
