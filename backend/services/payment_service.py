"""
Payment Service
===============

Business logic for MoMo and VNPay payment gateway integration.
Supports sandbox/development environment.
"""

import uuid
import hashlib
import hmac
import urllib.parse
import requests
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from decimal import Decimal
from sqlmodel import Session, select

from backend.core.settings import settings
from backend.models import Order, PaymentTransaction, User

logger = logging.getLogger(__name__)


class PaymentService:
    """Service for handling payment-related business logic"""

    def __init__(self, session: Session):
        self.session = session

    def create_momo_payment(
        self,
        order: Order,
        return_url: Optional[str] = None,
        notify_url: Optional[str] = None,
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
        request_id = f"REQ_{order.id}_{int(datetime.now().timestamp())}"
        momo_order_id = f"VPS_{order.order_number}_{int(datetime.now().timestamp())}"

        # Amount must be integer in VND
        amount = int(order.price)

        # URLs
        redirect_url = return_url or settings.MOMO_RETURN_URL
        ipn_url = notify_url or settings.MOMO_NOTIFY_URL

        # Order info
        order_info = f"Thanh toán đơn hàng #{order.order_number}"
        extra_data = ""  # Can encode additional data here

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
            f"&requestType=payWithMethod"
        )

        # Create HMAC SHA256 signature
        signature = hmac.new(
            secret_key.encode("utf-8"), raw_signature.encode("utf-8"), hashlib.sha256
        ).hexdigest()

        # Request payload
        payload = {
            "partnerCode": partner_code,
            "partnerName": "VPS Rental",
            "storeId": "VPSRentalStore",
            "requestId": request_id,
            "amount": amount,
            "orderId": momo_order_id,
            "orderInfo": order_info,
            "redirectUrl": redirect_url,
            "ipnUrl": ipn_url,
            "lang": "vi",
            "extraData": extra_data,
            "requestType": "payWithMethod",
            "signature": signature,
        }

        try:
            logger.info(f"Creating MoMo payment for order {order.order_number}")

            response = requests.post(
                settings.MOMO_ENDPOINT,
                json=payload,
                timeout=30,
                headers={"Content-Type": "application/json"},
            )
            result = response.json()

            logger.info(f"MoMo API response: {result}")

            if result.get("resultCode") == 0:
                # Create payment transaction record
                payment = PaymentTransaction(
                    order_id=order.id,
                    transaction_id=momo_order_id,
                    payment_method="momo",
                    amount=Decimal(str(amount)),
                    currency="VND",
                    status="pending",
                    gateway_response=result,
                )
                self.session.add(payment)
                self.session.commit()
                self.session.refresh(payment)

                return {
                    "success": True,
                    "payment_url": result.get("payUrl"),
                    "qr_code_url": result.get("qrCodeUrl"),
                    "deeplink": result.get("deeplink"),
                    "transaction_id": momo_order_id,
                    "request_id": request_id,
                    "payment_id": str(payment.id),
                }
            else:
                error_msg = result.get("message", "MoMo payment creation failed")
                logger.error(f"MoMo error: {error_msg}")
                return {
                    "success": False,
                    "error": error_msg,
                    "result_code": result.get("resultCode"),
                }

        except requests.RequestException as e:
            logger.error(f"MoMo API request failed: {str(e)}")
            return {
                "success": False,
                "error": f"Không thể kết nối đến MoMo: {str(e)}",
            }
        except Exception as e:
            logger.error(f"MoMo payment error: {str(e)}")
            return {
                "success": False,
                "error": f"Lỗi tạo thanh toán MoMo: {str(e)}",
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
                logger.warning("MoMo signature verification failed")
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
                    order.updated_at = datetime.now(timezone.utc)
                    self.session.add(order)

            else:  # Failed
                payment.status = "failed"
                payment.gateway_response = data

            payment.updated_at = datetime.now(timezone.utc)
            self.session.add(payment)
            self.session.commit()

            return {
                "valid": True,
                "success": result_code == 0,
                "transaction_id": momo_order_id,
                "momo_trans_id": data.get("transId"),
                "amount": data.get("amount"),
                "message": data.get("message"),
            }

        except Exception as e:
            logger.error(f"MoMo callback verification error: {str(e)}")
            return {
                "valid": False,
                "error": str(e),
            }

    def create_vnpay_payment(
        self,
        order: Order,
        client_ip: str = "127.0.0.1",
        return_url: Optional[str] = None,
        bank_code: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create VNPay payment request.

        Args:
            order: Order object to create payment for
            client_ip: Client IP address
            return_url: Optional custom return URL
            bank_code: Optional bank code for direct bank selection

        Returns:
            Dict with payment URL and transaction info
        """
        tmn_code = settings.VNPAY_TMN_CODE
        hash_secret = settings.VNPAY_HASH_SECRET

        # Generate transaction reference
        txn_ref = f"VPS{order.order_number}{int(datetime.now().timestamp())}"

        # Amount in VND * 100 (VNPay requires this format)
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

        # Add bank code if specified
        if bank_code:
            vnp_params["vnp_BankCode"] = bank_code

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

            # Create payment transaction record
            payment = PaymentTransaction(
                order_id=order.id,
                transaction_id=txn_ref,
                payment_method="vnpay",
                amount=Decimal(str(int(order.price))),
                currency="VND",
                status="pending",
                gateway_response={"request_params": vnp_params},
            )
            self.session.add(payment)
            self.session.commit()
            self.session.refresh(payment)

            logger.info(f"Created VNPay payment for order {order.order_number}")

            return {
                "success": True,
                "payment_url": payment_url,
                "transaction_id": txn_ref,
                "payment_id": str(payment.id),
            }

        except Exception as e:
            logger.error(f"VNPay payment creation error: {str(e)}")
            return {
                "success": False,
                "error": f"Lỗi tạo thanh toán VNPay: {str(e)}",
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
            query_string = ""
            seq = 0
            for key, val in sorted_params:
                if seq == 1:
                    query_string += "&" + key + "=" + urllib.parse.quote_plus(str(val))
                else:
                    seq = 1
                    query_string = key + "=" + urllib.parse.quote_plus(str(val))

            # Create signature using HMAC-SHA512
            expected_signature = hmac.new(
                hash_secret.encode("utf-8"),
                query_string.encode("utf-8"),
                hashlib.sha512,
            ).hexdigest()

            logger.info(f"VNPay verify - query_string: {query_string}")
            logger.info(f"VNPay verify - expected: {expected_signature}")
            logger.info(f"VNPay verify - received: {vnp_secure_hash}")

            # Verify signature
            if expected_signature.lower() != vnp_secure_hash.lower():
                logger.warning("VNPay signature verification failed")
                return {
                    "valid": False,
                    "error": "Invalid signature",
                }

            # Get transaction info
            txn_ref = params.get("vnp_TxnRef")
            response_code = params.get("vnp_ResponseCode")
            transaction_no = params.get("vnp_TransactionNo")
            amount = int(params.get("vnp_Amount", 0)) / 100

            # Find payment transaction (optional for demo mode)
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
                        order.updated_at = datetime.now(timezone.utc)
                        self.session.add(order)
                else:
                    payment.status = "failed"
                    payment.gateway_response = params

                payment.updated_at = datetime.now(timezone.utc)
                self.session.add(payment)
                self.session.commit()

            # Return result (works for both real payments and demo mode)
            return {
                "valid": True,
                "success": success,
                "transaction_id": txn_ref,
                "vnpay_transaction_no": transaction_no,
                "amount": amount,
                "response_code": response_code,
                "message": self._get_vnpay_response_message(response_code),
                "is_demo": payment is None,  # Flag to indicate demo mode
            }

        except Exception as e:
            logger.error(f"VNPay verification error: {str(e)}")
            return {
                "valid": False,
                "error": str(e),
            }

    def get_payment_status(self, payment_id: uuid.UUID) -> Optional[Dict[str, Any]]:
        """
        Get payment transaction status.

        Args:
            payment_id: Payment transaction ID

        Returns:
            Payment status info or None
        """
        payment = self.session.get(PaymentTransaction, payment_id)
        if not payment:
            return None

        order = self.session.get(Order, payment.order_id)

        return {
            "payment_id": str(payment.id),
            "transaction_id": payment.transaction_id,
            "payment_method": payment.payment_method,
            "amount": float(payment.amount),
            "currency": payment.currency,
            "status": payment.status,
            "order_id": str(payment.order_id) if payment.order_id else None,
            "order_number": order.order_number if order else None,
            "order_status": order.status if order else None,
            "created_at": payment.created_at.isoformat(),
            "updated_at": payment.updated_at.isoformat(),
        }

    def get_order_payments(self, order_id: uuid.UUID) -> list:
        """
        Get all payment transactions for an order.

        Args:
            order_id: Order ID

        Returns:
            List of payment transactions
        """
        statement = select(PaymentTransaction).where(
            PaymentTransaction.order_id == order_id
        )
        return list(self.session.exec(statement).all())

    def _get_vnpay_response_message(self, response_code: str) -> str:
        """Get human-readable message for VNPay response code."""
        messages = {
            "00": "Giao dịch thành công",
            "07": "Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)",
            "09": "Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking",
            "10": "Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần",
            "11": "Đã hết hạn chờ thanh toán",
            "12": "Thẻ/Tài khoản của khách hàng bị khóa",
            "13": "Sai mật khẩu OTP",
            "24": "Khách hàng hủy giao dịch",
            "51": "Tài khoản không đủ số dư",
            "65": "Tài khoản đã vượt quá hạn mức giao dịch trong ngày",
            "75": "Ngân hàng thanh toán đang bảo trì",
            "79": "Nhập sai mật khẩu thanh toán quá số lần quy định",
            "99": "Lỗi không xác định",
        }
        return messages.get(response_code, f"Mã lỗi: {response_code}")
