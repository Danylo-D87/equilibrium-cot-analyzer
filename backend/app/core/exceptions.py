"""
Application exception hierarchy.
==================================
All custom exceptions inherit from AppError so they can be
caught by a single FastAPI exception handler.
"""


class AppError(Exception):
    """Base exception for all application errors."""

    def __init__(self, message: str = "An unexpected error occurred", status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class NotFoundError(AppError):
    """Resource not found."""

    def __init__(self, message: str = "Resource not found"):
        super().__init__(message=message, status_code=404)


class ConflictError(AppError):
    """Operation conflict (e.g., resource already locked)."""

    def __init__(self, message: str = "Conflict"):
        super().__init__(message=message, status_code=409)


class ValidationError(AppError):
    """Input validation failed."""

    def __init__(self, message: str = "Validation error"):
        super().__init__(message=message, status_code=422)


class ExternalServiceError(AppError):
    """An external service call failed (CFTC, Yahoo Finance, etc.)."""

    def __init__(self, message: str = "External service unavailable"):
        super().__init__(message=message, status_code=502)


class AuthenticationError(AppError):
    """Authentication failed (invalid or missing credentials)."""

    def __init__(self, message: str = "Not authenticated"):
        super().__init__(message=message, status_code=401)


class ForbiddenError(AppError):
    """Insufficient permissions to access the resource."""

    def __init__(self, message: str = "Forbidden"):
        super().__init__(message=message, status_code=403)
