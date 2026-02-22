"""
Email service using Resend.com
================================
Async wrapper around the Resend SDK.
All emails are sent from noreply@equilibriumm.tech

Available functions:
    send_verification_email(to, code)   — 6-digit code to confirm registration
    send_welcome_email(to, nickname)    — welcome message after email confirmed
"""

import logging
from typing import Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"


def _from_address() -> str:
    return f"{settings.email_from_name} <{settings.email_from}>"


async def _send(*, to: str, subject: str, html: str, _plain: str | None = None) -> bool:
    """
    Low-level async send via Resend REST API.
    Returns True on success, False on failure (non-raising — email is best-effort).
    In DEBUG mode without an API key, prints the email content to the console.
    """
    if not settings.resend_api_key:
        if settings.debug:
            # Pretty-print to terminal so developers can complete flows locally
            border = "─" * 60
            logger.warning(
                "\n%s\n📧  DEV EMAIL (not sent — no RESEND_API_KEY)\n"
                "  To      : %s\n"
                "  Subject : %s\n"
                "%s\n%s\n%s",
                border, to, subject, border,
                _plain or "(html only)",
                border,
            )
        else:
            logger.warning("RESEND_API_KEY not configured — skipping email to %s", to)
        return False

    payload = {
        "from": _from_address(),
        "to": [to],
        "subject": subject,
        "html": html,
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                RESEND_API_URL,
                headers={
                    "Authorization": f"Bearer {settings.resend_api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
        if response.status_code in (200, 201):
            logger.info("Email sent to %s [%s]", to, subject)
            return True
        else:
            logger.error(
                "Resend API error %s: %s", response.status_code, response.text
            )
            return False
    except Exception as exc:  # noqa: BLE001
        logger.error("Failed to send email to %s: %s", to, exc)
        return False


# ──────────────────────────────────────────────────────────────
# Public helpers
# ──────────────────────────────────────────────────────────────

async def send_verification_email(to: str, code: str) -> bool:
    """Send a 6-digit verification code to confirm email ownership."""
    html = _verification_html(to, code)
    return await _send(
        to=to,
        subject=f"Your Equilibrium verification code: {code}",
        html=html,
        _plain=f"  Verification code: {code}  (valid 10 min)",
    )


async def send_welcome_email(to: str, nickname: Optional[str] = None) -> bool:
    """Send a welcome message after successful registration."""
    display = nickname or to.split("@")[0]
    html = _welcome_html(display)
    return await _send(
        to=to,
        subject="Welcome to Equilibrium",
        html=html,
    )


# ──────────────────────────────────────────────────────────────
# HTML templates
# ──────────────────────────────────────────────────────────────

def _base_layout(content: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Equilibrium</title>
  <style>
    body {{
      margin: 0; padding: 0;
      background: #0a0a0a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #e5e5e5;
    }}
    .wrapper {{
      max-width: 520px;
      margin: 40px auto;
      background: #111111;
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 4px;
      overflow: hidden;
    }}
    .header {{
      padding: 32px 40px 24px;
      border-bottom: 1px solid rgba(255,255,255,0.04);
    }}
    .brand {{
      font-family: Georgia, serif;
      font-size: 13px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #c8a96e;
    }}
    .body {{
      padding: 32px 40px;
    }}
    .footer {{
      padding: 20px 40px;
      border-top: 1px solid rgba(255,255,255,0.04);
      font-size: 11px;
      color: rgba(255,255,255,0.25);
    }}
    h2 {{
      margin: 0 0 16px;
      font-size: 16px;
      font-weight: 500;
      color: #ffffff;
      letter-spacing: 0.04em;
    }}
    p {{
      margin: 0 0 16px;
      font-size: 13px;
      line-height: 1.6;
      color: rgba(255,255,255,0.6);
    }}
    .code-block {{
      display: block;
      margin: 24px 0;
      padding: 16px 24px;
      background: rgba(200,169,110,0.06);
      border: 1px solid rgba(200,169,110,0.2);
      border-radius: 3px;
      font-size: 28px;
      font-weight: 600;
      letter-spacing: 0.3em;
      text-align: center;
      color: #c8a96e;
    }}
    .note {{
      font-size: 11px;
      color: rgba(255,255,255,0.25);
    }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="brand">Equilibrium</div>
    </div>
    <div class="body">
      {content}
    </div>
    <div class="footer">
      This email was sent from <a href="https://equilibriumm.tech" style="color:#c8a96e;text-decoration:none;">equilibriumm.tech</a>.
      If you did not request this, please ignore it.
    </div>
  </div>
</body>
</html>"""


def _verification_html(email: str, code: str) -> str:
    content = f"""
    <h2>Confirm your email</h2>
    <p>Use the code below to verify your email address. It expires in <strong>10 minutes</strong>.</p>
    <span class="code-block">{code}</span>
    <p class="note">If you did not create an account on Equilibrium, you can safely ignore this email.</p>
    """
    return _base_layout(content)


def _welcome_html(display_name: str) -> str:
    content = f"""
    <h2>Welcome, {display_name}</h2>
    <p>Your account has been successfully created on <strong>Equilibrium</strong>.</p>
    <p>You now have access to COT analytics, the trading journal, and market data tools.
    Visit <a href="https://equilibriumm.tech" style="color:#c8a96e;">equilibriumm.tech</a> to get started.</p>
    <p class="note">If you did not create this account, please contact us immediately.</p>
    """
    return _base_layout(content)
