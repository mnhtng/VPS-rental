from typing import Dict, List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from pydantic import BaseModel, Field
from decimal import Decimal
import logging

from backend.db import get_session
from backend.models import Cart, VMTemplate, VPSPlan, User
from backend.schemas import (
    PromotionResponse,
    UserPromotionResponse,
)
from backend.utils import get_current_user, get_admin_user
from backend.services import PromotionService


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/promotions", tags=["Promotions"])


# Request/Response schemas
class ValidatePromotionRequest(BaseModel):
    """Request schema for validating a promotion code"""

    code: str = Field(..., description="Promotion code to validate")
    cart_total: float = Field(..., description="Total cart amount", gt=0)


class ValidatePromotionResponse(BaseModel):
    """Response schema for promotion validation"""

    valid: bool = Field(..., description="Whether the promotion is valid")
    promotion: PromotionResponse = Field(..., description="Promotion details")
    discount_amount: float = Field(..., description="Calculated discount amount")
    discount_type: str = Field(..., description="Type of discount")
    discount_value: float = Field(..., description="Discount value")
    final_amount: float = Field(..., description="Final amount after discount")


@router.get(
    "/available",
    response_model=List[PromotionResponse],
    summary="Get available promotions",
    description="Returns all promotions that are currently available for the authenticated user based on usage limits",
)
async def get_available_promotions(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get all promotions available to the current user.

    Args:
        session (Session, optional): Database session. Defaults to Depends(get_session).
        current_user (User, optional): Current authenticated user. Defaults to Depends(get_current_user).

    Raises:
        HTTPException: 401 if user is not authenticated.
        HTTPException: 500 if there is a server error.

    Returns:
        List[PromotionResponse]: List of available promotions for the user.
    """
    try:
        promotion_service = PromotionService(session)
        promotions = promotion_service.get_available_promotions(current_user.id)

        return promotions
    except Exception as e:
        logger.error(f">>> Error fetching available promotions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch available promotions",
        )


@router.post(
    "/validate",
    response_model=ValidatePromotionResponse,
    summary="Validate a promotion code",
    description="Validates if a promotion code can be applied to the current user's cart",
)
async def validate_promotion(
    request: ValidatePromotionRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Validate if a promotion code can be used by the current user.

    Checks:
    - Promotion exists
    - Time validity (start/end dates)
    - Usage limits (total and per-user)
    - Calculates discount amount
    """
    try:
        promotion_service = PromotionService(session)

        # Validate promotion
        result = promotion_service.validate_promotion(
            code=request.code,
            user_id=current_user.id,
            cart_total=Decimal(str(request.cart_total)),
        )

        # Convert to response model
        promotion = result["promotion"]
        return ValidatePromotionResponse(
            valid=result["valid"],
            promotion=PromotionResponse(
                id=promotion.id,
                code=promotion.code,
                description=promotion.description,
                discount_type=promotion.discount_type,
                discount_value=float(promotion.discount_value),
                start_date=promotion.start_date,
                end_date=promotion.end_date,
                usage_limit=promotion.usage_limit,
                per_user_limit=promotion.per_user_limit,
                created_at=promotion.created_at,
                updated_at=promotion.updated_at,
            ),
            discount_amount=result["discount_amount"],
            discount_type=result["discount_type"],
            discount_value=result["discount_value"],
            final_amount=result["final_amount"],
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error validating promotion: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to validate promotion",
        )


@router.get(
    "/history",
    response_model=List[UserPromotionResponse],
    summary="Get promotion usage history",
    description="Returns the promotion usage history for the authenticated user",
)
async def get_promotion_history(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get all promotions used by the current user.
    """
    try:
        promotion_service = PromotionService(session)
        user_promotions = promotion_service.get_user_promotion_history(current_user.id)

        return [
            UserPromotionResponse(
                id=up.id,
                used_at=up.used_at,
                user=None,  # Optional: can populate if needed
                promotion=None,  # Optional: can populate if needed
                order=None,  # Optional: can populate if needed
            )
            for up in user_promotions
        ]
    except Exception as e:
        logger.error(f"Error fetching promotion history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch promotion history",
        )
