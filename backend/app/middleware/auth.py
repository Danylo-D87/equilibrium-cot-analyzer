"""
Auth middleware — FastAPI dependencies for authentication and authorization.
=============================================================================
Provides reusable Depends() functions for route protection.
"""

from uuid import UUID

from fastapi import Depends, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session
from app.core.exceptions import AuthenticationError, ForbiddenError
from app.core.models import User
from app.core.security import decode_access_token

# OAuth2 scheme — extracts Bearer token from Authorization header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


async def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_async_session),
) -> User:
    """
    Decode JWT access token and return the corresponding User.

    Raises AuthenticationError (401) if token is missing, invalid, or user not found.
    """
    if token is None:
        raise AuthenticationError("Not authenticated")

    payload = decode_access_token(token)

    user_id = payload.get("sub")
    if user_id is None:
        raise AuthenticationError("Invalid token payload")

    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()

    if user is None:
        raise AuthenticationError("User not found")

    return user


async def get_current_active_user(
    user: User = Depends(get_current_user),
) -> User:
    """
    Ensure the current user is active.

    Raises ForbiddenError (403) if the account is deactivated.
    """
    if not user.is_active:
        raise ForbiddenError("Account is deactivated")
    return user


def require_permission(permission: str):
    """
    Factory that returns a dependency checking for a specific permission.

    Usage::

        @router.get("/trades", dependencies=[Depends(require_permission("journal"))])
        async def list_trades(...): ...

    Admin users implicitly have all permissions.
    """
    async def _check(user: User = Depends(get_current_active_user)) -> User:
        if not user.has_permission(permission):
            raise ForbiddenError(f"Permission '{permission}' required")
        return user

    return _check


def require_admin():
    """
    Dependency that ensures the current user has the 'admin' role.
    """
    async def _check(user: User = Depends(get_current_active_user)) -> User:
        if user.role != "admin":
            raise ForbiddenError("Admin access required")
        return user

    return _check
