import uuid
from decimal import Decimal
from datetime import datetime, timezone
from typing import Dict, List, Optional, TYPE_CHECKING
from pydantic import ConfigDict
from sqlmodel import (
    SQLModel,
    Field,
    Relationship,
    UniqueConstraint,
    CheckConstraint,
    Column,
)
from sqlalchemy.dialects.postgresql import JSONB, INET

if TYPE_CHECKING:
    from .proxmox_clusters import ProxmoxCluster
    from .proxmox_storages import ProxmoxStorage
    from .vm_templates import VMTemplate
    from .proxmox_vms import ProxmoxVM


class ProxmoxNode(SQLModel, table=True):
    """
    ProxmoxNode model for storing Proxmox node details.

    Attributes:
        id: UUID primary key.
        cluster_id: Foreign key to ProxmoxCluster.
        name: Node name.
        ip_address: IP address of the node.
        status: Current status of the node.
        cpu_cores: Number of CPU cores.
        total_memory_gb: Total memory in GB.
        total_storage_gb: Total storage in GB.
        max_vms: Maximum number of VMs allowed.
        cpu_overcommit_ratio: CPU overcommit ratio.
        ram_overcommit_ratio: RAM overcommit ratio.
        datacenter: Datacenter location.
        location: Physical location of the node.
        last_health_check: Timestamp of the last health check.
        health_status: JSON field storing health status details.
        created_at: Timestamp of creation.
        updated_at: Timestamp of last update.

        cluster: Relationship to the ProxmoxCluster model (1-to-N).
        storages: Relationship to the ProxmoxStorage model (1-to-N).
        vm_templates: Relationship to the VMTemplate model (1-to-N).
        vms: Relationship to the ProxmoxVM model (1-to-N).
    """

    __tablename__ = "proxmox_nodes"
    __table_args__ = (
        UniqueConstraint(
            "cluster_id",
            "name",
            name="proxmox_nodes_cluster_id_name_key",
        ),
        CheckConstraint(
            "status IN ('online', 'offline', 'maintenance')",
            name="proxmox_nodes_status_check",
        ),
    )

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        nullable=False,
    )
    cluster_id: uuid.UUID = Field(
        foreign_key="proxmox_clusters.id",
        ondelete="CASCADE",
    )
    name: str = Field(
        nullable=False,
        max_length=100,
    )
    ip_address: str = Field(
        sa_column=Column(INET),
    )
    status: str = Field(
        default="online",
        max_length=20,
    )
    cpu_cores: Optional[int] = Field(
        default=None,
        nullable=True,
    )
    total_memory_gb: Optional[Decimal] = Field(
        default=None,
        max_digits=10,
        decimal_places=2,
    )
    total_storage_gb: Optional[Decimal] = Field(
        default=None,
        max_digits=10,
        decimal_places=2,
    )
    max_vms: Optional[int] = Field(
        default=100,
        nullable=True,
    )
    cpu_overcommit_ratio: Optional[Decimal] = Field(
        default=2.0,
        nullable=True,
        max_digits=3,
        decimal_places=2,
    )
    ram_overcommit_ratio: Optional[Decimal] = Field(
        default=1.5,
        nullable=True,
        max_digits=3,
        decimal_places=2,
    )
    datacenter: Optional[str] = Field(
        default=None,
        nullable=True,
        max_length=100,
    )
    location: Optional[str] = Field(
        default=None,
        nullable=True,
        max_length=255,
    )
    last_health_check: Optional[datetime] = Field(
        default=None,
        nullable=True,
    )
    health_status: Optional[Dict] = Field(
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

    cluster: Optional["ProxmoxCluster"] = Relationship(
        back_populates="nodes",
        sa_relationship_kwargs={"lazy": "select"},
    )
    storages: List["ProxmoxStorage"] = Relationship(
        back_populates="node",
        passive_deletes="all",
        sa_relationship_kwargs={"lazy": "select"},
    )
    vm_templates: List["VMTemplate"] = Relationship(
        back_populates="node",
        passive_deletes="all",
        sa_relationship_kwargs={"lazy": "select"},
    )
    vms: List["ProxmoxVM"] = Relationship(
        back_populates="node",
        passive_deletes="all",
        sa_relationship_kwargs={"lazy": "select"},
    )

    def __repr__(self) -> str:
        """Represent the ProxmoxNode model as a string"""
        return f"<ProxmoxNode id={self.id} name={self.name} status={self.status}>"

    def to_dict(self) -> dict:
        """Convert model instance to dictionary"""
        return {
            "id": str(self.id),
            "cluster_id": str(self.cluster_id),
            "name": self.name,
            "ip_address": self.ip_address,
            "status": self.status,
            "cpu_cores": self.cpu_cores,
            "total_memory_gb": self.total_memory_gb,
            "total_storage_gb": self.total_storage_gb,
            "max_vms": self.max_vms,
            "cpu_overcommit_ratio": (
                float(self.cpu_overcommit_ratio)
                if self.cpu_overcommit_ratio is not None
                else None
            ),
            "ram_overcommit_ratio": (
                float(self.ram_overcommit_ratio)
                if self.ram_overcommit_ratio is not None
                else None
            ),
            "datacenter": self.datacenter,
            "location": self.location,
            "last_health_check": (
                self.last_health_check.isoformat() if self.last_health_check else None
            ),
            "health_status": self.health_status,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def __eq__(self, other: object) -> bool:
        """Check equality based on id"""
        if isinstance(other, ProxmoxNode):
            return self.id == other.id
        return False

    model_config = ConfigDict(from_attributes=True)
