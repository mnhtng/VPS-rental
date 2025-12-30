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
    from .orders import OrderPublic


class PaymentStatus(str, Enum):
    """Payment status choices"""

    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"


class PaymentMethod(str, Enum):
    """Payment method choices"""

    MOMO = "momo"
    VNPAY = "vnpay"


class Currency(str, Enum):
    """Currency choices"""

    VND = "VND"
    USD = "USD"


class PaymentTransactionBase(BaseModel):
    """Base schema for payment transactions"""

    transaction_id: Optional[str] = Field(
        None, description="Transaction ID from payment gateway"
    )
    payment_method: PaymentMethod = Field(..., description="Payment method")
    amount: float = Field(..., description="Transaction amount")
    currency: Currency = Field(default=Currency.VND, description="Transaction currency")
    status: PaymentStatus = Field(
        default=PaymentStatus.PENDING, description="Payment status"
    )
    gateway_response: Optional[dict] = Field(
        None, description="Full response from payment gateway"
    )

    @field_validator("transaction_id")
    @classmethod
    def validate_transaction_id(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = v.strip()
        if len(v) == 0:
            return None
        if len(v) > 255:
            raise ValueError("Transaction ID must not exceed 255 characters")
        return v

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: float) -> float:
        if not v:
            raise ValueError("Amount must not be empty")
        if v < 0:
            raise ValueError("Amount must be a positive value")
        return v

    @field_validator("gateway_response")
    @classmethod
    def validate_gateway_response(cls, v: Optional[dict]) -> Optional[dict]:
        if v is None:
            return v
        if not isinstance(v, dict):
            raise ValueError("Gateway response must be a dictionary")
        return v

    @field_validator("payment_method", mode="before")
    @classmethod
    def validate_payment_method(cls, v: str) -> str:
        if not v:
            raise ValueError("Payment method must not be empty")

        v = str(v).strip().lower()
        if len(v) == 0:
            raise ValueError("Payment method must not be empty")
        if len(v) > 20:
            raise ValueError("Payment method must not exceed 20 characters")

        valid_methods = [item.value for item in PaymentMethod]
        if v not in valid_methods:
            raise ValueError("Invalid payment method")
        return v

    @field_validator("status", mode="before")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if not v:
            raise ValueError("Payment status must not be empty")

        v = str(v).strip().lower()
        if len(v) == 0:
            raise ValueError("Payment status must not be empty")
        if len(v) > 20:
            raise ValueError("Payment status must not exceed 20 characters")

        valid_statuses = [item.value for item in PaymentStatus]
        if v not in valid_statuses:
            raise ValueError("Invalid payment status")
        return v

    @field_validator("currency", mode="before")
    @classmethod
    def validate_currency(cls, v: str) -> str:
        if not v:
            raise ValueError("Currency must not be empty")

        v = str(v).strip().upper()
        if len(v) == 0:
            raise ValueError("Currency must not be empty")
        if len(v) > 10:
            raise ValueError("Currency must not exceed 10 characters")

        valid_currencies = [item.value for item in Currency]
        if v not in valid_currencies:
            raise ValueError("Invalid currency")
        return v


class PaymentTransactionCreate(PaymentTransactionBase):
    """Schema to create a new payment transaction"""

    order_id: uuid.UUID = Field(..., description="Order ID")


