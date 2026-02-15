"""
FastAPI Application Factory.
==============================
Creates and configures the application, mounts module routers,
and manages the scheduler lifecycle.
"""

import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.exceptions import AppError
from app.core.logging import setup_logging
from app.core import scheduler as core_scheduler

# --- Module routers ---
from app.modules.cot.router import router as cot_router
from app.modules.cot.scheduler import register_scheduled_job
from app.modules.prices.scheduler import register_daily_price_job

logger = logging.getLogger(__name__)


# ------------------------------------------------------------------
# Lifespan
# ------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: configure logging, create dirs, start scheduler."""
    setup_logging()
    settings.ensure_directories()

    logger.info("Starting %s v%s", settings.app_name, settings.app_version)

    # Register module jobs and start scheduler (can be disabled via env var)
    import os
    if os.getenv("DISABLE_SCHEDULER", "").lower() not in ("1", "true", "yes"):
        register_scheduled_job()       # COT pipeline — every Friday 23:00 Kyiv
        register_daily_price_job()     # Price update — every day 00:00 Kyiv
        core_scheduler.start()
        logger.info("Background scheduler started")
    else:
        logger.warning("Background scheduler DISABLED (DISABLE_SCHEDULER is set)")

    yield

    logger.info("Shutting down...")
    core_scheduler.shutdown()


# ------------------------------------------------------------------
# App factory
# ------------------------------------------------------------------

def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title=settings.app_name,
        description="Financial data analytics platform — COT reports, price data, and more.",
        version=settings.app_version,
        lifespan=lifespan,
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
    )

    # --- CORS ---
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.api_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # --- Exception handler ---
    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message},
        )

    # --- Mount module routers ---
    app.include_router(cot_router, prefix="/api/v1")

    # Future modules will be mounted here:
    # app.include_router(some_other_router, prefix="/api/v1")

    return app


# Application instance used by uvicorn
app = create_app()
