import uuid
from decimal import Decimal
from datetime import datetime, timezone
from typing import List, Optional, TYPE_CHECKING
from pydantic import ConfigDict
from sqlmodel import (
    SQLModel,
    Field,
    Relationship,
    Index,
    CheckConstraint,
)

if TYPE_CHECKING:
    from .users import User
    from .order_items import OrderItem
    from .payment_transactions import PaymentTransaction
    from .user_promotions import UserPromotion


class Order(SQLModel, table=True):
    """
    Order model for storing order details.

    Attributes:
        id: Unique identifier for the order.
        user_id: Identifier for the user who placed the order.
        order_number: Unique order number.
        price: Total price of the order.
        billing_address: Billing address for the order.
        billing_phone: Billing phone number.
        status: Status of the order (e.g., pending, paid, cancelled).
        note: Optional note for the order.
        created_at: Timestamp when the order was created.
        updated_at: Timestamp when the order was last updated.

        user: Relationship to the User model (1-to-N).
        order_items: Relationship to the OrderItem model (1-to-N).
        payment_transaction: Relationship to the PaymentTransaction model (1-to-1).
        user_promotions: Relationship to the UserPromotion model (1-to-N).
    """

    __tablename__ = "orders"
    __table_args__ = (
        Index(
            "orders_user_id_status_idx",
            "user_id",
            "status",
        ),
        CheckConstraint(
            "status IN ('pending', 'paid', 'cancelled')",
            name="orders_status_check",
        ),
    )

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        nullable=False,
    )
    user_id: Optional[uuid.UUID] = Field(
        foreign_key="users.id",
        ondelete="SET NULL",
    )
    order_number: str = Field(
        unique=True,
        nullable=False,
        max_length=50,
    )
    price: Decimal = Field(
        nullable=False,
        max_digits=10,
        decimal_places=2,
    )
    billing_address: Optional[str] = Field(
        default=None,
        nullable=True,
    )
    billing_phone: Optional[str] = Field(
        default=None,
        nullable=True,
        max_length=20,
    )
    status: str = Field(
        default="pending",
        nullable=False,
        max_length=20,
    )
    note: Optional[str] = Field(
        default=None,
        nullable=True,
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
        back_populates="orders",
        sa_relationship_kwargs={"lazy": "select"},
    )
    order_items: List["OrderItem"] = Relationship(
        back_populates="order",
        passive_deletes="all",
        sa_relationship_kwargs={"lazy": "select"},
    )
    payment_transaction: Optional["PaymentTransaction"] = Relationship(
        back_populates="order",
        passive_deletes="all",
        sa_relationship_kwargs={
            "lazy": "select",
            "uselist": False,
        },
    )
    user_promotions: List["UserPromotion"] = Relationship(
        back_populates="order",
        passive_deletes="all",
        sa_relationship_kwargs={"lazy": "select"},
    )

    def __repr__(self) -> str:
        """Represent the Order model as a string"""
        return f"<Order(order_number='{self.order_number}', user_id='{self.user_id}', status='{self.status}')>"

    def to_dict(self) -> dict:
        """Convert model instance to dictionary"""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id) if self.user_id else None,
            "order_number": self.order_number,
            "price": str(self.price),
            "billing_address": self.billing_address,
            "billing_phone": self.billing_phone,
            "status": self.status,
            "note": self.note,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    def __eq__(self, other: object) -> bool:
        """Check equality between two Order instances"""
        if isinstance(other, Order):
            return self.id == other.id
        return False

    model_config = ConfigDict(from_attributes=True)
