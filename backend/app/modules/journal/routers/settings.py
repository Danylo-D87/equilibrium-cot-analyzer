"""Journal settings endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session
from app.core.models import User
from app.modules.journal import storage
from app.modules.journal.routers._deps import journal_perm
from app.modules.journal.schemas import JournalSettingsResponse, JournalSettingsUpdate

router = APIRouter(tags=["Journal"])


@router.get("/settings", response_model=JournalSettingsResponse)
async def get_settings_endpoint(
    user: User = Depends(journal_perm),
    db: AsyncSession = Depends(get_async_session),
):
    """Get journal settings for current user."""
    return await storage.get_settings(db, user.id)


@router.put("/settings", response_model=JournalSettingsResponse)
async def update_settings_endpoint(
    body: JournalSettingsUpdate,
    user: User = Depends(journal_perm),
    db: AsyncSession = Depends(get_async_session),
):
    """Update journal settings for current user."""
    data = body.model_dump(exclude_unset=True)
    return await storage.update_settings(db, user.id, data)
