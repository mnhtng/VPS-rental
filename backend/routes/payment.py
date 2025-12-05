"""
Payment Routes
==============

API endpoints for payment processing with MoMo and VNPay.
"""

import uuid
import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlmodel import Session
from pydantic import BaseModel, Field

from backend.db import get_session
from backend.models import User, Order
from backend.utils import get_current_user
from backend.services.payment_service import PaymentService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/payments", tags=["Payments"])


# Request/Response Schemas
class CreateMoMoPaymentRequest(BaseModel):
    """Request to create MoMo payment"""

    order_id: uuid.UUID = Field(..., description="Order ID to pay for")
    return_url: Optional[str] = Field(
        None, description="Custom return URL after payment"
    )


class CreateVNPayPaymentRequest(BaseModel):
    """Request to create VNPay payment"""

    order_id: uuid.UUID = Field(..., description="Order ID to pay for")
    return_url: Optional[str] = Field(
        None, description="Custom return URL after payment"
    )
    bank_code: Optional[str] = Field(
        None, description="Bank code for direct bank selection"
    )


class PaymentResponse(BaseModel):
    """Payment creation response"""

    success: bool
    payment_url: Optional[str] = None
    qr_code_url: Optional[str] = None
    deeplink: Optional[str] = None
    transaction_id: Optional[str] = None
    payment_id: Optional[str] = None
    error: Optional[str] = None


class PaymentStatusResponse(BaseModel):
    """Payment status response"""

    payment_id: str
    transaction_id: Optional[str]
    payment_method: str
    amount: float
    currency: str
    status: str
    order_id: Optional[str]
    order_number: Optional[str]
    order_status: Optional[str]
    created_at: str
    updated_at: str


class CallbackResponse(BaseModel):
    """Callback response"""

    valid: bool
    success: Optional[bool] = None
    transaction_id: Optional[str] = None
    message: Optional[str] = None
    error: Optional[str] = None


# MoMo Endpoints
@router.post(
    "/momo/create",
    response_model=PaymentResponse,
    summary="Create MoMo payment",
    description="Create a new MoMo payment request for an order",
)
async def create_momo_payment(
    request: CreateMoMoPaymentRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> PaymentResponse:
    """
    Create MoMo payment for an order.

    Returns payment URL to redirect user to MoMo payment page.
    """
    try:
        # Get order
        order = session.get(Order, request.order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy đơn hàng",
            )

        # Check order ownership
        if order.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền thanh toán đơn hàng này",
            )

        # Check order status
        if order.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Đơn hàng không ở trạng thái chờ thanh toán",
            )

        # Create payment
        payment_service = PaymentService(session)
        result = payment_service.create_momo_payment(
            order=order,
            return_url=request.return_url,
        )

        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Không thể tạo thanh toán MoMo"),
            )

        return PaymentResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating MoMo payment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Lỗi khi tạo thanh toán MoMo",
        )


@router.post(
    "/momo/notify",
    summary="MoMo IPN callback",
    description="Receive payment notification from MoMo (IPN)",
)
async def momo_notify(
    request: Request,
    session: Session = Depends(get_session),
) -> Dict[str, Any]:
    """
    Handle MoMo Instant Payment Notification (IPN).

    This endpoint is called by MoMo server when payment status changes.
    """
    try:
        data = await request.json()
        logger.info(f"MoMo IPN received: {data}")

        payment_service = PaymentService(session)
        result = payment_service.verify_momo_callback(data)

        if result["valid"]:
            return {"resultCode": 0, "message": "Received"}
        else:
            return {
                "resultCode": 1,
                "message": result.get("error", "Verification failed"),
            }

    except Exception as e:
        logger.error(f"MoMo IPN error: {str(e)}")
        return {"resultCode": 1, "message": str(e)}


