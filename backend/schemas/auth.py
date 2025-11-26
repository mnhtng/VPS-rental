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


class AuthLogin(BaseModel):
    """Schema for user login"""

    email: str = Field(..., description="Email address")
    password: str = Field(..., description="Plain password")

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


class AuthRegister(BaseModel):
    """Schema for user registration"""

    name: str = Field(..., description="Full name")
    email: str = Field(..., description="Email address")
    password: str = Field(..., description="Plain password")
    phone: Optional[str] = Field(None, description="Phone number")

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


class AuthToken(BaseModel):
    """Schema for authentication token"""

    access_token: str = Field(..., description="Access token string")
    token_type: str = Field(..., description="Type of the token (e.g., Bearer)")


class AuthResendVerification(BaseModel):
    """Schema for resending verification email"""

    email: str = Field(..., description="Email address")

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


class AuthVerifyEmail(BaseModel):
    """Schema for verifying email"""

    token: str = Field(..., description="Verification token")

    @field_validator("token")
    @classmethod
    def validate_token(cls, v: str) -> str:
        if not v:
            raise ValueError("Token must not be empty")

        v = v.strip()
        if len(v) == 0:
            raise ValueError("Token must not be empty")
        return v


class AuthForgotPassword(BaseModel):
    """Schema for forgot password request"""

    email: str = Field(..., description="Email address")

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


class AuthResetPassword(BaseModel):
    """Schema for reset password"""

    token: str = Field(..., description="Reset token")
    email: str = Field(..., description="Email address")
    password: str = Field(..., description="New password")

    @field_validator("token")
    @classmethod
    def validate_token(cls, v: str) -> str:
        if not v:
            raise ValueError("Token must not be empty")

        v = v.strip()
        if len(v) == 0:
            raise ValueError("Token must not be empty")
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
