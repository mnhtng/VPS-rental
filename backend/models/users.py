import uuid
from datetime import datetime, timezone
from typing import List, Optional, TYPE_CHECKING
from pydantic import ConfigDict
from sqlmodel import (
    SQLModel,
    Field,
    Relationship,
)

if TYPE_CHECKING:
    from .accounts import Account
    from .sessions import Session
    from .authenticators import Authenticator
    from .carts import Cart
    from .orders import Order
    from .vps_instances import VPSInstance
    from .user_promotions import UserPromotion
    from .support_tickets import SupportTicket
    from .conversations import Conversation


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
        role: Role of the user (e.g., USER, ADMIN).
        created_at: Timestamp when the user was created.
        updated_at: Timestamp when the user was last updated.

        account: Account relationship (1-to-1).
        sessions: List of user sessions (1-to-N).
        authenticators: List of authenticators for the user (1-to-N).
        cart: User's shopping cart (1-to-1).
        orders: List of orders placed by the user (1-to-N).
        vps_instances: List of VPS instances owned by the user (1-to-N).
        user_promotions: List of user promotions associated with the user (1-to-N).
        support_tickets: List of support tickets created by the user (1-to-N).
        conversations: List of conversations associated with the user (1-to-N).
    """

    __tablename__ = "users"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        nullable=False,
    )
    name: str = Field(
        nullable=False,
    )
    email: str = Field(
        unique=True,
        nullable=False,
    )
    password: str = Field(
        nullable=False,
        max_length=255,
    )
    email_verified: Optional[datetime] = Field(
        default=None,
        nullable=True,
    )
    phone: Optional[str] = Field(
        default=None,
        nullable=True,
        max_length=20,
    )
    address: Optional[str] = Field(
        default=None,
        nullable=True,
    )
    image: Optional[str] = Field(
        default=None,
        nullable=True,
    )
    role: str = Field(
        default="USER",
        nullable=False,
        max_length=20,
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

    account: Optional["Account"] = Relationship(
        back_populates="user",
        passive_deletes="all",
        sa_relationship_kwargs={
            "lazy": "select",
            "uselist": False,
        },
    )
    sessions: List["Session"] = Relationship(
        back_populates="user",
        passive_deletes="all",
        sa_relationship_kwargs={"lazy": "select"},
    )
    authenticators: List["Authenticator"] = Relationship(
        back_populates="user",
        passive_deletes="all",
        sa_relationship_kwargs={"lazy": "select"},
    )
    cart: Optional["Cart"] = Relationship(
        back_populates="user",
        passive_deletes="all",
        sa_relationship_kwargs={
            "lazy": "select",
            "uselist": False,
        },
    )
    orders: List["Order"] = Relationship(
        back_populates="user",
        passive_deletes="all",
        sa_relationship_kwargs={"lazy": "select"},
    )
    vps_instances: List["VPSInstance"] = Relationship(
        back_populates="user",
        passive_deletes="all",
        sa_relationship_kwargs={"lazy": "select"},
    )
    user_promotions: List["UserPromotion"] = Relationship(
        back_populates="user",
        passive_deletes="all",
        sa_relationship_kwargs={"lazy": "select"},
    )
    support_tickets: List["SupportTicket"] = Relationship(
        back_populates="user",
        passive_deletes="all",
        sa_relationship_kwargs={"lazy": "select"},
    )
    conversations: List["Conversation"] = Relationship(
        back_populates="user",
        passive_deletes="all",
        sa_relationship_kwargs={"lazy": "select"},
    )

    def __repr__(self) -> str:
        """Represent the User model as a string"""
        return f"<User(email='{self.email}', name='{self.name}')>"

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
            "role": self.role,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def __eq__(self, other: object) -> bool:
        """Check equality between two User instances"""
        if isinstance(other, User):
            return self.id == other.id
        return False

    model_config = ConfigDict(from_attributes=True)
