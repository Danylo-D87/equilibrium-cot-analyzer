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

    # --- PostgreSQL (async, for auth + journal) ---
    @cached_property
    def database_url(self) -> str:
        """Async PostgreSQL connection string."""
        return env(
            "DATABASE_URL",
            "postgresql+asyncpg://equilibrium:dev_password@localhost:5432/equilibrium_db",
        )

    @cached_property
    def database_url_sync(self) -> str:
        """Sync PostgreSQL URL for Alembic migrations."""
        return self.database_url.replace("+asyncpg", "")

    # --- JWT ---
    jwt_secret_key: str = field(
        default_factory=lambda: env("JWT_SECRET_KEY", "CHANGE-ME-TO-A-RANDOM-256-BIT-KEY")
    )
    jwt_algorithm: str = field(default_factory=lambda: env("JWT_ALGORITHM", "HS256"))
    jwt_access_token_expire_minutes: int = field(
        default_factory=lambda: env_int("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", 15)
    )
    jwt_refresh_token_expire_days: int = field(
        default_factory=lambda: env_int("JWT_REFRESH_TOKEN_EXPIRE_DAYS", 7)
    )

    # --- Uploads ---
    @cached_property
    def upload_dir(self) -> Path:
        custom = os.environ.get("UPLOAD_DIR")
        if custom:
            return Path(custom)
        return self.base_dir / "uploads"

    max_image_size: int = field(
        default_factory=lambda: env_int("MAX_IMAGE_SIZE", 5 * 1024 * 1024)  # 5 MB
    )

    # --- App public URL (used in emails, OAuth callbacks) ---
    app_url: str = field(
        default_factory=lambda: env("APP_URL", "http://localhost:5173")
    )

    # --- Resend.com email service ---
    resend_api_key: str = field(
        default_factory=lambda: env("RESEND_API_KEY", "")
    )
    email_from: str = field(
        default_factory=lambda: env("EMAIL_FROM", "noreply@equilibriumm.tech")
    )
    email_from_name: str = field(
        default_factory=lambda: env("EMAIL_FROM_NAME", "Equilibrium")
    )

    # --- OAuth providers ---
    # Google
    oauth_google_client_id: str = field(
        default_factory=lambda: env("OAUTH_GOOGLE_CLIENT_ID", "")
    )
    oauth_google_client_secret: str = field(
        default_factory=lambda: env("OAUTH_GOOGLE_CLIENT_SECRET", "")
    )
    # GitHub
    oauth_github_client_id: str = field(
        default_factory=lambda: env("OAUTH_GITHUB_CLIENT_ID", "")
    )
    oauth_github_client_secret: str = field(
        default_factory=lambda: env("OAUTH_GITHUB_CLIENT_SECRET", "")
    )
    # LinkedIn
    oauth_linkedin_client_id: str = field(
        default_factory=lambda: env("OAUTH_LINKEDIN_CLIENT_ID", "")
    )
    oauth_linkedin_client_secret: str = field(
        default_factory=lambda: env("OAUTH_LINKEDIN_CLIENT_SECRET", "")
    )

    @cached_property
    def oauth_callback_base(self) -> str:
        """Base URL for OAuth callbacks — always backend API."""
        backend_url = env("BACKEND_URL", "http://localhost:8000")
        return f"{backend_url}/api/v1/auth/oauth"

    def ensure_directories(self) -> None:
        """Create required directories if they don't exist."""
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self.upload_dir.mkdir(parents=True, exist_ok=True)


# Load .env file if present (local development)
try:
    from dotenv import load_dotenv as _load_dotenv  # type: ignore
    _load_dotenv(Path(__file__).resolve().parent.parent.parent / '.env', override=False)
except ImportError:
    pass

# Singleton settings instance
settings = Settings()
