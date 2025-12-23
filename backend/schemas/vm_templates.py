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
    model_validator,
)

if TYPE_CHECKING:
    from .proxmox_clusters import ProxmoxClusterPublic
    from .proxmox_nodes import ProxmoxNodePublic
    from .proxmox_storages import ProxmoxStoragePublic


class VMTemplateBase(BaseModel):
    """Base schema for VM templates"""

    template_vmid: int = Field(..., description="VM ID of the template in Proxmox")
    name: str = Field(..., description="Template name")
    description: Optional[str] = Field(None, description="Template description")
    os_type: Optional[str] = Field(None, description="Operating system type")
    os_version: Optional[str] = Field(None, description="Operating system version")
    default_user: Optional[str] = Field(
        default="pcloud", description="Default username for the template"
    )
    cloud_init_enabled: Optional[bool] = Field(
        default=False, description="Whether cloud-init is enabled for the template"
    )
    cpu_cores: Optional[int] = Field(
        default=1, description="Number of CPU cores allocated to the template"
    )
    ram_gb: Optional[int] = Field(
        default=1, description="Amount of RAM in GB allocated to the template"
    )
    storage_gb: Optional[int] = Field(
        default=20, description="Amount of storage in GB allocated to the template"
    )
    setup_fee: Optional[float] = Field(
        default=0.0, description="Setup fee for using the VM template"
    )

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v:
            raise ValueError("Template name must not be empty")

        v = v.strip()
        if len(v) == 0:
            raise ValueError("Template name must not be empty")
        if len(v) > 255:
            raise ValueError("Template name must not exceed 255 characters")
        return v

    @field_validator("description", "os_type", "os_version", "default_user")
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
            "os_type": 50,
            "os_version": 10,
            "default_user": 50,
        }
        max_length = max_lengths.get(info.field_name)

        if max_length and len(v) > max_length:
            raise ValueError(f"{field_name} must not exceed {max_length} characters")
        return v

    @field_validator("template_vmid")
    @classmethod
    def validate_template_vmid(cls, v: int) -> int:
        if not v:
            raise ValueError("Template VM ID must not be empty")
        if v <= 0:
            raise ValueError("Template VM ID must be a positive integer")
        return v

    @field_validator("cpu_cores", "ram_gb", "storage_gb", "setup_fee")
    @classmethod
    def validate_positive_numbers(
        cls, v: Optional[int], info: ValidationInfo
    ) -> Optional[int]:
        field_name = info.field_name.replace("_", " ").capitalize()

        if v is None:
            return v
        if v < 0:
            raise ValueError(f"{field_name} must be a positive number")
        return v

    @model_validator(mode="after")
    def cross_field_rules(self):
        if self.cloud_init_enabled is True and not self.default_user:
            raise ValueError("Default user is required when cloud-init is enabled")
        return self


class VMTemplateCreate(VMTemplateBase):
    """Schema to create a new VM template"""

    cluster_id: Optional[uuid.UUID] = Field(
        None, description="Proxmox cluster ID where the template is stored"
    )
    node_id: Optional[uuid.UUID] = Field(
        None, description="Proxmox node ID where the template is stored"
    )
    storage_id: Optional[uuid.UUID] = Field(
        None, description="Proxmox storage ID where the template is stored"
    )


class VMTemplateUpdate(BaseModel):
    """Schema to update an existing VM template"""

    name: Optional[str] = Field(None, description="Template name")
    description: Optional[str] = Field(None, description="Template description")
    os_type: Optional[str] = Field(None, description="Operating system type")
    os_version: Optional[str] = Field(None, description="Operating system version")
    default_user: Optional[str] = Field(
        None, description="Default username for the template"
    )
    cloud_init_enabled: Optional[bool] = Field(
        None, description="Whether cloud-init is enabled for the template"
    )
    cpu_cores: Optional[int] = Field(
        None, description="Number of CPU cores allocated to the template"
    )
    ram_gb: Optional[int] = Field(
        None, description="Amount of RAM in GB allocated to the template"
    )
    storage_gb: Optional[int] = Field(
        None, description="Amount of storage in GB allocated to the template"
    )
    setup_fee: Optional[float] = Field(
        None, description="Setup fee for using the VM template"
    )

    @field_validator("name", "description", "os_type", "os_version", "default_user")
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
            "name": 255,
            "os_type": 50,
            "os_version": 10,
            "default_user": 50,
        }
        max_length = max_lengths.get(info.field_name)

        if max_length and len(v) > max_length:
            raise ValueError(f"{field_name} must not exceed {max_length} characters")
        return v

    @field_validator("cpu_cores", "ram_gb", "storage_gb", "setup_fee")
    @classmethod
    def validate_positive_numbers(
        cls, v: Optional[int], info: ValidationInfo
    ) -> Optional[int]:
        field_name = info.field_name.replace("_", " ").capitalize()

        if v is None:
            return v
        if v < 0:
            raise ValueError(f"{field_name} must be a positive number")
        return v

    @model_validator(mode="after")
    def cross_field_rules(self):
        if self.cloud_init_enabled is True and not self.default_user:
            raise ValueError("Default user is required when cloud-init is enabled")
        return self


class VMTemplatePublic(VMTemplateBase):
    """Schema representing VM template data in the database"""

    id: uuid.UUID = Field(..., description="Template ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    model_config = ConfigDict(from_attributes=True)


class VMTemplateResponse(VMTemplatePublic):
    """Schema for VM template data returned in API responses"""

    cluster: Optional[ProxmoxClusterPublic] = Field(
        None, description="Associated Proxmox cluster information"
    )
    node: Optional[ProxmoxNodePublic] = Field(
        None, description="Associated Proxmox node information"
    )
    storage: Optional[ProxmoxStoragePublic] = Field(
        None, description="Associated Proxmox storage information"
    )

    model_config = ConfigDict(from_attributes=True)