@router.get(
    "/momo/return",
    response_model=CallbackResponse,
    summary="MoMo return callback",
    description="Handle redirect from MoMo after payment",
)
async def momo_return(
    request: Request,
    session: Session = Depends(get_session),
) -> CallbackResponse:
    """
    Handle MoMo redirect after payment.

    User is redirected here after completing/canceling payment on MoMo.
    """
    try:
        # Get query parameters
        params = dict(request.query_params)
        logger.info(f"MoMo return params: {params}")

        # Convert to expected format
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
        )

    except Exception as e:
        logger.error(f"MoMo return error: {str(e)}")
        return CallbackResponse(valid=False, error=str(e))


# VNPay Endpoints
@router.post(
    "/vnpay/create",
    response_model=PaymentResponse,
    summary="Create VNPay payment",
    description="Create a new VNPay payment request for an order",
)
async def create_vnpay_payment(
    payment_request: CreateVNPayPaymentRequest,
    request: Request,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> PaymentResponse:
    """
    Create VNPay payment for an order.

    Returns payment URL to redirect user to VNPay payment page.
    """
    try:
        # Get order
        order = session.get(Order, payment_request.order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy đơn hàng",
            )

        # Check order ownership
        if order.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền thanh toán đơn hàng này",
            )

        # Check order status
        if order.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Đơn hàng không ở trạng thái chờ thanh toán",
            )

        # Get client IP
        client_ip = request.client.host if request.client else "127.0.0.1"
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()

        # Create payment
        payment_service = PaymentService(session)
        result = payment_service.create_vnpay_payment(
            order=order,
            client_ip=client_ip,
            return_url=payment_request.return_url,
            bank_code=payment_request.bank_code,
        )

        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Không thể tạo thanh toán VNPay"),
            )

        return PaymentResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating VNPay payment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Lỗi khi tạo thanh toán VNPay",
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
) -> CallbackResponse:
    """
    Handle VNPay redirect after payment.

    User is redirected here after completing/canceling payment on VNPay.
    """
    try:
        # Get query parameters
        params = dict(request.query_params)
        logger.info(f"VNPay return params: {params}")

        payment_service = PaymentService(session)
        result = payment_service.verify_vnpay_return(params)

        return CallbackResponse(
            valid=result.get("valid", False),
            success=result.get("success"),
            transaction_id=result.get("transaction_id"),
            message=result.get("message"),
            error=result.get("error"),
        )

    except Exception as e:
        logger.error(f"VNPay return error: {str(e)}")
        return CallbackResponse(valid=False, error=str(e))


@router.post(
    "/vnpay/ipn",
    summary="VNPay IPN callback",
    description="Receive payment notification from VNPay (IPN)",
)
async def vnpay_ipn(
    request: Request,
    session: Session = Depends(get_session),
) -> Dict[str, str]:
    """
    Handle VNPay Instant Payment Notification (IPN).

    This endpoint is called by VNPay server when payment status changes.
    """
    try:
        # Get query parameters
        params = dict(request.query_params)
        logger.info(f"VNPay IPN received: {params}")

        payment_service = PaymentService(session)
        result = payment_service.verify_vnpay_return(params)

        if result["valid"] and result.get("success"):
            return {"RspCode": "00", "Message": "Confirm Success"}
        else:
            return {
                "RspCode": "97",
                "Message": result.get("error", "Invalid signature"),
            }

    except Exception as e:
        logger.error(f"VNPay IPN error: {str(e)}")
        return {"RspCode": "99", "Message": str(e)}


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


