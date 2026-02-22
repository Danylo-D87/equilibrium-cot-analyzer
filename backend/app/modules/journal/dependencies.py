"""
Journal module FastAPI dependencies.
"""

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session
from app.core.models import User
from app.middleware.auth import require_permission


# Re-export for convenience in router
journal_permission = Depends(require_permission("journal"))


async def get_journal_db(
    db: AsyncSession = Depends(get_async_session),
) -> AsyncSession:
    """Alias for DB session dependency (explicit journal scope)."""
    return db
