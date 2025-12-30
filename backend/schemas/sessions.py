from __future__ import annotations
import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from pydantic import (
    BaseModel,
    Field,
    ConfigDict,
    field_validator,
)

if TYPE_CHECKING:
    from .users import UserPublic


class SessionBase(BaseModel):
    """Base schema for user sessions"""

    session_token: str = Field(..., description="Session token")
    expires: datetime = Field(..., description="Session expiration time")

    @field_validator("session_token")
    @classmethod
    def validate_session_token(cls, v: str) -> str:
        if not v:
            raise ValueError("Session token must not be empty")

        v = v.strip()
        if len(v) == 0:
            raise ValueError("Session token must not be empty")
        return v


class SessionCreate(SessionBase):
    """Schema to create a new session"""

    user_id: uuid.UUID = Field(..., description="User ID")


class SessionUpdate(BaseModel):
    """Schema to update a session"""

    expires: Optional[datetime] = Field(None, description="New expiration time")


class SessionPublic(SessionBase):
    """Schema representing session data in the database"""

    id: uuid.UUID = Field(..., description="Session ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    model_config = ConfigDict(from_attributes=True)


class SessionResponse(SessionPublic):
    """Schema for session data returned in API responses"""

    user: Optional[UserPublic] = Field(None, description="Associated user information")

    model_config = ConfigDict(from_attributes=True)
