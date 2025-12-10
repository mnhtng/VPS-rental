import uuid
import logging
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlmodel import Session, select

from backend.db import get_session
from backend.models import User, Order, Cart
from backend.schemas import (
    CartProceedToCheckout,
    PaymentRequest,
    PaymentResponse,
    PaymentStatusResponse,
    CallbackResponse,
)
from backend.services import PaymentService
from backend.utils import get_current_user


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post(
    "/checkout-proceed",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    summary="Proceed to checkout",
    description="Proceed to checkout by applying promotion code to all cart items",
)
async def proceed_to_checkout(
    data: CartProceedToCheckout,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Proceed to checkout by applying promotion code to all cart items.

    Args:
        promotion_code (Optional[str], optional): Promotion code to apply. Defaults to None.
        session (Session, optional): Database session. Defaults to Depends(get_session).
        current_user (User, optional): Current authenticated user. Defaults to Depends(get_current_user).

    Raises:
        HTTPException: 401 if not authenticated.
        HTTPException: 400 if cart is empty.
        HTTPException: 500 if there is a server error.

    Returns:
        Dict[str, Any]: Result of the checkout proceed operation.
    """
    try:
        statement = select(Cart).where(Cart.user_id == current_user.id)
        cart = session.exec(statement).all()

        if not cart:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cart is empty",
            )

        for item in cart:
            item.discount_code = data.promotion_code

        session.add_all(cart)
        session.commit()

        return {
            "message": "Proceeded to checkout successfully",
        }
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f">>> Error proceeding to checkout: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error proceeding to checkout",
        )


@router.get(
    "/order/{order_id}/can-repay",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    summary="Check if order can be repaid",
    description="Check if a pending order can be repaid (no VPS instances created)",
)
async def check_order_can_repay(
    order_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Check if a pending order can be repaid.
    An order can be repaid if:
    - It belongs to the current user
    - It has status 'pending'
    - None of its order items have VPS instances created

    Args:
        order_id (uuid.UUID): Order ID to check.
        session (Session): Database session.
        current_user (User): Current authenticated user.

    Returns:
        Dict[str, Any]: Result with can_repay flag and reason if not.
    """
    try:
        order = session.get(Order, order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found",
            )

        if order.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this order",
            )

        if order.status != "pending":
            return {
                "can_repay": False,
                "reason": "Order is not in a payable state",
            }

        # Check if any order item has a VPS instance
        for order_item in order.order_items:
            if order_item.vps_instance is not None:
                return {
                    "can_repay": False,
                    "reason": "VPS service has already been provided",
                }

        return {
            "can_repay": True,
            "order_number": order.order_number,
            "amount": float(order.price),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f">>> Error checking order repay status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error checking order repay status",
        )


# MoMo Endpoints
@router.post(
    "/momo/create",
    response_model=PaymentResponse,
    summary="Create MoMo payment",
    description="Create a MoMo payment for an order",
)
async def create_momo_payment(
    payment_request: PaymentRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Create demo MoMo payment for testing.

    Args:
        payment_request (PaymentRequest): Payment request data
        session (Session, optional): Database session, defaults to Depends(get_session)
        current_user (User, optional): Currently authenticated user, defaults to Depends(get_current_user)

    Raises:
        HTTPException: 401 if not authenticated.
        HTTPException: 400 if order is not in pending payment status or failure in payment creation.
        HTTPException: 403 if user does not have permission to pay for the order.
        HTTPException: 404 if order is not found.
        HTTPException: 500 if there is a server error.

    Returns:
        PaymentResponse: Response containing payment details or error information
    """
    try:
        payment_service = PaymentService(session)
        order_initialized = payment_service.initialize_order(
            order_number=payment_request.order_number,
            amount=payment_request.amount,
            user_id=current_user.id,
            phone=payment_request.phone,
            address=payment_request.address,
        )

        if not order_initialized:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Not found order",
            )

        if order_initialized.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to pay for this order",
            )

        if order_initialized.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Order is not in a payable state",
            )

        result = payment_service.create_momo_payment(
            order=order_initialized,
            return_url=payment_request.return_url,
        )

        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.error,
            )

        return result
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f">>> Error creating demo MoMo payment: {str(e)}")
        return HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating demo MoMo payment",
        )


@router.post(
    "/momo/repay",
    response_model=PaymentResponse,
    summary="Repay pending order with MoMo",
    description="Create a MoMo payment for an existing pending order",
)
async def repay_momo_payment(
    payment_request: PaymentRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Repay a pending order with MoMo.
    This endpoint is used for orders that were created but payment was not completed.

    Args:
        payment_request (PaymentRequest): Payment request data with existing order_number
        session (Session): Database session
        current_user (User): Currently authenticated user

    Returns:
        PaymentResponse: Response containing payment details or error information
    """
    try:
        # Find existing order by order_number
        statement = select(Order).where(Order.order_number == payment_request.order_number)
        order = session.exec(statement).first()

        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found",
            )

        if order.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to pay for this order",
            )

        if order.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Order is not in a payable state",
            )

        # Check if any VPS instance exists for this order
        for order_item in order.order_items:
            if order_item.vps_instance is not None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="VPS service has already been provided",
                )

        payment_service = PaymentService(session)
        result = payment_service.create_momo_payment(
            order=order,
            return_url=payment_request.return_url,
            repay=True,
        )

        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Failed to create payment"),
            )

        return result
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f">>> Error creating MoMo repayment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating MoMo repayment",
        )


