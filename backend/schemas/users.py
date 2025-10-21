"""
User Schemas for API Request/Response
======================================

Tách biệt database models và API schemas để tránh:
- Circular reference khi serialize JSON
- Expose password và sensitive data
- Pydantic validation conflicts
"""

import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, EmailStr, ConfigDict, field_validator


# Import role schema để embed
from .roles import RoleInUser


# ============================================================================
# BASE SCHEMAS (Shared fields)
# ============================================================================


class UserBase(BaseModel):
    """Base schema với các fields chung"""

    name: str = Field(..., min_length=1, max_length=255, description="Full name")
    email: EmailStr = Field(..., description="Email address")
    phone: Optional[str] = Field(None, max_length=20, pattern=r"^\+?[\d\s\-\(\)]+$")
    address: Optional[str] = Field(None, max_length=500)
    image: Optional[str] = Field(None, description="Profile image URL")


# ============================================================================
# REQUEST SCHEMAS (For API input)
# ============================================================================


class UserCreate(UserBase):
    """
    Schema để tạo user mới.
    ✅ Password được validate trước khi hash
    """

    password: str = Field(
        ..., min_length=8, max_length=100, description="Plain password (will be hashed)"
    )
    role_id: uuid.UUID = Field(..., description="Role ID")

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserUpdate(BaseModel):
    """
    Schema để update user (tất cả fields optional).
    ✅ Không cho phép update password qua route này (dùng route riêng)
    """

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=500)
    image: Optional[str] = None
    role_id: Optional[uuid.UUID] = None


class UserChangePassword(BaseModel):
    """Schema riêng để đổi password"""

    old_password: str = Field(..., description="Current password")
    new_password: str = Field(
        ..., min_length=8, max_length=100, description="New password"
    )

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


# ============================================================================
# RESPONSE SCHEMAS (For API output)
# ============================================================================


class UserRead(UserBase):
    """
    Schema để trả về user (KHÔNG có password).
    ✅ Tránh expose sensitive data
    ✅ Tránh circular reference
    """

    id: uuid.UUID
    email_verified: Optional[datetime] = None
    role_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserReadWithRole(UserRead):
    """
    Schema để trả về user kèm role details.
    ✅ Sử dụng RoleInUser để tránh circular reference
    ✅ Chỉ load role khi cần
    """

    role: RoleInUser

    model_config = ConfigDict(from_attributes=True)


class UserProfile(UserReadWithRole):
    """
    Schema đầy đủ cho user profile.
    Thêm thông tin bổ sung nếu cần
    """

    pass


# ============================================================================
# UTILITY SCHEMAS
# ============================================================================


class UserInList(BaseModel):
    """Schema nhỏ gọn cho danh sách users"""

    id: uuid.UUID
    name: str
    email: EmailStr
    role_name: str = Field(..., description="Role name")
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserLogin(BaseModel):
    """Schema cho login request"""

    email: EmailStr
    password: str


class UserLoginResponse(BaseModel):
    """Schema cho login response"""

    access_token: str
    token_type: str = "bearer"
    user: UserRead
