import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from backend.db import get_session
from backend.models import Order, User
from backend.schemas import OrderResponse
from backend.utils import get_current_user, get_admin_user


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
    current_user: User = Depends(get_current_user),
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
        if orders:
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
                    "user": order.user,
                    "order_items": order.order_items,
                    "payment_status": (
                        order.payment_transaction.status
                        if order.payment_transaction
                        else "pending"
                    ),
                    "payment_method": (
                        order.payment_transaction.payment_method
                        if order.payment_transaction
                        else None
                    ),
                }
                result.append(order_dict)

        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f">>> Error fetching orders for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving orders",
        )


@router.get(
    "/{order_id}",
    response_model=OrderResponse,
    status_code=status.HTTP_200_OK,
    summary="Get order by ID",
    description="Retrieve a specific order by its ID for the currently authenticated user",
)
async def get_order_by_id(
    order_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve a specific order by its ID for the current user.

    Args:
        order_id (str): The ID of the order to retrieve.
        session (Session, optional): Database session. Defaults to Depends(get_session).
        current_user (optional): The currently authenticated user. Defaults to Depends(get_current_user).

    Raises:
        HTTPException: 401 if not authenticated.
        HTTPException: 404 if order not found.
        HTTPException: 500 if there is a server error.

    Returns:
        OrderResponse: The requested order details.
    """
    try:
        statement = (
            select(Order)
            .where(Order.id == order_id)
            .where(Order.user_id == current_user.id)
        )
        order = session.exec(statement).first()

        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found",
            )

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
            "payment_method": (
                order.payment_transaction.payment_method
                if order.payment_transaction
                else None
            ),
        }

        return order_dict
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f">>> Error fetching order {order_id} for user {current_user.id}: {e}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving order",
        )


@router.get(
    "/total-revenue",
    response_model=float,
    status_code=status.HTTP_200_OK,
    summary="Get total revenue from all orders",
    description="Retrieve the total revenue generated from all orders",
)
async def get_total_revenue(
    month: Optional[int] = Query(
        None, description="Get revenue for a specific month (1-12)"
    ),
    session: Session = Depends(get_session),
    admin_user: User = Depends(get_admin_user),
):
    """
    Retrieve the total revenue generated from all orders.

    Args:
        session (Session, optional): Database session. Defaults to Depends(get_session).
        admin_user (optional): The currently authenticated admin user. Defaults to Depends(get_admin_user).

    Raises:
        HTTPException: 500 if there is a server error.

    Returns:
        float: Total revenue from all orders.
    """
    try:
        statement = select(Order)
        if month and 1 <= month <= 12:
            statement = statement.where(Order.created_at.month == month)
        orders = session.exec(statement).all()

        total_revenue = sum(float(order.price) for order in orders)

        return total_revenue
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f">>> Error calculating total revenue: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error calculating total revenue",
        )


@router.get(
    "/user/total-revenue",
    response_model=float,
    status_code=status.HTTP_200_OK,
    summary="Get total revenue from current user's orders",
    description="Retrieve the total revenue generated from the currently authenticated user's orders",
)
async def get_user_total_revenue(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve the total revenue generated from the current user's orders.

    Args:
        session (Session, optional): Database session. Defaults to Depends(get_session).
        current_user (optional): The currently authenticated user. Defaults to Depends(get_current_user).

    Raises:
        HTTPException: 500 if there is a server error.

    Returns:
        float: Total revenue from the current user's orders.
    """
    try:
        statement = select(Order).where(Order.user_id == current_user.id)
        orders = session.exec(statement).all()

        total_revenue = sum(float(order.price) for order in orders)

        return total_revenue
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f">>> Error calculating total revenue for user {current_user.id}: {e}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error calculating total revenue",
        )
