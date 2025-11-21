from __future__ import annotations
import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from pydantic import (
    BaseModel,
    Field,
    ConfigDict,
    ValidationInfo,
    field_validator,
)
from enum import Enum

if TYPE_CHECKING:
    from .proxmox_clusters import ProxmoxClusterPublic
    from .proxmox_nodes import ProxmoxNodePublic
    from .vm_templates import VMTemplatePublic
    from .vps_snapshots import VPSSnapshotPublic


class PowerStatus(str, Enum):
    """Power status choices"""

    RUNNING = "running"
    STOPPED = "stopped"
    SUSPENDED = "suspended"


class ProxmoxVMBase(BaseModel):
    """Base schema for Proxmox VM"""

    vmid: int = Field(..., description="VM ID in Proxmox")
    hostname: str = Field(..., description="Hostname of the VM")
    ip_address: Optional[str] = Field(None, description="IP address assigned to the VM")
    mac_address: Optional[str] = Field(None, description="MAC address of the VM")
    username: Optional[str] = Field(None, description="Username for accessing the VM")
    ssh_port: Optional[int] = Field(None, description="SSH port for accessing the VM")
    vnc_port: Optional[int] = Field(None, description="VNC port for accessing the VM")
    vcpu: Optional[int] = Field(
        None, description="Number of virtual CPUs allocated to the VM"
    )
    ram_gb: Optional[int] = Field(
        None, description="Amount of RAM in GB allocated to the VM"
    )
    storage_gb: Optional[int] = Field(
        None, description="Amount of storage in GB allocated to the VM"
    )
    storage_type: Optional[str] = Field(
        None, description="Type of storage (e.g., SSD, HDD)"
    )
    bandwidth_mbps: Optional[int] = Field(
        None, description="Network bandwidth in Mbps allocated to the VM"
    )
    power_status: PowerStatus = Field(..., description="Power status of the VM")

    @field_validator("hostname")
    @classmethod
    def validate_hostname(cls, v: str) -> str:
        if not v:
            raise ValueError("Hostname must not be empty")

        v = v.strip()
        if len(v) == 0:
            raise ValueError("Hostname must not be empty")
        if len(v) > 255:
            raise ValueError("Hostname must not exceed 255 characters")
        return v

    @field_validator("ip_address", "mac_address", "username", "storage_type")
    @classmethod
    def validate_optional_strings(
        cls, v: Optional[str], info: ValidationInfo
    ) -> Optional[str]:
        field_name = info.field_name.replace("_", " ").capitalize()

        if v is None:
            return v

        v = v.strip()
        if len(v) == 0:
            return None

        max_lengths = {
            "mac_address": 17,
            "username": 100,
            "storage_type": 20,
        }
        max_length = max_lengths.get(info.field_name)

        if max_length and len(v) > max_length:
            raise ValueError(f"{field_name} must not exceed {max_length} characters")
        return v

    @field_validator("vmid")
    @classmethod
    def validate_vmid(cls, v: int) -> int:
        if not v:
            raise ValueError("VM ID must not be empty")
        if v <= 0:
            raise ValueError("VM ID must be a positive integer")
        return v

    @field_validator(
        "ssh_port", "vnc_port", "vcpu", "ram_gb", "storage_gb", "bandwidth_mbps"
    )
    @classmethod
    def validate_positive_integers(
        cls, v: Optional[int], info: ValidationInfo
    ) -> Optional[int]:
        field_name = info.field_name.replace("_", " ").capitalize()

        if v is None:
            return v
        if v < 0:
            raise ValueError(f"{field_name} must be non-negative")
        return v

    @field_validator("power_status", mode="before")
    @classmethod
    def validate_power_status(cls, v: str) -> str:
        if not v:
            raise ValueError("Power status must not be empty")

        v = str(v).strip().lower()
        if len(v) == 0:
            raise ValueError("Power status must not be empty")
        if len(v) > 20:
            raise ValueError("Power status must not exceed 20 characters")

        valid_statuses = [item.value for item in PowerStatus]
        if v not in valid_statuses:
            raise ValueError("Invalid power status")
        return v


