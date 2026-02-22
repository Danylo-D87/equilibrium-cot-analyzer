"""
SQLAlchemy models for PostgreSQL (auth + journal).
====================================================
COT data stays in SQLite — these models are NOT used by the COT module.

Uses SQLAlchemy 2.0 declarative style with Mapped[] type annotations.
"""

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    mapped_column,
    relationship,
)


class Base(DeclarativeBase):
    """Shared declarative base for all PostgreSQL models."""
    pass


# ──────────────────────────────────────────────────────────────
# Auth models
# ──────────────────────────────────────────────────────────────

class User(Base):
    """Platform user account."""

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    nickname: Mapped[str | None] = mapped_column(String(100))
    language: Mapped[str] = mapped_column(String(5), default="en")
    timezone: Mapped[str] = mapped_column(String(50), default="Europe/Kiev")
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="user", index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    permissions: Mapped[list["UserPermission"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", lazy="selectin",
        foreign_keys="UserPermission.user_id",
    )
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    oauth_accounts: Mapped[list["OAuthAccount"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    email_verifications: Mapped[list["EmailVerification"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    def has_permission(self, permission: str) -> bool:
        """Check if user has a specific permission (admin has all)."""
        if self.role == "admin":
            return True
        return any(p.permission == permission for p in self.permissions)

    def __repr__(self) -> str:
        return f"<User {self.email} role={self.role}>"


class UserPermission(Base):
    """Per-module permission grant for a user."""

    __tablename__ = "user_permissions"
    __table_args__ = (
        UniqueConstraint("user_id", "permission", name="uq_user_permission"),
        Index("idx_permissions_user", "user_id"),
        Index("idx_permissions_perm", "permission"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    permission: Mapped[str] = mapped_column(String(50), nullable=False)
    granted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    granted_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="permissions", foreign_keys=[user_id])

    def __repr__(self) -> str:
        return f"<UserPermission user={self.user_id} perm={self.permission}>"


class RefreshToken(Base):
    """Hashed refresh token for JWT rotation."""

    __tablename__ = "refresh_tokens"
    __table_args__ = (
        Index("idx_refresh_user", "user_id"),
        Index("idx_refresh_expires", "expires_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    revoked: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="refresh_tokens")

    def __repr__(self) -> str:
        return f"<RefreshToken user={self.user_id} revoked={self.revoked}>"


# ──────────────────────────────────────────────────────────────
# OAuth accounts
# ──────────────────────────────────────────────────────────────

class OAuthAccount(Base):
    """Linked OAuth provider account for a user."""

    __tablename__ = "oauth_accounts"
    __table_args__ = (
        UniqueConstraint("provider", "provider_user_id", name="uq_oauth_provider_uid"),
        Index("idx_oauth_user", "user_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    provider: Mapped[str] = mapped_column(String(20), nullable=False)  # google|github|linkedin
    provider_user_id: Mapped[str] = mapped_column(String(255), nullable=False)
    provider_email: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="oauth_accounts")

    def __repr__(self) -> str:
        return f"<OAuthAccount {self.provider}:{self.provider_user_id}>"


# ──────────────────────────────────────────────────────────────
# Email verification codes
# ──────────────────────────────────────────────────────────────

class EmailVerification(Base):
    """One-time email verification code (SHA-256 hashed)."""

    __tablename__ = "email_verifications"
    __table_args__ = (
        Index("idx_email_verif_user", "user_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    code_hash: Mapped[str] = mapped_column(String(64), nullable=False)  # SHA-256 hex
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="email_verifications")

    def __repr__(self) -> str:
        return f"<EmailVerification user={self.user_id} used={self.used}>"
