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


class KnowledgeBase(BaseModel):
    """Base schema for knowledge bases"""

    question: str = Field(..., description="Knowledge base question")
    answer: str = Field(..., description="Knowledge base answer")
    category: Optional[str] = Field(None, description="Category of the knowledge base")
    tags: Optional[list[str]] = Field(
        None, description="Tags associated with the knowledge base"
    )

    @field_validator("question", "answer")
    @classmethod
    def validate_question(cls, v: str, info: ValidationInfo) -> str:
        field_name = info.field_name.replace("_", " ").capitalize()

        if not v:
            raise ValueError(f"{field_name} must not be empty")

        v = v.strip()
        if len(v) == 0:
            raise ValueError(f"{field_name} must not be empty")
        return v

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = v.strip()
        if len(v) == 0:
            return None
        if len(v) > 50:
            raise ValueError("Category must not exceed 50 characters")
        return v

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: Optional[list[str]]) -> Optional[list[str]]:
        if v is None:
            return v

        if not isinstance(v, list):
            raise ValueError("Tags must be a list of strings")

        for tag in v:
            if not isinstance(tag, str) or len(tag.strip()) == 0:
                raise ValueError("Each tag must be a non-empty string")
        return v


class KnowledgeBaseCreate(KnowledgeBase):
    """Schema for creating a knowledge base"""

    pass


class KnowledgeBaseUpdate(BaseModel):
    """Schema for updating a knowledge base"""

    question: Optional[str] = Field(None, description="Updated question")
    answer: Optional[str] = Field(None, description="Updated answer")
    category: Optional[str] = Field(None, description="Updated category")
    tags: Optional[list[str]] = Field(None, description="Updated tags")

    @field_validator("question", "answer", "category")
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
        if info.field_name == "category" and len(v) > 50:
            raise ValueError(f"{field_name} must not exceed 50 characters")
        return v

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: Optional[list[str]]) -> Optional[list[str]]:
        if v is None:
            return v

        if not isinstance(v, list):
            raise ValueError("Tags must be a list of strings")

        for tag in v:
            if not isinstance(tag, str) or len(tag.strip()) == 0:
                raise ValueError("Each tag must be a non-empty string")
        return v


class KnowledgeBasePublic(KnowledgeBase):
    """Schema representing knowledge base data in the database"""

    id: uuid.UUID = Field(..., description="Knowledge base ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    model_config = ConfigDict(from_attributes=True)


class KnowledgeBaseResponse(KnowledgeBasePublic):
    """Schema for knowledge base response"""

    pass