# Bank codes for VNPay (for frontend reference)
@router.get(
    "/vnpay/banks",
    summary="Get VNPay bank list",
    description="Get list of supported banks for VNPay",
)
async def get_vnpay_banks() -> Dict[str, Any]:
    """
    Get list of supported banks for VNPay direct payment.
    """
    banks = [
        {"code": "NCB", "name": "Ngân hàng NCB"},
        {"code": "AGRIBANK", "name": "Ngân hàng Agribank"},
        {"code": "SCB", "name": "Ngân hàng SCB"},
        {"code": "SACOMBANK", "name": "Ngân hàng Sacombank"},
        {"code": "EXIMBANK", "name": "Ngân hàng Eximbank"},
        {"code": "MSBANK", "name": "Ngân hàng Maritime Bank"},
        {"code": "NAMABANK", "name": "Ngân hàng Nam Á"},
        {"code": "VNMART", "name": "Ví điện tử VnMart"},
        {"code": "VIETINBANK", "name": "Ngân hàng Vietinbank"},
        {"code": "VIETCOMBANK", "name": "Ngân hàng Vietcombank"},
        {"code": "HDBANK", "name": "Ngân hàng HDBank"},
        {"code": "DONGABANK", "name": "Ngân hàng Đông Á"},
        {"code": "TPBANK", "name": "Ngân hàng TPBank"},
        {"code": "OJB", "name": "Ngân hàng OceanBank"},
        {"code": "BIDV", "name": "Ngân hàng BIDV"},
        {"code": "TECHCOMBANK", "name": "Ngân hàng Techcombank"},
        {"code": "VPBANK", "name": "Ngân hàng VPBank"},
        {"code": "MBBANK", "name": "Ngân hàng MBBank"},
        {"code": "ACB", "name": "Ngân hàng ACB"},
        {"code": "OCB", "name": "Ngân hàng OCB"},
        {"code": "IVB", "name": "Ngân hàng IVB"},
        {"code": "VISA", "name": "Thanh toán qua VISA/Master"},
    ]

    return {
        "success": True,
        "banks": banks,
    }


# Demo/Test Endpoints (for development only)
class CreateDemoPaymentRequest(BaseModel):
    """Request for demo payment without real order"""

    order_number: str = Field(..., description="Order number for reference")
    amount: float = Field(..., description="Amount in VND")
    return_url: Optional[str] = Field(None, description="Return URL after payment")
    bank_code: Optional[str] = Field(None, description="Bank code for VNPay")


@router.post(
    "/demo/vnpay",
    response_model=PaymentResponse,
    summary="Create demo VNPay payment",
    description="Create a demo VNPay payment for testing (no real order required)",
)
async def create_demo_vnpay_payment(
    payment_request: CreateDemoPaymentRequest,
    request: Request,
) -> PaymentResponse:
    """
    Create demo VNPay payment for testing.

    This endpoint allows testing the VNPay integration without creating a real order.
    Should only be enabled in development/sandbox environment.
    """
    try:
        from backend.core import settings

        # Get client IP
        client_ip = request.client.host if request.client else "127.0.0.1"
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()

        # Create payment URL directly using VNPay sandbox
        import hashlib
        import hmac
        import urllib.parse
        from datetime import datetime

        # VNPay parameters
        vnp_params = {
            "vnp_Version": "2.1.0",
            "vnp_Command": "pay",
            "vnp_TmnCode": settings.VNPAY_TMN_CODE,
            "vnp_Amount": int(
                payment_request.amount * 100
            ),  # VNPay uses smallest currency unit
            "vnp_CurrCode": "VND",
            "vnp_TxnRef": payment_request.order_number,
            "vnp_OrderInfo": f"Thanh toan don hang {payment_request.order_number}",
            "vnp_OrderType": "other",
            "vnp_Locale": "vn",
            "vnp_ReturnUrl": payment_request.return_url or settings.VNPAY_RETURN_URL,
            "vnp_IpAddr": client_ip,
            "vnp_CreateDate": datetime.now().strftime("%Y%m%d%H%M%S"),
        }

        if payment_request.bank_code:
            vnp_params["vnp_BankCode"] = payment_request.bank_code

        # Sort parameters alphabetically by key
        sorted_params = sorted(vnp_params.items())

        # Build query string (same string used for hash and URL)
        query_string = ""
        seq = 0
        for key, val in sorted_params:
            if seq == 1:
                query_string += "&" + key + "=" + urllib.parse.quote_plus(str(val))
            else:
                seq = 1
                query_string = key + "=" + urllib.parse.quote_plus(str(val))

        # Create secure hash using HMAC-SHA512
        secure_hash = hmac.new(
            settings.VNPAY_HASH_SECRET.encode("utf-8"),
            query_string.encode("utf-8"),
            hashlib.sha512,
        ).hexdigest()

        # Build payment URL with SecureHash
        payment_url = (
            f"{settings.VNPAY_URL}?{query_string}&vnp_SecureHash={secure_hash}"
        )

        logger.info(f"VNPay query_string: {query_string}")
        logger.info(f"VNPay secure_hash: {secure_hash}")

        return PaymentResponse(
            success=True,
            payment_url=payment_url,
            transaction_id=payment_request.order_number,
            payment_id=payment_request.order_number,
        )

    except Exception as e:
        logger.error(f"Error creating demo VNPay payment: {str(e)}")
        return PaymentResponse(
            success=False,
            error=str(e),
        )


