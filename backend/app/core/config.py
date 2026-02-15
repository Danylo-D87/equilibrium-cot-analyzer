"""
Application-level settings.
============================
Base configuration shared by all modules.
Module-specific settings live in their own config.py files.

Uses a simple dataclass-based approach for typed configuration
with sensible defaults and environment variable overrides.
"""

import os
from dataclasses import dataclass, field
from functools import cached_property
from importlib.metadata import version, PackageNotFoundError
from pathlib import Path


def _get_package_version() -> str:
    """Read version from installed package metadata (single source of truth)."""
    try:
        return version("cftc-analyzer")
    except PackageNotFoundError:
        return "0.0.0-dev"


def env(key: str, default: str) -> str:
    """Read an environment variable with a fallback default."""
    return os.environ.get(key, default)


def env_int(key: str, default: int) -> int:
    """Read an int environment variable with a fallback default."""
    return int(os.environ.get(key, str(default)))


def env_bool(key: str, default: bool) -> bool:
    """Read a bool environment variable with a fallback default."""
    return os.environ.get(key, str(default)).lower() in ("true", "1", "yes")


@dataclass(frozen=True)
class Settings:
    """
    Application-wide settings.

    Values can be overridden via environment variables:
        APP_NAME, APP_VERSION, DB_PATH, JSON_OUTPUT_DIR, LOG_DIR,
        API_HOST, API_PORT, API_CORS_ORIGINS, DEBUG
    """

    # --- Application metadata ---
    app_name: str = field(default_factory=lambda: env("APP_NAME", "Market Analytics Platform"))
    app_version: str = field(default_factory=_get_package_version)
    debug: bool = field(default_factory=lambda: env_bool("DEBUG", False))

    # --- Paths ---
    base_dir: Path = field(default_factory=lambda: Path(__file__).resolve().parent.parent.parent)

    @cached_property
    def db_path(self) -> Path:
        custom = os.environ.get("DB_PATH")
        if custom:
            return Path(custom)
        return self.base_dir / "data" / "app.db"

    @cached_property
    def json_output_dir(self) -> Path:
        custom = os.environ.get("JSON_OUTPUT_DIR")
        if custom:
            return Path(custom)
        return self.base_dir.parent / "frontend" / "public" / "data"

    @cached_property
    def log_dir(self) -> Path:
        custom = os.environ.get("LOG_DIR")
        if custom:
            return Path(custom)
        return self.base_dir / "data" / "logs"

    # --- API server ---
    api_host: str = field(default_factory=lambda: env("API_HOST", "127.0.0.1"))
    api_port: int = field(default_factory=lambda: env_int("API_PORT", 8000))
    api_cors_origins: list[str] = field(default_factory=lambda: [
        o.strip() for o in env(
            "API_CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173"
        ).split(",")
    ])

    # --- HTTP client defaults ---
    http_timeout: int = field(default_factory=lambda: env_int("HTTP_TIMEOUT", 60))
    http_retries: int = field(default_factory=lambda: env_int("HTTP_RETRIES", 3))
    http_retry_backoff: int = field(default_factory=lambda: env_int("HTTP_RETRY_BACKOFF", 2))

    @cached_property
    def http_user_agent(self) -> str:
        return f"MarketAnalytics/{self.app_version}"

    # --- Data staleness threshold ---
    data_stale_days: int = field(default_factory=lambda: env_int("DATA_STALE_DAYS", 10))

    def ensure_directories(self) -> None:
        """Create required directories if they don't exist."""
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.log_dir.mkdir(parents=True, exist_ok=True)


# Singleton settings instance
settings = Settings()
