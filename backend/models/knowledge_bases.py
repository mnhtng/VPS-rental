import uuid
from datetime import datetime, timezone
from typing import Optional
from pydantic import ConfigDict
from sqlmodel import (
    SQLModel,
    Field,
    Column,
)
from sqlalchemy import TEXT, ARRAY
from sqlalchemy.dialects.postgresql import TSVECTOR


class KnowledgeBase(SQLModel, table=True):
    """
    KnowledgeBase model for storing knowledge base articles.

    Attributes:
        id: Unique identifier for the knowledge base article.
        title: Title of the knowledge base article.
        content: Content of the knowledge base article in JSONB format.
        created_at: Timestamp when the article was created.
        updated_at: Timestamp when the article was last updated.
    """

    __tablename__ = "knowledge_bases"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        nullable=False,
    )
    question: str = Field(
        nullable=False,
    )
    answer: str = Field(
        nullable=False,
    )
    category: Optional[str] = Field(
        default=None,
        nullable=True,
        max_length=50,
    )
    tags: Optional[list[str]] = Field(
        default=None,
        sa_column=Column(ARRAY(TEXT)),
    )
    search_vector: Optional[str] = Field(
        default=None,
        sa_column=Column(TSVECTOR),
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
        sa_column_kwargs={
            "onupdate": lambda: datetime.now(timezone.utc),
        },
    )

    def __repr__(self) -> str:
        """Represent the KnowledgeBase model as a string"""
        return f"<KnowledgeBase(id={self.id}, question={self.question})>"

    def to_dict(self) -> dict:
        """Convert model instance to dictionary"""
        return {
            "id": str(self.id),
            "question": self.question,
            "answer": self.answer,
            "category": self.category,
            "tags": self.tags,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def __eq__(self, other: object) -> bool:
        """Check equality between two KnowledgeBase instances"""
        if isinstance(other, KnowledgeBase):
            return self.id == other.id
        return False

    model_config = ConfigDict(from_attributes=True)
