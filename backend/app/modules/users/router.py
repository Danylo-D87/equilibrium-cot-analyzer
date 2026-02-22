"""
Users module — admin API routes.
==================================
GET    /api/v1/users                           — List users
GET    /api/v1/users/{user_id}                 — User detail
PUT    /api/v1/users/{user_id}                 — Update user
DELETE /api/v1/users/{user_id}                 — Deactivate user
GET    /api/v1/users/{user_id}/permissions     — List permissions
POST   /api/v1/users/{user_id}/permissions     — Grant permission
DELETE /api/v1/users/{user_id}/permissions/{perm} — Revoke permission
"""

import logging
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session
from app.core.models import User
from app.middleware.auth import require_admin
from app.modules.users import service as users_service
from app.modules.users.schemas import (
    PermissionRequest,
    PermissionResponse,
    UpdateUserRequest,
    UserDetail,
    UserListItem,
)
from app.modules.auth.schemas import MessageResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["Users (Admin)"])

# All routes require admin role
admin_dep = Depends(require_admin())


def _to_list_item(user: User) -> UserListItem:
    return UserListItem(
        id=user.id,
        email=user.email,
        nickname=user.nickname,
        role=user.role,
        is_active=user.is_active,
        permissions=[p.permission for p in user.permissions],
        created_at=user.created_at,
    )


def _to_detail(user: User) -> UserDetail:
    return UserDetail(
        id=user.id,
        email=user.email,
        nickname=user.nickname,
        role=user.role,
        is_active=user.is_active,
        permissions=[p.permission for p in user.permissions],
        created_at=user.created_at,
        language=user.language,
        timezone=user.timezone,
        email_verified=user.email_verified,
        updated_at=user.updated_at,
    )


@router.get("", response_model=list[UserListItem])
async def list_users(
    db: AsyncSession = Depends(get_async_session),
    _admin: User = admin_dep,
):
    users = await users_service.list_users(db)
    return [_to_list_item(u) for u in users]


@router.get("/{user_id}", response_model=UserDetail)
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_async_session),
    _admin: User = admin_dep,
):
    user = await users_service.get_user(db, user_id)
    return _to_detail(user)


@router.put("/{user_id}", response_model=UserDetail)
async def update_user(
    user_id: UUID,
    body: UpdateUserRequest,
    db: AsyncSession = Depends(get_async_session),
    _admin: User = admin_dep,
):
    user = await users_service.update_user(
        db, user_id,
        role=body.role,
        is_active=body.is_active,
        nickname=body.nickname,
    )
    return _to_detail(user)


@router.delete("/{user_id}", response_model=MessageResponse)
async def deactivate_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_async_session),
    _admin: User = admin_dep,
):
    await users_service.deactivate_user(db, user_id)
    return MessageResponse(message="User deactivated")


# ── Permissions ──────────────────────────────────────────────

@router.get("/{user_id}/permissions", response_model=list[PermissionResponse])
async def list_permissions(
    user_id: UUID,
    db: AsyncSession = Depends(get_async_session),
    _admin: User = admin_dep,
):
    perms = await users_service.list_permissions(db, user_id)
    return perms


@router.post("/{user_id}/permissions", response_model=PermissionResponse, status_code=201)
async def grant_permission(
    user_id: UUID,
    body: PermissionRequest,
    db: AsyncSession = Depends(get_async_session),
    admin: User = admin_dep,
):
    perm = await users_service.grant_permission(
        db, user_id, body.permission, granted_by=admin.id,
    )
    return perm


@router.delete("/{user_id}/permissions/{permission}", response_model=MessageResponse)
async def revoke_permission(
    user_id: UUID,
    permission: str,
    db: AsyncSession = Depends(get_async_session),
    _admin: User = admin_dep,
):
    await users_service.revoke_permission(db, user_id, permission)
    return MessageResponse(message=f"Permission '{permission}' revoked")
