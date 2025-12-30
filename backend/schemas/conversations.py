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
from enum import Enum

if TYPE_CHECKING:
    from .users import UserPublic


class MessageSender(str, Enum):
    """Message sender choices"""

    USER = "user"
    BOT = "bot"


class ConversationBase(BaseModel):
    """Base schema for conversations"""

    sender: MessageSender = Field(..., description="Message sender")
    message: str = Field(..., description="Message content")
    intent: Optional[str] = Field(None, description="Intent classification")

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        if not v:
            raise ValueError("Message must not be empty")

        v = v.strip()
        if len(v) == 0:
            raise ValueError("Message must not be empty")
        return v

    @field_validator("intent")
    @classmethod
    def validate_intent(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = v.strip()
        if len(v) == 0:
            return None
        if len(v) > 100:
            raise ValueError("Intent must not exceed 100 characters")
        return v

    @field_validator("sender", mode="before")
    @classmethod
    def validate_sender(cls, v: str) -> str:
        if not v:
            raise ValueError("Sender must not be empty")

        v = str(v).strip().lower()
        if len(v) == 0:
            raise ValueError("Sender must not be empty")
        if len(v) > 20:
            raise ValueError("Sender must not exceed 20 characters")

        valid_senders = [item.value for item in MessageSender]
        if v not in valid_senders:
            raise ValueError("Invalid sender")
        return v


class ConversationCreate(ConversationBase):
    """Schema to create a new conversation"""

    user_id: uuid.UUID = Field(..., description="User ID")


class ConversationUpdate(BaseModel):
    """Schema to update a conversation"""

    sender: Optional[MessageSender] = Field(None, description="Updated message sender")
    message: Optional[str] = Field(None, description="Updated message content")
    intent: Optional[str] = Field(None, description="Updated intent classification")

    @field_validator("message", "intent")
    @classmethod
    def validate_optional_strings(
        cls, v: Optional[str], info: ValidationInfo
    ) -> Optional[str]:
        field_name = info.field_name.replace("_", " ").capitalize()

        if v is None:
            return v

        v = v.strip()
        if len(v) == 0:
            return None
        if info.field_name == "intent" and len(v) > 100:
            raise ValueError(f"{field_name} must not exceed 100 characters")
        return v

    @field_validator("sender", mode="before")
    @classmethod
    def validate_sender(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = str(v).strip().lower()
        if len(v) == 0:
            return None
        if len(v) > 20:
            raise ValueError("Sender must not exceed 20 characters")

        valid_senders = [item.value for item in MessageSender]
        if v not in valid_senders:
            raise ValueError("Invalid sender")
        return v


class ConversationPublic(ConversationBase):
    """Schema representing conversation data in the database"""

    id: uuid.UUID = Field(..., description="Conversation ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    model_config = ConfigDict(from_attributes=True)


class ConversationResponse(ConversationPublic):
    """Schema for conversation data returned in API responses"""

    user: Optional[UserPublic] = Field(None, description="Associated user information")

    model_config = ConfigDict(from_attributes=True)
