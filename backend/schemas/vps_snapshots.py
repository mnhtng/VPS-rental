from __future__ import annotations
import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from pydantic import (
    BaseModel,
    Field,
    ConfigDict,
    field_validator,
)
from enum import Enum

if TYPE_CHECKING:
    from .proxmox_vms import ProxmoxVMPublic


class SnapshotStatus(str, Enum):
    """Snapshot status choices"""

    CREATING = "creating"
    AVAILABLE = "available"
    DELETING = "deleting"
    ERROR = "error"


class VPSSnapshotBase(BaseModel):
    """Base schema for VPS snapshots"""

    name: str = Field(..., description="Snapshot name")
    description: Optional[str] = Field(None, description="Snapshot description")
    size_gb: Optional[float] = Field(None, description="Size of the snapshot in GB")
    status: SnapshotStatus = Field(
        default=SnapshotStatus.CREATING, description="Current status of the snapshot"
    )

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v:
            raise ValueError("Snapshot name must not be empty")

        v = v.strip()
        if len(v) == 0:
            raise ValueError("Snapshot name must not be empty")
        if len(v) > 100:
            raise ValueError("Snapshot name must not exceed 100 characters")
        return v

    @field_validator("description", mode="before")
    @classmethod
    def validate_description(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = v.strip()
        return None if len(v) == 0 else v

    @field_validator("size_gb")
    @classmethod
    def validate_size_gb(cls, v: Optional[float]) -> Optional[float]:
        if v is None:
            return v
        if v < 0:
            raise ValueError("Size must be a non-negative value")
        return v

    @field_validator("status", mode="before")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if not v:
            raise ValueError("Status must not be empty")

        v = str(v).strip().lower()
        if len(v) == 0:
            raise ValueError("Status must not be empty")
        if len(v) > 20:
            raise ValueError("Status must not exceed 20 characters")

        valid_statuses = [item.value for item in SnapshotStatus]
        if v not in valid_statuses:
            raise ValueError("Invalid status")
        return v


class VPSSnapshotCreate(VPSSnapshotBase):
    """Schema to create a new VPS snapshot"""

    vm_id: uuid.UUID = Field(..., description="Proxmox VM ID")


class VPSSnapshotUpdate(BaseModel):
    """Schema to update an existing VPS snapshot"""

    name: Optional[str] = Field(None, description="Snapshot name")
    description: Optional[str] = Field(None, description="Snapshot description")
    size_gb: Optional[float] = Field(None, description="Size of the snapshot in GB")
    status: Optional[SnapshotStatus] = Field(
        None, description="Current status of the snapshot"
    )

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = v.strip()
        if len(v) == 0:
            return None
        if len(v) > 100:
            raise ValueError("Snapshot name must not exceed 100 characters")
        return v

    @field_validator("description", mode="before")
    @classmethod
    def validate_description(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = v.strip()
        return None if len(v) == 0 else v

    @field_validator("size_gb")
    @classmethod
    def validate_size_gb(cls, v: Optional[float]) -> Optional[float]:
        if v is None:
            return v
        if v < 0:
            raise ValueError("Size must be a non-negative value")
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

        valid_statuses = [item.value for item in SnapshotStatus]
        if v not in valid_statuses:
            raise ValueError("Invalid status")
        return v


class VPSSnapshotPublic(VPSSnapshotBase):
    """Schema representing VPS snapshot data in the database"""

    id: uuid.UUID = Field(..., description="VPS snapshot ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    model_config = ConfigDict(from_attributes=True)


class VPSSnapshotResponse(VPSSnapshotPublic):
    """Schema for VPS snapshot data returned in API responses"""

    vm: Optional[ProxmoxVMPublic] = Field(
        None, description="Associated Proxmox VM details"
    )

    model_config = ConfigDict(from_attributes=True)