class ProxmoxVMCreate(ProxmoxVMBase):
    """Schema to create a Proxmox VM"""

    cluster_id: uuid.UUID = Field(..., description="Proxmox cluster ID")
    node_id: uuid.UUID = Field(..., description="Proxmox node ID")
    template_id: uuid.UUID = Field(..., description="VM template ID")
    password: Optional[str] = Field(None, description="Password for the VM")
    vnc_password: Optional[str] = Field(None, description="VNC password for the VM")

    @field_validator("password", "vnc_password", mode="before")
    @classmethod
    def validate_optional_passwords(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = v.strip()
        return None if len(v) == 0 else v


class ProxmoxVMUpdate(BaseModel):
    """Schema to update a Proxmox VM"""

    hostname: Optional[str] = Field(None, description="Hostname of the VM")
    ip_address: Optional[str] = Field(None, description="IP address assigned to the VM")
    mac_address: Optional[str] = Field(None, description="MAC address of the VM")
    username: Optional[str] = Field(None, description="Username for accessing the VM")
    ssh_port: Optional[int] = Field(None, description="SSH port for accessing the VM")
    vnc_port: Optional[int] = Field(None, description="VNC port for accessing the VM")
    vcpu: Optional[int] = Field(
        None, description="Number of virtual CPUs allocated to the VM"
    )
    ram_gb: Optional[int] = Field(
        None, description="Amount of RAM in GB allocated to the VM"
    )
    storage_gb: Optional[int] = Field(
        None, description="Amount of storage in GB allocated to the VM"
    )
    storage_type: Optional[str] = Field(
        None, description="Type of storage (e.g., SSD, HDD)"
    )
    bandwidth_mbps: Optional[int] = Field(
        None, description="Network bandwidth in Mbps allocated to the VM"
    )
    power_status: Optional[PowerStatus] = Field(
        None, description="Power status of the VM"
    )

    @field_validator(
        "hostname",
        "ip_address",
        "mac_address",
        "username",
        "storage_type",
    )
    @classmethod
    def validate_optional_strings(
        cls, v: Optional[str], info: ValidationInfo
    ) -> Optional[str]:
        field_name = info.field_name.replace("_", " ").capitalize()

        if v is None:
            return v

        v = v.strip()
        if len(v) == 0:
            return None

        max_lengths = {
            "hostname": 255,
            "mac_address": 17,
            "username": 100,
            "storage_type": 20,
        }
        max_length = max_lengths.get(info.field_name)

        if max_length and len(v) > max_length:
            raise ValueError(f"{field_name} must not exceed {max_length} characters")
        return v

    @field_validator(
        "ssh_port",
        "vnc_port",
        "vcpu",
        "ram_gb",
        "storage_gb",
        "bandwidth_mbps",
    )
    @classmethod
    def validate_positive_integers(
        cls, v: Optional[int], info: ValidationInfo
    ) -> Optional[int]:
        field_name = info.field_name.replace("_", " ").capitalize()

        if v is None:
            return v
        if v < 0:
            raise ValueError(f"{field_name} must be non-negative")
        return v

    @field_validator("power_status", mode="before")
    @classmethod
    def validate_power_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = str(v).strip().lower()
        if len(v) == 0:
            return None
        if len(v) > 20:
            raise ValueError("Power status must not exceed 20 characters")

        valid_statuses = [item.value for item in PowerStatus]
        if v not in valid_statuses:
            raise ValueError("Invalid power status")
        return v


class ProxmoxVMPublic(ProxmoxVMBase):
    """Schema representing Proxmox VM data in the database"""

    id: uuid.UUID = Field(..., description="Proxmox VM ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    model_config = ConfigDict(from_attributes=True)


class ProxmoxVMResponse(ProxmoxVMPublic):
    """Schema for Proxmox VM data returned in API responses"""

    cluster: Optional[ProxmoxClusterPublic] = Field(
        None, description="Associated Proxmox cluster information"
    )
    node: Optional[ProxmoxNodePublic] = Field(
        None, description="Associated Proxmox node information"
    )
    template: Optional[VMTemplatePublic] = Field(
        None, description="Associated VM template information"
    )
    snapshots: Optional[list[VPSSnapshotPublic]] = Field(
        None, description="List of associated VPS snapshots"
    )

    model_config = ConfigDict(from_attributes=True)
