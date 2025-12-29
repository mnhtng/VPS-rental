from typing import Optional
from pydantic import BaseModel, Field
from pydantic import (
    BaseModel,
    Field,
    field_validator,
)


class ChatRequest(BaseModel):
    """Request model for chat message"""

    message: str = Field(..., description="User message")

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        if not v or len(v.strip()) == 0:
            raise ValueError("Message must not be empty")
        return v.strip()


class ChatResponse(BaseModel):
    """Response model for chat message"""

    message: str = Field(..., description="Bot response message")
    intent: str = Field(..., description="Detected intent")
    recommended_plans: Optional[list] = Field(
        None, description="Recommended VPS plans if applicable"
    )
    category: Optional[str] = Field(
        None, description="Category from knowledge base if applicable"
    )
