import uuid
from datetime import datetime
from typing import Optional
from pydantic import (
    BaseModel,
    Field,
    ConfigDict,
    field_validator,
    ValidationInfo,
    EmailStr,
)


class VerificationTokenBase(BaseModel):
    """Base schema for verification tokens"""

    identifier: str = Field(..., description="Identifier (email)")
    token: str = Field(..., description="Verification token")
    expires: datetime = Field(..., description="Token expiration time")

    @field_validator("identifier", "token")
    @classmethod
    def validate_fields(cls, v: str, info: ValidationInfo) -> str:
        field_name = info.field_name.replace("_", " ").capitalize()

        if not v:
            raise ValueError(f"{field_name} must not be empty")

        v = v.strip()
        if len(v) == 0:
            raise ValueError(f"{field_name} must not be empty")
        return v


class VerificationTokenCreate(VerificationTokenBase):
    """Schema to create a new verification token"""

    pass


class VerificationTokenUpdate(BaseModel):
    """Schema to update a verification token"""

    expires: Optional[datetime] = Field(None, description="New expiration time")


class VerificationTokenGenerate(BaseModel):
    """Schema to generate a verification token"""

    email: EmailStr = Field(..., description="Email to generate token for")
    expires_in_hours: int = Field(
        default=24, gt=0, le=168, description="Token validity in hours"
    )


class VerificationTokenPublic(VerificationTokenBase):
    """Schema representing verification token data in the database"""

    id: uuid.UUID = Field(..., description="Verification Token ID")

    model_config = ConfigDict(from_attributes=True)


class VerificationTokenResponse(VerificationTokenPublic):
    """Schema for verification token data returned in API responses"""

    pass
