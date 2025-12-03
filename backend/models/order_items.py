import uuid
from decimal import Decimal
from datetime import datetime, timezone
from typing import Dict, Optional, TYPE_CHECKING
from pydantic import ConfigDict
from sqlmodel import (
    SQLModel,
    Field,
    Relationship,
    Column,
)
from sqlalchemy.dialects.postgresql import JSONB

if TYPE_CHECKING:
    from .orders import Order
    from .vps_plans import VPSPlan
    from .vm_templates import VMTemplate
    from .vps_instances import VPSInstance


class OrderItem(SQLModel, table=True):
    """
    OrderItem model for storing individual items within an order.

    Attributes:
        id: Unique identifier for the order item.
        order_id: Identifier for the associated order.
        vps_plan_id: Identifier for the VPS plan.
        template_id: Identifier for the VM template.
        hostname: Hostname for the VPS.
        duration_months: Duration in months for the VPS rental.
        unit_price: Unit price of the VPS plan at the time of order.
        total_price: Total price calculated as unit_price * duration_months.
        configuration: Configuration details for the VPS in JSON format.
            VD: {
                "vcpu": 2,
                "ram_gb": 4,
                "storage_gb": 80,
                "storage_type": "SSD",
                "bandwidth_mbps": 1000,
                "template_os": "Ubuntu 22.04",
            }
        created_at: Timestamp when the order item was created.
        updated_at: Timestamp when the order item was last updated.

        order: Relationship to the Order model (1-to-N).
        vps_plan: Relationship to the VPSPlan model (1-to-N).
        vm_template: Relationship to the VMTemplate model (1-to-N).
        vps_instance: Relationship to the VPSInstance model (1-to-1).
    """

    __tablename__ = "order_items"

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
    vps_plan_id: Optional[uuid.UUID] = Field(
        default=None,
        foreign_key="vps_plans.id",
        ondelete="SET NULL",
    )
    template_id: Optional[uuid.UUID] = Field(
        default=None,
        foreign_key="vm_templates.id",
        ondelete="SET NULL",
    )
    hostname: str = Field(
        nullable=False,
        max_length=255,
    )
    os: str = Field(
        nullable=False,
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
    configuration: Dict = Field(
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
        back_populates="order_items",
        sa_relationship_kwargs={"lazy": "select"},
    )
    vps_plan: Optional["VPSPlan"] = Relationship(
        back_populates="order_items",
        sa_relationship_kwargs={"lazy": "select"},
    )
    template: Optional["VMTemplate"] = Relationship(
        back_populates="order_items",
        sa_relationship_kwargs={"lazy": "select"},
    )
    vps_instance: Optional["VPSInstance"] = Relationship(
        back_populates="order_item",
        passive_deletes="all",
        sa_relationship_kwargs={
            "lazy": "select",
            "uselist": False,
        },
    )

    def __repr__(self) -> str:
        """Represent the OrderItem model as a string"""
        return f"<OrderItem(order_id='{self.order_id}', vps_plan_id='{self.vps_plan_id}', hostname='{self.hostname}')>"

    def to_dict(self) -> dict:
        """Convert model instance to dictionary"""
        return {
            "id": str(self.id),
            "order_id": str(self.order_id),
            "vps_plan_id": str(self.vps_plan_id) if self.vps_plan_id else None,
            "template_id": str(self.template_id) if self.template_id else None,
            "hostname": self.hostname,
            "os": self.os,
            "duration_months": self.duration_months,
            "unit_price": float(self.unit_price),
            "total_price": float(self.total_price),
            "configuration": self.configuration,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def __eq__(self, other: object) -> bool:
        """Check equality between two OrderItem instances"""
        if isinstance(other, OrderItem):
            return self.id == other.id
        return False

    model_config = ConfigDict(from_attributes=True)
