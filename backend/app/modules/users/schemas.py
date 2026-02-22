"""
Users module — Pydantic schemas for admin user management.
============================================================
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserListItem(BaseModel):
    id: uuid.UUID
    email: str
    nickname: str | None
    role: str
    is_active: bool
    permissions: list[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class UserDetail(UserListItem):
    language: str
    timezone: str
    email_verified: bool
    updated_at: datetime


class UpdateUserRequest(BaseModel):
    role: str | None = Field(None, pattern=r"^(admin|user)$")
    is_active: bool | None = None
    nickname: str | None = Field(None, max_length=100)


class PermissionRequest(BaseModel):
    permission: str = Field(pattern=r"^(cot|journal)$")


class PermissionResponse(BaseModel):
    id: uuid.UUID
    permission: str
    granted_at: datetime
    granted_by: uuid.UUID | None

    model_config = {"from_attributes": True}
