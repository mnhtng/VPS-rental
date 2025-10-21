import uuid
from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .roles import Role
    from .accounts import Account
    from .sessions import Session
    from .authenticators import Authenticator


class User(SQLModel, table=True):
    """
    User model for storing user information.

    Attributes:
        id: Unique identifier for the user.
        name: Full name of the user.
        email: Email address.
        password: Hashed password.
        email_verified: Timestamp when email was verified.
        phone: Phone number.
        address: User's address.
        image: Profile image URL.
        role_id: Foreign key to roles table.
        created_at: Timestamp when the user was created.
        updated_at: Timestamp when the user was last updated.

        role: Role relationship.
        account: Account relationship.
        sessions: List of user sessions.
    """

    __tablename__ = "users"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        nullable=False,
    )
    name: str = Field(
        nullable=False,
        sa_column_kwargs={"type_": "TEXT"},
    )
    email: str = Field(
        unique=True,
        nullable=False,
        sa_column_kwargs={"type_": "TEXT"},
    )
    password: str = Field(
        nullable=False,
        max_length=255,
    )
    email_verified: Optional[datetime] = Field(
        default=None,
        nullable=True,
        sa_column_kwargs={
            "type_": "TIMESTAMP(3)",
        },
    )
    phone: Optional[str] = Field(
        default=None,
        nullable=True,
        max_length=20,
    )
    address: Optional[str] = Field(
        default=None,
        nullable=True,
        sa_column_kwargs={"type_": "TEXT"},
    )
    image: Optional[str] = Field(
        default=None,
        nullable=True,
        sa_column_kwargs={"type_": "TEXT"},
    )
    role_id: uuid.UUID = Field(
        foreign_key="roles.id",
        nullable=False,
        ondelete="SET NULL",
        sa_column_kwargs={
            "onupdate": "CASCADE",
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

    role: Optional["Role"] = Relationship(
        back_populates="users",
        sa_relationship_kwargs={"lazy": "select"},
    )
    account: Optional["Account"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={
            "lazy": "select",
            "uselist": False,
        },
    )
    sessions: List["Session"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"lazy": "select"},
    )
    authenticators: List["Authenticator"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"lazy": "select"},
    )

    def __repr__(self) -> str:
        """Represent the User model as a string"""
        return f"<User(email='{self.email}', name='{self.name}')>"

    def __str__(self) -> str:
        """String representation of the User model"""
        return self.email

    def to_dict(self) -> dict:
        """Convert model instance to dictionary"""
        return {
            "id": str(self.id),
            "name": self.name,
            "email": self.email,
            "email_verified": self.email_verified,
            "phone": self.phone,
            "address": self.address,
            "image": self.image,
            "role_id": str(self.role_id),
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    def __eq__(self, other) -> bool:
        """Check equality based on user ID"""
        if isinstance(other, User):
            return self.id == other.id
        return False

    def __hash__(self) -> int:
        """Hash based on user ID"""
        return hash(self.id)

    class Config:
        """Pydantic model configuration"""

        orm_mode = True
        json_encoders = {
            uuid.UUID: lambda v: str(v),
            datetime: lambda v: v.isoformat() if v else None,
        }
