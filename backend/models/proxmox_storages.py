import uuid
from datetime import datetime, timezone
from typing import List, Optional, TYPE_CHECKING
from pydantic import ConfigDict
from sqlmodel import (
    SQLModel,
    Field,
    Relationship,
    UniqueConstraint,
    CheckConstraint,
    Column,
)
from sqlalchemy import TEXT, BIGINT, ARRAY

if TYPE_CHECKING:
    from .proxmox_nodes import ProxmoxNode
    from .vm_templates import VMTemplate


class ProxmoxStorage(SQLModel, table=True):
    """
    ProxmoxStorage model for storing Proxmox storage details.

    Attributes:
        id: Unique identifier for the Proxmox storage.
        node_id: Foreign key to proxmox_nodes table.
        name: Name of the Proxmox storage.
        type: Type of the Proxmox storage (e.g., nfs, lvm, zfs).
        content_types: Types of content stored (e.g., images, iso, backup).
        total_space_gb: Total space of the storage in GB.
        used_space_gb: Used space of the storage in GB.
        available_space_gb: Available space of the storage in GB.
        enabled: Whether the storage is enabled.
        shared: Whether the storage is shared across nodes.
        created_at: Timestamp when the Proxmox storage was created.
        updated_at: Timestamp when the Proxmox storage was last updated.

        node: Relationship to the ProxmoxNode model (1-to-N).
        vm_templates: List of VM templates associated with this storage (1-to-N).
    """

    __tablename__ = "proxmox_storages"
    __table_args__ = (
        UniqueConstraint(
            "node_id",
            "name",
            name="proxmox_storages_node_id_name_key",
        ),
        CheckConstraint(
            "type IN ('btrfs', 'cephfs', 'cifs', 'dir', 'esxi', 'iscsi', 'iscsidirect', 'lvm', 'lvmthin', 'nfs', 'pbs', 'rbd', 'zfs', 'zfspool')",
            name="proxmox_storages_type_check",
        ),
    )

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        nullable=False,
    )
    node_id: uuid.UUID = Field(
        foreign_key="proxmox_nodes.id",
        ondelete="CASCADE",
    )
    name: str = Field(
        nullable=False,
        max_length=100,
    )
    type: str = Field(
        nullable=False,
        max_length=20,
    )
    content_types: Optional[List[str]] = Field(
        default=None,
        sa_column=Column(ARRAY(TEXT)),
    )
    total_space_gb: Optional[int] = Field(
        default=None,
        sa_column=Column(BIGINT),
    )
    used_space_gb: Optional[int] = Field(
        default=None,
        sa_column=Column(BIGINT),
    )
    available_space_gb: Optional[int] = Field(
        default=None,
        sa_column=Column(BIGINT),
    )
    enabled: Optional[bool] = Field(
        default=True,
        nullable=True,
    )
    shared: Optional[bool] = Field(
        default=False,
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

    node: Optional["ProxmoxNode"] = Relationship(
        back_populates="storages",
        sa_relationship_kwargs={"lazy": "select"},
    )
    vm_templates: List["VMTemplate"] = Relationship(
        back_populates="storage",
        passive_deletes="all",
        sa_relationship_kwargs={"lazy": "select"},
    )

    def __repr__(self) -> str:
        """Represent the ProxmoxStorage model as a string"""
        return (
            f"ProxmoxStorage(id={self.id}, name={self.name}, "
            f"type={self.type}, node_id={self.node_id})"
        )

    def to_dict(self) -> dict:
        """Convert model instance to dictionary"""
        return {
            "id": str(self.id),
            "node_id": str(self.node_id),
            "name": self.name,
            "type": self.type,
            "content_types": self.content_types,
            "total_space_gb": self.total_space_gb,
            "used_space_gb": self.used_space_gb,
            "available_space_gb": self.available_space_gb,
            "enabled": self.enabled,
            "shared": self.shared,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def __eq__(self, other: object) -> bool:
        """Check equality between two ProxmoxStorage instances"""
        if isinstance(other, ProxmoxStorage):
            return self.id == other.id
        return False

    model_config = ConfigDict(from_attributes=True)
