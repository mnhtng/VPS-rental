import uuid
from datetime import datetime, timezone
from typing import List, Optional, TYPE_CHECKING
from pydantic import ConfigDict
from sqlmodel import (
    Relationship,
    SQLModel,
    Field,
    CheckConstraint,
)

if TYPE_CHECKING:
    from .proxmox_nodes import ProxmoxNode
    from .vm_templates import VMTemplate
    from .proxmox_vms import ProxmoxVM


class ProxmoxCluster(SQLModel, table=True):
    """
    ProxmoxCluster model for storing Proxmox cluster information.

    Attributes:
        id: Unique identifier for the Proxmox cluster.
        name: Name of the Proxmox cluster.
        api_host: API host address.
        api_port: API port number.
        api_user: API username.
        api_password: API password (optional).
        api_token_id: API token ID (optional).
        api_token_secret: API token secret (optional).
        verify_ssl: Whether to verify SSL certificates.
        status: Status of the cluster (e.g., active, maintenance, offline).
        version: Version of the Proxmox cluster (optional).
        created_at: Timestamp when the cluster was created.
        updated_at: Timestamp when the cluster was last updated.

        nodes: Relationship to ProxmoxNode model (1-to-N).
        vm_templates: Relationship to VMTemplate model (1-to-N).
        vms: Relationship to ProxmoxVM model (1-to-N).
    """

    __tablename__ = "proxmox_clusters"
    __table_args__ = (
        CheckConstraint(
            "status IN ('active', 'maintenance', 'offline')",
            name="proxmox_clusters_status_check",
        ),
    )

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        nullable=False,
    )
    name: str = Field(
        unique=True,
        nullable=False,
        max_length=100,
    )
    api_host: str = Field(
        nullable=False,
        max_length=255,
    )
    api_port: int = Field(
        default=8006,
    )
    api_user: str = Field(
        nullable=False,
        max_length=100,
    )
    api_password: Optional[str] = Field(
        default=None,
        nullable=True,
        max_length=255,
    )
    api_token_id: Optional[str] = Field(
        default=None,
        nullable=True,
        max_length=100,
    )
    api_token_secret: Optional[str] = Field(
        default=None,
        nullable=True,
        max_length=255,
    )
    verify_ssl: bool = Field(
        default=False,
        nullable=False,
    )
    status: str = Field(
        default="active",
        max_length=20,
    )
    version: Optional[str] = Field(
        default=None,
        nullable=True,
        max_length=50,
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

    nodes: List["ProxmoxNode"] = Relationship(
        back_populates="cluster",
        passive_deletes="all",
        sa_relationship_kwargs={"lazy": "select"},
    )
    vm_templates: List["VMTemplate"] = Relationship(
        back_populates="cluster",
        passive_deletes="all",
        sa_relationship_kwargs={"lazy": "select"},
    )
    vms: List["ProxmoxVM"] = Relationship(
        back_populates="cluster",
        passive_deletes="all",
        sa_relationship_kwargs={"lazy": "select"},
    )

    def __repr__(self) -> str:
        """Represent the ProxmoxCluster model as a string"""
        return f"<ProxmoxCluster(name='{self.name}', api_host='{self.api_host}', status='{self.status}')>"

    def to_dict(self) -> dict:
        """Convert model instance to dictionary"""
        return {
            "id": str(self.id),
            "name": self.name,
            "api_host": self.api_host,
            "api_port": self.api_port,
            "api_user": self.api_user,
            "api_password": self.api_password,
            "api_token_id": self.api_token_id,
            "api_token_secret": self.api_token_secret,
            "verify_ssl": self.verify_ssl,
            "status": self.status,
            "version": self.version,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def __eq__(self, other: object) -> bool:
        """Check equality between two ProxmoxCluster instances"""
        if isinstance(other, ProxmoxCluster):
            return self.id == other.id
        return False

    model_config = ConfigDict(from_attributes=True)
