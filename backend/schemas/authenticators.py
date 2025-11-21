from __future__ import annotations
import uuid
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


class AuthenticatorBase(BaseModel):
    """Base schema for user authenticators"""

    credential_id: str = Field(..., description="Credential ID")
    provider_account_id: str = Field(..., description="Account ID from provider")
    credential_public_key: str = Field(..., description="Public key of the credential")
    counter: int = Field(..., description="Counter for the authenticator")
    credential_device_type: str = Field(
        ..., description="Type of device for the credential"
    )
    credential_backed_up: bool = Field(
        ..., description="Indicates if the credential is backed up"
    )
    transports: Optional[str] = Field(None, description="Transports information")

    @field_validator(
        "credential_id",
        "provider_account_id",
        "credential_public_key",
        "credential_device_type",
    )
    @classmethod
    def validate_required_fields(cls, v: str, info: ValidationInfo) -> str:
        field_name = info.field_name.replace("_", " ").capitalize()

        if not v:
            raise ValueError(f"{field_name} must not be empty")

        v = v.strip()
        if len(v) == 0:
            raise ValueError(f"{field_name} must not be empty")
        return v

    @field_validator("transports", mode="before")
    @classmethod
    def validate_optional_fields(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = v.strip()
        return None if len(v) == 0 else v

    @field_validator("counter")
    @classmethod
    def validate_counter(cls, v: int) -> int:
        if not v:
            raise ValueError("Counter must not be empty")
        if v < 0:
            raise ValueError("Counter must be non-negative")
        return v


class AuthenticatorCreate(AuthenticatorBase):
    """Schema to create a new authenticator"""

    user_id: uuid.UUID = Field(..., description="User ID")


class AuthenticatorUpdate(BaseModel):
    """Schema to update an existing authenticator"""

    counter: Optional[int] = Field(None, description="New counter value")
    credential_backed_up: Optional[bool] = Field(
        None, description="Indicates if the credential is backed up"
    )
    transports: Optional[str] = Field(None, description="Transports information")

    @field_validator("transports", mode="before")
    @classmethod
    def validate_transports(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = v.strip()
        return None if len(v) == 0 else v

    @field_validator("counter")
    @classmethod
    def validate_counter(cls, v: Optional[int]) -> Optional[int]:
        if v is None:
            return v
        if v < 0:
            raise ValueError("Counter must be non-negative")
        return v


class AuthenticatorPublic(AuthenticatorBase):
    """Schema representing authenticator data in the database"""

    pass


class AuthenticatorResponse(AuthenticatorPublic):
    """Schema for authenticator data returned in API responses"""

    user: Optional[UserPublic] = Field(None, description="Associated user information")

    model_config = ConfigDict(from_attributes=True)
