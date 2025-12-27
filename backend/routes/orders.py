import logging
from datetime import datetime
from calendar import month_abbr
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from backend.db import get_session
from backend.models import Order, User
from backend.schemas import OrderResponse
from backend.utils import get_current_user, get_admin_user


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/orders", tags=["Orders"])
admin_router = APIRouter(prefix="/admin/orders", tags=["Admin - Orders Management"])


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


# ============================================================================
# Admin Endpoints - Orders Management
# ============================================================================


@admin_router.get(
    "/",
    response_model=List[OrderResponse],
    status_code=status.HTTP_200_OK,
    summary="[Admin] Get all orders",
    description="Retrieve all orders with pagination and filtering (Admin Only)",
)
async def admin_get_all_orders(
    skip: int = Query(0, description="Number of records to skip"),
    limit: int = Query(None, description="Maximum number of records to return"),
    status_filter: Optional[str] = Query(
        None, alias="status", description="Filter by order status (pending, paid, cancelled)"
    ),
    session: Session = Depends(get_session),
    admin_user: User = Depends(get_admin_user),
):
    """
    Retrieve all orders for admin management.

    Args:
        skip (int, optional): Number of records to skip for pagination. Defaults to 0.
        limit (int, optional): Maximum number of records to return. Defaults to None.
        status_filter (str, optional): Filter by order status. Defaults to None.
        session (Session, optional): Database session. Defaults to Depends(get_session).
        admin_user (User, optional): The currently authenticated admin user. Defaults to Depends(get_admin_user).

    Raises:
        HTTPException: 401 if not authenticated.
        HTTPException: 403 if not admin.
        HTTPException: 500 if there is a server error.

    Returns:
        List[OrderResponse]: List of all orders.
    """
    try:
        statement = select(Order).order_by(Order.created_at.desc())

        if status_filter:
            statement = statement.where(Order.status == status_filter)

        if skip is not None:
            statement = statement.offset(skip)
        if limit is not None:
            statement = statement.limit(limit)

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
        logger.error(f">>> Error fetching all orders: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving orders",
        )


@admin_router.get(
    "/statistics",
    status_code=status.HTTP_200_OK,
    summary="[Admin] Get order statistics",
    description="Retrieve order statistics for dashboard (Admin Only)",
)
async def admin_get_order_statistics(
    session: Session = Depends(get_session),
    admin_user: User = Depends(get_admin_user),
):
    """
    Retrieve order statistics for admin dashboard.

    Returns:
        Dict with total_orders, paid_orders, pending_orders, cancelled_orders,
        total_revenue, pending_amount, average_order
    """
    try:
        statement = select(Order)
        orders = session.exec(statement).all()

        paid_orders = [order for order in orders if order.status == "paid"]
        pending_orders = [order for order in orders if order.status == "pending"]
        cancelled_orders = [order for order in orders if order.status == "cancelled"]

        total_revenue = sum(float(order.price) for order in paid_orders)
        pending_amount = sum(float(order.price) for order in pending_orders)
        average_order = total_revenue / len(paid_orders) if paid_orders else 0

        return {
            "total_orders": len(orders),
            "paid_orders": len(paid_orders),
            "pending_orders": len(pending_orders),
            "cancelled_orders": len(cancelled_orders),
            "total_revenue": total_revenue,
            "pending_amount": pending_amount,
            "average_order": average_order,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f">>> Error calculating order statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error calculating order statistics",
        )


@admin_router.get(
    "/revenue/monthly",
    status_code=status.HTTP_200_OK,
    summary="[Admin] Get monthly revenue",
    description="Retrieve monthly revenue data for charts (Admin Only)",
)
async def admin_get_monthly_revenue(
    year: Optional[int] = Query(None, description="Year to get data for (defaults to current year)"),
    session: Session = Depends(get_session),
    admin_user: User = Depends(get_admin_user),
):
    """
    Retrieve monthly revenue data for admin dashboard charts.

    Returns:
        List of monthly revenue data with month name and revenue amount
    """
    try:
        current_year = year or datetime.now().year

        statement = select(Order).where(Order.status == "paid")
        orders = session.exec(statement).all()

        monthly_revenue = {i: 0.0 for i in range(1, 13)}
        monthly_orders = {i: 0 for i in range(1, 13)}

        for order in orders:
            if order.created_at.year == current_year:
                month = order.created_at.month
                monthly_revenue[month] += float(order.price)
                monthly_orders[month] += 1

        result = [
            {
                "month": month_abbr[i],
                "revenue": monthly_revenue[i],
                "orders": monthly_orders[i],
            }
            for i in range(1, 13)
        ]

        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f">>> Error calculating monthly revenue: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error calculating monthly revenue",
        )

