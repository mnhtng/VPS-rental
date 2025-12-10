from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from pydantic import BaseModel, Field
from decimal import Decimal
import logging

from backend.db import get_session
from backend.models import Cart, User
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
    data: PromotionValidateRequest,
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
        data (ValidatePromotionRequest): Request data containing promotion code and cart total.
        session (Session, optional): Database session. Defaults to Depends(get_session).
        current_user (User, optional): Current authenticated user. Defaults to Depends(get_current_user).

    Raises:
        HTTPException: 401 if user is not authenticated.
        HTTPException: 404 if promotion code is not found.
        HTTPException: 400 if promotion is not valid for the user or cart.
        HTTPException: 500 if there is a server error.

    Returns:
        PromotionValidateResponse: Validation result with promotion details and discount amounts.
    """
    try:
        promotion_service = PromotionService(session)
        result = promotion_service.validate_promotion(
            user_id=current_user.id,
            code=data.code,
            cart_total_amount=Decimal(str(data.cart_total_amount)),
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
    "/cart",
    response_model=PromotionValidateResponse | None,
    summary="Get promotion applied to cart",
    description="Returns the promotion currently applied to the authenticated user's cart",
)
async def get_promotion_cart(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get the promotion currently applied to the current user's cart.

    Args:
        session (Session, optional): Database session. Defaults to Depends(get_session).
        current_user (User, optional): Current authenticated user. Defaults to Depends(get_current_user).

    Raises:
        HTTPException: 401 if user is not authenticated.
        HTTPException: 500 if there is a server error.

    Returns:
        PromotionValidateResponse: Details of the promotion applied to the cart.
    """
    try:
        statement = select(Cart).where(Cart.user_id == current_user.id)
        cart_items = session.exec(statement).all()

        if not cart_items:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cart is empty",
            )

        promotion_code = cart_items[0].discount_code

        if not promotion_code:
            return None

        total_price = sum(item.total_price for item in cart_items)

        promotion_service = PromotionService(session)
        promotion_in_cart = promotion_service.validate_promotion(
            user_id=current_user.id,
            code=promotion_code,
            cart_total_amount=total_price,
        )

        return promotion_in_cart
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f">>> Error fetching promotion in cart: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch promotion in cart",
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


class ApplyPromotionRequest(BaseModel):
    """Request model for applying promotion to cart"""

    code: str | None = Field(
        None,
        description="Promotion code to apply, or null to remove promotion",
    )


class ApplyPromotionResponse(BaseModel):
    """Response model for applying promotion"""

    success: bool
    promotion_applied: bool
    promotion: PromotionResponse | None
    subtotal: Decimal
    discount_amount: Decimal
    final_amount: Decimal


@router.post(
    "/apply",
    response_model=ApplyPromotionResponse,
    summary="Apply promotion to cart",
    description="Apply or remove a promotion code from the user's cart",
)
async def apply_promotion(
    request: ApplyPromotionRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Apply or remove a promotion from the current user's cart.

    Args:
        request (ApplyPromotionRequest): Request containing promotion code or null to remove.
        session (Session, optional): Database session. Defaults to Depends(get_session).
        current_user (User, optional): Current authenticated user. Defaults to Depends(get_current_user).

    Raises:
        HTTPException: 401 if user is not authenticated.
        HTTPException: 404 if cart is empty or promotion not found.
        HTTPException: 400 if promotion is not valid.
        HTTPException: 500 if there is a server error.

    Returns:
        ApplyPromotionResponse: Cart summary with applied promotion and calculated discount.
    """
    try:
        # Get user's cart items
        cart_items = session.exec(
            select(Cart).where(Cart.user_id == current_user.id)
        ).all()

        if not cart_items:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cart is empty",
            )

        # Calculate subtotal
        subtotal = sum(item.total_price for item in cart_items)

        # If code is None, remove promotion
        if request.code is None:
            return ApplyPromotionResponse(
                success=True,
                promotion_applied=False,
                promotion=None,
                subtotal=subtotal,
                discount_amount=Decimal("0"),
                final_amount=subtotal,
            )

        # Validate and apply promotion
        promotion_service = PromotionService(session)
        validation_result = promotion_service.validate_promotion(
            user_id=current_user.id,
            code=request.code,
            cart_total_amount=subtotal,
        )

        if not validation_result["valid"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=validation_result.get("error", "Invalid promotion code"),
            )

        # Return success with promotion details
        return ApplyPromotionResponse(
            success=True,
            promotion_applied=True,
            promotion=PromotionResponse(
                id=validation_result["promotion"]["id"],
                code=validation_result["promotion"]["code"],
                description=validation_result["promotion"]["description"],
                discount_type=validation_result["promotion"]["discount_type"],
                discount_value=validation_result["promotion"]["discount_value"],
                start_date=validation_result["promotion"].get("start_date"),
                end_date=validation_result["promotion"].get("end_date"),
                usage_limit=validation_result["promotion"].get("usage_limit"),
                per_user_limit=validation_result["promotion"].get("per_user_limit"),
                is_active=validation_result["promotion"]["is_active"],
                created_at=validation_result["promotion"]["created_at"],
                updated_at=validation_result["promotion"]["updated_at"],
            ),
            subtotal=subtotal,
            discount_amount=Decimal(str(validation_result["discount_amount"])),
            final_amount=Decimal(str(validation_result["final_amount"])),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f">>> Error applying promotion: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to apply promotion",
        )
