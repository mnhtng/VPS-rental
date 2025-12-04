from typing import Dict, List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
import logging

from backend.db import get_session
from backend.models import Cart, VMTemplate, VPSPlan
from backend.schemas import (
    CartAdd,
    CartResponse,
)
from backend.utils import get_current_user, get_admin_user


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/cart", tags=["Cart"])


@router.get("/", response_model=List[CartResponse], status_code=status.HTTP_200_OK)
async def get_cart(
    session: Session = Depends(get_session),
    current_user=Depends(get_current_user),
):
    """
    Retrieve the shopping cart for the current user.

    Args:
        session (Session, optional): Database session. Defaults to Depends(get_session).
        current_user (optional): The currently authenticated user. Defaults to Depends(get_current_user).

    Raises:
        HTTPException: 401 if not authenticated.
        HTTPException: 500 if there is a server error.

    Returns:
        CartResponse: The shopping cart of the current user.
    """
    try:
        statement = select(Cart).where(Cart.user_id == current_user.id)
        cart = session.exec(statement).all()

        if not cart:
            return []

        return cart
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f">>> Error fetching cart for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving cart",
        )


@router.post("/", response_model=CartResponse, status_code=status.HTTP_201_CREATED)
async def add_to_cart(
    cart_data: CartAdd,
    session: Session = Depends(get_session),
    current_user=Depends(get_current_user),
):
    """
    Add a VPS plan to the shopping cart for the current user.

    Args:
        cart_data (CartAdd): Data for the cart item to be added.
        session (Session, optional): Database session. Defaults to Depends(get_session).
        current_user (optional): The currently authenticated user. Defaults to Depends(get_current_user).

    Raises:
        HTTPException: 401 if not authenticated.
        HTTPException: 404 if the VPS plan or VM template is not found.
        HTTPException: 500 if there is a server error.

    Returns:
        CartResponse: The updated shopping cart of the current user.
    """
    try:
        plan = session.get(VPSPlan, cart_data.plan_id)
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="VPS plan not found",
            )

        statement = select(VMTemplate).where(
            VMTemplate.os_type == cart_data.os_type,
            VMTemplate.os_version == cart_data.os_version,
            VMTemplate.cpu_cores == plan.vcpu,
            VMTemplate.ram_gb == plan.ram_gb,
            VMTemplate.storage_gb == plan.storage_gb,
        )
        template = session.exec(statement).first()

        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No matching VM template found for the selected VPS plan and OS",
            )

        statement = select(Cart).where(Cart.user_id == current_user.id)
        cart = session.exec(statement).first()

        cart = Cart(
            user_id=current_user.id,
            vps_plan_id=plan.id,
            template_id=template.id,
            hostname=cart_data.hostname,
            os=cart_data.os,
            duration_months=cart_data.duration_months,
            unit_price=plan.monthly_price,
            total_price=cart_data.total_price,
        )

        session.add(cart)
        session.commit()
        session.refresh(cart)

        return cart
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f">>> Error adding to cart for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error adding to cart",
        )


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
async def clear_cart(
    session: Session = Depends(get_session),
    current_user=Depends(get_current_user),
):
    """
    Clear the shopping cart for the current user.

    Args:
        session (Session, optional): Database session. Defaults to Depends(get_session).
        current_user (optional): The currently authenticated user. Defaults to Depends(get_current_user).

    Raises:
        HTTPException: 401 if not authenticated.
        HTTPException: 500 if there is a server error.
    Returns:
        Dict[str, Any]: A message indicating the cart was cleared successfully.
    """
    try:
        statement = select(Cart).where(Cart.user_id == current_user.id)
        carts = session.exec(statement).all()

        for cart in carts:
            session.delete(cart)
        session.commit()

        return {"message": "Cart cleared successfully"}
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f">>> Error clearing cart for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error clearing cart",
        )


@router.delete("/{cart_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_cart_item(
    cart_id: int,
    session: Session = Depends(get_session),
    current_user=Depends(get_current_user),
):
    try:
        cart = session.get(Cart, cart_id)
        if not cart or cart.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cart item not found",
            )

        session.delete(cart)
        session.commit()

        return {"message": "Cart item removed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(
            f">>> Error removing cart item {cart_id} for user {current_user.id}: {e}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error removing cart item",
        )
