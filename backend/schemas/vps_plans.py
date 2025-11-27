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


class StorageType(str, Enum):
    """Storage type choices"""

    SSD = "SSD"
    NVME = "NVMe"


class PlanCategory(str, Enum):
    """Plan category choices"""

    BASIC = "basic"
    STANDARD = "standard"
    PREMIUM = "premium"


class Currency(str, Enum):
    """Currency choices"""

    VND = "VND"
    USD = "USD"


class VPSPlanBase(BaseModel):
    """Base schema for VPS plans"""

    name: str = Field(..., description="Plan name")
    description: Optional[str] = Field(None, description="Plan description")
    category: PlanCategory = Field(..., description="Plan category")
    use_case: Optional[list[str]] = Field(
        None, description="Intended use case for the VPS plan"
    )
    vcpu: int = Field(..., description="Number of virtual CPUs")
    ram_gb: int = Field(..., description="RAM in GB")
    storage_type: StorageType = Field(..., description="Storage type")
    storage_gb: int = Field(..., description="Storage in GB")
    bandwidth_mbps: int = Field(..., description="Bandwidth in Mbps")
    monthly_price: float = Field(..., description="Monthly price")
    currency: Currency = Field(default=Currency.VND, description="Currency")
    max_snapshots: int = Field(default=3, description="Maximum snapshots allowed")
    max_ip_addresses: int = Field(default=1, description="Maximum IP addresses")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v:
            raise ValueError("Plan name must not be empty")

        v = v.strip()
        if len(v) == 0:
            raise ValueError("Plan name must not be empty")
        if len(v) > 100:
            raise ValueError("Plan name must not exceed 100 characters")
        return v

    @field_validator("description", mode="before")
    @classmethod
    def validate_description(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = v.strip()
        return None if len(v) == 0 else v

    @field_validator(
        "vcpu",
        "ram_gb",
        "storage_gb",
        "bandwidth_mbps",
        "monthly_price",
        "max_snapshots",
        "max_ip_addresses",
    )
    @classmethod
    def validate_positive_ints(
        cls, v: int | float, info: ValidationInfo
    ) -> int | float:
        field_name = info.field_name.replace("_", " ").capitalize()

        if not v:
            raise ValueError(f"{field_name} must not be empty")
        if v < 0:
            raise ValueError(f"{field_name} must be non-negative")
        return v

    @field_validator("use_case", mode="before")
    @classmethod
    def validate_use_case(cls, v: Optional[list[str]]) -> Optional[list[str]]:
        if v is None:
            return v

        if not isinstance(v, list):
            raise ValueError("Use case must be a list of strings")

        for item in v:
            if not isinstance(item, str):
                raise ValueError("Each use case must be a non-empty string")
        return v

    @field_validator("category", mode="before")
    @classmethod
    def validate_category(cls, v: str) -> str:
        if not v:
            raise ValueError("Category must not be empty")

        v = str(v).strip().lower()
        if len(v) == 0:
            raise ValueError("Category must not be empty")
        if len(v) > 50:
            raise ValueError("Category must not exceed 50 characters")

        valid_categories = [item.value for item in PlanCategory]
        if v not in valid_categories:
            raise ValueError("Invalid plan category")
        return v

    @field_validator("storage_type", mode="before")
    @classmethod
    def validate_storage_type(cls, v: str) -> str:
        if not v:
            raise ValueError("Storage type must not be empty")

        v = str(v).strip()
        if len(v) == 0:
            raise ValueError("Storage type must not be empty")
        if len(v) > 20:
            raise ValueError("Storage type must not exceed 20 characters")

        valid_types = [item.value for item in StorageType]
        if v not in valid_types:
            raise ValueError("Invalid storage type")
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


class VPSPlanCreate(VPSPlanBase):
    """Schema to create a new VPS plan"""

    pass


class VPSPlanUpdate(BaseModel):
    """Schema to update an existing VPS plan"""

    name: Optional[str] = Field(None, description="Plan name")
    description: Optional[str] = Field(None, description="Plan description")
    category: Optional[PlanCategory] = Field(None, description="Plan category")
    use_case: Optional[list[str]] = Field(
        None, description="Intended use case for the VPS plan"
    )
    vcpu: Optional[int] = Field(None, description="Number of virtual CPUs")
    ram_gb: Optional[int] = Field(None, description="RAM in GB")
    storage_type: Optional[StorageType] = Field(None, description="Storage type")
    storage_gb: Optional[int] = Field(None, description="Storage in GB")
    bandwidth_mbps: Optional[int] = Field(None, description="Bandwidth in Mbps")
    monthly_price: Optional[float] = Field(None, description="Monthly price")
    currency: Optional[Currency] = Field(None, description="Currency")
    max_snapshots: Optional[int] = Field(None, description="Maximum snapshots allowed")
    max_ip_addresses: Optional[int] = Field(None, description="Maximum IP addresses")

    @field_validator("name", "description")
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
        if info.field_name == "name" and len(v) > 100:
            raise ValueError(f"{field_name} must not exceed 100 characters")
        return v

    @field_validator(
        "vcpu",
        "ram_gb",
        "storage_gb",
        "bandwidth_mbps",
        "monthly_price",
        "max_snapshots",
        "max_ip_addresses",
    )
    @classmethod
    def validate_positive_ints(
        cls, v: Optional[int | float], info: ValidationInfo
    ) -> Optional[int | float]:
        field_name = info.field_name.replace("_", " ").capitalize()

        if v is None:
            return v
        if v < 0:
            raise ValueError(f"{field_name} must be non-negative")
        return v

    @field_validator("use_case", mode="before")
    @classmethod
    def validate_use_case(cls, v: Optional[list[str]]) -> Optional[list[str]]:
        if v is None:
            return v

        if not isinstance(v, list):
            raise ValueError("Use case must be a list of strings")

        for item in v:
            if not isinstance(item, str) or len(item.strip()) == 0:
                raise ValueError("Each use case must be a non-empty string")
        return v

    @field_validator("category", mode="before")
    @classmethod
    def validate_category(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = str(v).strip().lower()
        if len(v) == 0:
            return None
        if len(v) > 50:
            raise ValueError("Category must not exceed 50 characters")

        valid_categories = [item.value for item in PlanCategory]
        if v not in valid_categories:
            raise ValueError("Invalid plan category")
        return v

    @field_validator("storage_type", mode="before")
    @classmethod
    def validate_storage_type(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = str(v).strip()
        if len(v) == 0:
            return None
        if len(v) > 20:
            raise ValueError("Storage type must not exceed 20 characters")

        valid_types = [item.value for item in StorageType]
        if v not in valid_types:
            raise ValueError("Invalid storage type")
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


class VPSPlanPublic(VPSPlanBase):
    """Schema representing VPS plan data in the database"""

    id: uuid.UUID = Field(..., description="Plan ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    model_config = ConfigDict(from_attributes=True)


class VPSPlanResponse(VPSPlanPublic):
    """Schema for VPS plan data returned in API responses"""

    pass
