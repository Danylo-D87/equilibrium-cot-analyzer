"""
Auth module — API routes.
===========================
POST /api/v1/auth/register
POST /api/v1/auth/verify-email
POST /api/v1/auth/resend-verification
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
PUT  /api/v1/auth/me
PUT  /api/v1/auth/me/password
GET  /api/v1/auth/oauth/{provider}
GET  /api/v1/auth/oauth/{provider}/callback
"""

import logging
from urllib.parse import urlencode

from fastapi import APIRouter, Cookie, Depends, Request, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_async_session
from app.core.models import User
from app.middleware.auth import get_current_active_user
from app.modules.auth import service as auth_service
from app.modules.auth import oauth as oauth_service
from app.modules.auth.schemas import (
    ChangePasswordRequest,
    LoginRequest,
    LoginResponse,
    MessageResponse,
    RegisterPendingResponse,
    RegisterRequest,
    ResendVerificationRequest,
    UpdateProfileRequest,
    UserResponse,
    VerifyEmailRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Auth"])

# Cookie config
REFRESH_COOKIE = "refresh_token"
OAUTH_STATE_COOKIE = "oauth_state"
COOKIE_MAX_AGE = settings.jwt_refresh_token_expire_days * 86400  # seconds


def _set_refresh_cookie(response: Response, token: str) -> None:
    """Set the HttpOnly refresh token cookie."""
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=token,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        secure=not settings.debug,  # Secure in production only
        samesite="lax",
        path="/api/v1/auth",
    )


def _clear_refresh_cookie(response: Response) -> None:
    """Delete the refresh token cookie."""
    response.delete_cookie(
        key=REFRESH_COOKIE,
        httponly=True,
        secure=not settings.debug,
        samesite="lax",
        path="/api/v1/auth",
    )


def _user_response(user: User) -> UserResponse:
    """Convert a User model to a UserResponse schema."""
    return UserResponse(
        id=user.id,
        email=user.email,
        nickname=user.nickname,
        language=user.language,
        timezone=user.timezone,
        role=user.role,
        is_active=user.is_active,
        email_verified=user.email_verified,
        permissions=[p.permission for p in user.permissions],
        created_at=user.created_at,
    )


# ──────────────────────────────────────────────────────────────
# Register  (step 1 — initiates email verification)
# ──────────────────────────────────────────────────────────────

@router.post("/register", response_model=RegisterPendingResponse, status_code=202)
async def register(
    body: RegisterRequest,
    db: AsyncSession = Depends(get_async_session),
):
    """
    Create a new account and send an email with a 6-digit verification code.
    The user must confirm their email via POST /verify-email before getting tokens.
    """
    pending_email = await auth_service.register_user(
        db,
        email=body.email,
        password=body.password,
        nickname=body.nickname,
        language=body.language,
    )
    return RegisterPendingResponse(pending_email=pending_email)


# ──────────────────────────────────────────────────────────────
# Verify email  (step 2 — returns tokens)
# ──────────────────────────────────────────────────────────────

@router.post("/verify-email", response_model=LoginResponse)
async def verify_email(
    body: VerifyEmailRequest,
    response: Response,
    db: AsyncSession = Depends(get_async_session),
):
    """Verify the 6-digit code sent by email. On success issues auth tokens."""
    user, access_token, refresh_raw = await auth_service.verify_email_code(
        db, email=body.email, code=body.code,
    )
    _set_refresh_cookie(response, refresh_raw)
    return LoginResponse(access_token=access_token, user=_user_response(user))


# ──────────────────────────────────────────────────────────────
# Resend verification code
# ──────────────────────────────────────────────────────────────

@router.post("/resend-verification", response_model=MessageResponse)
async def resend_verification(
    body: ResendVerificationRequest,
    db: AsyncSession = Depends(get_async_session),
):
    """Resend the email verification code."""
    await auth_service.resend_verification_code(db, email=body.email)
    return MessageResponse(message="Verification code sent")


# ──────────────────────────────────────────────────────────────
# Login
# ──────────────────────────────────────────────────────────────

@router.post("/login", response_model=LoginResponse)
async def login(
    body: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_async_session),
):
    """Authenticate user, return access token + set refresh cookie."""
    user, access_token, refresh_raw = await auth_service.login_user(
        db, email=body.email, password=body.password,
    )
    _set_refresh_cookie(response, refresh_raw)
    return LoginResponse(
        access_token=access_token,
        user=_user_response(user),
    )


# ──────────────────────────────────────────────────────────────
# OAuth  — initiate
# ──────────────────────────────────────────────────────────────

def _oauth_error_redirect(message: str) -> RedirectResponse:
    """Redirect to frontend error page instead of returning raw JSON."""
    from urllib.parse import urlencode
    url = f"{settings.app_url}/auth/callback?" + urlencode({"error": message})
    return RedirectResponse(url=url, status_code=302)


