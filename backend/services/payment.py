from fastapi import HTTPException, status
import uuid
import hashlib
import hmac
import urllib.parse
import requests
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
from decimal import Decimal
from sqlmodel import Session, select

from backend.core import settings
from backend.models import (
    Cart,
    Order,
    OrderItem,
    PaymentTransaction,
    VPSPlan,
    VMTemplate,
    UserPromotion,
    Promotion,
    User,
    VPSInstance,
)
from backend.utils import generate_order_number


logger = logging.getLogger(__name__)


class PaymentService:
    """Service for handling payment-related business logic"""

    def __init__(self, session: Session):
        self.session = session

    def initialize_order(
        self,
        order_number: str,
        amount: float,
        user_id: uuid.UUID,
        phone: str,
        address: str,
    ) -> Order:
        """
        Initialize an order. If the order already exists, return it.

        Args:
            order_number (str): Unique order number
            amount (float): Total amount for the order
            user_id (uuid.UUID): ID of the user placing the order
            phone (str): Billing phone number
            address (str): Billing address

        Raises:
            HTTPException: 404 if VPS plan or VM template not found.

        Returns:
            OrderResponse: The initialized or existing order
        """
        statement = select(Order).where(Order.order_number == order_number)
        order = self.session.exec(statement).first()

        if order:
            return order

        statement = select(Cart).where(Cart.user_id == user_id)
        cart_items = self.session.exec(statement).all()

        order = Order(
            user_id=user_id,
            order_number=order_number,
            price=Decimal(str(amount)),
            discount_code=(
                cart_items[0].discount_code
                if cart_items and cart_items[0].discount_code
                else None
            ),
            billing_phone=phone,
            billing_address=address,
            status="pending",
        )

        self.session.add(order)
        self.session.flush()

        order_items = []
        for item in cart_items:
            plan = self.session.get(VPSPlan, item.vps_plan_id)
            if not plan:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="VPS plan not found",
                )

            statement = select(VMTemplate).where(
                VMTemplate.os_type == item.template.os_type,
                VMTemplate.os_version == item.template.os_version,
                VMTemplate.cpu_cores == plan.vcpu,
                VMTemplate.ram_gb == plan.ram_gb,
                VMTemplate.storage_gb == plan.storage_gb,
            )
            template = self.session.exec(statement).first()

            if not template:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="VM template not found",
                )

            order_item = OrderItem(
                order_id=order.id,
                vps_plan_id=plan.id,
                template_id=template.id,
                hostname=item.hostname,
                os=item.os,
                duration_months=item.duration_months,
                unit_price=item.unit_price,
                total_price=item.total_price,
                configuration={
                    "plan_name": plan.name,
                    "vcpu": plan.vcpu,
                    "ram_gb": plan.ram_gb,
                    "storage_gb": plan.storage_gb,
                    "storage_type": plan.storage_type,
                    "bandwidth_mbps": plan.bandwidth_mbps,
                    "template_os": template.os_type + " " + template.os_version,
                },
            )
            order_items.append(order_item)

        self.session.add_all(order_items)
        self.session.commit()
        self.session.refresh(order)

        return order

    def create_momo_payment(
        self,
        order: Order,
        return_url: Optional[str] = None,
        notify_url: Optional[str] = None,
        repay: Optional[bool] = False,
    ) -> Dict[str, Any]:
        """
        Create MoMo payment request.

        Args:
            order: Order object to create payment for
            return_url: Optional custom return URL
            notify_url: Optional custom notify URL

        Returns:
            Dict with payment URL and transaction info
        """
        partner_code = settings.MOMO_PARTNER_CODE
        access_key = settings.MOMO_ACCESS_KEY
        secret_key = settings.MOMO_SECRET_KEY

        # Generate unique request and order IDs
        request_id = f"REQ-{order.id}-{int(datetime.now().timestamp())}"
        momo_order_id = f"{order.order_number}"

        # Amount must be integer in VND
        amount = int(order.price)

        # URLs
        redirect_url = return_url or settings.MOMO_RETURN_URL
        ipn_url = notify_url or settings.MOMO_NOTIFY_URL

        # Order info
        order_info = f"Pay for order #{order.order_number}"
        extra_data = ""  # Can encode additional data here
        request_type = "payWithMethod"

        # Build raw signature string (MoMo v2 API)
        raw_signature = (
            f"accessKey={access_key}"
            f"&amount={amount}"
            f"&extraData={extra_data}"
            f"&ipnUrl={ipn_url}"
            f"&orderId={momo_order_id}"
            f"&orderInfo={order_info}"
            f"&partnerCode={partner_code}"
            f"&redirectUrl={redirect_url}"
            f"&requestId={request_id}"
            f"&requestType={request_type}"
        )

        # Create HMAC SHA256 signature
        signature = hmac.new(
            secret_key.encode("utf-8"),
            raw_signature.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

        # Request payload
        payload = {
            "partnerCode": partner_code,
            "partnerName": "PCloud",
            "storeId": "pcloud_store",
            "requestId": request_id,
            "amount": amount,
            "orderId": momo_order_id,
            "orderInfo": order_info,
            "redirectUrl": redirect_url,
            "ipnUrl": ipn_url,
            "lang": "vi",
            "extraData": extra_data,
            "requestType": request_type,
            "signature": signature,
        }

        try:
            response = requests.post(
                settings.MOMO_ENDPOINT,
                json=payload,
                timeout=30,
                headers={"Content-Type": "application/json"},
            )

            result = response.json()

            if result.get("resultCode") == 0:
                if repay == True:
                    payment = self.session.exec(
                        select(PaymentTransaction).where(
                            PaymentTransaction.order_id == order.id,
                            PaymentTransaction.status == "pending",
                        )
                    ).first()

                    if payment:
                        # Update existing transaction with new payment method
                        payment.payment_method = "momo"
                        payment.gateway_response = {
                            "request_id": request_id,
                            "response": result,
                        }
                        self.session.add(payment)
                        self.session.commit()
                        self.session.refresh(payment)
                    else:
                        # Create new transaction if none exists
                        payment = PaymentTransaction(
                            order_id=order.id,
                            transaction_id=momo_order_id,
                            payment_method="momo",
                            amount=Decimal(str(amount)),
                            currency="VND",
                            status="pending",
                            gateway_response={
                                "request_id": request_id,
                                "response": result,
                            },
                        )
                        self.session.add(payment)
                        self.session.commit()
                        self.session.refresh(payment)
                else:
                    # Create payment transaction record
                    payment = PaymentTransaction(
                        order_id=order.id,
                        transaction_id=momo_order_id,
                        payment_method="momo",
                        amount=Decimal(str(amount)),
                        currency="VND",
                        status="pending",
                        gateway_response={"request_id": request_id, "response": result},
                    )
                    self.session.add(payment)
                    self.session.commit()
                    self.session.refresh(payment)

                return {
                    "success": True,
                    "payment_url": result.get("payUrl"),
                    "deeplink": result.get("deeplink"),
                    "transaction_id": momo_order_id,
                    "request_id": request_id,
                    "payment_id": str(payment.id),
                }
            else:
                error_msg = result.get("message", "MoMo payment creation failed")
                logger.error(f">>> MoMo error: {error_msg}")
                return {
                    "success": False,
                    "error": error_msg,
                    "result_code": result.get("resultCode"),
                }
        except requests.RequestException as e:
            self.session.rollback()
            logger.error(f">>> MoMo API request failed: {str(e)}")
            return {
                "success": False,
                "error": "Failed to connect to MoMo payment gateway",
            }
        except Exception as e:
            self.session.rollback()
            logger.error(f">>> MoMo payment error: {str(e)}")
            return {
                "success": False,
                "error": "Failed to create MoMo payment",
            }

    def verify_momo_callback(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Verify MoMo IPN/callback signature and process payment result.

        Args:
            data: Callback data from MoMo

        Returns:
            Dict with verification result
        """
        try:
            secret_key = settings.MOMO_SECRET_KEY
            access_key = settings.MOMO_ACCESS_KEY

            # Extract fields for signature verification
            received_signature = data.get("signature", "")

            # Build raw signature string for verification
            raw_signature = (
                f"accessKey={access_key}"
                f"&amount={data.get('amount')}"
                f"&extraData={data.get('extraData', '')}"
                f"&message={data.get('message', '')}"
                f"&orderId={data.get('orderId')}"
                f"&orderInfo={data.get('orderInfo', '')}"
                f"&orderType={data.get('orderType', '')}"
                f"&partnerCode={data.get('partnerCode')}"
                f"&payType={data.get('payType', '')}"
                f"&requestId={data.get('requestId')}"
                f"&responseTime={data.get('responseTime')}"
                f"&resultCode={data.get('resultCode')}"
                f"&transId={data.get('transId')}"
            )

            # Create signature
            expected_signature = hmac.new(
                secret_key.encode("utf-8"),
                raw_signature.encode("utf-8"),
                hashlib.sha256,
            ).hexdigest()

            # Verify signature
            if expected_signature.lower() != received_signature.lower():
                return {
                    "valid": False,
                    "error": "Invalid signature",
                }

            # Get transaction
            momo_order_id = data.get("orderId")
            result_code = data.get("resultCode")

            statement = select(PaymentTransaction).where(
                PaymentTransaction.transaction_id == momo_order_id
            )
            payment = self.session.exec(statement).first()

            if not payment:
                return {
                    "valid": False,
                    "error": "Payment transaction not found",
                }

            # Update payment status
            if result_code == 0:  # Success
                payment.status = "completed"
                payment.gateway_response = data

                # Update order status
                order = self.session.get(Order, payment.order_id)
                if order:
                    order.status = "paid"
                    self.session.add(order)

                # Update user promotion used for this order if applicable
                promotion_code = order.discount_code if order else None
                if promotion_code:
                    promotion = self.session.exec(
                        select(Promotion).where(
                            Promotion.code == promotion_code,
                        )
                    ).first()

                    if promotion:
                        user_promotion = UserPromotion(
                            user_id=order.user_id,
                            promotion_id=promotion.id,
                            order_id=order.id,
                            used_at=datetime.now(timezone.utc),
                        )
                        self.session.add(user_promotion)

                # Remove user's cart after successful payment
                cart_items = self.session.exec(
                    select(Cart).where(Cart.user_id == order.user_id)
                ).all()

                saved_cart_data = [
                    {
                        "vps_plan_id": item.vps_plan_id,
                        "hostname": item.hostname,
                        "os": item.os,
                        "duration_months": item.duration_months,
                        "unit_price": float(item.unit_price),
                        "total_price": float(item.total_price),
                    }
                    for item in cart_items
                ]

                for item in cart_items:
                    self.session.delete(item)
            else:  # Failed
                payment.status = "failed"
                payment.gateway_response = data
                saved_cart_data = []

                # Update order status to failed
                order = self.session.get(Order, payment.order_id)
                if order:
                    order.status = "cancelled"
                    self.session.add(order)

            self.session.add(payment)
            self.session.commit()
            self.session.refresh(order)
            self.session.refresh(payment)

            user = self.session.get(User, order.user_id)

            vps_plans = []
            for cart_item in saved_cart_data:
                vps_plan = self.session.get(VPSPlan, cart_item["vps_plan_id"])
                vps_plans.append(vps_plan)

            return {
                "valid": True,
                "success": result_code == 0,
                "transaction_id": momo_order_id,
                "momo_trans_id": data.get("transId"),
                "amount": data.get("amount"),
                "message": data.get("message"),
                "data": {
                    "user": user,
                    "plans": vps_plans,
                    "cart": saved_cart_data,
                    "order": order,
                    "payment": payment,
                },
            }
        except Exception as e:
            self.session.rollback()
            logger.error(f">>> MoMo callback verification error: {str(e)}")
            return {
                "valid": False,
                "error": "Payment transaction failed",
            }

    def create_vnpay_payment(
        self,
        order: Order,
        client_ip: str = "127.0.0.1",
        return_url: Optional[str] = None,
        repay: Optional[bool] = False,
    ) -> Dict[str, Any]:
        """
        Create VNPay payment request.

        Args:
            order (Order): Order object to create payment for
            client_ip (str, optional): Client IP address. Defaults to "127.0.0.1".
            return_url (Optional[str], optional): Custom return URL. Defaults to None.

        Returns:
            Dict[str, Any]: Dict with payment URL and transaction info
        """
        tmn_code = settings.VNPAY_TMN_CODE
        hash_secret = settings.VNPAY_HASH_SECRET

        # Generate transaction reference
        txn_ref = f"{order.order_number}"
        # Amount in smallest currency unit (VND * 100)
        amount = int(order.price) * 100
        # URLs
        vnp_return_url = return_url or settings.VNPAY_RETURN_URL
        # Order info
        order_info = f"Pay for order #{order.order_number}"

        # Build VNPay parameters
        vnp_params = {
            "vnp_Version": "2.1.0",
            "vnp_Command": "pay",
            "vnp_TmnCode": tmn_code,
            "vnp_Amount": amount,
            "vnp_CurrCode": "VND",
            "vnp_TxnRef": txn_ref,
            "vnp_OrderInfo": order_info,
            "vnp_OrderType": "other",
            "vnp_Locale": "vn",
            "vnp_ReturnUrl": vnp_return_url,
            "vnp_CreateDate": datetime.now().strftime("%Y%m%d%H%M%S"),
            "vnp_IpAddr": client_ip,
        }

        try:
            # Sort parameters alphabetically
            sorted_params = sorted(vnp_params.items())

            # Create query string for signature
            query_string = "&".join(
                [
                    f"{key}={urllib.parse.quote_plus(str(value))}"
                    for key, value in sorted_params
                ]
            )

            # Create HMAC SHA512 signature
            signature = hmac.new(
                hash_secret.encode("utf-8"),
                query_string.encode("utf-8"),
                hashlib.sha512,
            ).hexdigest()

            # Add signature to params
            vnp_params["vnp_SecureHash"] = signature

            # Build payment URL
            payment_url = f"{settings.VNPAY_URL}?{urllib.parse.urlencode(vnp_params)}"

            # Create or update payment transaction record
            if repay == True:
                payment = self.session.exec(
                    select(PaymentTransaction).where(
                        PaymentTransaction.order_id == order.id,
                        PaymentTransaction.status == "pending",
                    )
                ).first()

                if payment:
                    # Update existing transaction with new payment method
                    payment.payment_method = "vnpay"
                    payment.gateway_response = {"request_params": vnp_params}
                    self.session.add(payment)
                    self.session.commit()
                    self.session.refresh(payment)
                else:
                    # Create new transaction if none exists
                    payment = PaymentTransaction(
                        order_id=order.id,
                        transaction_id=txn_ref,
                        payment_method="vnpay",
                        amount=Decimal(str(order.price)),
                        currency="VND",
                        status="pending",
                        gateway_response={"request_params": vnp_params},
                    )
                    self.session.add(payment)
                    self.session.commit()
                    self.session.refresh(payment)
            else:
                payment = PaymentTransaction(
                    order_id=order.id,
                    transaction_id=txn_ref,
                    payment_method="vnpay",
                    amount=Decimal(str(order.price)),
                    currency="VND",
                    status="pending",
                    gateway_response={"request_params": vnp_params},
                )
                self.session.add(payment)
                self.session.commit()
                self.session.refresh(payment)

            return {
                "success": True,
                "payment_url": payment_url,
                "transaction_id": txn_ref,
                "payment_id": str(payment.id),
            }
        except Exception as e:
            self.session.rollback()
            logger.error(f">>> VNPay payment creation error: {str(e)}")
            return {
                "success": False,
                "error": "Failed to create VNPay payment",
            }

    def verify_vnpay_return(self, params: Dict[str, str]) -> Dict[str, Any]:
        """
        Verify VNPay return URL parameters.

        Args:
            params: Query parameters from VNPay return URL

        Returns:
            Dict with verification result
        """
        try:
            hash_secret = settings.VNPAY_HASH_SECRET

            # Get and remove signature from params
            vnp_secure_hash = params.pop("vnp_SecureHash", "")
            params.pop("vnp_SecureHashType", None)

            # Sort remaining parameters
            sorted_params = sorted(params.items())

            # Create query string for signature verification (same method as vnpay.py reference)
            query_string = "&".join(
                [
                    f"{key}={urllib.parse.quote_plus(str(value))}"
                    for key, value in sorted_params
                ]
            )

            # Create signature using HMAC-SHA512
            expected_signature = hmac.new(
                hash_secret.encode("utf-8"),
                query_string.encode("utf-8"),
                hashlib.sha512,
            ).hexdigest()

            # Verify signature
            if expected_signature.lower() != vnp_secure_hash.lower():
                return {
                    "valid": False,
                    "error": "Invalid signature",
                }

            # Get transaction info
            txn_ref = params.get("vnp_TxnRef")
            response_code = params.get("vnp_ResponseCode")
            transaction_no = params.get("vnp_TransactionNo")
            amount = int(params.get("vnp_Amount", 0)) / 100

            # Find payment transaction
            statement = select(PaymentTransaction).where(
                PaymentTransaction.transaction_id == txn_ref
            )
            payment = self.session.exec(statement).first()

            # Check if payment successful based on response code
            success = response_code == "00"

            if payment:
                # Update payment status if transaction exists
                if success:
                    payment.status = "completed"
                    payment.gateway_response = params

                    # Update order status
                    order = self.session.get(Order, payment.order_id)
                    if order:
                        order.status = "paid"
                        self.session.add(order)

                    # Update user promotion used for this order if applicable
                    promotion_code = order.discount_code if order else None
                    if promotion_code:
                        promotion = self.session.exec(
                            select(Promotion).where(
                                Promotion.code == promotion_code,
                            )
                        ).first()

                        if promotion:
                            user_promotion = UserPromotion(
                                user_id=order.user_id,
                                promotion_id=promotion.id,
                                order_id=order.id,
                                used_at=datetime.now(timezone.utc),
                            )
                            self.session.add(user_promotion)

                    # Remove user's cart after successful payment
                    cart_items = self.session.exec(
                        select(Cart).where(Cart.user_id == order.user_id)
                    ).all()

                    saved_cart_data = [
                        {
                            "vps_plan_id": item.vps_plan_id,
                            "hostname": item.hostname,
                            "os": item.os,
                            "duration_months": item.duration_months,
                            "unit_price": float(item.unit_price),
                            "total_price": float(item.total_price),
                        }
                        for item in cart_items
                    ]

                    for item in cart_items:
                        self.session.delete(item)
                else:
                    # Update payment as failed
                    payment.status = "failed"
                    payment.gateway_response = params
                    saved_cart_data = []

                    # Update order status to failed
                    order = self.session.get(Order, payment.order_id)
                    if order:
                        order.status = "cancelled"
                        self.session.add(order)

                self.session.add(payment)
                self.session.commit()
                self.session.refresh(order)
                self.session.refresh(payment)

                user = self.session.get(User, order.user_id)

                vps_plans = []
                for cart_item in saved_cart_data:
                    vps_plan = self.session.get(VPSPlan, cart_item["vps_plan_id"])
                    vps_plans.append(vps_plan)

            return {
                "valid": True,
                "success": success,
                "transaction_id": txn_ref,
                "vnpay_transaction_no": transaction_no,
                "amount": amount,
                "response_code": response_code,
                "message": self._get_vnpay_response_message(response_code),
                "data": {
                    "user": user,
                    "plans": vps_plans,
                    "cart": saved_cart_data,
                    "order": order,
                    "payment": payment,
                },
            }
        except Exception as e:
            self.session.rollback()
            logger.error(f">>> VNPay verification error: {str(e)}")
            return {
                "valid": False,
                "error": "Payment transaction failed",
            }

    # =========================================================================
    # Renewal Service Methods
    # =========================================================================

    def renewals_order(
        self,
        vps_instance_id: uuid.UUID,
        duration_months: int,
        amount: float,
        user_id: uuid.UUID,
        phone: str,
        address: str,
    ) -> Order:
        """
        Create renewal order (Order only, no new OrderItem).

        Args:
            vps_instance_id: ID of the VPS instance to renew
            duration_months: Number of months to extend
            amount: Total amount for renewal
            user_id: ID of the user
            phone: Billing phone number
            address: Billing address

        Raises:
            HTTPException: 404 if VPS instance not found
            HTTPException: 403 if VPS instance doesn't belong to user
            HTTPException: 400 if VPS instance is terminated or errored

        Returns:
            Order: The created renewal order
        """
        vps_instance = self.session.get(VPSInstance, vps_instance_id)
        if not vps_instance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="VPS instance not found",
            )

        if vps_instance.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="VPS instance does not belong to user",
            )

        if vps_instance.status in ["terminated", "error"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot renew terminated or errored VPS instance",
            )

        order_number = generate_order_number()

        order = Order(
            user_id=user_id,
            order_number=order_number,
            price=Decimal(str(amount)),
            billing_phone=phone,
            billing_address=address,
            status="pending",
            note=f"VPS Renewal - {duration_months} {duration_months == 1 and 'month' or 'months'}",
        )

        self.session.add(order)
        self.session.commit()
        self.session.refresh(order)

        return order

    def create_renewals_vnpay(
        self,
        order: Order,
        vps_instance_id: uuid.UUID,
        duration_months: int,
        client_ip: str = "127.0.0.1",
        return_url: Optional[str] = None,
        repay: Optional[bool] = False,
    ) -> Dict[str, Any]:
        """
        Create VNPay payment for renewal order.

        Args:
            order: Renewal order
            vps_instance_id: VPS instance ID for reference
            duration_months: Duration for renewal
            client_ip: Client IP address
            return_url: Custom return URL

        Returns:
            Dict with payment URL and transaction info
        """
        tmn_code = settings.VNPAY_TMN_CODE
        hash_secret = settings.VNPAY_HASH_SECRET

        txn_ref = f"{order.order_number}"
        amount = int(order.price) * 100
        vnp_return_url = return_url or settings.VNPAY_RETURN_URL
        order_info = f"VPS Renewal #{order.order_number}"

        vnp_params = {
            "vnp_Version": "2.1.0",
            "vnp_Command": "pay",
            "vnp_TmnCode": tmn_code,
            "vnp_Amount": amount,
            "vnp_CurrCode": "VND",
            "vnp_TxnRef": txn_ref,
            "vnp_OrderInfo": order_info,
            "vnp_OrderType": "other",
            "vnp_Locale": "vn",
            "vnp_ReturnUrl": vnp_return_url,
            "vnp_CreateDate": datetime.now().strftime("%Y%m%d%H%M%S"),
            "vnp_IpAddr": client_ip,
        }

        try:
            sorted_params = sorted(vnp_params.items())
            query_string = "&".join(
                [
                    f"{key}={urllib.parse.quote_plus(str(value))}"
                    for key, value in sorted_params
                ]
            )

            signature = hmac.new(
                hash_secret.encode("utf-8"),
                query_string.encode("utf-8"),
                hashlib.sha512,
            ).hexdigest()

            vnp_params["vnp_SecureHash"] = signature
            payment_url = f"{settings.VNPAY_URL}?{urllib.parse.urlencode(vnp_params)}"

            if repay == True:
                payment = self.session.exec(
                    select(PaymentTransaction).where(
                        PaymentTransaction.order_id == order.id,
                        PaymentTransaction.status == "pending",
                    )
                ).first()

                if payment:
                    # Update existing transaction with new payment method
                    payment.payment_method = "vnpay"
                    payment.gateway_response = {
                        "request_params": vnp_params,
                        "vps_instance_id": str(vps_instance_id),
                        "duration_months": duration_months,
                        "is_renewal": True,
                    }
                    self.session.add(payment)
                    self.session.commit()
                    self.session.refresh(payment)
            else:
                # Create payment transaction with renewal metadata
                payment = PaymentTransaction(
                    order_id=order.id,
                    transaction_id=txn_ref,
                    payment_method="vnpay",
                    amount=Decimal(str(order.price)),
                    currency="VND",
                    status="pending",
                    gateway_response={
                        "request_params": vnp_params,
                        "vps_instance_id": str(vps_instance_id),
                        "duration_months": duration_months,
                        "is_renewal": True,
                    },
                )
                self.session.add(payment)
                self.session.commit()
                self.session.refresh(payment)

            return {
                "success": True,
                "payment_url": payment_url,
                "transaction_id": txn_ref,
                "payment_id": str(payment.id),
            }
        except Exception as e:
            self.session.rollback()
            logger.error(f">>> VNPay renewal payment creation error: {str(e)}")
            return {
                "success": False,
                "error": "Failed to create VNPay renewal payment",
            }

    def create_renewals_momo(
        self,
        order: Order,
        vps_instance_id: uuid.UUID,
        duration_months: int,
        return_url: Optional[str] = None,
        notify_url: Optional[str] = None,
        repay: Optional[bool] = False,
    ) -> Dict[str, Any]:
        """
        Create MoMo payment for renewal order.

        Args:
            order: Renewal order
            vps_instance_id: VPS instance ID for reference
            duration_months: Duration for renewal
            return_url: Custom return URL
            notify_url: Custom notify URL

        Returns:
            Dict with payment URL and transaction info
        """
        partner_code = settings.MOMO_PARTNER_CODE
        access_key = settings.MOMO_ACCESS_KEY
        secret_key = settings.MOMO_SECRET_KEY

        request_id = f"REQ-{order.id}-{int(datetime.now().timestamp())}"
        momo_order_id = f"{order.order_number}"
        amount = int(order.price)

        redirect_url = return_url or settings.MOMO_RETURN_URL
        ipn_url = notify_url or settings.MOMO_NOTIFY_URL

        order_info = f"VPS Renewal #{order.order_number}"
        extra_data = ""
        request_type = "payWithMethod"

        raw_signature = (
            f"accessKey={access_key}"
            f"&amount={amount}"
            f"&extraData={extra_data}"
            f"&ipnUrl={ipn_url}"
            f"&orderId={momo_order_id}"
            f"&orderInfo={order_info}"
            f"&partnerCode={partner_code}"
            f"&redirectUrl={redirect_url}"
            f"&requestId={request_id}"
            f"&requestType={request_type}"
        )

        signature = hmac.new(
            secret_key.encode("utf-8"),
            raw_signature.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

        payload = {
            "partnerCode": partner_code,
            "partnerName": "PCloud",
            "storeId": "pcloud_store",
            "requestId": request_id,
            "amount": amount,
            "orderId": momo_order_id,
            "orderInfo": order_info,
            "redirectUrl": redirect_url,
            "ipnUrl": ipn_url,
            "lang": "vi",
            "extraData": extra_data,
            "requestType": request_type,
            "signature": signature,
        }

        try:
            response = requests.post(
                settings.MOMO_ENDPOINT,
                json=payload,
                timeout=30,
                headers={"Content-Type": "application/json"},
            )

            result = response.json()

            if result.get("resultCode") == 0:
                if repay == True:
                    payment = self.session.exec(
                        select(PaymentTransaction).where(
                            PaymentTransaction.order_id == order.id,
                            PaymentTransaction.status == "pending",
                        )
                    ).first()

                    if payment:
                        # Update existing transaction with new payment method
                        payment.payment_method = "momo"
                        payment.gateway_response = {
                            "request_id": request_id,
                            "response": result,
                            "vps_instance_id": str(vps_instance_id),
                            "duration_months": duration_months,
                            "is_renewal": True,
                        }
                        self.session.add(payment)
                        self.session.commit()
                        self.session.refresh(payment)
                    else:
                        # Create new transaction if none exists
                        payment = PaymentTransaction(
                            order_id=order.id,
                            transaction_id=momo_order_id,
                            payment_method="momo",
                            amount=Decimal(str(amount)),
                            currency="VND",
                            status="pending",
                            gateway_response={
                                "request_id": request_id,
                                "response": result,
                                "vps_instance_id": str(vps_instance_id),
                                "duration_months": duration_months,
                                "is_renewal": True,
                            },
                        )
                        self.session.add(payment)
                        self.session.commit()
                        self.session.refresh(payment)
                else:
                    payment = PaymentTransaction(
                        order_id=order.id,
                        transaction_id=momo_order_id,
                        payment_method="momo",
                        amount=Decimal(str(amount)),
                        currency="VND",
                        status="pending",
                        gateway_response={
                            "request_id": request_id,
                            "response": result,
                            "vps_instance_id": str(vps_instance_id),
                            "duration_months": duration_months,
                            "is_renewal": True,
                        },
                    )
                    self.session.add(payment)
                    self.session.commit()
                    self.session.refresh(payment)

                return {
                    "success": True,
                    "payment_url": result.get("payUrl"),
                    "deeplink": result.get("deeplink"),
                    "transaction_id": momo_order_id,
                    "request_id": request_id,
                    "payment_id": str(payment.id),
                }
            else:
                error_msg = result.get("message", "MoMo renewal payment creation failed")
                logger.error(f">>> MoMo renewal error: {error_msg}")
                return {
                    "success": False,
                    "error": error_msg,
                    "result_code": result.get("resultCode"),
                }
        except requests.RequestException as e:
            self.session.rollback()
            logger.error(f">>> MoMo renewal API request failed: {str(e)}")
            return {
                "success": False,
                "error": "Failed to connect to MoMo payment gateway",
            }
        except Exception as e:
            self.session.rollback()
            logger.error(f">>> MoMo renewal payment error: {str(e)}")
            return {
                "success": False,
                "error": "Failed to create MoMo renewal payment",
            }

    def complete_renewal(
        self,
        order: Order,
        vps_instance_id: uuid.UUID,
        duration_months: int,
    ) -> VPSInstance:
        """
        Complete renewal by updating order_item and vps_instance.

        Args:
            order: The renewal order
            vps_instance_id: VPS instance ID
            duration_months: Duration to extend

        Returns:
            Updated VPSInstance
        """
        vps_instance = self.session.get(VPSInstance, vps_instance_id)
        if not vps_instance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="VPS instance not found",
            )

        # Update duration months
        if vps_instance.order_item:
            vps_instance.order_item.duration_months += duration_months
            self.session.add(vps_instance.order_item)

        # Extend expire
        current_expires = vps_instance.expires_at
        if current_expires < datetime.now(timezone.utc):
            new_expires = datetime.now(timezone.utc) + timedelta(days=30 * duration_months)
        else:
            new_expires = current_expires + timedelta(days=30 * duration_months)

        vps_instance.expires_at = new_expires
        vps_instance.status = "active"

        self.session.add(vps_instance)
        self.session.commit()
        self.session.refresh(vps_instance)

        return vps_instance

    def verify_renewals_vnpay_callback(self, params: Dict[str, str]) -> Dict[str, Any]:
        """
        Verify VNPay renewal callback and complete renewal.

        Args:
            params: Query parameters from VNPay return URL

        Returns:
            Dict with verification result
        """
        try:
            hash_secret = settings.VNPAY_HASH_SECRET

            vnp_secure_hash = params.pop("vnp_SecureHash", "")
            params.pop("vnp_SecureHashType", None)

            sorted_params = sorted(params.items())
            query_string = "&".join(
                [
                    f"{key}={urllib.parse.quote_plus(str(value))}"
                    for key, value in sorted_params
                ]
            )

            expected_signature = hmac.new(
                hash_secret.encode("utf-8"),
                query_string.encode("utf-8"),
                hashlib.sha512,
            ).hexdigest()

            if expected_signature.lower() != vnp_secure_hash.lower():
                return {
                    "valid": False,
                    "error": "Invalid signature",
                }

            txn_ref = params.get("vnp_TxnRef")
            response_code = params.get("vnp_ResponseCode")
            transaction_no = params.get("vnp_TransactionNo")
            amount = int(params.get("vnp_Amount", 0)) / 100

            statement = select(PaymentTransaction).where(
                PaymentTransaction.transaction_id == txn_ref
            )
            payment = self.session.exec(statement).first()

            if not payment:
                return {
                    "valid": False,
                    "error": "Payment transaction not found",
                }

            success = response_code == "00"
            order = self.session.get(Order, payment.order_id)

            if success:
                payment.status = "completed"
                payment.gateway_response = {
                    **payment.gateway_response,
                    "vnpay_response": params,
                }

                if order:
                    order.status = "paid"
                    self.session.add(order)

                # Complete the renewal - extend VPS expiration
                gateway_response = payment.gateway_response
                vps_instance_id = gateway_response.get("vps_instance_id")
                duration_months = gateway_response.get("duration_months", 1)

                if vps_instance_id:
                    vps_instance = self.complete_renewal(
                        order,
                        uuid.UUID(vps_instance_id),
                        duration_months,
                    )
                else:
                    vps_instance = None
            else:
                payment.status = "failed"
                payment.gateway_response = {
                    **payment.gateway_response,
                    "vnpay_response": params,
                }
                vps_instance = None

                if order:
                    order.status = "cancelled"
                    self.session.add(order)

            self.session.add(payment)
            self.session.commit()
            if order:
                self.session.refresh(order)
            self.session.refresh(payment)

            return {
                "valid": True,
                "success": success,
                "transaction_id": txn_ref,
                "vnpay_transaction_no": transaction_no,
                "amount": amount,
                "response_code": response_code,
                "message": self._get_vnpay_response_message(response_code),
                "is_renewal": True,
                "vps_instance": vps_instance,
                "order": order,
            }
        except Exception as e:
            self.session.rollback()
            logger.error(f">>> VNPay renewal verification error: {str(e)}")
            return {
                "valid": False,
                "error": "Renewal payment verification failed",
            }

    def verify_renewals_momo_callback(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Verify MoMo renewal callback and complete renewal.

        Args:
            data: Callback data from MoMo

        Returns:
            Dict with verification result
        """
        try:
            secret_key = settings.MOMO_SECRET_KEY
            access_key = settings.MOMO_ACCESS_KEY

            received_signature = data.get("signature", "")

            raw_signature = (
                f"accessKey={access_key}"
                f"&amount={data.get('amount')}"
                f"&extraData={data.get('extraData', '')}"
                f"&message={data.get('message', '')}"
                f"&orderId={data.get('orderId')}"
                f"&orderInfo={data.get('orderInfo', '')}"
                f"&orderType={data.get('orderType', '')}"
                f"&partnerCode={data.get('partnerCode')}"
                f"&payType={data.get('payType', '')}"
                f"&requestId={data.get('requestId')}"
                f"&responseTime={data.get('responseTime')}"
                f"&resultCode={data.get('resultCode')}"
                f"&transId={data.get('transId')}"
            )

            expected_signature = hmac.new(
                secret_key.encode("utf-8"),
                raw_signature.encode("utf-8"),
                hashlib.sha256,
            ).hexdigest()

            if expected_signature.lower() != received_signature.lower():
                return {
                    "valid": False,
                    "error": "Invalid signature",
                }

            momo_order_id = data.get("orderId")
            result_code = data.get("resultCode")

            statement = select(PaymentTransaction).where(
                PaymentTransaction.transaction_id == momo_order_id
            )
            payment = self.session.exec(statement).first()

            if not payment:
                return {
                    "valid": False,
                    "error": "Payment transaction not found",
                }

            order = self.session.get(Order, payment.order_id)

            if result_code == 0: 
                payment.status = "completed"
                payment.gateway_response = {
                    **payment.gateway_response,
                    "momo_response": data,
                }

                if order:
                    order.status = "paid"
                    self.session.add(order)

                # Complete the renewal - extend VPS expiration
                gateway_response = payment.gateway_response
                vps_instance_id = gateway_response.get("vps_instance_id")
                duration_months = gateway_response.get("duration_months", 1)

                if vps_instance_id:
                    vps_instance = self.complete_renewal(
                        order,
                        uuid.UUID(vps_instance_id),
                        duration_months,
                    )
                else:
                    vps_instance = None
            else:  # Failed
                payment.status = "failed"
                payment.gateway_response = {
                    **payment.gateway_response,
                    "momo_response": data,
                }
                vps_instance = None

                if order:
                    order.status = "cancelled"
                    self.session.add(order)

            self.session.add(payment)
            self.session.commit()
            if order:
                self.session.refresh(order)
            self.session.refresh(payment)

            return {
                "valid": True,
                "success": result_code == 0,
                "transaction_id": momo_order_id,
                "momo_trans_id": data.get("transId"),
                "amount": data.get("amount"),
                "message": data.get("message"),
                "is_renewal": True,
                "vps_instance": vps_instance,
                "order": order,
            }
        except Exception as e:
            self.session.rollback()
            logger.error(f">>> MoMo renewal callback verification error: {str(e)}")
            return {
                "valid": False,
                "error": "Renewal payment verification failed",
            }

    # =========================================================================
    # Helper methods
    # =========================================================================
    def _get_vnpay_response_message(self, response_code: str) -> str:
        """Get human-readable message for VNPay response code."""
        messages = {
            "00": "Payment successful",
            "07": "Payment successful. Transaction suspected (related to fraud, unusual transaction)",
            "09": "Customer's card/account has not registered for InternetBanking service",
            "10": "Customer failed card/account information verification more than 3 times",
            "11": "Payment waiting time expired",
            "12": "Customer's card/account is locked",
            "13": "Incorrect OTP password",
            "24": "Customer cancelled the transaction",
            "51": "Insufficient account balance",
            "65": "Account has exceeded the daily transaction limit",
            "75": "Payment bank is under maintenance",
            "79": "Incorrect payment password entered too many times",
            "99": "Unknown error occurred",
        }
        return messages.get(response_code, "Unrecognized response code")
