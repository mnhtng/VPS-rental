import uuid
from decimal import Decimal
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from pydantic import ConfigDict
from sqlmodel import (
    SQLModel,
    Field,
    Relationship,
    UniqueConstraint,
    CheckConstraint,
)

if TYPE_CHECKING:
    from .proxmox_vms import ProxmoxVM


class VPSSnapshot(SQLModel, table=True):
    """
    VPSSnapshot model for storing VPS snapshot details.

    Attributes:
        id: Unique identifier for the VPS snapshot.
        vm_id: Identifier for the VPS instance associated with the snapshot.
        name: Name of the snapshot.
        description: Optional description of the snapshot.
        size_gb: Size of the snapshot in GB.
        status: Status of the snapshot (e.g., creating, available, deleting, error).
        created_at: Timestamp when the snapshot was created.
        updated_at: Timestamp when the snapshot was last updated.

        vm: Relationship to ProxmoxVM model (1-to-N).
    """

    __tablename__ = "vps_snapshots"
    __table_args__ = (
        UniqueConstraint(
            "vm_id",
            "name",
            name="vps_snapshots_vm_id_name_key",
        ),
        CheckConstraint(
            "status IN ('creating', 'available', 'deleting', 'error')",
            name="vps_snapshots_status_check",
        ),
    )

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        nullable=False,
    )
    vm_id: uuid.UUID = Field(
        index=True,
        foreign_key="proxmox_vms.id",
        ondelete="CASCADE",
    )
    name: str = Field(
        nullable=False,
        max_length=100,
    )
    description: Optional[str] = Field(
        default=None,
        nullable=True,
    )
    size_gb: Optional[Decimal] = Field(
        default=None,
        nullable=True,
        max_digits=10,
        decimal_places=2,
    )
    status: str = Field(
        default="creating",
        nullable=False,
        max_length=20,
        index=True,
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

    vm: Optional["ProxmoxVM"] = Relationship(
        back_populates="snapshots",
        sa_relationship_kwargs={"lazy": "select"},
    )

    def __repr__(self) -> str:
        """Represent the VPSSnapshot instance as a string"""
        return (
            f"VPSSnapshot(id={self.id}, vm_id={self.vm_id}, "
            f"name='{self.name}', status='{self.status}')"
        )

    def to_dict(self) -> dict:
        """Convert model instance to dictionary"""
        return {
            "id": str(self.id),
            "vm_id": str(self.vm_id),
            "name": self.name,
            "description": self.description,
            "size_gb": float(self.size_gb) if self.size_gb is not None else None,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def __eq__(self, other: object) -> bool:
        """Check equality between two VPSSnapshot instances"""
        if isinstance(other, VPSSnapshot):
            return self.id == other.id
        return False

    model_config = ConfigDict(from_attributes=True)
