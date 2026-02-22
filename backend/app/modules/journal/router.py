"""
Journal module — router assembly.
===================================
Mounts sub-routers for each domain at the ``/journal`` prefix.
Business logic lives in the individual sub-router modules under ``routers/``.
"""

from fastapi import APIRouter

from app.modules.journal.routers.analytics import router as analytics_router
from app.modules.journal.routers.enums import router as enums_router
from app.modules.journal.routers.images import router as images_router
from app.modules.journal.routers.portfolios import router as portfolios_router
from app.modules.journal.routers.settings import router as settings_router
from app.modules.journal.routers.trades import router as trades_router

router = APIRouter(prefix="/journal", tags=["Journal"])

router.include_router(settings_router)
router.include_router(portfolios_router)
router.include_router(trades_router)
router.include_router(images_router)
router.include_router(analytics_router)
router.include_router(enums_router)
