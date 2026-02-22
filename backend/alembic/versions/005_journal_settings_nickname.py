"""Add nickname column to user_journal_settings

Revision ID: 005_journal_settings_nickname
Revises: 004_oauth_email_verification
Create Date: 2026-02-22 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "005_journal_settings_nickname"
down_revision: Union[str, None] = "004_oauth_email_verification"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "user_journal_settings",
        sa.Column("nickname", sa.String(100), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("user_journal_settings", "nickname")
