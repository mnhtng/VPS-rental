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
    from .proxmox_nodes import ProxmoxNodePublic


class StorageType(str, Enum):
    """Storage type choices"""

    BTRFS = "btrfs"
    CEPHFS = "cephfs"
    CIFS = "cifs"
    DIR = "dir"
    ESXI = "esxi"
    ISCSI = "iscsi"
    ISCSIDIRECT = "iscsidirect"
    LVM = "lvm"
    LVMTHIN = "lvmthin"
    NFS = "nfs"
    PBS = "pbs"
    RBD = "rbd"
    ZFS = "zfs"
    ZFSPOOL = "zfspool"


class ProxmoxStorageBase(BaseModel):
    """Base schema for Proxmox storage"""

    name: str = Field(..., description="Storage name")
    type: Optional[StorageType] = Field(None, description="Storage type")
    content_types: Optional[list[str]] = Field(
        None, description="Content types (images, iso, backup)"
    )
    total_space_gb: Optional[float] = Field(None, description="Total space in GB")
    used_space_gb: Optional[float] = Field(None, description="Used space in GB")
    available_space_gb: Optional[float] = Field(
        None, description="Available space in GB"
    )
    enabled: Optional[bool] = Field(default=True, description="Storage enabled")
    shared: Optional[bool] = Field(
        default=False, description="Shared storage across nodes"
    )

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v:
            raise ValueError("Storage name must not be empty")

        v = v.strip()
        if len(v) == 0:
            raise ValueError("Storage name must not be empty")
        if len(v) > 100:
            raise ValueError("Storage name must not exceed 100 characters")
        return v

    @field_validator("total_space_gb", "used_space_gb", "available_space_gb")
    @classmethod
    def validate_space_fields(
        cls, v: Optional[float], info: ValidationInfo
    ) -> Optional[float]:
        field_name = info.field_name.replace("_", " ").capitalize()

        if v is None:
            return v
        if v < 0:
            raise ValueError(f"{field_name} must be non-negative")
        return v

    @field_validator("content_types")
    @classmethod
    def validate_content_types(cls, v: Optional[list[str]]) -> Optional[list[str]]:
        if v is None:
            return v

        if not isinstance(v, list):
            raise ValueError("Content types must be a list of strings")

        for content_type in v:
            if not isinstance(content_type, str) or len(content_type.strip()) == 0:
                raise ValueError("Each content type must be a non-empty string")
        return v

    @field_validator("type", mode="before")
    @classmethod
    def validate_type(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = str(v).strip().lower()
        if len(v) == 0:
            return None
        if len(v) > 20:
            raise ValueError("Storage type must not exceed 20 characters")

        valid_types = [item.value for item in StorageType]
        if v not in valid_types:
            raise ValueError("Invalid storage type")
        return v


class ProxmoxStorageCreate(ProxmoxStorageBase):
    """Schema to create a new Proxmox storage"""

    node_id: Optional[uuid.UUID] = Field(None, description="Node ID")


class ProxmoxStorageUpdate(BaseModel):
    """Schema to update an existing Proxmox storage"""

    name: Optional[str] = Field(None, description="Storage name")
    type: Optional[StorageType] = Field(None, description="Storage type")
    content_types: Optional[list[str]] = Field(
        None, description="Content types (images, iso, backup)"
    )
    total_space_gb: Optional[float] = Field(None, description="Total space in GB")
    used_space_gb: Optional[float] = Field(None, description="Used space in GB")
    available_space_gb: Optional[float] = Field(
        None, description="Available space in GB"
    )
    enabled: Optional[bool] = Field(None, description="Storage enabled")
    shared: Optional[bool] = Field(None, description="Shared storage across nodes")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = v.strip()
        if len(v) == 0:
            return None
        if len(v) > 100:
            raise ValueError("Storage name must not exceed 100 characters")
        return v

    @field_validator("total_space_gb", "used_space_gb", "available_space_gb")
    @classmethod
    def validate_space_fields(
        cls, v: Optional[float], info: ValidationInfo
    ) -> Optional[float]:
        field_name = info.field_name.replace("_", " ").capitalize()

        if v is None:
            return v
        if v < 0:
            raise ValueError(f"{field_name} must be non-negative")
        return v

    @field_validator("content_types")
    @classmethod
    def validate_content_types(cls, v: Optional[list[str]]) -> Optional[list[str]]:
        if v is None:
            return v

        if not isinstance(v, list):
            raise ValueError("Content types must be a list of strings")

        for content_type in v:
            if not isinstance(content_type, str) or len(content_type.strip()) == 0:
                raise ValueError("Each content type must be a non-empty string")
        return v

    @field_validator("type", mode="before")
    @classmethod
    def validate_type(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = str(v).strip().lower()
        if len(v) == 0:
            return None
        if len(v) > 20:
            raise ValueError("Storage type must not exceed 20 characters")

        valid_types = [item.value for item in StorageType]
        if v not in valid_types:
            raise ValueError("Invalid storage type")
        return v


class ProxmoxStoragePublic(ProxmoxStorageBase):
    """Schema representing Proxmox storage data in the database"""

    id: uuid.UUID = Field(..., description="Storage ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    model_config = ConfigDict(from_attributes=True)


class ProxmoxStorageResponse(ProxmoxStoragePublic):
    """Schema for Proxmox storage data returned in API responses"""

    node: Optional[ProxmoxNodePublic] = Field(
        None, description="Associated Proxmox node information"
    )

    model_config = ConfigDict(from_attributes=True)
