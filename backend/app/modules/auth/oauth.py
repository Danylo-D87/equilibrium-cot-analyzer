"""
OAuth 2.0 provider integrations.
==================================
Supported providers: google, github

Flow:
    1. GET /api/v1/auth/oauth/{provider}
       → generate state, set state cookie, redirect to provider

    2. GET /api/v1/auth/oauth/{provider}/callback?code=...&state=...
       → verify state, exchange code → tokens, fetch user info
       → create/find user via service.login_or_create_oauth_user
       → set refresh cookie, redirect to {APP_URL}/auth/callback?access_token=...
"""

import logging
import secrets
from dataclasses import dataclass
from urllib.parse import urlencode, urljoin

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────
# Provider configuration
# ──────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class OAuthProvider:
    name: str
    client_id: str
    client_secret: str
    authorize_url: str
    token_url: str
    userinfo_url: str
    scope: str


def _get_provider(name: str) -> OAuthProvider:
    providers: dict[str, OAuthProvider] = {
        "google": OAuthProvider(
            name="google",
            client_id=settings.oauth_google_client_id,
            client_secret=settings.oauth_google_client_secret,
            authorize_url="https://accounts.google.com/o/oauth2/v2/auth",
            token_url="https://oauth2.googleapis.com/token",
            userinfo_url="https://www.googleapis.com/oauth2/v3/userinfo",
            scope="openid email profile",
        ),
        "github": OAuthProvider(
            name="github",
            client_id=settings.oauth_github_client_id,
            client_secret=settings.oauth_github_client_secret,
            authorize_url="https://github.com/login/oauth/authorize",
            token_url="https://github.com/login/oauth/access_token",
            userinfo_url="https://api.github.com/user",
            scope="user:email read:user",
        ),
    }
    if name not in providers:
        raise ValueError(f"Unknown OAuth provider: {name}")
    return providers[name]


SUPPORTED_PROVIDERS = ("google", "github")

# ──────────────────────────────────────────────────────────────
# State helpers
# ──────────────────────────────────────────────────────────────

def generate_state() -> str:
    return secrets.token_urlsafe(32)


def callback_uri(provider_name: str) -> str:
    """Backend callback URL registered with the OAuth app."""
    return f"{settings.oauth_callback_base}/{provider_name}/callback"


# ──────────────────────────────────────────────────────────────
# Build authorization URL
# ──────────────────────────────────────────────────────────────

def build_authorization_url(provider_name: str, state: str) -> str:
    """Return the URL to redirect the user to for OAuth authorization."""
    p = _get_provider(provider_name)
    params = {
        "client_id": p.client_id,
        "redirect_uri": callback_uri(provider_name),
        "response_type": "code",
        "scope": p.scope,
        "state": state,
    }
    if provider_name == "google":
        params["access_type"] = "online"
        params["prompt"] = "select_account"

    return f"{p.authorize_url}?{urlencode(params)}"


# ──────────────────────────────────────────────────────────────
# Exchange code + fetch user info
# ──────────────────────────────────────────────────────────────

async def _exchange_code(p: OAuthProvider, code: str) -> str:
    """Exchange authorization code for access token. Returns the access token string."""
    data: dict = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": callback_uri(p.name),
        "client_id": p.client_id,
        "client_secret": p.client_secret,
    }
    headers = {"Accept": "application/json"}
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(p.token_url, data=data, headers=headers)
    resp.raise_for_status()
    token_data = resp.json()
    access_token = token_data.get("access_token")
    if not access_token:
        raise RuntimeError(f"No access_token in response: {token_data}")
    return access_token


async def _fetch_userinfo_google(access_token: str, p: OAuthProvider) -> dict:
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            p.userinfo_url,
            headers={"Authorization": f"Bearer {access_token}"},
        )
    resp.raise_for_status()
    data = resp.json()
    return {
        "id": data["sub"],
        "email": data.get("email", ""),
        "name": data.get("name"),
        "email_verified": data.get("email_verified", False),
    }


async def _fetch_userinfo_github(access_token: str, p: OAuthProvider) -> dict:
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/vnd.github+json",
    }
    async with httpx.AsyncClient(timeout=10) as client:
        user_resp = await client.get(p.userinfo_url, headers=headers)
        user_resp.raise_for_status()
        user_data = user_resp.json()

        # GitHub may not expose email publicly — fetch via /user/emails
        email = user_data.get("email")
        if not email:
            emails_resp = await client.get(
                "https://api.github.com/user/emails", headers=headers
            )
            if emails_resp.status_code == 200:
                for e in emails_resp.json():
                    if e.get("primary") and e.get("verified"):
                        email = e["email"]
                        break

    return {
        "id": str(user_data["id"]),
        "email": email or "",
        "name": user_data.get("name") or user_data.get("login"),
        "email_verified": bool(email),
    }


async def _fetch_userinfo_linkedin(access_token: str, p: OAuthProvider) -> dict:
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            p.userinfo_url,
            headers={"Authorization": f"Bearer {access_token}"},
        )
    resp.raise_for_status()
    data = resp.json()
    return {
        "id": data.get("sub", ""),
        "email": data.get("email", ""),
        "name": data.get("name"),
        "email_verified": data.get("email_verified", False),
    }


async def fetch_oauth_user(provider_name: str, code: str) -> tuple[str, str, str | None]:
    """
    Exchange code and return (provider_user_id, email, display_name).
    Raises RuntimeError if the provider doesn't return an email.
    """
    p = _get_provider(provider_name)
    access_token = await _exchange_code(p, code)

    fetch_fn = {
        "google": _fetch_userinfo_google,
        "github": _fetch_userinfo_github,
        "linkedin": _fetch_userinfo_linkedin,
    }[provider_name]

    info = await fetch_fn(access_token, p)

    if not info.get("email"):
        raise RuntimeError(
            f"OAuth provider '{provider_name}' did not return an email address. "
            "Please ensure your account has a public email."
        )

    return info["id"], info["email"], info.get("name")