@router.post(
    "/demo/momo",
    response_model=PaymentResponse,
    summary="Create demo MoMo payment",
    description="Create a demo MoMo payment for testing (no real order required)",
)
async def create_demo_momo_payment(
    payment_request: CreateDemoPaymentRequest,
) -> PaymentResponse:
    """
    Create demo MoMo payment for testing.

    This endpoint allows testing the MoMo integration without creating a real order.
    Should only be enabled in development/sandbox environment.
    """
    try:
        import hashlib
        import hmac
        import json
        import httpx
        from backend.core import settings

        # MoMo parameters
        request_id = f"demo_{payment_request.order_number}"
        order_info = (
            f"Payment for order {payment_request.order_number}"  # Use ASCII only
        )
        redirect_url = payment_request.return_url or settings.MOMO_RETURN_URL
        ipn_url = settings.MOMO_NOTIFY_URL
        extra_data = ""
        # Use payWithMethod to allow user to choose payment method (wallet, ATM, CC)
        request_type = "payWithMethod"

        # Raw signature string - parameters MUST be in alphabetical order
        raw_signature = (
            f"accessKey={settings.MOMO_ACCESS_KEY}"
            f"&amount={int(payment_request.amount)}"
            f"&extraData={extra_data}"
            f"&ipnUrl={ipn_url}"
            f"&orderId={payment_request.order_number}"
            f"&orderInfo={order_info}"
            f"&partnerCode={settings.MOMO_PARTNER_CODE}"
            f"&redirectUrl={redirect_url}"
            f"&requestId={request_id}"
            f"&requestType={request_type}"
        )

        logger.info(f"MoMo raw signature string: {raw_signature}")

        signature = hmac.new(
            settings.MOMO_SECRET_KEY.encode("utf-8"),
            raw_signature.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

        logger.info(f"MoMo signature: {signature}")

        # Build request
        momo_request = {
            "partnerCode": settings.MOMO_PARTNER_CODE,
            "partnerName": "VPS Rental",
            "storeId": settings.MOMO_PARTNER_CODE,
            "requestId": request_id,
            "amount": int(payment_request.amount),
            "orderId": payment_request.order_number,
            "orderInfo": order_info,
            "redirectUrl": redirect_url,
            "ipnUrl": ipn_url,
            "lang": "vi",
            "requestType": request_type,
            "autoCapture": True,
            "extraData": extra_data,
            "signature": signature,
        }

        logger.info(f"MoMo Request: {momo_request}")

        # Send request to MoMo
        async with httpx.AsyncClient() as client:
            response = await client.post(
                settings.MOMO_ENDPOINT,
                json=momo_request,
                timeout=30.0,
            )
            data = response.json()

        logger.info(f"MoMo Response: {data}")

        if data.get("resultCode") == 0:
            return PaymentResponse(
                success=True,
                payment_url=data.get("payUrl"),
                qr_code_url=data.get("qrCodeUrl"),
                deeplink=data.get("deeplink"),
                transaction_id=data.get("orderId"),
                payment_id=payment_request.order_number,
            )
        else:
            return PaymentResponse(
                success=False,
                error=data.get("message", "MoMo payment creation failed"),
            )

    except Exception as e:
        logger.error(f"Error creating demo MoMo payment: {str(e)}")
        return PaymentResponse(
            success=False,
            error=str(e),
        )
