import uuid
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
from sqlalchemy.dialects.postgresql import INET

if TYPE_CHECKING:
    from .users import User
    from .vps_plans import VPSPlan
    from .order_items import OrderItem
    from .proxmox_vms import ProxmoxVM


class VPSInstance(SQLModel, table=True):
    """
    VPSInstance model for storing VPS instance details.

    Attributes:
        id: Unique identifier for the VPS instance.
        user_id: Foreign key to users table.
        vps_plan_id: Foreign key to vps_plans table.
        order_item_id: Foreign key to order_items table.
        vm_id: Foreign key to proxmox_vms table.
        status: Current status of the VPS instance.
        expires_at: Timestamp when the VPS instance expires.
        auto_renew: Whether the VPS instance is set to auto-renew.
        created_at: Timestamp when the VPS instance was created.
        updated_at: Timestamp when the VPS instance was last updated.

        user: Relationship to User model (1-to-N).
        vps_plan: Relationship to VPSPlan model (1-to-N).
        order_item: Relationship to OrderItem model (1-to-1).
        vm: Relationship to ProxmoxVM model (1-to-1).
    """

    __tablename__ = "vps_instances"
    __table_args__ = (
        Index("vps_instances_user_id_status_idx", "user_id", "status"),
        CheckConstraint(
            "status IN ('creating', 'active', 'suspended', 'terminated', 'error')",
            name="vps_instances_status_check",
        ),
    )

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        nullable=False,
    )
    user_id: uuid.UUID = Field(
        foreign_key="users.id",
        ondelete="CASCADE",
    )
    vps_plan_id: Optional[uuid.UUID] = Field(
        default=None,
        foreign_key="vps_plans.id",
        ondelete="SET NULL",
    )
    order_item_id: Optional[uuid.UUID] = Field(
        default=None,
        foreign_key="order_items.id",
        ondelete="SET NULL",
    )
    vm_id: Optional[uuid.UUID] = Field(
        index=True,
        default=None,
        foreign_key="proxmox_vms.id",
        ondelete="SET NULL",
    )
    status: str = Field(
        default="creating",
        nullable=False,
        max_length=20,
    )
    expires_at: datetime = Field(
        index=True,
        nullable=False,
    )
    auto_renew: bool = Field(
        default=False,
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

    user: Optional["User"] = Relationship(
        back_populates="vps_instances",
        sa_relationship_kwargs={"lazy": "select"},
    )
    vps_plan: Optional["VPSPlan"] = Relationship(
        back_populates="vps_instances",
        sa_relationship_kwargs={"lazy": "select"},
    )
    order_item: Optional["OrderItem"] = Relationship(
        back_populates="vps_instance",
        sa_relationship_kwargs={"lazy": "select"},
    )
    vm: Optional["ProxmoxVM"] = Relationship(
        back_populates="vps_instance",
        sa_relationship_kwargs={"lazy": "select"},
    )

    def __repr__(self) -> str:
        """Represent the VPSInstance model as a string"""
        return (
            f"VPSInstance(id={self.id}, user_id={self.user_id}, vps_plan_id={self.vps_plan_id}, "
            f"status='{self.status}', expires_at='{self.expires_at.isoformat()}')"
        )

    def to_dict(self) -> dict:
        """Convert model instance to dictionary"""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "vps_plan_id": str(self.vps_plan_id) if self.vps_plan_id else None,
            "order_item_id": str(self.order_item_id) if self.order_item_id else None,
            "vm_id": str(self.vm_id) if self.vm_id else None,
            "status": self.status,
            "expires_at": self.expires_at.isoformat(),
            "auto_renew": self.auto_renew,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def __eq__(self, other: object) -> bool:
        """Check equality between two VPSInstance instances"""
        if isinstance(other, VPSInstance):
            return self.id == other.id
        return False

    model_config = ConfigDict(from_attributes=True)
