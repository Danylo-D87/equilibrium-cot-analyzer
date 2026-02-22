"""
Admin module — statistics API.
================================
GET /api/v1/admin/stats  — aggregated user statistics (admin only)
"""

import logging
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session
from app.core.models import User, UserPermission
from app.middleware.auth import require_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Admin"])
admin_dep = Depends(require_admin())

KYIV_TZ = ZoneInfo("Europe/Kiev")

# ──────────────────────────────────────────────────────────────
# Response schemas
# ──────────────────────────────────────────────────────────────


class RoleBreakdown(BaseModel):
    admin: int = 0
    user: int = 0


class PermissionBreakdown(BaseModel):
    cot: int = 0
    journal: int = 0


class DayRegistration(BaseModel):
    date: str          # ISO date string  "2025-02-22"
    count: int


class AdminStats(BaseModel):
    # Overall
    total_users: int
    active_users: int
    inactive_users: int
    verified_users: int
    unverified_users: int
    by_role: RoleBreakdown
    by_permission: PermissionBreakdown

    # Period
    period_from: str
    period_to: str
    new_registrations: int
    registrations_by_day: list[DayRegistration]


# ──────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────


def _kyiv_today_range() -> tuple[datetime, datetime]:
    """Return (start_utc, end_utc) for today in Kyiv time."""
    now_kyiv = datetime.now(KYIV_TZ)
    start = now_kyiv.replace(hour=0, minute=0, second=0, microsecond=0)
    end = now_kyiv.replace(hour=23, minute=59, second=59, microsecond=999999)
    return start.astimezone(timezone.utc), end.astimezone(timezone.utc)


def _date_to_utc_range(d: date, tz: ZoneInfo) -> tuple[datetime, datetime]:
    start = datetime(d.year, d.month, d.day, 0, 0, 0, tzinfo=tz)
    end = datetime(d.year, d.month, d.day, 23, 59, 59, 999999, tzinfo=tz)
    return start.astimezone(timezone.utc), end.astimezone(timezone.utc)


# ──────────────────────────────────────────────────────────────
# Route
# ──────────────────────────────────────────────────────────────


@router.get("/stats", response_model=AdminStats)
async def get_admin_stats(
    date_from: date | None = Query(None, description="Start date (YYYY-MM-DD). Default: today Kyiv."),
    date_to: date | None = Query(None, description="End date (YYYY-MM-DD). Default: today Kyiv."),
    db: AsyncSession = Depends(get_async_session),
    _admin: User = admin_dep,
):
    """Return aggregated user statistics. All counts are live from the DB."""

    # ── Resolve period ──────────────────────────────────────
    now_kyiv = datetime.now(KYIV_TZ)
    if date_from is None:
        date_from = now_kyiv.date()
    if date_to is None:
        date_to = now_kyiv.date()
    if date_to < date_from:
        date_to = date_from

    # UTC boundaries for the full period
    period_start_utc, _ = _date_to_utc_range(date_from, KYIV_TZ)
    _, period_end_utc = _date_to_utc_range(date_to, KYIV_TZ)

    # ── Overall counts ──────────────────────────────────────
    total_row = await db.execute(select(func.count(User.id)))
    total_users: int = total_row.scalar_one()

    active_row = await db.execute(select(func.count(User.id)).where(User.is_active == True))
    active_users: int = active_row.scalar_one()

    verified_row = await db.execute(select(func.count(User.id)).where(User.email_verified == True))
    verified_users: int = verified_row.scalar_one()

    # ── By role ─────────────────────────────────────────────
    role_rows = await db.execute(
        select(User.role, func.count(User.id)).group_by(User.role)
    )
    by_role = RoleBreakdown()
    for role_name, cnt in role_rows.all():
        if role_name == "admin":
            by_role.admin = cnt
        elif role_name == "user":
            by_role.user = cnt

    # ── By permission ────────────────────────────────────────
    perm_rows = await db.execute(
        select(
            UserPermission.permission,
            func.count(UserPermission.user_id.distinct()),
        ).group_by(UserPermission.permission)
    )
    by_permission = PermissionBreakdown()
    for perm_name, cnt in perm_rows.all():
        if perm_name == "cot":
            by_permission.cot = cnt
        elif perm_name == "journal":
            by_permission.journal = cnt

    # ── New registrations in period ──────────────────────────
    new_reg_row = await db.execute(
        select(func.count(User.id)).where(
            User.created_at >= period_start_utc,
            User.created_at <= period_end_utc,
        )
    )
    new_registrations: int = new_reg_row.scalar_one()

    # ── Registrations by day ─────────────────────────────────
    registrations_by_day: list[DayRegistration] = []
    total_days = (date_to - date_from).days + 1

    for i in range(total_days):
        current_date = date_from + timedelta(days=i)
        day_start, day_end = _date_to_utc_range(current_date, KYIV_TZ)
        cnt_row = await db.execute(
            select(func.count(User.id)).where(
                User.created_at >= day_start,
                User.created_at <= day_end,
            )
        )
        registrations_by_day.append(
            DayRegistration(date=current_date.isoformat(), count=cnt_row.scalar_one())
        )

    return AdminStats(
        total_users=total_users,
        active_users=active_users,
        inactive_users=total_users - active_users,
        verified_users=verified_users,
        unverified_users=total_users - verified_users,
        by_role=by_role,
        by_permission=by_permission,
        period_from=date_from.isoformat(),
        period_to=date_to.isoformat(),
        new_registrations=new_registrations,
        registrations_by_day=registrations_by_day,
    )
