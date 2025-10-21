import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlmodel import PrimaryKeyConstraint, SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .users import User


class Authenticator(SQLModel, table=True):
    """
    Authenticator model for storing user authenticator details.

    Attributes:
        id: Unique identifier for the authenticator.
        name: Name of the authenticator.
        created_at: Timestamp when the authenticator was created.
        updated_at: Timestamp when the authenticator was last updated.
    """

    __tablename__ = "authenticators"
    __table_args__ = (
        PrimaryKeyConstraint(
            "user_id",
            "credential_id",
            name="authenticators_pkey",
        ),
    )

    credential_id: str = Field(
        unique=True,
        nullable=False,
        sa_column_kwargs={"type_": "TEXT"},
    )
    user_id: uuid.UUID = Field(
        foreign_key="users.id",
        nullable=False,
        ondelete="CASCADE",
        sa_column_kwargs={
            "onupdate": "CASCADE",
        },
    )
    provider_account_id: str = Field(
        nullable=False,
        sa_column_kwargs={"type_": "TEXT"},
    )
    credential_public_key: str = Field(
        nullable=False,
        sa_column_kwargs={"type_": "TEXT"},
    )
    counter: int = Field(
        nullable=False,
    )
    credential_device_type: str = Field(
        nullable=False,
        sa_column_kwargs={"type_": "TEXT"},
    )
    credential_backed_up: bool = Field(
        nullable=False,
    )
    transports: Optional[str] = Field(
        default=None,
        nullable=True,
        sa_column_kwargs={"type_": "TEXT"},
    )

    user: Optional["User"] = Relationship(
        back_populates="authenticators",
        sa_relationship_kwargs={"lazy": "select"},
    )

    def __repr__(self) -> str:
        """Represent the Authenticator model as a string"""
        return f"<Authenticator(credential_id='{self.credential_id}', user_id='{self.user_id}')>"

    def __str__(self) -> str:
        """String representation of the Authenticator model"""
        return (
            f"Authenticator(credential_id={self.credential_id}, user_id={self.user_id})"
        )

    def to_dict(self) -> dict:
        """Convert model instance to dictionary"""
        return {
            "credential_id": self.credential_id,
            "user_id": str(self.user_id),
            "provider_account_id": self.provider_account_id,
            "credential_public_key": self.credential_public_key,
            "counter": self.counter,
            "credential_device_type": self.credential_device_type,
            "credential_backed_up": self.credential_backed_up,
            "transports": self.transports,
        }

    def __eq__(self, other) -> bool:
        """Check equality based on credential ID and user ID"""
        if isinstance(other, Authenticator):
            return (self.credential_id, self.user_id) == (
                other.credential_id,
                other.user_id,
            )
        return False

    def __hash__(self) -> int:
        """Hash based on credential ID and user ID"""
        return hash((self.credential_id, self.user_id))

    class Config:
        """Pydantic model configuration"""

        orm_mode = True
        json_encoders = {
            uuid.UUID: lambda v: str(v),
            datetime: lambda v: v.isoformat() if v else None,
        }
