import uuid
from datetime import datetime, timezone
from typing import List, Optional, TYPE_CHECKING
from pydantic import ConfigDict
from sqlmodel import (
    SQLModel,
    Field,
    Relationship,
    Column,
    UniqueConstraint,
    CheckConstraint,
)
from sqlalchemy.dialects.postgresql import INET

if TYPE_CHECKING:
    from .proxmox_clusters import ProxmoxCluster
    from .proxmox_nodes import ProxmoxNode
    from .vm_templates import VMTemplate
    from .vps_instances import VPSInstance
    from .vps_snapshots import VPSSnapshot


class ProxmoxVM(SQLModel, table=True):
    """
    ProxmoxVM model for storing Proxmox virtual machine details.

    Attributes:
        id: Unique identifier for the Proxmox VM.
        cluster_id: Foreign key to ProxmoxCluster.
        node_id: Foreign key to ProxmoxNode.
        template_id: Foreign key to VMTemplate.
        vmid: VM ID in Proxmox.
        hostname: Hostname of the VM.
        ip_address: IP address assigned to the VM.
        mac_address: MAC address of the VM.
        username: Username for accessing the VM.
        password: Password for accessing the VM.
        ssh_port: SSH port for accessing the VM.
        vnc_port: VNC port for accessing the VM.
        vnc_password: VNC password for accessing the VM.
        vcpu: Number of virtual CPUs allocated to the VM.
        ram_gb: Amount of RAM in GB allocated to the VM.
        storage_gb: Amount of storage in GB allocated to the VM.
        storage_type: Type of storage (e.g., SSD, HDD).
        bandwidth_mbps: Network bandwidth in Mbps allocated to the VM.
        power_status: Power status of the VM (e.g., running, stopped).
        created_at: Timestamp when the VM was created.
        updated_at: Timestamp when the VM was last updated.

        cluster: Relationship to ProxmoxCluster model (1-to-N).
        node: Relationship to ProxmoxNode model (1-to-N).
        template: Relationship to VMTemplate model (1-to-N).
        vps_instance: Relationship to VPSInstance model (1-to-1).
        snapshots: List of VPS snapshots associated with this VM (1-to-N).
    """

    __tablename__ = "proxmox_vms"
    __table_args__ = (
        UniqueConstraint(
            "cluster_id",
            "node_id",
            "vmid",
            name="proxmox_vms_cluster_id_node_id_vmid_key",
        ),
        CheckConstraint(
            "power_status IN ('running', 'stopped', 'suspended')",
            name="proxmox_vms_power_status_check",
        ),
    )

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        nullable=False,
    )
    cluster_id: uuid.UUID = Field(
        foreign_key="proxmox_clusters.id",
        ondelete="RESTRICT",
    )
    node_id: uuid.UUID = Field(
        index=True,
        foreign_key="proxmox_nodes.id",
        ondelete="RESTRICT",
    )
    template_id: uuid.UUID = Field(
        foreign_key="vm_templates.id",
        ondelete="RESTRICT",
    )
    vmid: int = Field(
        index=True,
        nullable=False,
    )
    hostname: str = Field(
        nullable=False,
        max_length=255,
    )
    ip_address: Optional[str] = Field(
        default=None,
        sa_column=Column(INET),
    )
    mac_address: Optional[str] = Field(
        default=None,
        nullable=True,
        max_length=17,
    )
    username: Optional[str] = Field(
        default=None,
        nullable=True,
        max_length=100,
    )
    password: Optional[str] = Field(
        default=None,
        nullable=True,
        max_length=255,
    )
    ssh_port: Optional[int] = Field(
        default=22,
        nullable=True,
    )
    vnc_port: Optional[int] = Field(
        default=None,
        nullable=True,
    )
    vnc_password: Optional[str] = Field(
        default=None,
        nullable=True,
        max_length=255,
    )
    vcpu: Optional[int] = Field(
        default=None,
        nullable=True,
    )
    ram_gb: Optional[int] = Field(
        default=None,
        nullable=True,
    )
    storage_gb: Optional[int] = Field(
        default=None,
        nullable=True,
    )
    storage_type: Optional[str] = Field(
        default=None,
        nullable=True,
        max_length=20,
    )
    bandwidth_mbps: Optional[int] = Field(
        default=None,
        nullable=True,
    )
    power_status: str = Field(
        default="stopped",
        nullable=False,
        max_length=20,
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
        back_populates="vms",
        sa_relationship_kwargs={"lazy": "select"},
    )
    node: Optional["ProxmoxNode"] = Relationship(
        back_populates="vms",
        sa_relationship_kwargs={"lazy": "select"},
    )
    template: Optional["VMTemplate"] = Relationship(
        back_populates="vms",
        sa_relationship_kwargs={"lazy": "select"},
    )
    vps_instance: Optional["VPSInstance"] = Relationship(
        back_populates="vm",
        passive_deletes="all",
        sa_relationship_kwargs={
            "lazy": "select",
            "uselist": False,
        },
    )
    snapshots: List["VPSSnapshot"] = Relationship(
        back_populates="vm",
        passive_deletes="all",
        sa_relationship_kwargs={"lazy": "select"},
    )

    def __repr__(self) -> str:
        """Represent the ProxmoxVM instance as a string"""
        return (
            f"ProxmoxVM(id={self.id}, node_id={self.node_id}, "
            f"vmid={self.vmid}, hostname='{self.hostname}', power_status='{self.power_status}')"
        )

    def to_dict(self) -> dict:
        """Convert model instance to dictionary"""
        return {
            "id": str(self.id),
            "cluster_id": (str(self.cluster_id) if self.cluster_id else None),
            "node_id": (str(self.node_id) if self.node_id else None),
            "template_id": (str(self.template_id) if self.template_id else None),
            "vmid": self.vmid,
            "hostname": self.hostname,
            "ip_address": self.ip_address,
            "mac_address": self.mac_address,
            "username": self.username,
            "ssh_port": self.ssh_port,
            "vnc_port": self.vnc_port,
            "vnc_password": self.vnc_password,
            "vcpu": self.vcpu,
            "ram_gb": self.ram_gb,
            "storage_gb": self.storage_gb,
            "storage_type": self.storage_type,
            "bandwidth_mbps": self.bandwidth_mbps,
            "power_status": self.power_status,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def __eq__(self, other: object) -> bool:
        """Check equality between two ProxmoxVM instances"""
        if isinstance(other, ProxmoxVM):
            return self.id == other.id
        return False

    model_config = ConfigDict(from_attributes=True)
