from __future__ import annotations
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, TYPE_CHECKING
from pydantic import (
    BaseModel,
    Field,
    ConfigDict,
    field_validator,
)
from enum import Enum

if TYPE_CHECKING:
    from .users import UserPublic
    from .vps_plans import VPSPlanPublic
    from .order_items import OrderItemPublic
    from .proxmox_vms import ProxmoxVMPublic


class VPSStatus(str, Enum):
    """VPS status choices"""

    CREATING = "creating"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    TERMINATED = "terminated"
    ERROR = "error"


class VPSInstanceBase(BaseModel):
    """Base schema for VPS instance"""

    status: VPSStatus = Field(
        default=VPSStatus.CREATING, description="Current status of the VPS instance"
    )
    expires_at: datetime = Field(
        None, description="Expiration date of the VPS instance"
    )
    auto_renew: bool = Field(
        default=False, description="Whether the VPS is set to auto-renew"
    )

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

        valid_statuses = [item.value for item in VPSStatus]
        if v not in valid_statuses:
            raise ValueError("Invalid status")
        return v


class VPSInstanceCreate(VPSInstanceBase):
    """Schema to create a new VPS instance"""

    user_id: uuid.UUID = Field(..., description="User ID")
    vps_plan_id: Optional[uuid.UUID] = Field(None, description="VPS plan ID")
    order_item_id: Optional[uuid.UUID] = Field(None, description="Order item ID")
    vm_id: Optional[uuid.UUID] = Field(None, description="Proxmox VM ID")


class VPSInstanceUpdate(BaseModel):
    """Schema to update a VPS instance"""

    status: Optional[VPSStatus] = Field(None, description="Current status of the VPS")
    expires_at: Optional[datetime] = Field(
        None, description="Expiration date of the VPS instance"
    )
    auto_renew: Optional[bool] = Field(
        None, description="Whether the VPS is set to auto-renew"
    )

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

        valid_statuses = [item.value for item in VPSStatus]
        if v not in valid_statuses:
            raise ValueError("Invalid status")
        return v


class VPSSetupRequest(BaseModel):
    order_number: str = Field(..., description="Order number")

    @field_validator("order_number")
    @classmethod
    def validate_order_number(cls, v: str) -> str:
        v = v.strip()
        if len(v) == 0:
            raise ValueError("Order number must not be empty")
        if len(v) > 50:
            raise ValueError("Order number must not exceed 50 characters")
        return v


class VPSCredentials(BaseModel):
    """VPS credentials returned after setup"""

    ip_address: str = Field(..., description="VPS IP address")
    sub_ip_addresses: str = Field(..., description="VPS additional IP addresses")
    username: str = Field(..., description="SSH username")
    password: str = Field(..., description="SSH password")
    ssh_port: int = Field(default=22, description="SSH port")

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        v = v.strip()
        if len(v) == 0:
            raise ValueError("Username must not be empty")
        if len(v) > 100:
            raise ValueError("Username must not exceed 100 characters")
        return v


class VPSSetupItem(BaseModel):
    """Individual VPS setup result"""

    order_item_id: str = Field(..., description="Order item ID")
    vps_instance_id: str = Field(..., description="VPS instance ID")
    vm_id: str = Field(..., description="Proxmox VM record ID")
    vmid: int = Field(..., description="Proxmox VM ID")
    hostname: str = Field(..., description="VPS hostname")
    status: str = Field(..., description="VPS status")
    credentials: VPSCredentials = Field(..., description="VPS credentials")
    vps_info: Dict[str, Any] = Field(..., description="VPS specifications")


class VPSSetupResponse(BaseModel):
    """Response for VPS setup endpoint"""

    success: bool = Field(..., description="Whether setup was successful")
    message: str = Field(..., description="Status message")
    order_number: str = Field(..., description="Order number")
    order_date: str = Field(..., description="Order date")
    customer_name: str = Field(..., description="Customer name")
    customer_email: str = Field(..., description="Customer email")
    vps_list: List[VPSSetupItem] = Field(
        default=[], description="List of provisioned VPS"
    )


class VPSInstancePublic(VPSInstanceBase):
    """Schema representing VPS instance data in the database"""

    id: uuid.UUID = Field(..., description="VPS Instance ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    model_config = ConfigDict(from_attributes=True)


class VPSInstanceResponse(VPSInstancePublic):
    """Schema for VPS instance data returned in API responses"""

    user: Optional[UserPublic] = Field(None, description="User details")
    vps_plan: Optional[VPSPlanPublic] = Field(None, description="VPS plan details")
    order_item: Optional[OrderItemPublic] = Field(
        None, description="Order item details"
    )
    vm: Optional[ProxmoxVMPublic] = Field(None, description="Proxmox VM details")

    model_config = ConfigDict(from_attributes=True)