@router.get(
    "/momo/return",
    response_model=CallbackResponse,
    summary="MoMo return callback",
    description="Handle redirect from MoMo after payment",
)
async def momo_return(
    request: Request,
    session: Session = Depends(get_session),
):
    """
    Handle MoMo redirect after payment.

    Args:
        request (Request): HTTP request object containing query parameters from MoMo redirect
        session (Session, optional): Database session, defaults to Depends(get_session).

    Returns:
        CallbackResponse: Response model indicating the result of the callback
    """
    try:
        params = dict(request.query_params)

        data = {
            "partnerCode": params.get("partnerCode"),
            "orderId": params.get("orderId"),
            "requestId": params.get("requestId"),
            "amount": params.get("amount"),
            "orderInfo": params.get("orderInfo"),
            "orderType": params.get("orderType"),
            "transId": params.get("transId"),
            "resultCode": int(params.get("resultCode", 1)),
            "message": params.get("message"),
            "payType": params.get("payType"),
            "responseTime": params.get("responseTime"),
            "extraData": params.get("extraData", ""),
            "signature": params.get("signature"),
        }

        payment_service = PaymentService(session)
        result = payment_service.verify_momo_callback(data)

        return CallbackResponse(
            valid=result.get("valid", False),
            success=result.get("success"),
            transaction_id=result.get("transaction_id"),
            message=result.get("message"),
            error=result.get("error"),
            data=result.get("data"),
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f">>> MoMo return error: {str(e)}")
        return CallbackResponse(
            valid=False,
            error="An error occurred while processing MoMo return",
        )


@router.post(
    "/momo/notify",
    response_model=Dict[str, Any],
    summary="MoMo IPN callback",
    description="Receive payment notification from MoMo (IPN)",
)
async def momo_notify(
    request: Request,
    session: Session = Depends(get_session),
):
    """
    Handle MoMo Instant Payment Notification (IPN).
    Called by MoMo server when payment status changes.

    Args:
        request (Request): The incoming request from MoMo containing payment notification data.
        session (Session, optional): Database session, defaults to Depends(get_session).

    Returns:
        Dict[str, Any]: Response indicating the result of the IPN processing.
    """
    try:
        data = await request.json()

        payment_service = PaymentService(session)
        result = payment_service.verify_momo_callback(data)

        if result["valid"]:
            return {
                "resultCode": 0,
                "message": "Received",
            }
        else:
            return {
                "resultCode": 1,
                "message": result.get("error", "Verification failed"),
            }
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f">>> MoMo IPN error: {str(e)}")
        return {
            "resultCode": 1,
            "message": "An error occurred while processing MoMo IPN",
        }


# VNPay Endpoints
@router.post(
    "/vnpay/create",
    response_model=PaymentResponse,
    summary="Create VNPay payment",
    description="Create a new VNPay payment request for an order",
)
async def create_vnpay_payment(
    payment_request: PaymentRequest,
    request: Request,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Create demo VNPay payment for testing.

    Args:
        payment_request (PaymentRequest): Payment request data
        request (Request): HTTP request object
        session (Session, optional): Database session, defaults to Depends(get_session)
        current_user (User, optional): Currently authenticated user, defaults to Depends(get_current_user)

    Raises:
        HTTPException: 401 if not authenticated.
        HTTPException: 400 if order is not in pending payment status or failure in payment creation.
        HTTPException: 403 if user does not have permission to pay for the order.
        HTTPException: 404 if order is not found.
        HTTPException: 500 if there is a server error.

    Returns:
        PaymentResponse: Response containing payment details or error information
    """
    try:
        payment_service = PaymentService(session)
        order_initialized = payment_service.initialize_order(
            order_number=payment_request.order_number,
            amount=payment_request.amount,
            user_id=current_user.id,
            phone=payment_request.phone,
            address=payment_request.address,
        )

        if not order_initialized:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Not found order",
            )

        if order_initialized.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to pay for this order",
            )

        if order_initialized.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Order is not in a payable state",
            )

        # Get client IP
        client_ip = request.client.host if request.client else "127.0.0.1"
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()

        result = payment_service.create_vnpay_payment(
            order=order_initialized,
            client_ip=client_ip,
            return_url=payment_request.return_url,
        )

        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.error,
            )

        return result
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f">>> Error creating VNPay payment: {str(e)}")
        return HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating demo VNPay payment",
        )


@router.post(
    "/vnpay/repay",
    response_model=PaymentResponse,
    summary="Repay pending order with VNPay",
    description="Create a VNPay payment for an existing pending order",
)
async def repay_vnpay_payment(
    payment_request: PaymentRequest,
    request: Request,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Repay a pending order with VNPay.
    This endpoint is used for orders that were created but payment was not completed.

    Args:
        payment_request (PaymentRequest): Payment request data with existing order_number
        request (Request): HTTP request object
        session (Session): Database session
        current_user (User): Currently authenticated user

    Returns:
        PaymentResponse: Response containing payment details or error information
    """
    try:
        # Find existing order by order_number
        statement = select(Order).where(Order.order_number == payment_request.order_number)
        order = session.exec(statement).first()

        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found",
            )

        if order.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to pay for this order",
            )

        if order.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Order is not in a payable state",
            )

        # Check if any VPS instance exists for this order
        for order_item in order.order_items:
            if order_item.vps_instance is not None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="VPS service has already been provided",
                )

        # Get client IP
        client_ip = request.client.host if request.client else "127.0.0.1"
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()

        payment_service = PaymentService(session)
        result = payment_service.create_vnpay_payment(
            order=order,
            client_ip=client_ip,
            return_url=payment_request.return_url,
            repay=True,
        )

        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Failed to create payment"),
            )

        return result
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f">>> Error creating VNPay repayment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating VNPay repayment",
        )


