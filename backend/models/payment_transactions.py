import uuid
from decimal import Decimal
from datetime import datetime, timezone
from typing import Dict, Optional, TYPE_CHECKING
from pydantic import ConfigDict
from sqlmodel import (
    SQLModel,
    Field,
    Relationship,
    CheckConstraint,
    Column,
)
from sqlalchemy.dialects.postgresql import JSONB

if TYPE_CHECKING:
    from .orders import Order


class PaymentTransaction(SQLModel, table=True):
    """
    PaymentTransaction model for storing payment transaction details.

    Attributes:
        id: Unique identifier for the payment transaction.
        order_id: Identifier for the associated order.
        transaction_id: Unique transaction ID from the payment gateway.
        payment_method: Method of payment used (e.g., momo, vnpay).
        amount: Amount paid in the transaction.
        currency: Currency of the transaction (default is VND).
        status: Status of the transaction (e.g., pending, completed, failed).
        gateway_response: JSON response from the payment gateway.
        created_at: Timestamp when the transaction was created.
        updated_at: Timestamp when the transaction was last updated.

        order: Relationship to the Order model (1-to-1).
    """

    __tablename__ = "payment_transactions"
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'completed', 'failed')",
            name="payment_transactions_status_check",
        ),
        CheckConstraint(
            "payment_method IN ('momo', 'vnpay')",
            name="payment_transactions_payment_method_check",
        ),
        CheckConstraint(
            "currency IN ('VND', 'USD')",
            name="payment_transactions_currency_check",
        ),
    )

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        nullable=False,
    )
    order_id: uuid.UUID = Field(
        index=True,
        foreign_key="orders.id",
        ondelete="CASCADE",
    )
    transaction_id: Optional[str] = Field(
        default=None,
        nullable=True,
        unique=True,
        max_length=255,
    )
    payment_method: str = Field(
        nullable=False,
        max_length=20,
    )
    amount: Decimal = Field(
        nullable=False,
        max_digits=10,
        decimal_places=2,
    )
    currency: str = Field(
        default="VND",
        nullable=False,
        max_length=10,
    )
    status: str = Field(
        default="pending",
        nullable=False,
        max_length=20,
    )
    gateway_response: Optional[Dict] = Field(
        default=None,
        sa_column=Column(JSONB),
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

    order: Optional["Order"] = Relationship(
        back_populates="payment_transaction",
        sa_relationship_kwargs={"lazy": "select"},
    )

    def __repr__(self) -> str:
        """Represent the PaymentTransaction model as a string"""
        return (
            f"<PaymentTransaction(order_id='{self.order_id}', "
            f"transaction_id='{self.transaction_id}', amount='{self.amount}', "
            f"status='{self.status}')>"
        )

    def to_dict(self) -> dict:
        """Convert model instance to dictionary"""
        return {
            "id": str(self.id),
            "order_id": str(self.order_id),
            "transaction_id": self.transaction_id,
            "payment_method": self.payment_method,
            "amount": float(self.amount),
            "currency": self.currency,
            "status": self.status,
            "gateway_response": self.gateway_response,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def __eq__(self, other: object) -> bool:
        """Check equality between two PaymentTransaction instances"""
        if isinstance(other, PaymentTransaction):
            return self.id == other.id
        return False

    model_config = ConfigDict(from_attributes=True)
