import uuid
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from pydantic import ConfigDict
from sqlmodel import (
    SQLModel,
    Field,
    Relationship,
    CheckConstraint,
)

if TYPE_CHECKING:
    from .users import User


class Conversation(SQLModel, table=True):
    """
    Conversation model for storing conversation messages.

    Attributes:
        id: Unique identifier for the conversation.
        user_id: Identifier for the user involved in the conversation.
        sender: Indicates who sent the message (user or bot).
        message: The content of the message.
        intent: Optional intent classification for chatbot messages.
        created_at: Timestamp when the message was created.
        updated_at: Timestamp when the message was last updated.

        user: Relationship to the User model (1-to-N).
    """

    __tablename__ = "conversations"
    __table_args__ = (
        CheckConstraint(
            "sender IN ('user', 'bot')",
            name="conversations_sender_check",
        ),
    )

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        nullable=False,
    )
    user_id: uuid.UUID = Field(
        index=True,
        foreign_key="users.id",
        ondelete="CASCADE",
    )
    sender: str = Field(
        nullable=False,
        max_length=20,
    )
    message: str = Field(
        nullable=False,
    )
    intent: Optional[str] = Field(
        default=None,
        nullable=True,
        max_length=100,
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

    user: Optional["User"] = Relationship(
        back_populates="conversations",
        sa_relationship_kwargs={"lazy": "select"},
    )

    def __repr__(self) -> str:
        """Representation the Conversation instance as a string"""
        return f"Conversation id={self.id} user_id={self.user_id} sender={self.sender}"

    def to_dict(self) -> dict:
        """Convert model instance to a dictionary"""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "sender": self.sender,
            "message": self.message,
            "intent": self.intent,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def __eq__(self, other: object) -> bool:
        """Check equality between two Conversation instances"""
        if isinstance(other, Conversation):
            return self.id == other.id
        return False

    model_config = ConfigDict(from_attributes=True)