@router.get("/oauth/{provider}")
async def oauth_authorize(provider: str):
    """Redirect user to OAuth provider login page."""
    if provider not in oauth_service.SUPPORTED_PROVIDERS:
        return _oauth_error_redirect(f"Unsupported OAuth provider: {provider}")

    if provider == "google" and not settings.oauth_google_client_id:
        return _oauth_error_redirect("Google OAuth is not configured on this server")
    if provider == "github" and not settings.oauth_github_client_id:
        return _oauth_error_redirect("GitHub OAuth is not configured on this server")

    state = oauth_service.generate_state()
    auth_url = oauth_service.build_authorization_url(provider, state)

    redirect = RedirectResponse(url=auth_url, status_code=302)
    redirect.set_cookie(
        key=OAUTH_STATE_COOKIE,
        value=state,
        max_age=600,  # 10 minutes
        httponly=True,
        secure=not settings.debug,
        samesite="lax",
    )
    return redirect


# ──────────────────────────────────────────────────────────────
# OAuth — callback
# ──────────────────────────────────────────────────────────────

@router.get("/oauth/{provider}/callback")
async def oauth_callback(
    provider: str,
    request: Request,
    db: AsyncSession = Depends(get_async_session),
):
    """Handle OAuth provider callback, create/find user, redirect to frontend."""
    params = request.query_params

    error = params.get("error")
    if error:
        error_desc = params.get("error_description", error)
        frontend_error_url = (
            f"{settings.app_url}/auth/callback?"
            + urlencode({"error": error_desc})
        )
        return RedirectResponse(url=frontend_error_url, status_code=302)

    code = params.get("code")
    state = params.get("state")

    # Verify CSRF state
    stored_state = request.cookies.get(OAUTH_STATE_COOKIE)
    if not code or not state or state != stored_state:
        frontend_error_url = (
            f"{settings.app_url}/auth/callback?"
            + urlencode({"error": "Invalid OAuth state"})
        )
        return RedirectResponse(url=frontend_error_url, status_code=302)

    try:
        provider_uid, email, display_name = await oauth_service.fetch_oauth_user(
            provider, code
        )
        user, access_token, refresh_raw = await auth_service.login_or_create_oauth_user(
            db,
            provider=provider,
            provider_user_id=provider_uid,
            provider_email=email,
            nickname=display_name,
        )
    except Exception as exc:
        logger.error("OAuth callback error (%s): %s", provider, exc)
        frontend_error_url = (
            f"{settings.app_url}/auth/callback?"
            + urlencode({"error": "Authentication failed. Please try again."})
        )
        return RedirectResponse(url=frontend_error_url, status_code=302)

    # Build redirect to frontend with access token in query param
    frontend_url = (
        f"{settings.app_url}/auth/callback?"
        + urlencode({"access_token": access_token})
    )

    redirect = RedirectResponse(url=frontend_url, status_code=302)

    # Set refresh cookie (path must match the router prefix)
    redirect.set_cookie(
        key=REFRESH_COOKIE,
        value=refresh_raw,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        secure=not settings.debug,
        samesite="lax",
        path="/api/v1/auth",
    )
    # Clear state cookie
    redirect.delete_cookie(OAUTH_STATE_COOKIE)

    return redirect


# ──────────────────────────────────────────────────────────────
# Refresh
# ──────────────────────────────────────────────────────────────

@router.post("/refresh", response_model=LoginResponse)
async def refresh(
    response: Response,
    db: AsyncSession = Depends(get_async_session),
    refresh_token: str | None = Cookie(None),
):
    """Refresh the access token using the HttpOnly refresh cookie."""
    if refresh_token is None:
        from app.core.exceptions import AuthenticationError
        raise AuthenticationError("No refresh token provided")

    user, access_token, new_refresh = await auth_service.refresh_access_token(
        db, raw_refresh_token=refresh_token,
    )
    _set_refresh_cookie(response, new_refresh)
    return LoginResponse(
        access_token=access_token,
        user=_user_response(user),
    )


# ──────────────────────────────────────────────────────────────
# Logout
# ──────────────────────────────────────────────────────────────

@router.post("/logout", response_model=MessageResponse)
async def logout(
    response: Response,
    db: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_current_active_user),
    refresh_token: str | None = Cookie(None),
):
    """Revoke refresh token and clear cookie."""
    await auth_service.logout_user(
        db, raw_refresh_token=refresh_token, user_id=user.id,
    )
    _clear_refresh_cookie(response)
    return MessageResponse(message="Logged out")


# ──────────────────────────────────────────────────────────────
# Profile: GET / PUT
# ──────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_active_user)):
    """Return the authenticated user's profile."""
    return _user_response(user)


@router.put("/me", response_model=UserResponse)
async def update_me(
    body: UpdateProfileRequest,
    db: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_current_active_user),
):
    """Update profile (nickname, language, timezone)."""
    updated = await auth_service.update_profile(
        db,
        user=user,
        nickname=body.nickname,
        language=body.language,
        timezone_str=body.timezone,
    )
    return _user_response(updated)


@router.put("/me/password", response_model=MessageResponse)
async def change_password(
    body: ChangePasswordRequest,
    response: Response,
    db: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_current_active_user),
):
    """Change password and revoke all refresh tokens."""
    await auth_service.change_password(
        db,
        user=user,
        current_password=body.current_password,
        new_password=body.new_password,
    )
    _clear_refresh_cookie(response)
    return MessageResponse(message="Password changed — please log in again")
