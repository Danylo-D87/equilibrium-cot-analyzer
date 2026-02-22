"""Journal tables: portfolios, trades, trade_images, user_journal_settings

Revision ID: 002_journal_tables
Revises: 001_initial_auth
Create Date: 2026-02-21 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "002_journal_tables"
down_revision: Union[str, None] = "001_initial_auth"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- portfolios ---
    op.create_table(
        "portfolios",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("initial_capital", sa.Numeric(15, 2), nullable=False, server_default="0"),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "name", name="uq_portfolio_user_name"),
    )
    op.create_index("idx_portfolios_user", "portfolios", ["user_id"])
    op.create_index("idx_portfolios_active", "portfolios", ["user_id", "is_active"])

    # --- trades ---
    op.create_table(
        "trades",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("portfolio_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("portfolios.id", ondelete="SET NULL"), nullable=True),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("pair", sa.String(50), nullable=False),
        sa.Column("type", sa.String(20), nullable=True),
        sa.Column("style", sa.String(20), nullable=True),
        sa.Column("direction", sa.String(10), nullable=True),
        sa.Column("status", sa.String(10), nullable=True),
        sa.Column("risk_amount", sa.Numeric(15, 2), nullable=True),
        sa.Column("profit_amount", sa.Numeric(15, 2), nullable=True),
        sa.Column("rr_ratio", sa.Numeric(8, 4), nullable=True),
        sa.Column("entry_price", sa.Numeric(20, 8), nullable=True),
        sa.Column("exit_price", sa.Numeric(20, 8), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("idx_trades_user", "trades", ["user_id"])
    op.create_index("idx_trades_user_date", "trades", ["user_id", "date"])
    op.create_index("idx_trades_portfolio", "trades", ["portfolio_id"])
    op.create_index("idx_trades_user_status", "trades", ["user_id", "status"])
    op.create_index("idx_trades_user_pair", "trades", ["user_id", "pair"])

    # --- trade_images ---
    op.create_table(
        "trade_images",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("trade_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("trades.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("filename", sa.String(255), nullable=False),
        sa.Column("storage_path", sa.String(500), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0"),
        sa.Column("file_size", sa.Integer(), nullable=True),
        sa.Column("mime_type", sa.String(100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("idx_images_trade", "trade_images", ["trade_id"])
    op.create_index("idx_images_user", "trade_images", ["user_id"])

    # --- user_journal_settings ---
    op.create_table(
        "user_journal_settings",
        sa.Column("user_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("initial_balance", sa.Numeric(15, 2), server_default="100000"),
        sa.Column("risk_free_rate", sa.Numeric(6, 4), server_default="0.04"),
        sa.Column("default_currency", sa.String(10), server_default="'USD'"),
        sa.Column("display_mode", sa.String(20), server_default="'currency'"),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("user_journal_settings")
    op.drop_table("trade_images")
    op.drop_table("trades")
    op.drop_table("portfolios")
