import uuid
from typing import Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import selectinload
from sqlmodel import Session, select
import logging

from backend.db import get_session
from backend.models import Cart, VMTemplate, VPSPlan, ProxmoxVM, User
from backend.schemas import (
    CartAdd,
    CartResponse,
)
from backend.utils import get_current_user, normalize_hostname, Translator, get_translator


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/cart", tags=["Cart"])


@router.get(
    "",
    response_model=List[CartResponse],
    status_code=status.HTTP_200_OK,
    summary="Get current user's cart",
    description="Retrieve the shopping cart for the currently authenticated user",
)
async def get_cart(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    translator: Translator = Depends(get_translator),
):
    """
    Retrieve the shopping cart for the current user.

    Args:
        session (Session, optional): Database session. Defaults to Depends(get_session).
        current_user (optional): The currently authenticated user. Defaults to Depends(get_current_user).
        translator (Translator, optional): Translator for i18n messages. Defaults to Depends(get_translator).

    Raises:
        HTTPException: 401 if not authenticated.
        HTTPException: 500 if there is a server error.

    Returns:
        CartResponse: The shopping cart of the current user.
    """
    try:
        statement = (
            select(Cart)
            .where(Cart.user_id == current_user.id)
            .options(
                selectinload(Cart.vps_plan),
                selectinload(Cart.template),
            )
        )
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
            detail=translator.t("errors.internal_server"),
        )


@router.get(
    "/count",
    response_model=Dict[str, int],
    status_code=status.HTTP_200_OK,
    summary="Get total items in current user's cart",
    description="Retrieve the total number of items in the shopping cart for the currently authenticated user",
)
async def get_cart_total(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    translator: Translator = Depends(get_translator),
):
    """
    Get the total number of items in the current user's cart.

    Args:
        session (Session, optional): Database session. Defaults to Depends(get_session).
        current_user (optional): The currently authenticated user. Defaults to Depends(get_current_user).
        translator (Translator, optional): Translator for i18n messages. Defaults to Depends(get_translator).

    Raises:
        HTTPException: 401 if not authenticated.
        HTTPException: 500 if there is a server error.

    Returns:
        Dict[str, int]: A dictionary containing the total number of items in the cart.
    """
    try:
        statement = select(Cart).where(Cart.user_id == current_user.id)
        cart_items = session.exec(statement).all()

        return {"total_items": len(cart_items)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f">>> Error calculating cart items total for user {current_user.id}: {e}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=translator.t("errors.internal_server"),
        )


@router.post(
    "",
    response_model=CartResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add item to cart",
    description="Add a VPS plan to the shopping cart for the currently authenticated user",
)
async def add_to_cart(
    cart_data: CartAdd,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    translator: Translator = Depends(get_translator),
):
    """
    Add a VPS plan to the shopping cart for the current user.

    Args:
        cart_data (CartAdd): Data for the cart item to be added.
        session (Session, optional): Database session. Defaults to Depends(get_session).
        current_user (optional): The currently authenticated user. Defaults to Depends(get_current_user).
        translator (Translator, optional): Translator for i18n messages. Defaults to Depends(get_translator).

    Raises:
        HTTPException: 400 if the VPS with the same hostname already exists.
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
                detail=translator.t("admin.plan_not_found"),
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
                detail=translator.t("proxmox.template_not_found"),
            )

        statement = select(ProxmoxVM).where(
            ProxmoxVM.template_id == template.id,
            ProxmoxVM.hostname == cart_data.hostname,
            ProxmoxVM.hostname == cart_data.hostname,
        )
        exist_vm = session.exec(statement).first()

        if exist_vm:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=translator.t("cart.item_not_found"),
            )

        statement = select(Cart).where(Cart.user_id == current_user.id)
        cart = session.exec(statement).first()

        if cart:
            statement = select(Cart).where(
                Cart.hostname == cart_data.hostname, Cart.os == cart_data.os
            )
            existing_cart_item = session.exec(statement).first()

            if existing_cart_item:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=translator.t("cart.item_not_found"),
                )

        cart = Cart(
            user_id=current_user.id,
            vps_plan_id=plan.id,
            template_id=template.id,
            hostname=normalize_hostname(cart_data.hostname),
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
            detail=translator.t("errors.internal_server"),
        )


@router.delete(
    "",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Clear current user's cart",
    description="Clear the shopping cart for the currently authenticated user",
)
async def clear_cart(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    translator: Translator = Depends(get_translator),
):
    """
    Clear the shopping cart for the current user.

    Args:
        session (Session, optional): Database session. Defaults to Depends(get_session).
        current_user (optional): The currently authenticated user. Defaults to Depends(get_current_user).
        translator (Translator, optional): Translator for i18n messages. Defaults to Depends(get_translator).

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

        return {"message": translator.t("cart.cart_cleared")}
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f">>> Error clearing cart for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=translator.t("errors.internal_server"),
        )


@router.delete(
    "/{cart_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove item from cart",
    description="Remove a specific item from the shopping cart for the currently authenticated user",
)
async def remove_cart_item(
    cart_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    translator: Translator = Depends(get_translator),
):
    """
    Remove a specific item from the current user's cart.

    Args:
        cart_id (uuid.UUID): The ID of the cart item to remove.
        session (Session, optional): Database session. Defaults to Depends(get_session).
        current_user (optional): The currently authenticated user. Defaults to Depends(get_current_user).
        translator (Translator, optional): Translator for i18n messages. Defaults to Depends(get_translator).

    Raises:
        HTTPException: 404 if the cart item is not found or does not belong to the user.
        HTTPException: 500 if there is a server error.

    Returns:
        Dict[str, str]: A message indicating the cart item was removed successfully.
    """
    try:
        cart = session.get(Cart, cart_id)
        if not cart or cart.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=translator.t("cart.item_not_found"),
            )

        session.delete(cart)
        session.commit()

        return {"message": translator.t("cart.item_removed")}
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(
            f">>> Error removing cart item {cart_id} for user {current_user.id}: {e}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=translator.t("errors.internal_server"),
        )
