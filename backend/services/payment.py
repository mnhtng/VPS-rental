import qrcode
import io
import base64
import hashlib
import hmac
import json
import requests
import urllib.parse
from datetime import datetime
from typing import Dict, Any
from backend.core.settings import settings


class QRCodeService:
    @staticmethod
    def generate_qr_code(
        order_id: int, amount: float, bank_account: str, bank_name: str
    ) -> str:
        """Generate QR code for bank transfer payment"""
        # Vietnamese QR payment format
        payment_info = f"Order #{order_id} - Amount: {amount:,.0f} VND - Account: {bank_account} - {bank_name}"

        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(payment_info)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")

        # Convert to base64 string
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        img_str = base64.b64encode(buffer.getvalue()).decode()

        return f"data:image/png;base64,{img_str}"


class MoMoService:
    @staticmethod
    def create_payment(order_id: int, amount: float, order_info: str) -> Dict[str, Any]:
        """Create MoMo payment request"""
        partner_code = settings.MOMO_PARTNER_CODE
        access_key = settings.MOMO_ACCESS_KEY
        secret_key = settings.MOMO_SECRET_KEY

        request_id = f"MM_{order_id}_{int(datetime.now().timestamp())}"
        order_id_str = f"ORDER_{order_id}"

        # Request parameters
        raw_data = {
            "partnerCode": partner_code,
            "partnerName": "VPS Rental",
            "storeId": "VPSStore",
            "requestId": request_id,
            "amount": int(amount),
            "orderId": order_id_str,
            "orderInfo": order_info,
            "redirectUrl": settings.MOMO_RETURN_URL,
            "ipnUrl": settings.MOMO_NOTIFY_URL,
            "lang": "vi",
            "extraData": "",
            "requestType": "payWithATM",
            "signature": "",
        }

        # Create signature
        raw_signature = f"accessKey={access_key}&amount={raw_data['amount']}&extraData={raw_data['extraData']}&ipnUrl={raw_data['ipnUrl']}&orderId={raw_data['orderId']}&orderInfo={raw_data['orderInfo']}&partnerCode={raw_data['partnerCode']}&redirectUrl={raw_data['redirectUrl']}&requestId={raw_data['requestId']}&requestType={raw_data['requestType']}"

        signature = hmac.new(
            secret_key.encode("utf-8"), raw_signature.encode("utf-8"), hashlib.sha256
        ).hexdigest()

        raw_data["signature"] = signature

        try:
            response = requests.post(settings.MOMO_ENDPOINT, json=raw_data, timeout=30)
            result = response.json()

            if result.get("resultCode") == 0:
                return {
                    "success": True,
                    "payment_url": result.get("payUrl"),
                    "transaction_id": request_id,
                }
            else:
                return {
                    "success": False,
                    "error": result.get("message", "MoMo payment creation failed"),
                }
        except Exception as e:
            return {"success": False, "error": f"MoMo API error: {str(e)}"}


class VNPayService:
    @staticmethod
    def create_payment(order_id: int, amount: float, order_info: str) -> Dict[str, Any]:
        """Create VNPay payment request"""
        tmn_code = settings.VNPAY_TMN_CODE
        hash_secret = settings.VNPAY_HASH_SECRET

        # Convert amount to VND cents
        vnp_amount = int(amount * 100)

        # Create payment data
        vnp_data = {
            "vnp_Version": "2.1.0",
            "vnp_Command": "pay",
            "vnp_TmnCode": tmn_code,
            "vnp_Amount": vnp_amount,
            "vnp_CurrCode": "VND",
            "vnp_TxnRef": f"ORDER_{order_id}_{int(datetime.now().timestamp())}",
            "vnp_OrderInfo": order_info,
            "vnp_OrderType": "other",
            "vnp_Locale": "vn",
            "vnp_ReturnUrl": settings.VNPAY_RETURN_URL,
            "vnp_CreateDate": datetime.now().strftime("%Y%m%d%H%M%S"),
            "vnp_IpAddr": "127.0.0.1",
        }

        # Sort parameters
        sorted_params = sorted(vnp_data.items())

        # Create query string
        query_string = "&".join(
            [
                f"{key}={urllib.parse.quote_plus(str(value))}"
                for key, value in sorted_params
            ]
        )

        # Create signature
        signature = hmac.new(
            hash_secret.encode("utf-8"), query_string.encode("utf-8"), hashlib.sha512
        ).hexdigest()

        # Add signature to data
        vnp_data["vnp_SecureHash"] = signature

        # Create payment URL
        payment_url = f"{settings.VNPAY_URL}?{urllib.parse.urlencode(vnp_data)}"

        return {
            "success": True,
            "payment_url": payment_url,
            "transaction_id": vnp_data["vnp_TxnRef"],
        }

    @staticmethod
    def verify_payment(params: Dict[str, str]) -> Dict[str, Any]:
        """Verify VNPay payment response"""
        hash_secret = settings.VNPAY_HASH_SECRET

        # Get signature from params
        vnp_secure_hash = params.pop("vnp_SecureHash", "")

        # Sort parameters
        sorted_params = sorted(params.items())

        # Create query string
        query_string = "&".join(
            [
                f"{key}={urllib.parse.quote_plus(str(value))}"
                for key, value in sorted_params
            ]
        )

        # Create signature
        signature = hmac.new(
            hash_secret.encode("utf-8"), query_string.encode("utf-8"), hashlib.sha512
        ).hexdigest()

        # Verify signature
        if signature.upper() == vnp_secure_hash.upper():
            return {
                "valid": True,
                "transaction_status": params.get("vnp_ResponseCode") == "00",
                "transaction_id": params.get("vnp_TxnRef"),
                "amount": int(params.get("vnp_Amount", 0)) / 100,
            }
        else:
            return {"valid": False, "error": "Invalid signature"}
