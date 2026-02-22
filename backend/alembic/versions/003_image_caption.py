"""Add caption column to trade_images

Revision ID: 003_image_caption
Revises: 002_journal_tables
Create Date: 2026-02-22 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "003_image_caption"
down_revision: Union[str, None] = "002_journal_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("trade_images", sa.Column("caption", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("trade_images", "caption")
