import uuid
from decimal import Decimal
from datetime import datetime, timezone
from typing import List, Optional, TYPE_CHECKING
from pydantic import ConfigDict
from sqlmodel import (
    SQLModel,
    Field,
    Relationship,
    UniqueConstraint,
)

if TYPE_CHECKING:
    from .proxmox_clusters import ProxmoxCluster
    from .proxmox_nodes import ProxmoxNode
    from .proxmox_storages import ProxmoxStorage
    from .carts import Cart
    from .order_items import OrderItem
    from .proxmox_vms import ProxmoxVM


class VMTemplate(SQLModel, table=True):
    """
    VMTemplate model for storing VM template details.

    Attributes:
        id: Unique identifier for the VM template.
        cluster_id: Foreign key to proxmox_clusters table.
        node_id: Foreign key to proxmox_nodes table.
        storage_id: Foreign key to proxmox_storages table.
        template_vmid: VM ID of the template in Proxmox.
        name: Name of the VM template.
        description: Description of the VM template.
        os_type: Operating system type of the VM template.
        os_version: Operating system version of the VM template.
        default_user: Default username for the VM template.
        cloud_init_enabled: Whether cloud-init is enabled for the template.
        cpu_cores: Number of CPU cores allocated to the template.
        ram_gb: Amount of RAM in GB allocated to the template.
        storage_gb: Amount of storage in GB allocated to the template.
        setup_fee: Setup fee for using the VM template.
        created_at: Timestamp when the VM template was created.
        updated_at: Timestamp when the VM template was last updated.

        cluster: Relationship to ProxmoxCluster model (1-to-N).
        node: Relationship to ProxmoxNode model (1-to-N).
        storage: Relationship to ProxmoxStorage model (1-to-N).
        carts: List of carts associated with this VM template (1-to-N).
        order_items: List of order items associated with this VM template (1-to-N).
        vms: List of Proxmox VMs associated with this VM template (1-to-N).
    """

    __tablename__ = "vm_templates"
    __table_args__ = (
        UniqueConstraint(
            "cluster_id",
            "node_id",
            "template_vmid",
            name="vm_templates_cluster_id_node_id_template_vmid_key",
        ),
    )

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        nullable=False,
    )
    cluster_id: Optional[uuid.UUID] = Field(
        default=None,
        foreign_key="proxmox_clusters.id",
        ondelete="SET NULL",
    )
    node_id: Optional[uuid.UUID] = Field(
        default=None,
        foreign_key="proxmox_nodes.id",
        ondelete="SET NULL",
    )
    storage_id: Optional[uuid.UUID] = Field(
        default=None,
        foreign_key="proxmox_storages.id",
        ondelete="SET NULL",
    )
    template_vmid: int = Field(
        index=True,
        nullable=False,
    )
    name: str = Field(
        nullable=False,
        max_length=255,
    )
    description: Optional[str] = Field(
        default=None,
        nullable=True,
    )
    os_type: Optional[str] = Field(
        default=None,
        nullable=True,
        max_length=50,
    )
    os_version: Optional[str] = Field(
        default=None,
        nullable=True,
        max_length=10,
    )
    default_user: Optional[str] = Field(
        default="root",
        nullable=True,
        max_length=50,
    )
    cloud_init_enabled: Optional[bool] = Field(
        default=False,
        nullable=True,
    )
    cpu_cores: Optional[int] = Field(
        default=1,
        nullable=True,
    )
    ram_gb: Optional[int] = Field(
        default=1,
        nullable=True,
    )
    storage_gb: Optional[int] = Field(
        default=20,
        nullable=True,
    )
    setup_fee: Optional[Decimal] = Field(
        default=0.0,
        nullable=True,
        max_digits=10,
        decimal_places=2,
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
        back_populates="vm_templates",
        sa_relationship_kwargs={"lazy": "select"},
    )
    node: Optional["ProxmoxNode"] = Relationship(
        back_populates="vm_templates",
        sa_relationship_kwargs={"lazy": "select"},
    )
    storage: Optional["ProxmoxStorage"] = Relationship(
        back_populates="vm_templates",
        sa_relationship_kwargs={"lazy": "select"},
    )
    carts: List["Cart"] = Relationship(
        back_populates="vm_template",
        passive_deletes="all",
        sa_relationship_kwargs={"lazy": "select"},
    )
    order_items: List["OrderItem"] = Relationship(
        back_populates="vm_template",
        passive_deletes="all",
        sa_relationship_kwargs={"lazy": "select"},
    )
    vms: List["ProxmoxVM"] = Relationship(
        back_populates="template",
        passive_deletes="all",
        sa_relationship_kwargs={"lazy": "select"},
    )

    def __repr__(self) -> str:
        """Represent the VMTemplate instance as a string"""
        return f"VMTemplate(id={self.id}, name='{self.name}', os_type='{self.os_type}')"

    def to_dict(self) -> dict:
        """Convert model instance to dictionary"""
        return {
            "id": str(self.id),
            "cluster_id": (str(self.cluster_id) if self.cluster_id else None),
            "node_id": (str(self.node_id) if self.node_id else None),
            "storage_id": (str(self.storage_id) if self.storage_id else None),
            "template_vmid": self.template_vmid,
            "name": self.name,
            "description": self.description,
            "os_type": self.os_type,
            "os_version": self.os_version,
            "default_user": self.default_user,
            "cloud_init_enabled": self.cloud_init_enabled,
            "cpu_cores": self.cpu_cores,
            "ram_gb": self.ram_gb,
            "storage_gb": self.storage_gb,
            "setup_fee": float(self.setup_fee) if self.setup_fee is not None else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def __eq__(self, other: object) -> bool:
        """Check equality between two VMTemplate instances"""
        if isinstance(other, VMTemplate):
            return self.id == other.id
        return False

    model_config = ConfigDict(from_attributes=True)
