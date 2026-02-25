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
</head>
<body style="margin:0;padding:0;background:#060606;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e5e5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#060606;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

          <!-- Brand -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);font-weight:500;">Equilibrium</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#111111;border:1px solid rgba(255,255,255,0.05);border-radius:20px;overflow:hidden;">
              <div style="padding:40px;">
                {content}
              </div>
              <!-- Footer inside card -->
              <div style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.04);">
                <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);line-height:1.6;">
                  Sent from <a href="https://equilibriumm.tech" style="color:rgba(255,255,255,0.35);text-decoration:none;">equilibriumm.tech</a>.
                  If you did not request this, please ignore.
                </p>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _verification_html(email: str, code: str) -> str:
    content = f"""
    <p style="margin:0 0 8px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.3);font-weight:500;">Verify your email</p>
    <p style="margin:0 0 28px;font-size:20px;font-weight:400;color:rgba(255,255,255,0.85);letter-spacing:0.01em;line-height:1.3;">Enter this code to<br>confirm your account</p>

    <div style="margin:0 0 28px;padding:20px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;text-align:center;">
      <span style="font-size:36px;font-weight:600;letter-spacing:0.35em;color:#ffffff;font-family:'Courier New',monospace;">{code}</span>
    </div>

    <p style="margin:0 0 8px;font-size:13px;color:rgba(255,255,255,0.45);line-height:1.6;">
      This code expires in <span style="color:rgba(255,255,255,0.7);">10 minutes</span>.
    </p>
    <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.2);line-height:1.6;">
      If you didn't create an Equilibrium account, you can safely ignore this email.
    </p>
    """
    return _base_layout(content)


def _welcome_html(display_name: str) -> str:
    content = f"""
    <p style="margin:0 0 8px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.3);font-weight:500;">Welcome</p>
    <p style="margin:0 0 28px;font-size:20px;font-weight:400;color:rgba(255,255,255,0.85);letter-spacing:0.01em;line-height:1.3;">You're in, {display_name}</p>

    <p style="margin:0 0 16px;font-size:13px;color:rgba(255,255,255,0.45);line-height:1.7;">
      Your account is ready. You now have access to COT analytics, the trading journal, and market data tools.
    </p>
    <p style="margin:0 0 28px;font-size:13px;color:rgba(255,255,255,0.45);line-height:1.7;">
      <a href="https://equilibriumm.tech" style="color:rgba(255,255,255,0.7);text-decoration:none;">equilibriumm.tech</a>
    </p>
    <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.2);line-height:1.6;">
      If you didn't create this account, please contact us immediately.
    </p>
    """
    return _base_layout(content)
