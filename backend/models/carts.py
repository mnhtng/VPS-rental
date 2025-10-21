import uuid
from decimal import Decimal
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from sqlmodel import (
    Field,
    SQLModel,
    Relationship,
    UniqueConstraint,
    DECIMAL,
    TIMESTAMP,
    ForeignKey,
)
from pydantic import ConfigDict


class Cart(SQLModel, table=True):
    """
    Cart model for storing shopping cart details.

    Attributes:
        id: Unique identifier for the cart.
        user_id: Identifier for the user owning the cart.
        vps_plan_id: Identifier for the VPS plan added to the cart.
        hostname: Hostname for the VPS.
        vm_template: VM template to be used.
        duration_months: Duration in months for the VPS rental.
        unit_price: Unit price of the VPS plan at the time of adding to cart.
        total_price: Total price calculated as unit_price * duration_months.
        created_at: Timestamp when the cart was created.
        updated_at: Timestamp when the cart was last updated.
    """

    __tablename__ = "carts"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "vps_plan_id",
            name="carts_user_id_vps_plan_id_key",
        ),
    )

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        nullable=False,
    )
    user_id: uuid.UUID = Field(
        sa_column=ForeignKey("users.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
        index=True,
    )
    vps_plan_id: uuid.UUID = Field(
        sa_column=ForeignKey("vps_plans.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
    )
    hostname: str = Field(
        nullable=False,
        max_length=255,
    )
    vm_template: str = Field(
        nullable=False,
        max_length=100,
    )
    duration_months: int = Field(
        default=1,
        nullable=False,
    )
    unit_price: Decimal = Field(
        nullable=False,
        max_digits=10,
        decimal_places=2,
    )
    total_price: Decimal = Field(
        nullable=False,
        max_digits=10,
        decimal_places=2,
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
        sa_column_kwargs={
            "type_": TIMESTAMP(timezone=True),
        },
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
        sa_column_kwargs={
            "type_": TIMESTAMP(timezone=True),
            "onupdate": lambda: datetime.now(timezone.utc),
        },
    )

    def __repr__(self) -> str:
        """Represent the Cart model as a string"""
        return f"<Cart id={self.id} user_id={self.user_id} vps_plan_id={self.vps_plan_id} total_price={self.total_price}>"

    def to_dict(self) -> dict:
        """Convert the Cart model to a dictionary"""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "vps_plan_id": str(self.vps_plan_id),
            "hostname": self.hostname,
            "vm_template": self.vm_template,
            "duration_months": self.duration_months,
            "unit_price": float(self.unit_price),
            "total_price": float(self.total_price),
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def __eq__(self, other: object) -> bool:
        """Check equality between two Cart instances"""
        if not isinstance(other, Cart):
            return NotImplemented
        return self.id == other.id

    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={
            uuid.UUID: lambda v: str(v),
            datetime: lambda v: v.isoformat() if v else None,
        },
    )
