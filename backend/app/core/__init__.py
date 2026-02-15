"""
Core infrastructure — shared across all modules.
"""

from app.core.config import settings
from app.core.exceptions import AppError, NotFoundError, ConflictError

__all__ = ["settings", "AppError", "NotFoundError", "ConflictError"]
