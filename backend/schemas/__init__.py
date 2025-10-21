"""
API Schemas Package
===================

Schema definitions for data validation and serialization.
Pydantic schemas for API request/response validation.
Separate from database models to:
- Avoid circular reference
- Control data exposure
- Validate input/output
"""

from .roles import (
    RoleBase,
    RoleCreate,
    RoleUpdate,
    RoleRead,
    RoleWithUsers,
    RoleInUser,
)

from .users import (
    UserBase,
    UserCreate,
    UserUpdate,
    UserChangePassword,
    UserRead,
    UserReadWithRole,
    UserProfile,
    UserInList,
    UserLogin,
    UserLoginResponse,
)

__all__ = [
    # Role schemas
    "RoleBase",
    "RoleCreate",
    "RoleUpdate",
    "RoleRead",
    "RoleWithUsers",
    "RoleInUser",
    # User schemas
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserChangePassword",
    "UserRead",
    "UserReadWithRole",
    "UserProfile",
    "UserInList",
    "UserLogin",
    "UserLoginResponse",
]
