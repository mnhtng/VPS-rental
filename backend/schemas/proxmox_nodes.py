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


class NodeStatus(str, Enum):
    """Node status choices"""

    ONLINE = "online"
    OFFLINE = "offline"
    MAINTENANCE = "maintenance"


class ProxmoxNodeBase(BaseModel):
    """Base schema for Proxmox node"""

    name: str = Field(..., description="Node name")
    ip_address: str = Field(..., description="IP address")
    status: Optional[NodeStatus] = Field(
        default=NodeStatus.ONLINE, description="Node status"
    )
    cpu_cores: Optional[int] = Field(None, description="CPU cores")
    total_memory_mb: Optional[int] = Field(None, description="Total memory in MB")
    total_storage_gb: Optional[int] = Field(None, description="Total storage in GB")
    max_vms: Optional[int] = Field(default=100, description="Maximum VMs allowed")
    cpu_overcommit_ratio: Optional[float] = Field(
        default=2.0, description="CPU overcommit ratio"
    )
    ram_overcommit_ratio: Optional[float] = Field(
        default=1.5, description="RAM overcommit ratio"
    )
    datacenter: Optional[str] = Field(None, description="Datacenter location")
    location: Optional[str] = Field(None, description="Physical location")
    last_health_check: Optional[datetime] = Field(
        None, description="Timestamp of last health check"
    )
    health_status: Optional[dict] = Field(
        None, description="Health status details in JSON format"
    )

    @field_validator("name", "ip_address")
    @classmethod
    def validate_required_fields(cls, v: str, info: ValidationInfo) -> str:
        field_name = info.field_name.replace("_", " ").capitalize()

        if not v:
            raise ValueError(f"{field_name} must not be empty")

        v = v.strip()
        if len(v) == 0:
            raise ValueError(f"{field_name} must not be empty")
        if info.field_name == "name" and len(v) > 100:
            raise ValueError("Name must not exceed 100 characters")
        return v

    @field_validator("datacenter", "location")
    @classmethod
    def validate_optional_fields(
        cls, v: Optional[str], info: ValidationInfo
    ) -> Optional[str]:
        field_name = info.field_name.replace("_", " ").capitalize()

        if v is None:
            return v

        v = v.strip()
        if len(v) == 0:
            return None

        max_lengths = {
            "datacenter": 100,
            "location": 255,
        }
        max_length = max_lengths.get(info.field_name)

        if max_length and len(v) > max_length:
            raise ValueError(f"{field_name} must not exceed {max_length} characters")
        return v

    @field_validator(
        "cpu_cores",
        "total_memory_mb",
        "total_storage_gb",
        "max_vms",
        "cpu_overcommit_ratio",
        "ram_overcommit_ratio",
    )
    @classmethod
    def validate_positive_numbers(
        cls, v: Optional[int | float], info: ValidationInfo
    ) -> Optional[int | float]:
        field_name = info.field_name.replace("_", " ").capitalize()

        if v is None:
            return v
        if v <= 0:
            raise ValueError(f"{field_name} must be a positive number")
        return v

    @field_validator("status", mode="before")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = str(v).strip().lower()
        if len(v) == 0:
            return None
        if len(v) > 20:
            raise ValueError("Status must not exceed 20 characters")

        valid_statuses = [status.value for status in NodeStatus]
        if v not in valid_statuses:
            raise ValueError("Invalid node status")
        return v


class ProxmoxNodeCreate(ProxmoxNodeBase):
    """Schema to create a new Proxmox node"""

    cluster_id: uuid.UUID = Field(..., description="Cluster ID")


class ProxmoxNodeUpdate(BaseModel):
    """Schema to update an existing Proxmox node"""

    name: Optional[str] = Field(None, description="Node name")
    ip_address: Optional[str] = Field(None, description="IP address")
    status: Optional[NodeStatus] = Field(None, description="Node status")
    cpu_cores: Optional[int] = Field(None, description="CPU cores")
    total_memory_mb: Optional[int] = Field(None, description="Total memory in MB")
    total_storage_gb: Optional[int] = Field(None, description="Total storage in GB")
    max_vms: Optional[int] = Field(None, description="Maximum VMs allowed")
    cpu_overcommit_ratio: Optional[float] = Field(
        None, description="CPU overcommit ratio"
    )
    ram_overcommit_ratio: Optional[float] = Field(
        None, description="RAM overcommit ratio"
    )
    datacenter: Optional[str] = Field(None, description="Datacenter location")
    location: Optional[str] = Field(None, description="Physical location")
    last_health_check: Optional[datetime] = Field(
        None, description="Timestamp of last health check"
    )
    health_status: Optional[dict] = Field(
        None, description="Health status details in JSON format"
    )

    @field_validator("name", "ip_address", "datacenter", "location")
    @classmethod
    def validate_optional_string_fields(
        cls, v: Optional[str], info: ValidationInfo
    ) -> Optional[str]:
        field_name = info.field_name.replace("_", " ").capitalize()

        if v is None:
            return v

        v = v.strip()
        if len(v) == 0:
            return None

        max_lengths = {
            "name": 100,
            "datacenter": 100,
            "location": 255,
        }
        max_length = max_lengths.get(info.field_name)

        if max_length and len(v) > max_length:
            raise ValueError(f"{field_name} must not exceed {max_length} characters")
        return v

    @field_validator(
        "cpu_cores",
        "total_memory_mb",
        "total_storage_gb",
        "max_vms",
        "cpu_overcommit_ratio",
        "ram_overcommit_ratio",
    )
    @classmethod
    def validate_positive_numbers(
        cls, v: Optional[int | float], info: ValidationInfo
    ) -> Optional[int | float]:
        field_name = info.field_name.replace("_", " ").capitalize()

        if v is None:
            return v
        if v <= 0:
            raise ValueError(f"{field_name} must be a positive number")
        return v

    @field_validator("status", mode="before")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = str(v).strip().lower()
        if len(v) == 0:
            return None
        if len(v) > 20:
            raise ValueError("Status must not exceed 20 characters")

        valid_statuses = [status.value for status in NodeStatus]
        if v not in valid_statuses:
            raise ValueError("Invalid node status")
        return v


class ProxmoxNodePublic(ProxmoxNodeBase):
    """Schema representing Proxmox node data in the database"""

    id: uuid.UUID = Field(..., description="Node ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    model_config = ConfigDict(from_attributes=True)


class ProxmoxNodeResponse(ProxmoxNodePublic):
    """Schema for Proxmox node data returned in API responses"""

    cluster: Optional[ProxmoxClusterPublic] = Field(
        None, description="Associated Proxmox cluster information"
    )

    model_config = ConfigDict(from_attributes=True)


class ProxmoxNodeResourceUsage(BaseModel):
    """Schema representing resource usage statistics for a Proxmox node"""

    node_id: uuid.UUID
    node_name: str
    cpu_usage_percent: float
    memory_used_mb: int
    memory_total_mb: int
    memory_usage_percent: float
    storage_used_gb: int
    storage_total_gb: int
    storage_usage_percent: float
    active_vms: int
    max_vms: int

    model_config = ConfigDict(from_attributes=True)
