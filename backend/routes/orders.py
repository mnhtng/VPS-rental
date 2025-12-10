import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from backend.db import get_session
from backend.models import Order, OrderItem
from backend.schemas import OrderResponse
from backend.utils import get_current_user


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/orders", tags=["Orders"])


@router.get(
    "/",
    response_model=List[OrderResponse],
    status_code=status.HTTP_200_OK,
    summary="Get current user's orders",
    description="Retrieve all orders for the currently authenticated user",
)
async def get_user_orders(
    session: Session = Depends(get_session),
    current_user=Depends(get_current_user),
):
    """
    Retrieve all orders for the current user.

    Args:
        session (Session, optional): Database session. Defaults to Depends(get_session).
        current_user (optional): The currently authenticated user. Defaults to Depends(get_current_user).

    Raises:
        HTTPException: 401 if not authenticated.
        HTTPException: 500 if there is a server error.

    Returns:
        List[OrderResponse]: List of orders for the current user.
    """
    try:
        statement = (
            select(Order)
            .where(Order.user_id == current_user.id)
            .order_by(Order.created_at.desc())
        )
        orders = session.exec(statement).all()

        result = []
        for order in orders:
            order_dict = {
                "id": order.id,
                "order_number": order.order_number,
                "price": float(order.price),
                "billing_address": order.billing_address,
                "billing_phone": order.billing_phone,
                "status": order.status,
                "note": order.note,
                "created_at": order.created_at,
                "updated_at": order.updated_at,
                "order_items": order.order_items,
                "payment_status": (
                    order.payment_transaction.status
                    if order.payment_transaction
                    else "pending"
                ),
            }
            result.append(order_dict)

        print(">>> 🎄 orders plan: ", result[0]["order_items"][0].vps_plan)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f">>> Error fetching orders for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving orders",
        )
