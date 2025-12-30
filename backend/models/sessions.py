import uuid
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from pydantic import ConfigDict
from sqlmodel import (
    SQLModel,
    Field,
    Relationship,
)

if TYPE_CHECKING:
    from .users import User


class Session(SQLModel, table=True):
    """
    Session model for managing user sessions.

    Attributes:
        id: Unique identifier for the session.
        user_id: Foreign key to users table.
        session_token: Unique token for the session.
        expires_at: Session expiration timestamp.
        created_at: Timestamp when the session was created.
        updated_at: Timestamp when the session was last updated.

        user: Relationship to the User model (1-to-N).
    """

    __tablename__ = "sessions"

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
    session_token: str = Field(
        unique=True,
        nullable=False,
    )
    expires: datetime = Field(
        nullable=False,
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
        back_populates="sessions",
        sa_relationship_kwargs={"lazy": "select"},
    )

    def __repr__(self) -> str:
        """Represent the Session model as a string"""
        return (
            f"<Session(user_id='{self.user_id}', session_token='{self.session_token}')>"
        )

    def to_dict(self) -> dict:
        """Convert model instance to dictionary"""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "session_token": self.session_token,
            "expires_at": self.expires_at,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def __eq__(self, other: object) -> bool:
        """Check equality between two Session instances"""
        if isinstance(other, Session):
            return self.id == other.id
        return False

    model_config = ConfigDict(from_attributes=True)
