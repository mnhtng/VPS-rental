from __future__ import annotations
import uuid
import re
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
    from .users import UserPublic
    from .order_items import OrderItemPublic


class OrderStatus(str, Enum):
    """Order status choices"""

    PENDING = "pending"
    PAID = "paid"
    CANCELLED = "cancelled"


class OrderBase(BaseModel):
    """Base schema for orders"""

    order_number: str = Field(..., description="Unique order number")
    price: float = Field(..., description="Total price of the order")
    discount_code: Optional[str] = Field(
        None, description="Optional discount code applied to the order"
    )
    billing_address: Optional[str] = Field(None, description="Billing address")
    billing_phone: Optional[str] = Field(None, description="Billing phone number")
    status: OrderStatus = Field(
        default=OrderStatus.PENDING, description="Status of the order"
    )
    note: Optional[str] = Field(None, description="Order note")

    @field_validator("order_number")
    @classmethod
    def validate_order_number(cls, v: str) -> str:
        if not v:
            raise ValueError("Order number must not be empty")

        v = v.strip()
        if len(v) == 0:
            raise ValueError("Order number must not be empty")
        if len(v) > 50:
            raise ValueError("Order number must not exceed 50 characters")
        return v

    @field_validator("price")
    @classmethod
    def validate_price(cls, v: float) -> float:
        if not v:
            raise ValueError("Price must not be empty")
        if v <= 0:
            raise ValueError("Price must be a positive value")
        return v

    @field_validator("billing_phone")
    @classmethod
    def validate_billing_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = v.strip()
        if len(v) == 0:
            return None

        phone_pattern = r"^[\d]+$"
        if not re.match(phone_pattern, v):
            raise ValueError("Invalid phone number format")
        if len(v) < 10:
            raise ValueError("Phone number must be at least 10 digits")
        if len(v) > 20:
            raise ValueError("Phone number must not exceed 20 digits")
        return v

    @field_validator("discount_code", "billing_address", "note", mode="before")
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
        if info.field_name == "discount_code" and len(v) > 50:
            raise ValueError(f"{field_name} must not exceed 50 characters")
        return v

    @field_validator("status", mode="before")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if not v:
            raise ValueError("Order status must not be empty")

        v = str(v).strip().lower()
        if len(v) == 0:
            raise ValueError("Order status must not be empty")
        if len(v) > 20:
            raise ValueError("Order status must not exceed 20 characters")

        valid_statuses = [item.value for item in OrderStatus]
        if v not in valid_statuses:
            raise ValueError("Invalid order status")
        return v


class OrderCreate(OrderBase):
    """Schema to create a new order"""

    user_id: Optional[uuid.UUID] = Field(
        None, description="User ID who placed the order"
    )


class OrderUpdate(BaseModel):
    """Schema to update an existing order"""

    order_number: Optional[str] = Field(None, description="Unique order number")
    price: Optional[float] = Field(None, description="Total price of the order")
    discount_code: Optional[str] = Field(
        None, description="Optional discount code applied to the order"
    )
    billing_address: Optional[str] = Field(None, description="Billing address")
    billing_phone: Optional[str] = Field(None, description="Billing phone number")
    status: Optional[OrderStatus] = Field(None, description="Status of the order")
    note: Optional[str] = Field(None, description="Order note")

    @field_validator(
        "order_number", "discount_code", "billing_address", "billing_phone", "note"
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

        if info.field_name == "order_number" and len(v) > 50:
            raise ValueError(f"{field_name} must not exceed 50 characters")
        if info.field_name == "discount_code" and len(v) > 50:
            raise ValueError(f"{field_name} must not exceed 50 characters")
        if info.field_name == "billing_phone":
            phone_pattern = r"^[\d]+$"
            if not re.match(phone_pattern, v):
                raise ValueError("Invalid phone number format")
            if len(v) < 10:
                raise ValueError("Phone number must be at least 10 digits")
            if len(v) > 20:
                raise ValueError("Phone number must not exceed 20 digits")
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
            raise ValueError("Order status must not exceed 20 characters")

        valid_statuses = [item.value for item in OrderStatus]
        if v not in valid_statuses:
            raise ValueError("Invalid order status")
        return v


class OrderPublic(OrderBase):
    """Schema representing order data in the database"""

    id: uuid.UUID = Field(..., description="Order ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    model_config = ConfigDict(from_attributes=True)


class OrderResponse(OrderPublic):
    """Schema for order data returned in API responses"""

    user: Optional[UserPublic] = Field(None, description="Associated user information")
    order_items: Optional[list[OrderItemPublic]] = Field(
        None, description="List of order items associated with the order"
    )
    payment_status: Optional[str] = Field(
        default="pending", description="Payment status (pending, completed, failed)"
    )
    payment_method: Optional[str] = Field(
        default=None, description="Payment method used for the order"
    )

    model_config = ConfigDict(from_attributes=True)
