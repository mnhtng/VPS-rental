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
    from .users import UserPublic
    from .vps_plans import VPSPlanPublic
    from .vm_templates import VMTemplatePublic


class CartBase(BaseModel):
    """Base schema for cart items"""

    hostname: str = Field(..., description="Hostname")
    os: str = Field(..., description="Operating system")
    duration_months: int = Field(default=1, description="Duration in months")
    unit_price: float = Field(..., description="Unit price per month")
    total_price: float = Field(..., description="Total price")
    discount_code: Optional[str] = Field(
        None, description="Optional discount code applied to the cart"
    )

    @field_validator("hostname", "os")
    @classmethod
    def validate_hostname(cls, v: str, info: ValidationInfo) -> str:
        field_name = info.field_name.replace("_", " ").capitalize()

        if not v:
            raise ValueError(f"{field_name} must not be empty")

        v = v.strip()
        if len(v) == 0:
            raise ValueError(f"{field_name} must not be empty")
        if info.field_name == "hostname" and len(v) > 255:
            raise ValueError(f"{field_name} must not exceed 255 characters")
        return v

    @field_validator("discount_code")
    @classmethod
    def validate_discount_code(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = v.strip()
        if len(v) == 0:
            return None
        if len(v) > 50:
            raise ValueError("Discount code must not exceed 50 characters")
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


class CartCreate(CartBase):
    """Schema to create a cart item"""

    user_id: uuid.UUID = Field(..., description="User ID")
    vps_plan_id: uuid.UUID = Field(..., description="VPS plan ID")
    template_id: uuid.UUID = Field(..., description="VM template ID")


class CartUpdate(BaseModel):
    """Schema để update cart item"""

    hostname: Optional[str] = Field(None, description="Hostname")
    os: Optional[str] = Field(None, description="Operating system")
    duration_months: Optional[int] = Field(None, description="Duration in months")
    unit_price: Optional[float] = Field(None, description="Unit price per month")
    total_price: Optional[float] = Field(None, description="Total price")
    discount_code: Optional[str] = Field(
        None, description="Optional discount code applied to the cart"
    )

    @field_validator("hostname", "os", "discount_code")
    @classmethod
    def validate_hostname(cls, v: Optional[str], info: ValidationInfo) -> Optional[str]:
        field_name = info.field_name.replace("_", " ").capitalize()

        if v is None:
            return v

        v = v.strip()
        if len(v) == 0:
            return None

        max_lengths = {
            "hostname": 255,
            "discount_code": 50,
        }
        max_length = max_lengths.get(info.field_name)
        if max_length and len(v) > max_length:
            raise ValueError(f"{field_name} must not exceed {max_length} characters")
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


class CartAdd(BaseModel):
    """Schema to add item to cart"""

    plan_id: uuid.UUID = Field(..., description="VPS plan ID to add")
    hostname: str = Field(..., description="Hostname")
    os: str = Field(..., description="Operating system")
    os_type: str = Field(..., description="Template operating system type")
    os_version: str = Field(..., description="Template operating system version")
    duration_months: int = Field(default=1, description="Duration in months")
    total_price: float = Field(..., description="Total price")

    @field_validator("hostname", "os", "os_type", "os_version")
    @classmethod
    def validate_required_str(cls, v: str, info: ValidationInfo) -> str:
        field_name = info.field_name.replace("_", " ").capitalize()

        if not v:
            raise ValueError(f"{field_name} must not be empty")

        v = v.strip()
        if len(v) == 0:
            raise ValueError(f"{field_name} must not be empty")

        max_lengths = {
            "hostname": 255,
            "os_type": 50,
            "os_version": 10,
        }
        max_length = max_lengths.get(info.field_name)
        if max_length and len(v) > max_length:
            raise ValueError(f"{field_name} must not exceed {max_length} characters")
        return v

    @field_validator("duration_months", "total_price")
    @classmethod
    def validate_positive(cls, v: int | float, info: ValidationInfo) -> int | float:
        field_name = info.field_name.replace("_", " ").capitalize()

        if not v:
            raise ValueError(f"{field_name} must not be empty")
        if v <= 0:
            raise ValueError(f"{field_name} must be a positive value")
        return v


class CartProceedToCheckout(BaseModel):
    """Schema to proceed to checkout with optional promotion code"""

    promotion_code: Optional[str] = Field(
        None, description="Optional promotion code to apply during checkout"
    )

    @field_validator("promotion_code")
    @classmethod
    def validate_promotion_code(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = v.strip()
        if len(v) == 0:
            return None
        if len(v) > 50:
            raise ValueError("Promotion code must not exceed 50 characters")
        return v


class CartPublic(CartBase):
    """Schema representing cart items data in the database"""

    id: uuid.UUID = Field(..., description="Cart item ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    model_config = ConfigDict(from_attributes=True)


class CartResponse(CartPublic):
    """Schema for cart items data returned in API responses"""

    user: Optional[UserPublic] = Field(None, description="Associated user information")
    vps_plan: Optional[VPSPlanPublic] = Field(
        None, description="Associated VPS plan information"
    )
    template: Optional[VMTemplatePublic] = Field(
        None, description="Associated VM template information"
    )

    model_config = ConfigDict(from_attributes=True)
