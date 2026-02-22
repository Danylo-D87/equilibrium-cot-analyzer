"""Journal enum endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.models import User
from app.modules.journal.routers._deps import journal_perm
from app.modules.journal.schemas import TradeDirection, TradeStatus, TradeStyle, TradeType

router = APIRouter(tags=["Journal"])


@router.get("/enums/types", response_model=list[str])
async def enum_types(user: User = Depends(journal_perm)):
    return [e.value for e in TradeType]


@router.get("/enums/styles", response_model=list[str])
async def enum_styles(user: User = Depends(journal_perm)):
    return [e.value for e in TradeStyle]


@router.get("/enums/directions", response_model=list[str])
async def enum_directions(user: User = Depends(journal_perm)):
    return [e.value for e in TradeDirection]


@router.get("/enums/statuses", response_model=list[str])
async def enum_statuses(user: User = Depends(journal_perm)):
    return [e.value for e in TradeStatus]
