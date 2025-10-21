"""
Role Schemas for API Request/Response
======================================

Tách biệt database models và API schemas để tránh:
- Circular reference khi serialize JSON
- Expose sensitive data
- Pydantic validation conflicts
"""

import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


# ============================================================================
# BASE SCHEMAS (Shared fields)
# ============================================================================


class RoleBase(BaseModel):
    """Base schema với các fields chung"""

    name: str = Field(
        ..., min_length=1, max_length=100, description="Role name (e.g., ADMIN, USER)"
    )
    description: Optional[str] = Field(
        None, max_length=500, description="Role description"
    )


# ============================================================================
# REQUEST SCHEMAS (For API input)
# ============================================================================


class RoleCreate(RoleBase):
    """Schema để tạo role mới"""

    pass


class RoleUpdate(BaseModel):
    """Schema để update role (tất cả fields optional)"""

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)


# ============================================================================
# RESPONSE SCHEMAS (For API output)
# ============================================================================


class RoleRead(RoleBase):
    """
    Schema để trả về role (không có relationships).
    ✅ Tránh circular reference
    """

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RoleWithUsers(RoleRead):
    """
    Schema để trả về role kèm số lượng users.
    ✅ Chỉ trả về thông tin cần thiết, không load toàn bộ users
    """

    user_count: int = Field(default=0, description="Number of users with this role")

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# UTILITY SCHEMAS
# ============================================================================


class RoleInUser(BaseModel):
    """Schema nhỏ gọn để embed trong User response"""

    id: uuid.UUID
    name: str
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
