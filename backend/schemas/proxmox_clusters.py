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


class ClusterStatus(str, Enum):
    """Cluster status choices"""

    ACTIVE = "active"
    MAINTENANCE = "maintenance"
    OFFLINE = "offline"


class ProxmoxClusterBase(BaseModel):
    """Base schema for Proxmox cluster"""

    name: str = Field(..., description="Cluster name")
    api_host: str = Field(..., description="API host address")
    api_port: Optional[int] = Field(default=8006, description="API port")
    api_user: str = Field(..., description="API username")
    verify_ssl: bool = Field(default=False, description="Verify SSL certificates")
    status: Optional[ClusterStatus] = Field(
        default=ClusterStatus.ACTIVE, description="Cluster status"
    )
    version: Optional[str] = Field(None, description="Proxmox version")

    @field_validator("name", "api_host", "api_user")
    @classmethod
    def validate_required_fields(cls, v: str, info: ValidationInfo) -> str:
        field_name = info.field_name.replace("_", " ").capitalize()

        if not v:
            raise ValueError(f"{field_name} must not be empty")

        v = v.strip()
        if len(v) == 0:
            raise ValueError(f"{field_name} must not be empty")

        max_lengths = {
            "name": 100,
            "api_host": 255,
            "api_user": 100,
        }
        max_length = max_lengths.get(info.field_name)

        if max_length and len(v) > max_length:
            raise ValueError(f"{field_name} must not exceed {max_length} characters")
        return v

    @field_validator("version")
    @classmethod
    def validate_version(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = v.strip()
        if len(v) == 0:
            return None
        if len(v) > 50:
            raise ValueError("Version must not exceed 50 characters")
        return v

    @field_validator("api_port")
    @classmethod
    def validate_api_port(cls, v: Optional[int]) -> Optional[int]:
        if v is None:
            return v
        if v <= 0 or v > 65535:
            raise ValueError("API port must be between 1 and 65535")
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

        valid_statuses = [status.value for status in ClusterStatus]
        if v not in valid_statuses:
            raise ValueError("Invalid cluster status")
        return v


class ProxmoxClusterCreate(ProxmoxClusterBase):
    """Schema to create a new Proxmox cluster"""

    api_password: Optional[str] = Field(None, description="API password")
    api_token_id: Optional[str] = Field(None, description="API token ID")
    api_token_secret: Optional[str] = Field(None, description="API token secret")

    @field_validator("api_password", "api_token_id", "api_token_secret")
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
        if info.field_name == "api_token_id" and len(v) > 100:
            raise ValueError(f"{field_name} must not exceed 100 characters")
        return v


class ProxmoxClusterUpdate(BaseModel):
    """Schema to update an existing Proxmox cluster"""

    name: Optional[str] = Field(None, description="Cluster name")
    api_host: Optional[str] = Field(None, description="API host address")
    api_port: Optional[int] = Field(None, description="API port")
    api_user: Optional[str] = Field(None, description="API username")
    api_password: Optional[str] = Field(None, description="API password")
    api_token_id: Optional[str] = Field(None, description="API token ID")
    api_token_secret: Optional[str] = Field(None, description="API token secret")
    verify_ssl: Optional[bool] = Field(None, description="Verify SSL certificates")
    status: Optional[ClusterStatus] = Field(None, description="Cluster status")
    version: Optional[str] = Field(None, description="Proxmox version")

    @field_validator(
        "name",
        "api_host",
        "api_user",
        "api_password",
        "api_token_id",
        "api_token_secret",
        "version",
    )
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
            "name": 100,
            "api_host": 255,
            "api_user": 100,
            "api_token_id": 100,
            "version": 50,
        }
        max_length = max_lengths.get(info.field_name)

        if max_length and len(v) > max_length:
            raise ValueError(f"{field_name} must not exceed {max_length} characters")
        return v

    @field_validator("api_port")
    @classmethod
    def validate_api_port(cls, v: Optional[int]) -> Optional[int]:
        if v is None:
            return v
        if v <= 0 or v > 65535:
            raise ValueError("API port must be between 1 and 65535")
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

        valid_statuses = [status.value for status in ClusterStatus]
        if v not in valid_statuses:
            raise ValueError("Invalid cluster status")
        return v


class ProxmoxClusterPublic(ProxmoxClusterBase):
    """Schema representing proxmox cluster data in the database"""

    id: uuid.UUID = Field(..., description="Cluster ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    model_config = ConfigDict(from_attributes=True)


class ProxmoxClusterResponse(ProxmoxClusterPublic):
    """Schema for proxmox cluster data returned in API responses"""

    nodes: Optional[list[ProxmoxNodePublic]] = Field(
        None, description="List of nodes associated with the cluster"
    )

    model_config = ConfigDict(from_attributes=True)
