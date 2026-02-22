"""Add OAuth accounts, email verifications; make password_hash nullable

Revision ID: 004_oauth_email_verification
Revises: 003_image_caption
Create Date: 2026-02-22 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "004_oauth_email_verification"
down_revision: Union[str, None] = "003_image_caption"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Make password_hash nullable (OAuth users have no password)
    op.alter_column("users", "password_hash", nullable=True)

    # --- oauth_accounts ---
    op.create_table(
        "oauth_accounts",
        sa.Column(
            "id", postgresql.UUID(as_uuid=True), primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "user_id", postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False,
        ),
        sa.Column("provider", sa.String(20), nullable=False),
        sa.Column("provider_user_id", sa.String(255), nullable=False),
        sa.Column("provider_email", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("provider", "provider_user_id", name="uq_oauth_provider_uid"),
    )
    op.create_index("idx_oauth_user", "oauth_accounts", ["user_id"])

    # --- email_verifications ---
    op.create_table(
        "email_verifications",
        sa.Column(
            "id", postgresql.UUID(as_uuid=True), primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "user_id", postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False,
        ),
        sa.Column("code_hash", sa.String(64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("idx_email_verif_user", "email_verifications", ["user_id"])


def downgrade() -> None:
    op.drop_index("idx_email_verif_user", "email_verifications")
    op.drop_table("email_verifications")
    op.drop_index("idx_oauth_user", "oauth_accounts")
    op.drop_table("oauth_accounts")
    op.alter_column("users", "password_hash", nullable=False)
