import uuid
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from pydantic import ConfigDict
from sqlmodel import (
    SQLModel,
    Field,
    Relationship,
    UniqueConstraint,
)

if TYPE_CHECKING:
    from .users import User
    from .promotions import Promotion
    from .orders import Order


class UserPromotion(SQLModel, table=True):
    """
    UserPromotion model for storing user promotion details.

    Attributes:
        id: Unique identifier for the user promotion.
        user_id: Identifier for the user.
        promotion_id: Identifier for the promotion.
        order_id: Identifier for the order where the promotion was used.
        used_at: Timestamp when the promotion was used.

        user: Relationship to the User model (1-to-N).
        promotion: Relationship to the Promotion model (1-to-N).
        order: Relationship to the Order model (1-to-N).
    """

    __tablename__ = "user_promotions"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "promotion_id",
            "order_id",
            name="user_promotions_user_id_promotion_id_order_id_key",
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
    promotion_id: uuid.UUID = Field(
        foreign_key="promotions.id",
        ondelete="CASCADE",
    )
    order_id: uuid.UUID = Field(
        foreign_key="orders.id",
        ondelete="CASCADE",
    )
    used_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user: Optional["User"] = Relationship(
        back_populates="user_promotions",
        sa_relationship_kwargs={"lazy": "select"},
    )
    promotion: Optional["Promotion"] = Relationship(
        back_populates="user_promotions",
        sa_relationship_kwargs={"lazy": "select"},
    )
    order: Optional["Order"] = Relationship(
        back_populates="user_promotions",
        sa_relationship_kwargs={"lazy": "select"},
    )

    def __repr__(self) -> str:
        """Representation the UserPromotion instance as a string"""
        return (
            f"UserPromotion(id={self.id}, user_id={self.user_id}, "
            f"promotion_id={self.promotion_id}, used_at={self.used_at})"
        )

    def to_dict(self) -> dict:
        """Convert model instance to a dictionary"""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "promotion_id": str(self.promotion_id),
            "used_at": self.used_at.isoformat(),
        }

    def __eq__(self, other: object) -> bool:
        """Check equality between two UserPromotion instances"""
        if isinstance(other, UserPromotion):
            return self.id == other.id
        return False

    model_config = ConfigDict(from_attributes=True)
