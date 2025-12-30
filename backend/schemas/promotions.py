import uuid
from datetime import datetime
from typing import Optional
from pydantic import (
    BaseModel,
    Field,
    ConfigDict,
    ValidationInfo,
    field_validator,
)
from enum import Enum


class DiscountType(str, Enum):
    """Discount type choices"""

    PERCENTAGE = "percentage"
    FIXED_AMOUNT = "fixed_amount"


class PromotionBase(BaseModel):
    """Base schema với các fields chung"""

    code: str = Field(..., description="Promotion code")
    description: Optional[str] = Field(None, description="Description")
    discount_type: DiscountType = Field(..., description="Discount type")
    discount_value: float = Field(..., description="Discount value")
    start_date: Optional[datetime] = Field(None, description="Start date")
    end_date: Optional[datetime] = Field(None, description="End date")
    usage_limit: Optional[int] = Field(None, description="Total usage limit")
    per_user_limit: Optional[int] = Field(None, description="Per user usage limit")

    @field_validator("code")
    @classmethod
    def validate_code(cls, v: str) -> str:
        if not v:
            raise ValueError("Promotion code must not be empty")

        v = v.strip()
        if len(v) == 0:
            raise ValueError("Promotion code must not be empty")
        if len(v) > 50:
            raise ValueError("Promotion code must not exceed 50 characters")
        return v

    @field_validator("description", mode="before")
    @classmethod
    def validate_description(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = v.strip()
        return None if len(v) == 0 else v

    @field_validator("discount_value")
    @classmethod
    def validate_discount_value(cls, v: float) -> float:
        if not v:
            raise ValueError("Discount value must not be empty")
        if v <= 0:
            raise ValueError("Discount value must be a positive number")
        return v

    @field_validator("usage_limit", "per_user_limit")
    @classmethod
    def validate_limits(cls, v: Optional[int]) -> Optional[int]:
        if v is None:
            return v
        if v < 0:
            raise ValueError("Limit values must be non-negative integers")
        return v

    @field_validator("discount_type", mode="before")
    @classmethod
    def validate_discount_type(cls, v: str) -> str:
        if not v:
            raise ValueError("Discount type must not be empty")

        v = str(v).strip().lower()
        if len(v) == 0:
            raise ValueError("Discount type must not be empty")
        if len(v) > 20:
            raise ValueError("Discount type must not exceed 20 characters")

        valid_types = [item.value for item in DiscountType]
        if v not in valid_types:
            raise ValueError("Invalid discount type")
        return v


class PromotionCreate(PromotionBase):
    """Schema to create a new promotion"""

    pass


class PromotionUpdate(BaseModel):
    """Schema to update an existing promotion"""

    code: Optional[str] = Field(None, description="Promotion code")
    description: Optional[str] = Field(None, description="Description")
    discount_type: Optional[DiscountType] = Field(None, description="Discount type")
    discount_value: Optional[float] = Field(None, description="Discount value")
    start_date: Optional[datetime] = Field(None, description="Start date")
    end_date: Optional[datetime] = Field(None, description="End date")
    usage_limit: Optional[int] = Field(None, description="Total usage limit")
    per_user_limit: Optional[int] = Field(None, description="Per user usage limit")

    @field_validator("code", "description")
    @classmethod
    def validate_code(cls, v: Optional[str], info: ValidationInfo) -> Optional[str]:
        field_name = info.field_name.replace("_", " ").capitalize()

        if v is None:
            return v

        v = v.strip()
        if len(v) == 0:
            return None
        if info.field_name == "code" and len(v) > 50:
            raise ValueError(f"{field_name} must not exceed 50 characters")
        return v

    @field_validator("discount_value", "usage_limit", "per_user_limit")
    @classmethod
    def validate_discount_value(cls, v: Optional[float | int]) -> Optional[float | int]:
        if v is None:
            return v
        if v < 0:
            raise ValueError("Value must be a positive number")
        return v

    @field_validator("discount_type", mode="before")
    @classmethod
    def validate_discount_type(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = str(v).strip().lower()
        if len(v) == 0:
            return None
        if len(v) > 20:
            raise ValueError("Discount type must not exceed 20 characters")

        valid_types = [item.value for item in DiscountType]
        if v not in valid_types:
            raise ValueError(f"Invalid discount type. Valid types are: {valid_types}")
        return v


class PromotionPublic(PromotionBase):
    """Schema representing promotion data in the database"""

    id: uuid.UUID = Field(..., description="Promotion ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    model_config = ConfigDict(from_attributes=True)


class PromotionResponse(PromotionPublic):
    """Schema for promotion data returned in API responses"""

    pass


class PromotionValidateRequest(BaseModel):
    """Request schema for validating a promotion code"""

    code: str = Field(..., description="Promotion code to validate")
    cart_total_amount: float = Field(..., description="Total cart amount")

    @field_validator("code")
    @classmethod
    def validate_code(cls, v: str) -> str:
        if not v:
            raise ValueError("Promotion code must not be empty")

        v = v.strip()
        if len(v) == 0:
            raise ValueError("Promotion code must not be empty")
        if len(v) > 50:
            raise ValueError("Promotion code must not exceed 50 characters")
        return v

    @field_validator("cart_total_amount")
    @classmethod
    def validate_cart_total_amount(cls, v: float) -> float:
        if not v:
            raise ValueError("Cart total amount must not be empty")
        if v < 0:
            raise ValueError("Cart total amount must be a positive number")
        return v


class PromotionValidateResponse(BaseModel):
    """Response schema for promotion validation"""

    valid: bool = Field(..., description="Whether the promotion is valid")
    promotion: PromotionResponse = Field(..., description="Promotion details")
    discount_amount: float = Field(..., description="Calculated discount amount")
    discount_type: DiscountType = Field(..., description="Type of discount")
    discount_value: float = Field(..., description="Discount value")
    final_amount: float = Field(..., description="Final amount after discount")

    @field_validator("discount_amount", "discount_value", "final_amount")
    @classmethod
    def validate_positive_numbers(cls, v: float, info: ValidationInfo) -> float:
        field_name = info.field_name.replace("_", " ").capitalize()

        if not v:
            raise ValueError(f"{field_name} must not be empty")
        if v < 0:
            raise ValueError(f"{field_name} must be a positive number")
        return v

    @field_validator("discount_type", mode="before")
    @classmethod
    def validate_discount_type(cls, v: str) -> str:
        if not v:
            raise ValueError("Discount type must not be empty")

        v = str(v).strip().lower()
        if len(v) == 0:
            raise ValueError("Discount type must not be empty")
        if len(v) > 20:
            raise ValueError("Discount type must not exceed 20 characters")

        valid_types = [item.value for item in DiscountType]
        if v not in valid_types:
            raise ValueError("Invalid discount type")
        return v

    model_config = ConfigDict(from_attributes=True)
