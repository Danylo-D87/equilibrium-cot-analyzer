"""
SQLAlchemy models for the Journal module (PostgreSQL).
======================================================
All journal data is user-scoped via ``user_id`` foreign key.
Images are stored in a dedicated table instead of comma-separated paths.
"""

import uuid
from datetime import date as date_type, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.models import Base  # shared declarative base


# ──────────────────────────────────────────────────────────────
# Portfolio
# ──────────────────────────────────────────────────────────────

class Portfolio(Base):
    """Trading portfolio (per-user, unique name per user)."""

    __tablename__ = "portfolios"
    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_portfolio_user_name"),
        Index("idx_portfolios_user", "user_id"),
        Index("idx_portfolios_active", "user_id", "is_active"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    initial_capital: Mapped[Decimal] = mapped_column(
        Numeric(15, 2), nullable=False, default=0,
    )
    description: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(),
    )

    # Relationships
    trades: Mapped[list["Trade"]] = relationship(
        back_populates="portfolio", cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Portfolio {self.name!r} user={self.user_id}>"


# ──────────────────────────────────────────────────────────────
# Trade
# ──────────────────────────────────────────────────────────────

class Trade(Base):
    """Single trade entry (per-user)."""

    __tablename__ = "trades"
    __table_args__ = (
        Index("idx_trades_user", "user_id"),
        Index("idx_trades_user_date", "user_id", "date"),
        Index("idx_trades_portfolio", "portfolio_id"),
        Index("idx_trades_user_status", "user_id", "status"),
        Index("idx_trades_user_pair", "user_id", "pair"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False,
    )
    portfolio_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("portfolios.id", ondelete="SET NULL"),
    )
    date: Mapped[date_type] = mapped_column(Date, nullable=False)
    pair: Mapped[str] = mapped_column(String(50), nullable=False)
    type: Mapped[str | None] = mapped_column(String(20))     # Option, Futures
    style: Mapped[str | None] = mapped_column(String(20))    # Swing, Intraday, Smart Idea
    direction: Mapped[str | None] = mapped_column(String(10))  # Long, Short
    status: Mapped[str | None] = mapped_column(String(10))   # TP, SL, BE, Active
    risk_amount: Mapped[Decimal | None] = mapped_column(Numeric(15, 2))
    profit_amount: Mapped[Decimal | None] = mapped_column(Numeric(15, 2))
    rr_ratio: Mapped[Decimal | None] = mapped_column(Numeric(8, 4))
    entry_price: Mapped[Decimal | None] = mapped_column(Numeric(20, 8))
    exit_price: Mapped[Decimal | None] = mapped_column(Numeric(20, 8))
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(),
    )

    # Relationships
    portfolio: Mapped["Portfolio | None"] = relationship(back_populates="trades")
    images: Mapped[list["TradeImage"]] = relationship(
        back_populates="trade", cascade="all, delete-orphan",
        order_by="TradeImage.sort_order",
    )

    def __repr__(self) -> str:
        return f"<Trade {self.pair} {self.date} user={self.user_id}>"


# ──────────────────────────────────────────────────────────────
# Trade Images
# ──────────────────────────────────────────────────────────────

class TradeImage(Base):
    """Image attached to a trade (per-user, separate table)."""

    __tablename__ = "trade_images"
    __table_args__ = (
        Index("idx_images_trade", "trade_id"),
        Index("idx_images_user", "user_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    trade_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("trades.id", ondelete="CASCADE"), nullable=False,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False,
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    file_size: Mapped[int | None] = mapped_column(Integer)
    mime_type: Mapped[str | None] = mapped_column(String(100))
    caption: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )

    # Relationships
    trade: Mapped["Trade"] = relationship(back_populates="images")

    def __repr__(self) -> str:
        return f"<TradeImage {self.filename} trade={self.trade_id}>"


# ──────────────────────────────────────────────────────────────
# User Journal Settings
# ──────────────────────────────────────────────────────────────

class UserJournalSettings(Base):
    """Per-user journal configuration stored in DB (replaces in-memory global)."""

    __tablename__ = "user_journal_settings"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    initial_balance: Mapped[Decimal] = mapped_column(
        Numeric(15, 2), default=100000,
    )
    risk_free_rate: Mapped[Decimal] = mapped_column(
        Numeric(6, 4), default=0.04,
    )
    default_currency: Mapped[str] = mapped_column(String(10), default="USD")
    display_mode: Mapped[str] = mapped_column(String(20), default="currency")
    nickname: Mapped[str | None] = mapped_column(String(100), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(),
    )

    def __repr__(self) -> str:
        return f"<UserJournalSettings user={self.user_id}>"
