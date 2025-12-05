import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from decimal import Decimal
from sqlmodel import Session, select, func
from fastapi import HTTPException, status

from backend.models import Promotion, UserPromotion
from backend.schemas import PromotionResponse


class PromotionService:
    """Service for handling promotion-related business logic"""

    def __init__(self, session: Session):
        self.session = session

    def get_available_promotions(self, user_id: uuid.UUID) -> List[PromotionResponse]:
        """
        Get all available promotions for a specific user.

        Filters out:
        - Expired promotions (past end_date)
        - Not yet started promotions (before start_date)
        - Promotions that reached total usage limit
        - Promotions where user reached per_user_limit

        Args:
            user_id: The UUID of the user

        Returns:
            List of PromotionResponse objects
        """
        current_time = datetime.now(timezone.utc)

        promotions = self.session.exec(select(Promotion)).all()

        available_promotions = []

        for promotion in promotions:
            if promotion.start_date and promotion.start_date > current_time:
                continue

            if promotion.end_date and promotion.end_date < current_time:
                continue

            if promotion.usage_limit is not None:
                statement = select(func.count(UserPromotion.id)).where(
                    UserPromotion.promotion_id == promotion.id
                )
                total_usage = self.session.exec(statement).one()

                if total_usage >= promotion.usage_limit:
                    continue

            if promotion.per_user_limit is not None:
                statement = select(func.count(UserPromotion.id)).where(
                    UserPromotion.promotion_id == promotion.id,
                    UserPromotion.user_id == user_id,
                )
                user_usage = self.session.exec(statement).one()

                if user_usage >= promotion.per_user_limit:
                    continue

            available_promotions.append(promotion)

        return available_promotions

    def validate_promotion(
        self, user_id: uuid.UUID, code: str, cart_total_amount: Decimal
    ) -> Dict[str, Any]:
        """
        Validate if a promotion code can be used by a user.

        Args:
            code: The promotion code
            user_id: The UUID of the user
            cart_total_amount: The total amount in cart

        Raises:
            HTTPException: 404 if promotion not found
            HTTPException: 400 if promotion is not valid for the user or cart

        Returns:
            Dict with validation result and calculated discount
        """
        statement = select(Promotion).where(Promotion.code == code.upper())
        promotion = self.session.exec(statement).first()

        if not promotion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Promotion code not found",
            )

        current_time = datetime.now(timezone.utc)

        # Check if promotion has started
        if promotion.start_date and promotion.start_date > current_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This promotion is not yet active",
            )

        # Check if promotion has expired
        if promotion.end_date and promotion.end_date < current_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This promotion has expired",
            )

        # Check total usage limit
        if promotion.usage_limit is not None:
            total_usage_query = select(func.count(UserPromotion.id)).where(
                UserPromotion.promotion_id == promotion.id
            )
            total_usage = self.session.exec(total_usage_query).one()

            if total_usage >= promotion.usage_limit:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This promotion has reached its usage limit",
                )

        # Check per-user usage limit
        if promotion.per_user_limit is not None:
            user_usage_query = select(func.count(UserPromotion.id)).where(
                UserPromotion.promotion_id == promotion.id,
                UserPromotion.user_id == user_id,
            )
            user_usage = self.session.exec(user_usage_query).one()

            if user_usage >= promotion.per_user_limit:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You have reached the usage limit for this promotion",
                )

        # Calculate discount
        discount_amount = self._calculate_discount(promotion, cart_total_amount)

        return {
            "valid": True,
            "promotion": promotion,
            "discount_amount": float(discount_amount),
            "discount_type": promotion.discount_type,
            "discount_value": float(promotion.discount_value),
            "final_amount": float(cart_total_amount - discount_amount),
        }

    def apply_promotion(
        self, promotion_id: uuid.UUID, user_id: uuid.UUID, order_id: uuid.UUID
    ) -> UserPromotion:
        """
        Record that a promotion was used by a user on an order.

        Args:
            promotion_id: The UUID of the promotion
            user_id: The UUID of the user
            order_id: The UUID of the order

        Returns:
            The created UserPromotion object
        """
        user_promotion = UserPromotion(
            user_id=user_id,
            promotion_id=promotion_id,
            order_id=order_id,
            used_at=datetime.now(timezone.utc),
        )

        self.session.add(user_promotion)
        self.session.commit()
        self.session.refresh(user_promotion)

        return user_promotion

    def get_user_promotion_history(self, user_id: uuid.UUID) -> List[UserPromotion]:
        """
        Get all promotions used by a specific user.

        Args:
            user_id: The UUID of the user

        Returns:
            List of UserPromotion objects
        """
        statement = select(UserPromotion).where(UserPromotion.user_id == user_id)
        return List(self.session.exec(statement).all())

    # =============================================================================
    # Private Methods
    # =============================================================================
    def _calculate_discount(
        self, promotion: Promotion, cart_total_amount: Decimal
    ) -> Decimal:
        """
        Calculate discount amount based on promotion type.

        Args:
            promotion: The Promotion object
            cart_total_amount: The total amount in cart

        Returns:
            The discount amount as Decimal
        """
        if promotion.discount_type == "percentage":
            discount = cart_total_amount * (promotion.discount_value / 100)
        elif promotion.discount_type == "fixed_amount":
            discount = min(promotion.discount_value, cart_total_amount)
        else:
            discount = Decimal(0)

        # Ensure discount doesn't exceed cart total
        return min(discount, cart_total_amount)
