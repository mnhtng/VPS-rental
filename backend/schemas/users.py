from __future__ import annotations
import uuid
import re
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from pydantic import (
    BaseModel,
    Field,
    EmailStr,
    ConfigDict,
    field_validator,
)
from enum import Enum

if TYPE_CHECKING:
    from .accounts import AccountPublic


class UserRole(str, Enum):
    """User role choices"""

    USER = "USER"
    ADMIN = "ADMIN"


class UserBase(BaseModel):
    """Base schema with common user fields"""

    name: str = Field(..., description="Full name")
    email: str = Field(..., description="Email address")
    email_verified: Optional[datetime] = Field(
        None, description="Email verified timestamp"
    )
    phone: Optional[str] = Field(None, description="Phone number")
    address: Optional[str] = Field(None, description="Home address")
    image: Optional[str] = Field(None, description="Profile image URL")
    role: UserRole = Field(default=UserRole.USER, description="User role name")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v:
            raise ValueError("Name must not be empty")

        v = v.strip()
        if len(v) == 0:
            raise ValueError("Name must not be empty")
        if len(v) < 2:
            raise ValueError("Name must be at least 2 characters")
        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if not v:
            raise ValueError("Email must not be empty")

        v = v.strip()
        if len(v) == 0:
            raise ValueError("Email must not be empty")

        local_part = v.split("@")[0] if "@" in v else ""
        domain_part = v.split("@")[-1] if "@" in v else ""
        domain_part = domain_part.lower()
        v = local_part + "@" + domain_part

        email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        if not re.match(email_pattern, v) or v.count("@") != 1:
            raise ValueError("Email is not in valid format")

        if len(local_part) < 1:
            raise ValueError("The part before @ must not be empty")
        if len(local_part) > 64:
            raise ValueError("The part before @ must not exceed 64 characters")
        if local_part.startswith(".") or local_part.endswith("."):
            raise ValueError("Email cannot start or end with a dot")
        if ".." in local_part:
            raise ValueError("Email cannot contain consecutive dots")

        if len(domain_part) < 3:
            raise ValueError("Email domain must be at least 3 characters")
        if len(domain_part) > 255:
            raise ValueError("Email domain must not exceed 255 characters")
        if "." not in domain_part:
            raise ValueError("Email domain must contain a dot")

        # Block temporary/disposable email providers
        blocked_domains = [
            "tempmail.com",
            "throwaway.email",
            "guerrillamail.com",
            "10minutemail.com",
            "mailinator.com",
            "yopmail.com",
            "temp-mail.org",
            "fakeinbox.com",
        ]

        if domain_part in blocked_domains:
            raise ValueError("Email domain is not allowed")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
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

    @field_validator("address", "image", mode="before")
    @classmethod
    def validate_address_image(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = v.strip()
        return None if len(v) == 0 else v

    @field_validator("role", mode="before")
    @classmethod
    def validate_role(cls, v: str) -> str:
        if not v:
            raise ValueError("Role must not be empty")

        v = str(v).strip().upper()
        if len(v) == 0:
            raise ValueError("Role must not be empty")
        if len(v) > 20:
            raise ValueError("Role must not exceed 20 characters")

        valid_roles = [role.value for role in UserRole]
        if v not in valid_roles:
            raise ValueError("Invalid user role")
        return v


class UserCreate(UserBase):
    """Schema to create a new user"""

    password: str = Field(..., description="Plain password (will be hashed)")
    verify_email: Optional[bool] = Field(
        False, description="Whether to verify email immediately"
    )

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not v:
            raise ValueError("Password must not be empty")

        v = v.strip()
        if len(v) == 0:
            raise ValueError("Password must not be empty")
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must be at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must be at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must be at least one digit")
        return v


class UserUpdate(BaseModel):
    """Schema to update user (all fields optional)"""

    name: Optional[str] = Field(None, description="Full name")
    email: Optional[str] = Field(None, description="Email address")
    phone: Optional[str] = Field(None, description="Phone number")
    address: Optional[str] = Field(None, description="Home address")
    image: Optional[str] = Field(None, description="Profile image URL")
    role: Optional[UserRole] = Field(None, description="User role name")
    verify_email: Optional[bool] = Field(
        None, description="Whether to verify email (True=verify, False=unverify, None=no change)"
    )

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = v.strip()
        if len(v) == 0:
            return None
        if len(v) < 2:
            raise ValueError("Name must be at least 2 characters")
        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = v.strip()
        if len(v) == 0:
            return None

        local_part = v.split("@")[0] if "@" in v else ""
        domain_part = v.split("@")[-1] if "@" in v else ""
        domain_part = domain_part.lower()
        v = local_part + "@" + domain_part

        email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        if not re.match(email_pattern, v) or v.count("@") != 1:
            raise ValueError("Email is not in valid format")

        if len(local_part) < 1:
            raise ValueError("The part before @ must not be empty")
        if len(local_part) > 64:
            raise ValueError("The part before @ must not exceed 64 characters")
        if local_part.startswith(".") or local_part.endswith("."):
            raise ValueError("Email cannot start or end with a dot")
        if ".." in local_part:
            raise ValueError("Email cannot contain consecutive dots")

        if len(domain_part) < 3:
            raise ValueError("Email domain must be at least 3 characters")
        if len(domain_part) > 255:
            raise ValueError("Email domain must not exceed 255 characters")
        if "." not in domain_part:
            raise ValueError("Email domain must contain a dot")

        # Block temporary/disposable email providers
        blocked_domains = [
            "tempmail.com",
            "throwaway.email",
            "guerrillamail.com",
            "10minutemail.com",
            "mailinator.com",
            "yopmail.com",
            "temp-mail.org",
            "fakeinbox.com",
        ]

        if domain_part in blocked_domains:
            raise ValueError("Email domain is not allowed")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
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

    @field_validator("address", "image", mode="before")
    @classmethod
    def validate_address_image(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = v.strip()
        return None if len(v) == 0 else v

    @field_validator("role", mode="before")
    @classmethod
    def validate_role(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = str(v).strip().upper()
        if len(v) == 0:
            return None
        if len(v) > 20:
            raise ValueError("Role must not exceed 20 characters")

        valid_roles = [role.value for role in UserRole]
        if v not in valid_roles:
            raise ValueError("Invalid user role")
        return v


class UserChangePassword(BaseModel):
    """Schema to change user password"""

    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., description="New password")

    @field_validator("current_password")
    @classmethod
    def validate_current_password(cls, v: str) -> str:
        if not v:
            raise ValueError("Password must not be empty")

        v = v.strip()
        if len(v) == 0:
            raise ValueError("Password must not be empty")
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must be at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must be at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must be at least one digit")
        return v

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        if not v:
            raise ValueError("New password must not be empty")

        v = v.strip()

        if len(v) == 0:
            raise ValueError("New password must not be empty")
        if len(v) < 6:
            raise ValueError("New password must be at least 6 characters")
        if not any(c.isupper() for c in v):
            raise ValueError("New password must be at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("New password must be at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("New password must be at least one digit")
        return v


class UserPublic(UserBase):
    """Schema representing user data in the database"""

    id: uuid.UUID = Field(..., description="User ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    model_config = ConfigDict(from_attributes=True)


class UserResponse(UserPublic):
    """Schema for user data returned in API responses"""

    account: Optional[AccountPublic] = Field(
        None, description="Associated account information"
    )

    model_config = ConfigDict(from_attributes=True)