class PaymentTransactionUpdate(BaseModel):
    """Schema to update a payment transaction"""

    transaction_id: Optional[str] = Field(
        None, description="Transaction ID from payment gateway"
    )
    payment_method: Optional[PaymentMethod] = Field(None, description="Payment method")
    amount: Optional[float] = Field(None, description="Transaction amount")
    currency: Optional[Currency] = Field(
        default=Currency.VND, description="Transaction currency"
    )
    status: Optional[PaymentStatus] = Field(
        default=PaymentStatus.PENDING, description="Payment status"
    )
    gateway_response: Optional[dict] = Field(
        None, description="Full response from payment gateway"
    )

    @field_validator("transaction_id")
    @classmethod
    def validate_transaction_id(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = v.strip()
        if len(v) == 0:
            return None
        if len(v) > 255:
            raise ValueError("Transaction ID must not exceed 255 characters")
        return v

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: Optional[float]) -> Optional[float]:
        if v is None:
            return v
        if v < 0:
            raise ValueError("Amount must be a positive value")
        return v

    @field_validator("gateway_response")
    @classmethod
    def validate_gateway_response(cls, v: Optional[dict]) -> Optional[dict]:
        if v is None:
            return v
        if not isinstance(v, dict):
            raise ValueError("Gateway response must be a dictionary")
        return v

    @field_validator("payment_method", mode="before")
    @classmethod
    def validate_payment_method(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = str(v).strip().lower()
        if len(v) == 0:
            return None
        if len(v) > 20:
            raise ValueError("Payment method must not exceed 20 characters")

        valid_methods = [item.value for item in PaymentMethod]
        if v not in valid_methods:
            raise ValueError("Invalid payment method")
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
            raise ValueError("Payment status must not exceed 20 characters")

        valid_statuses = [item.value for item in PaymentStatus]
        if v not in valid_statuses:
            raise ValueError("Invalid payment status")
        return v

    @field_validator("currency", mode="before")
    @classmethod
    def validate_currency(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = str(v).strip().upper()
        if len(v) == 0:
            return None
        if len(v) > 10:
            raise ValueError("Currency must not exceed 10 characters")

        valid_currencies = [item.value for item in Currency]
        if v not in valid_currencies:
            raise ValueError("Invalid currency")
        return v


class PaymentRequest(BaseModel):
    """Schema for creating a payment request to payment gateway"""

    order_number: str = Field(..., description="Order number for reference")
    amount: float = Field(..., description="Amount in VND")
    phone: str = Field(..., description="Customer phone number")
    address: str = Field(..., description="Customer address")
    return_url: Optional[str] = Field(None, description="Return URL after payment")

    @field_validator("order_number", "phone", "address")
    @classmethod
    def validate_required_str_fields(cls, v: str, info: ValidationInfo) -> str:
        field_name = info.field_name.replace("_", " ").capitalize()

        if not v:
            raise ValueError(f"{field_name} must not be empty")

        v = v.strip()
        if len(v) == 0:
            raise ValueError(f"{field_name} must not be empty")
        return v

    @field_validator("return_url", mode="before")
    @classmethod
    def validate_optional_str_field(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = v.strip()
        return None if len(v) == 0 else v

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: float) -> float:
        if not v:
            raise ValueError("Amount must not be empty")
        if v < 0:
            raise ValueError("Amount must be a positive value")
        return v


class RenewalPaymentRequest(BaseModel):
    """Schema for creating a VPS renewal payment request"""

    vps_id: uuid.UUID = Field(..., description="VPS instance ID to renew")
    duration_months: int = Field(..., description="Duration in months to extend")
    amount: float = Field(..., description="Amount in VND")
    phone: str = Field(..., description="Customer phone number")
    address: str = Field(..., description="Customer address")
    return_url: Optional[str] = Field(None, description="Return URL after payment")

    @field_validator("duration_months")
    @classmethod
    def validate_duration_months(cls, v: int) -> int:
        if not v:
            raise ValueError("Duration months must not be empty")
        if v < 1:
            raise ValueError("Duration months must be greater than 0")
        if v > 24:
            raise ValueError("Duration months must be less than or equal to 24")
        return v

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: float) -> float:
        if not v:
            raise ValueError("Amount must not be empty")
        if v < 0:
            raise ValueError("Amount must be a positive value")
        return v

    @field_validator("phone", "address")
    @classmethod
    def validate_required_str_fields(cls, v: str, info: ValidationInfo) -> str:
        field_name = info.field_name.replace("_", " ").capitalize()

        if not v:
            raise ValueError(f"{field_name} must not be empty")

        v = v.strip()
        if len(v) == 0:
            raise ValueError(f"{field_name} must not be empty")
        return v

    @field_validator("return_url", mode="before")
    @classmethod
    def validate_optional_str_field(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = v.strip()
        return None if len(v) == 0 else v


class PaymentResponse(BaseModel):
    """Schema for payment response from gateway"""

    success: bool = Field(
        ..., description="Indicates if the payment initiation was successful"
    )
    payment_url: Optional[str] = Field(
        None, description="URL to redirect user for payment completion"
    )
    deeplink: Optional[str] = Field(
        None, description="Deeplink for mobile payment apps"
    )
    transaction_id: Optional[str] = Field(
        None, description="Transaction ID from payment gateway"
    )
    payment_id: Optional[str] = Field(
        None, description="Payment ID from payment gateway"
    )
    error: Optional[str] = Field(
        None, description="Error message if payment initiation failed"
    )

    @field_validator(
        "payment_url",
        "deeplink",
        "transaction_id",
        "payment_id",
        "error",
        mode="before",
    )
    @classmethod
    def validate_optional_str_fields(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = v.strip()
        return None if len(v) == 0 else v


class PaymentStatusResponse(BaseModel):
    """Schema for payment status response"""

    payment_id: str = Field(..., description="Payment ID from payment gateway")
    transaction_id: Optional[str] = Field(
        None, description="Transaction ID from payment gateway"
    )
    payment_method: str = Field(..., description="Payment method")
    amount: float = Field(..., description="Payment amount")
    currency: str = Field(..., description="Currency code")
    status: str = Field(..., description="Payment status")
    order_id: Optional[str] = Field(None, description="Order ID")
    order_number: Optional[str] = Field(None, description="Order number")
    order_status: Optional[str] = Field(None, description="Order status")
    created_at: str = Field(..., description="Creation timestamp")
    updated_at: str = Field(..., description="Last update timestamp")

    @field_validator(
        "transaction_id",
        "order_id",
        "order_number",
        "order_status",
        mode="before",
    )
    @classmethod
    def validate_optional_str_fields(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = v.strip()
        return None if len(v) == 0 else v

    @field_validator(
        "payment_id",
        "payment_method",
        "currency",
        "status",
        "created_at",
        "updated_at",
    )
    @classmethod
    def validate_required_str_fields(cls, v: str, info: ValidationInfo) -> str:
        field_name = info.field_name.replace("_", " ").capitalize()

        if not v:
            raise ValueError(f"{field_name} must not be empty")

        v = v.strip()
        if len(v) == 0:
            raise ValueError(f"{field_name} must not be empty")
        return v

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: float) -> float:
        if not v:
            raise ValueError("Amount must not be empty")
        if v < 0:
            raise ValueError("Amount must be a positive value")
        return v


class CallbackResponse(BaseModel):
    """Schema for payment gateway callback verification response"""

    valid: bool = Field(..., description="Indicates if the callback is valid")
    success: Optional[bool] = Field(
        None, description="Indicates if the callback was successful"
    )
    transaction_id: Optional[str] = Field(
        None, description="Transaction ID from payment gateway"
    )
    message: Optional[str] = Field(None, description="Message from payment gateway")
    error: Optional[str] = Field(
        None, description="Error message if callback verification failed"
    )
    data: Optional[dict] = Field(None, description="Additional data from payment gateway")

    @field_validator("transaction_id", "message", "error", mode="before")
    @classmethod
    def validate_optional_str_fields(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = v.strip()
        return None if len(v) == 0 else v


class PaymentTransactionPublic(PaymentTransactionBase):
    """Schema representing payment transaction data in the database"""

    id: uuid.UUID = Field(..., description="Payment Transaction ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    model_config = ConfigDict(from_attributes=True)


class PaymentTransactionResponse(PaymentTransactionPublic):
    """Schema for payment transaction data returned in API responses"""

    order: Optional[OrderPublic] = Field(
        None, description="Associated order information"
    )

    model_config = ConfigDict(from_attributes=True)
