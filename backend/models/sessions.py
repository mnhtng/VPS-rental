import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

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

        user: Relationship to the User model.
    """

    __tablename__ = "sessions"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        nullable=False,
    )
    user_id: uuid.UUID = Field(
        foreign_key="users.id",
        nullable=False,
        index=True,
        ondelete="CASCADE",
        sa_column_kwargs={
            "onupdate": "CASCADE",
        },
    )
    session_token: str = Field(
        unique=True,
        nullable=False,
        sa_column_kwargs={"type_": "TEXT"},
    )
    expires: datetime = Field(
        nullable=False,
        sa_column_kwargs={
            "type_": "TIMESTAMP(3)",
        },
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        sa_column_kwargs={
            "type_": "TIMESTAMP(3)",
        },
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        sa_column_kwargs={
            "type_": "TIMESTAMP(3)",
            "onupdate": datetime.utcnow,
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

    def __str__(self) -> str:
        """String representation of the Session model"""
        return f"Session(token={self.session_token}, user_id={self.user_id})"

    def to_dict(self) -> dict:
        """Convert model instance to dictionary"""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "session_token": self.session_token,
            "expires_at": self.expires_at,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    def __eq__(self, other) -> bool:
        """Check equality based on session ID"""
        if isinstance(other, Session):
            return self.id == other.id
        return False

    def __hash__(self) -> int:
        """Hash based on session ID"""
        return hash(self.id)

    class Config:
        """Pydantic model configuration"""

        orm_mode = True
        json_encoders = {
            uuid.UUID: lambda v: str(v),
            datetime: lambda v: v.isoformat(),
        }
