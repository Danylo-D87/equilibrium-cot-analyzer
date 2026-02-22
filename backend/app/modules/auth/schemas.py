"""
Auth module — Pydantic schemas for request / response validation.
==================================================================
"""

import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


# ──────────────────────────────────────────────────────────────
# Requests
# ──────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    nickname: str | None = Field(None, max_length=100)
    language: str = Field("en", pattern=r"^(en|uk|ru)$")

class VerifyEmailRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")

class ResendVerificationRequest(BaseModel):
    email: EmailStr

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UpdateProfileRequest(BaseModel):
    nickname: str | None = Field(None, max_length=100)
    language: str | None = Field(None, pattern=r"^(en|uk|ru)$")
    timezone: str | None = Field(None, max_length=50)

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


# ──────────────────────────────────────────────────────────────
# Responses
# ──────────────────────────────────────────────────────────────

class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    nickname: str | None
    language: str
    timezone: str
    role: str
    is_active: bool
    email_verified: bool
    permissions: list[str]
    created_at: datetime

    model_config = {"from_attributes": True}

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class RegisterPendingResponse(BaseModel):
    """Returned after manual registration — user must verify email."""
    pending_email: str
    message: str = "Verification code sent to your email"

class MessageResponse(BaseModel):
    message: str