@router.get(
    "/vnpay/return",
    response_model=CallbackResponse,
    summary="VNPay return callback",
    description="Handle redirect from VNPay after payment",
)
async def vnpay_return(
    request: Request,
    session: Session = Depends(get_session),
):
    """
    Handle VNPay redirect after payment.

    Args:
        request (Request): HTTP request object
        session (Session, optional): Database session. Defaults to Depends(get_session).

    Returns:
        CallbackResponse: Response model indicating the result of the callback
    """
    try:
        params = dict(request.query_params)

        payment_service = PaymentService(session)
        result = payment_service.verify_vnpay_return(params)

        return CallbackResponse(
            valid=result.get("valid", False),
            success=result.get("success"),
            transaction_id=result.get("transaction_id"),
            message=result.get("message"),
            error=result.get("error"),
            data=result.get("data"),
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f">>> VNPay return error: {str(e)}")
        return CallbackResponse(
            valid=False,
            error="An error occurred while processing VNPay return",
        )


@router.post(
    "/vnpay/ipn",
    response_model=Dict[str, str],
    summary="VNPay IPN callback",
    description="Receive payment notification from VNPay (IPN)",
)
async def vnpay_ipn(
    request: Request,
    session: Session = Depends(get_session),
):
    """
    Handle VNPay Instant Payment Notification (IPN).
    Called by VNPay server when payment status changes.

    Args:
        request (Request): HTTP request object
        session (Session, optional): Database session, defaults to Depends(get_session).

    Returns:
        Dict[str, str]: Response indicating the result of the IPN processing.
    """
    try:
        params = dict(request.query_params)

        payment_service = PaymentService(session)
        result = payment_service.verify_vnpay_return(params)

        if result["valid"] and result.get("success"):
            return {
                "RspCode": "00",
                "Message": "Confirm Success",
            }
        else:
            return {
                "RspCode": "97",
                "Message": result.get("error", "Invalid signature"),
            }
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f">>> VNPay IPN error: {str(e)}")
        return {
            "RspCode": "99",
            "Message": "An error occurred while processing VNPay IPN",
        }


# Common Payment Endpoints
@router.get(
    "/{payment_id}",
    response_model=PaymentStatusResponse,
    summary="Get payment status",
    description="Get the status of a payment transaction",
)
async def get_payment_status(
    payment_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> PaymentStatusResponse:
    """
    Get payment transaction status.
    """
    try:
        payment_service = PaymentService(session)
        result = payment_service.get_payment_status(payment_id)

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy giao dịch thanh toán",
            )

        # Verify ownership via order
        order = session.get(Order, uuid.UUID(result["order_id"]))
        if order and order.user_id != current_user.id and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền xem giao dịch này",
            )

        return PaymentStatusResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting payment status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Lỗi khi lấy thông tin thanh toán",
        )


@router.get(
    "/order/{order_id}",
    summary="Get order payments",
    description="Get all payment transactions for an order",
)
async def get_order_payments(
    order_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Get all payment transactions for an order.
    """
    try:
        # Get order and verify ownership
        order = session.get(Order, order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy đơn hàng",
            )

        if order.user_id != current_user.id and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền xem đơn hàng này",
            )

        payment_service = PaymentService(session)
        payments = payment_service.get_order_payments(order_id)

        return {
            "order_id": str(order_id),
            "order_number": order.order_number,
            "order_status": order.status,
            "payments": [
                {
                    "id": str(p.id),
                    "transaction_id": p.transaction_id,
                    "payment_method": p.payment_method,
                    "amount": float(p.amount),
                    "currency": p.currency,
                    "status": p.status,
                    "created_at": p.created_at.isoformat(),
                }
                for p in payments
            ],
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting order payments: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Lỗi khi lấy danh sách thanh toán",
        )
