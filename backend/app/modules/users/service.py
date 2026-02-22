"""
Users module — admin CRUD service.
=====================================
"""

import logging
from uuid import UUID

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.core.models import User, UserPermission

logger = logging.getLogger(__name__)


async def list_users(db: AsyncSession) -> list[User]:
    """Return all users, ordered by creation date."""
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return list(result.scalars().all())


async def get_user(db: AsyncSession, user_id: UUID) -> User:
    """Return a single user by ID."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise NotFoundError(f"User {user_id} not found")
    return user


async def update_user(
    db: AsyncSession,
    user_id: UUID,
    *,
    role: str | None = None,
    is_active: bool | None = None,
    nickname: str | None = None,
) -> User:
    """Update user fields (admin operation)."""
    user = await get_user(db, user_id)
    if role is not None:
        user.role = role
    if is_active is not None:
        user.is_active = is_active
    if nickname is not None:
        user.nickname = nickname
    logger.info("Admin updated user %s: role=%s active=%s", user.email, role, is_active)
    return user


async def deactivate_user(db: AsyncSession, user_id: UUID) -> User:
    """Deactivate a user (soft delete)."""
    user = await get_user(db, user_id)
    user.is_active = False
    logger.info("Admin deactivated user %s", user.email)
    return user


# ──────────────────────────────────────────────────────────────
# Permissions
# ──────────────────────────────────────────────────────────────

async def list_permissions(db: AsyncSession, user_id: UUID) -> list[UserPermission]:
    """Return all permissions for a user."""
    result = await db.execute(
        select(UserPermission)
        .where(UserPermission.user_id == user_id)
        .order_by(UserPermission.granted_at)
    )
    return list(result.scalars().all())


async def grant_permission(
    db: AsyncSession,
    user_id: UUID,
    permission: str,
    granted_by: UUID,
) -> UserPermission:
    """Grant a permission to a user."""
    # Ensure user exists
    await get_user(db, user_id)

    # Check if already granted
    existing = await db.execute(
        select(UserPermission).where(
            UserPermission.user_id == user_id,
            UserPermission.permission == permission,
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise ConflictError(f"Permission '{permission}' already granted")

    perm = UserPermission(
        user_id=user_id,
        permission=permission,
        granted_by=granted_by,
    )
    db.add(perm)
    await db.flush()
    await db.refresh(perm)
    logger.info("Granted '%s' to user %s", permission, user_id)
    return perm


async def revoke_permission(
    db: AsyncSession,
    user_id: UUID,
    permission: str,
) -> None:
    """Revoke a permission from a user."""
    result = await db.execute(
        delete(UserPermission).where(
            UserPermission.user_id == user_id,
            UserPermission.permission == permission,
        )
    )
    if result.rowcount == 0:
        raise NotFoundError(f"Permission '{permission}' not found for user {user_id}")
    logger.info("Revoked '%s' from user %s", permission, user_id)
