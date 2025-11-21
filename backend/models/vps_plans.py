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
    from .carts import Cart
    from .order_items import OrderItem
    from .vps_instances import VPSInstance


class VPSPlan(SQLModel, table=True):
    """
    VPSPlan model for storing VPS plan details.

    Attributes:
        id: Unique identifier for the VPS plan.
        name: Name of the VPS plan.
        description: Description of the VPS plan.
        category: Category of the VPS plan (e.g., basic, standard, premium).
        vcpu: Number of virtual CPUs.
        ram_gb: Amount of RAM in GB.
        storage_type: Type of storage (e.g., SSD, NVMe).
        storage_gb: Amount of storage in GB.
        bandwidth_mbps: Bandwidth in Mbps.
        monthly_price: Monthly price of the VPS plan.
        currency: Currency for the pricing (e.g., VND, USD).
        max_snapshots: Maximum number of snapshots allowed.
        max_ip_addresses: Maximum number of IP addresses allowed.
        created_at: Timestamp when the VPS plan was created.
        updated_at: Timestamp when the VPS plan was last updated.

        carts: List of carts associated with this VPS plan (1-to-N).
        order_items: List of order items associated with this VPS plan (1-to-N).
        vps_instances: List of VPS instances associated with this VPS plan (1-to-N).
    """

    __tablename__ = "vps_plans"
    __table_args__ = (
        CheckConstraint(
            "storage_type IN ('SSD', 'NVMe')",
            name="vps_plans_storage_type_check",
        ),
        CheckConstraint(
            "category IN ('basic', 'standard', 'premium')",
            name="vps_plans_category_check",
        ),
        CheckConstraint(
            "currency IN ('VND', 'USD')",
            name="vps_plans_currency_check",
        ),
    )

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        nullable=False,
    )
    name: str = Field(
        nullable=False,
        max_length=100,
    )
    description: Optional[str] = Field(
        default=None,
        nullable=True,
    )
    category: str = Field(
        index=True,
        nullable=False,
        max_length=50,
    )
    vcpu: int = Field(
        nullable=False,
    )
    ram_gb: int = Field(
        nullable=False,
    )
    storage_type: str = Field(
        nullable=False,
        max_length=20,
    )
    storage_gb: int = Field(
        nullable=False,
    )
    bandwidth_mbps: int = Field(
        nullable=False,
    )
    monthly_price: Decimal = Field(
        nullable=False,
        max_digits=10,
        decimal_places=2,
    )
    currency: str = Field(
        default="VND",
        nullable=False,
        max_length=10,
    )
    max_snapshots: int = Field(
        default=3,
        nullable=False,
    )
    max_ip_addresses: int = Field(
        default=1,
        nullable=False,
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

    carts: List["Cart"] = Relationship(
        back_populates="vps_plan",
        passive_deletes="all",
        sa_relationship_kwargs={"lazy": "select"},
    )
    order_items: List["OrderItem"] = Relationship(
        back_populates="vps_plan",
        passive_deletes="all",
        sa_relationship_kwargs={"lazy": "select"},
    )
    vps_instances: List["VPSInstance"] = Relationship(
        back_populates="vps_plan",
        passive_deletes="all",
        sa_relationship_kwargs={"lazy": "select"},
    )

    def __repr__(self) -> str:
        """Represent the VPSPlan model as a string"""
        return f"VPSPlan(id={self.id}, name='{self.name}', category='{self.category}', monthly_price={self.monthly_price})"

    def to_dict(self) -> dict:
        """Convert model instance to dictionary"""
        return {
            "id": str(self.id),
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "vcpu": self.vcpu,
            "ram_gb": self.ram_gb,
            "storage_type": self.storage_type,
            "storage_gb": self.storage_gb,
            "bandwidth_mbps": self.bandwidth_mbps,
            "monthly_price": float(self.monthly_price),
            "currency": self.currency,
            "max_snapshots": self.max_snapshots,
            "max_ip_addresses": self.max_ip_addresses,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def __eq__(self, other: object) -> bool:
        """Check equality between two VPSPlan instances"""
        if isinstance(other, VPSPlan):
            return self.id == other.id
        return False

    model_config = ConfigDict(from_attributes=True)
