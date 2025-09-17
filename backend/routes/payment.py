from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlmodel import Session, select
from typing import Dict, Any
from datetime import datetime
from models.database import (
    Order, Payment, User, get_session, 
    PaymentStatus, PaymentMethod, OrderStatus
)
from schemas.api import (
    PaymentResponse, QRPaymentRequest, 
    MoMoPaymentRequest, VNPayPaymentRequest
)
from services.payment import QRCodeService, MoMoService, VNPayService
from core.auth import get_current_active_user

router = APIRouter(prefix="/api/payment", tags=["Payment"])

@router.post("/qr-code", response_model=PaymentResponse)
async def create_qr_payment(
    payment_request: QRPaymentRequest,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Create QR code payment"""
    # Get order
    order = session.get(Order, payment_request.order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check order ownership
    if order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to process payment for this order"
        )
    
    # Check order status
    if order.status != OrderStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is not available for payment"
        )
    
    # Generate QR code
    qr_code_data = QRCodeService.generate_qr_code(
        order_id=order.id,
        amount=order.total_amount,
        bank_account=payment_request.bank_account,
        bank_name=payment_request.bank_name
    )
    
    # Create payment record
    payment = Payment(
        order_id=order.id,
        payment_method=PaymentMethod.QR_CODE,
        amount=order.total_amount,
        qr_code_data=qr_code_data,
        transaction_id=f"QR_{order.id}_{int(datetime.now().timestamp())}"
    )
    
    session.add(payment)
    session.commit()
    session.refresh(payment)
    
    return payment

@router.post("/momo", response_model=PaymentResponse)
async def create_momo_payment(
    payment_request: MoMoPaymentRequest,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Create MoMo payment"""
    # Get order
    order = session.get(Order, payment_request.order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check order ownership
    if order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to process payment for this order"
        )
    
    # Check order status
    if order.status != OrderStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is not available for payment"
        )
    
    # Create MoMo payment
    order_info = f"VPS Rental - Order #{order.order_number}"
    momo_result = MoMoService.create_payment(
        order_id=order.id,
        amount=order.total_amount,
        order_info=order_info
    )
    
    if not momo_result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=momo_result["error"]
        )
    
    # Create payment record
    payment = Payment(
        order_id=order.id,
        payment_method=PaymentMethod.MOMO,
        amount=order.total_amount,
        payment_url=momo_result["payment_url"],
        transaction_id=momo_result["transaction_id"]
    )
    
    session.add(payment)
    session.commit()
    session.refresh(payment)
    
    return payment

@router.post("/vnpay", response_model=PaymentResponse)
async def create_vnpay_payment(
    payment_request: VNPayPaymentRequest,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Create VNPay payment"""
    # Get order
    order = session.get(Order, payment_request.order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check order ownership
    if order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to process payment for this order"
        )
    
    # Check order status
    if order.status != OrderStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is not available for payment"
        )
    
    # Create VNPay payment
    order_info = f"VPS Rental - Order #{order.order_number}"
    vnpay_result = VNPayService.create_payment(
        order_id=order.id,
        amount=order.total_amount,
        order_info=order_info
    )
    
    if not vnpay_result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create VNPay payment"
        )
    
    # Create payment record
    payment = Payment(
        order_id=order.id,
        payment_method=PaymentMethod.VNPAY,
        amount=order.total_amount,
        payment_url=vnpay_result["payment_url"],
        transaction_id=vnpay_result["transaction_id"]
    )
    
    session.add(payment)
    session.commit()
    session.refresh(payment)
    
    return payment

@router.post("/momo/notify")
async def momo_payment_notify(request: Request, session: Session = Depends(get_session)):
    """Handle MoMo payment notification"""
    try:
        data = await request.json()
        
        # Verify MoMo signature (simplified for demo)
        if data.get("resultCode") == 0:  # Success
            # Extract order ID from orderId
            order_id = data.get("orderId", "").replace("ORDER_", "")
            if order_id.isdigit():
                order_id = int(order_id)
                
                # Update payment status
                statement = select(Payment).where(
                    Payment.order_id == order_id,
                    Payment.payment_method == PaymentMethod.MOMO
                )
                payment = session.exec(statement).first()
                
                if payment:
                    payment.status = PaymentStatus.COMPLETED
                    payment.external_transaction_id = data.get("transId")
                    session.add(payment)
                    
                    # Update order status
                    order = session.get(Order, order_id)
                    if order:
                        order.status = OrderStatus.PROCESSING
                        session.add(order)
                    
                    session.commit()
        
        return {"message": "Notification processed"}
    except Exception as e:
        return {"error": str(e)}

@router.get("/vnpay/return")
async def vnpay_payment_return(request: Request, session: Session = Depends(get_session)):
    """Handle VNPay payment return"""
    try:
        # Get query parameters
        params = dict(request.query_params)
        
        # Verify payment
        verification_result = VNPayService.verify_payment(params)
        
        if verification_result["valid"] and verification_result["transaction_status"]:
            # Extract order ID from transaction ID
            txn_ref = verification_result["transaction_id"]
            if "ORDER_" in txn_ref:
                order_id_part = txn_ref.split("ORDER_")[1].split("_")[0]
                if order_id_part.isdigit():
                    order_id = int(order_id_part)
                    
                    # Update payment status
                    statement = select(Payment).where(
                        Payment.order_id == order_id,
                        Payment.payment_method == PaymentMethod.VNPAY
                    )
                    payment = session.exec(statement).first()
                    
                    if payment:
                        payment.status = PaymentStatus.COMPLETED
                        payment.external_transaction_id = params.get("vnp_TransactionNo")
                        session.add(payment)
                        
                        # Update order status
                        order = session.get(Order, order_id)
                        if order:
                            order.status = OrderStatus.PROCESSING
                            session.add(order)
                        
                        session.commit()
                        
                        return {"message": "Payment successful", "order_id": order_id}
        
        return {"message": "Payment failed"}
    except Exception as e:
        return {"error": str(e)}

@router.post("/confirm-qr/{payment_id}")
async def confirm_qr_payment(
    payment_id: int,
    admin_user: User = Depends(get_current_active_user),  # In production, this should be admin only
    session: Session = Depends(get_session)
):
    """Manually confirm QR code payment (Admin only)"""
    payment = session.get(Payment, payment_id)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    if payment.payment_method != PaymentMethod.QR_CODE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This endpoint is only for QR code payments"
        )
    
    # Update payment status
    payment.status = PaymentStatus.COMPLETED
    session.add(payment)
    
    # Update order status
    order = session.get(Order, payment.order_id)
    if order:
        order.status = OrderStatus.PROCESSING
        session.add(order)
    
    session.commit()
    
    return {"message": "QR payment confirmed successfully"}

@router.get("/order/{order_id}", response_model=list[PaymentResponse])
async def get_order_payments(
    order_id: int,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Get all payments for an order"""
    # Get order
    order = session.get(Order, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check order ownership or admin
    if order.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view payments for this order"
        )
    
    # Get payments
    statement = select(Payment).where(Payment.order_id == order_id)
    payments = session.exec(statement).all()
    
    return payments
