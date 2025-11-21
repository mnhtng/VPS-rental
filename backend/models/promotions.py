import uuid
from decimal import Decimal
from datetime import datetime, timezone
from typing import List, Optional, TYPE_CHECKING
from pydantic import ConfigDict
from sqlmodel import (
    SQLModel,
    Field,
    Relationship,
    CheckConstraint,
)

if TYPE_CHECKING:
    from .user_promotions import UserPromotion


class Promotion(SQLModel, table=True):
    """
    Promotion model for storing promotion details.

    Attributes:
        id: Unique identifier for the promotion.
        code: Unique promotion code.
        description: Optional description of the promotion.
        discount_type: Type of discount (percentage, fixed_amount).
        discount_value: Value of the discount.
        start_date: Optional start date of the promotion.
        end_date: Optional end date of the promotion.
        usage_limit: Optional total usage limit for the promotion.
        per_user_limit: Optional usage limit per user.
        created_at: Timestamp when the promotion was created.
        updated_at: Timestamp when the promotion was last updated.

        user_promotions: List of user promotions associated with this promotion (1-to-N).
    """

    __tablename__ = "promotions"
    __table_args__ = (
        CheckConstraint(
            "discount_type IN ('percentage', 'fixed_amount')",
            name="promotions_discount_type_check",
        ),
    )

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        nullable=False,
    )
    code: str = Field(
        unique=True,
        nullable=False,
        max_length=50,
    )
    description: Optional[str] = Field(
        default=None,
        nullable=True,
    )
    discount_type: str = Field(
        nullable=False,
        max_length=20,
    )
    discount_value: Decimal = Field(
        nullable=False,
        max_digits=10,
        decimal_places=2,
    )
    start_date: Optional[datetime] = Field(
        default=None,
        nullable=True,
    )
    end_date: Optional[datetime] = Field(
        default=None,
        nullable=True,
    )
    usage_limit: Optional[int] = Field(
        default=None,
        nullable=True,
    )
    per_user_limit: Optional[int] = Field(
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

    user_promotions: List["UserPromotion"] = Relationship(
        back_populates="promotion",
        passive_deletes="all",
        sa_relationship_kwargs={"lazy": "select"},
    )

    def __repr__(self) -> str:
        """Represent the Promotion instance as a string"""
        return (
            f"Promotion(id={self.id}, code='{self.code}', "
            f"discount_type='{self.discount_type}', discount_value={self.discount_value})"
        )

    def to_dict(self) -> dict:
        """Convert model instance to dictionary"""
        return {
            "id": str(self.id),
            "code": self.code,
            "description": self.description,
            "discount_type": self.discount_type,
            "discount_value": float(self.discount_value),
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "usage_limit": self.usage_limit,
            "per_user_limit": self.per_user_limit,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def __eq__(self, other: object) -> bool:
        """Check equality between two Promotion instances"""
        if isinstance(other, Promotion):
            return self.id == other.id
        return False

    model_config = ConfigDict(from_attributes=True)
