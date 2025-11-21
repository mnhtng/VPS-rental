from __future__ import annotations
import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from pydantic import (
    BaseModel,
    Field,
    ConfigDict,
)

if TYPE_CHECKING:
    from .users import UserPublic
    from .promotions import PromotionPublic
    from .orders import OrderPublic


class UserPromotionBase(BaseModel):
    """Base schema for user promotions"""

    used_at: datetime = Field(..., description="Timestamp when the promotion was used")


class UserPromotionCreate(UserPromotionBase):
    """Schema to create a new user promotion"""

    user_id: uuid.UUID = Field(..., description="User ID")
    promotion_id: uuid.UUID = Field(..., description="Promotion ID")
    order_id: uuid.UUID = Field(..., description="Order ID")


class UserPromotionUpdate(BaseModel):
    """Schema to update a user promotion"""

    used_at: Optional[datetime] = Field(None, description="New used at timestamp")


class UserPromotionPublic(UserPromotionBase):
    """Schema representing user promotion data in the database"""

    id: uuid.UUID = Field(..., description="User Promotion ID")

    model_config = ConfigDict(from_attributes=True)


class UserPromotionResponse(UserPromotionPublic):
    """Schema for user promotion data returned in API responses"""

    user: Optional[UserPublic] = Field(None, description="User details")
    promotion: Optional[PromotionPublic] = Field(None, description="Promotion details")
    order: Optional[OrderPublic] = Field(None, description="Order details")

    model_config = ConfigDict(from_attributes=True)
