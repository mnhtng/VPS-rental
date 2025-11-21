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

if TYPE_CHECKING:
    from .orders import OrderPublic
    from .vps_plans import VPSPlanPublic
    from .vm_templates import VMTemplatePublic


class OrderItemBase(BaseModel):
    """Base schema for order items"""

    hostname: str = Field(..., description="Hostname for the VPS")
    duration_months: int = Field(..., description="Duration in months")
    unit_price: float = Field(..., description="Unit price per month")
    total_price: float = Field(..., description="Total price for the order item")
    configuration: dict = Field(..., description="Configuration details for the VPS")

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

    @field_validator("duration_months", "unit_price", "total_price")
    @classmethod
    def validate_positive(cls, v: int | float, info: ValidationInfo) -> int | float:
        field_name = info.field_name.replace("_", " ").capitalize()

        if not v:
            raise ValueError(f"{field_name} must not be empty")
        if v <= 0:
            raise ValueError(f"{field_name} must be a positive value")
        return v

    @field_validator("configuration")
    @classmethod
    def validate_configuration(cls, v: dict) -> dict:
        if not v:
            raise ValueError("Configuration must not be empty")
        if not isinstance(v, dict):
            raise ValueError("Configuration must be a dictionary")
        return v


class OrderItemCreate(OrderItemBase):
    """Schema to create an order item"""

    order_id: uuid.UUID = Field(..., description="Order ID")
    vps_plan_id: Optional[uuid.UUID] = Field(None, description="VPS plan ID")
    template_id: Optional[uuid.UUID] = Field(None, description="VM template ID")


class OrderItemUpdate(BaseModel):
    """Schema to update an order item"""

    hostname: Optional[str] = Field(None, description="Hostname for the VPS")
    duration_months: Optional[int] = Field(None, description="Duration in months")
    unit_price: Optional[float] = Field(None, description="Unit price per month")
    total_price: Optional[float] = Field(
        None, description="Total price for the order item"
    )
    configuration: Optional[dict] = Field(
        None, description="Configuration details for the VPS"
    )

    @field_validator("hostname")
    @classmethod
    def validate_hostname(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = v.strip()
        if len(v) == 0:
            return None
        if len(v) > 255:
            raise ValueError("Hostname must not exceed 255 characters")
        return v

    @field_validator("duration_months", "unit_price", "total_price")
    @classmethod
    def validate_positive(
        cls, v: Optional[int | float], info: ValidationInfo
    ) -> Optional[int | float]:
        field_name = info.field_name.replace("_", " ").capitalize()

        if v is None:
            return v
        if v <= 0:
            raise ValueError(f"{field_name} must be a positive value")
        return v

    @field_validator("configuration")
    @classmethod
    def validate_configuration(cls, v: Optional[dict]) -> Optional[dict]:
        if v is None:
            return v
        if not isinstance(v, dict):
            raise ValueError("Configuration must be a dictionary")
        return v


class OrderItemPublic(OrderItemBase):
    """Schema representing order item data in the database"""

    id: uuid.UUID = Field(..., description="Order item ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    model_config = ConfigDict(from_attributes=True)


class OrderItemResponse(OrderItemPublic):
    """Schema for order item data returned in API responses"""

    order: Optional[OrderPublic] = Field(
        None, description="Associated order information"
    )
    vps_plan: Optional[VPSPlanPublic] = Field(
        None, description="Associated VPS plan information"
    )
    template: Optional[VMTemplatePublic] = Field(
        None, description="Associated VM template information"
    )

    model_config = ConfigDict(from_attributes=True)
