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
    from .support_tickets import SupportTicketPublic


class SupportTicketReplyBase(BaseModel):
    """Base schema for support ticket replies"""

    message: dict = Field(..., description="Reply message in JSONB format")

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: dict) -> dict:
        if not v:
            raise ValueError("Message must not be empty")
        if not isinstance(v, dict):
            raise ValueError("Message must be a valid JSON object")
        return v


class SupportTicketReplyCreate(SupportTicketReplyBase):
    """Schema to create a new ticket reply"""

    ticket_id: uuid.UUID = Field(..., description="Support ticket ID")


class SupportTicketReplyUpdate(BaseModel):
    """Schema to update a ticket reply"""

    message: Optional[dict] = Field(None, description="Updated message")

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: Optional[dict]) -> Optional[dict]:
        if v is None:
            return v
        if not isinstance(v, dict):
            raise ValueError("Message must be a valid JSON object")
        return v


class SupportTicketReplyPublic(SupportTicketReplyBase):
    """Schema representing support ticket reply data in the database"""

    id: uuid.UUID = Field(..., description="Support Ticket Reply ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    model_config = ConfigDict(from_attributes=True)


class SupportTicketReplyResponse(SupportTicketReplyPublic):
    """Schema for support ticket reply data returned in API responses"""

    support_ticket: Optional[SupportTicketPublic] = Field(
        None, description="Associated support ticket details"
    )

    model_config = ConfigDict(from_attributes=True)
