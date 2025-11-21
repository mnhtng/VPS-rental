from __future__ import annotations
import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from pydantic import (
    BaseModel,
    Field,
    ConfigDict,
    ValidationInfo,
    field_validator,
)

if TYPE_CHECKING:
    from .users import UserPublic


class AccountBase(BaseModel):
    """Base schema for user accounts"""

    type: str = Field(..., description="Account type (oauth, email)")
    provider: str = Field(..., description="Provider name (google, github, etc)")
    provider_account_id: str = Field(..., description="Account ID from provider")
    refresh_token: Optional[str] = Field(None, description="OAuth refresh token")
    access_token: Optional[str] = Field(None, description="OAuth access token")
    expires_at: Optional[int] = Field(None, description="Token expiration timestamp")
    token_type: Optional[str] = Field(None, description="Token type (Bearer, etc)")
    scope: Optional[str] = Field(None, description="OAuth scopes")
    id_token: Optional[str] = Field(None, description="OpenID Connect ID token")
    session_state: Optional[str] = Field(None, description="OAuth session state")

    @field_validator("type", "provider", "provider_account_id")
    @classmethod
    def validate_required_fields(cls, v: str, info: ValidationInfo) -> str:
        field_name = info.field_name.replace("_", " ").capitalize()

        if not v:
            raise ValueError(f"{field_name} must not be empty")

        v = v.strip()
        if len(v) == 0:
            raise ValueError(f"{field_name} must not be empty")
        return v

    @field_validator(
        "refresh_token",
        "access_token",
        "token_type",
        "scope",
        "id_token",
        "session_state",
        mode="before",
    )
    @classmethod
    def validate_optional_fields(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = v.strip()
        return None if len(v) == 0 else v

    @field_validator("expires_at")
    @classmethod
    def validate_expires_at(cls, v: Optional[int]) -> Optional[int]:
        if v is None:
            return v
        if v <= 0:
            raise ValueError("Expiration timestamp must be positive")
        return v


class AccountCreate(AccountBase):
    """Schema to create a new account"""

    user_id: uuid.UUID = Field(..., description="User ID")


class AccountUpdate(BaseModel):
    """Schema to update account info"""

    type: Optional[str] = Field(None, description="Account type (oauth, email)")
    provider: Optional[str] = Field(
        None, description="Provider name (google, github, etc)"
    )
    provider_account_id: Optional[str] = Field(
        None, description="Account ID from provider"
    )
    refresh_token: Optional[str] = Field(None, description="OAuth refresh token")
    access_token: Optional[str] = Field(None, description="OAuth access token")
    expires_at: Optional[int] = Field(None, description="Token expiration timestamp")
    token_type: Optional[str] = Field(None, description="Token type (Bearer, etc)")
    scope: Optional[str] = Field(None, description="OAuth scopes")
    id_token: Optional[str] = Field(None, description="OpenID Connect ID token")
    session_state: Optional[str] = Field(None, description="OAuth session state")

    @field_validator(
        "type",
        "provider",
        "provider_account_id",
        "refresh_token",
        "access_token",
        "token_type",
        "scope",
        "id_token",
        "session_state",
        mode="before",
    )
    @classmethod
    def validate_string_fields(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = v.strip()
        return None if len(v) == 0 else v

    @field_validator("expires_at")
    @classmethod
    def validate_expires_at(cls, v: Optional[int]) -> Optional[int]:
        if v is None:
            return v
        if v <= 0:
            raise ValueError("Expiration timestamp must be positive")
        return v


class AccountPublic(AccountBase):
    """Schema representing account data in the database"""

    id: uuid.UUID = Field(..., description="Account ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    model_config = ConfigDict(from_attributes=True)


class AccountResponse(AccountPublic):
    """Schema for account data returned in API responses"""

    user: Optional[UserPublic] = Field(None, description="Associated user information")

    model_config = ConfigDict(from_attributes=True)
