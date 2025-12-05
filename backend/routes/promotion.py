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
    PromotionValidateRequest,
    PromotionValidateResponse,
    UserPromotionResponse,
)
from backend.utils import get_current_user, get_admin_user
from backend.services import PromotionService


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/promotions", tags=["Promotions"])


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
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f">>> Error fetching available promotions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch available promotions",
        )


@router.post(
    "/validate",
    response_model=PromotionValidateResponse,
    summary="Validate a promotion code",
    description="Validates if a promotion code can be applied to the current user's cart",
)
async def validate_promotion(
    request: PromotionValidateRequest,
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

    Args:
        request (ValidatePromotionRequest): Request data containing promotion code and cart total.
        session (Session, optional): Database session. Defaults to Depends(get_session).
        current_user (User, optional): Current authenticated user. Defaults to Depends(get_current_user).

    Raises:
        HTTPException: 401 if user is not authenticated.
        HTTPException: 404 if promotion code is not found.
        HTTPException: 400 if promotion is not valid for the user or cart.
        HTTPException: 500 if there is a server error.

    Returns:
        ValidatePromotionResponse: Details about the promotion validation and calculated discount.
    """
    try:
        promotion_service = PromotionService(session)
        result = promotion_service.validate_promotion(
            user_id=current_user.id,
            code=request.code,
            cart_total_amount=Decimal(str(request.cart_total_amount)),
        )

        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f">>> Error validating promotion: {str(e)}")
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
    Get promotion usage history for the current user.

    Args:
        session (Session, optional): Database session. Defaults to Depends(get_session).
        current_user (User, optional): Current authenticated user. Defaults to Depends(get_current_user).

    Raises:
        HTTPException: 401 if user is not authenticated.
        HTTPException: 500 if there is a server error.

    Returns:
        List[UserPromotionResponse]: List of user's promotion usage history.
    """
    try:
        promotion_service = PromotionService(session)
        user_promotions = promotion_service.get_user_promotion_history(current_user.id)

        return [
            UserPromotionResponse(
                id=up.id,
                used_at=up.used_at,
                user=None,
                promotion=None,
                order=None,
            )
            for up in user_promotions
        ]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f">>> Error fetching promotion history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch promotion history",
        )
