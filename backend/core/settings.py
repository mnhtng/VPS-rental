import sys
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List

# Detect if running in development mode
# fastapi dev -> sys.argv contains 'dev'
# fastapi run -> sys.argv contains 'run'
IS_DEV_MODE = "dev" in sys.argv


class Settings(BaseSettings):
    DATABASE_URL: str
    API_PREFIX: str = "/api/v1"
    DEBUG: bool = False
    ALLOWED_ORIGINS: str = ""

    # JWT Configuration
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    REFRESH_TOKEN_NAME: str = "pcloud_refresh_token"

    PROXMOX_HOST: str
    PROXMOX_PORT: int = 8006
    PROXMOX_USER: str
    PROXMOX_PASSWORD: str

    # Email Configuration
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""

    # Payment Configuration
    VNPAY_TMN_CODE: str = ""
    VNPAY_HASH_SECRET: str = ""
    VNPAY_URL: str = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
    VNPAY_RETURN_URL: str = "http://localhost:3000/checkout/vnpay-return"

    MOMO_PARTNER_CODE: str = ""
    MOMO_ACCESS_KEY: str = ""
    MOMO_SECRET_KEY: str = ""
    MOMO_ENDPOINT: str = "https://test-payment.momo.vn/v2/gateway/api/create"
    MOMO_RETURN_URL: str = "http://localhost:3000/checkout/momo-return"
    MOMO_NOTIFY_URL: str = "http://localhost:8000/api/v1/payments/momo/notify"

    OPENROUTER_API_KEY: str

    @field_validator("ALLOWED_ORIGINS")
    def parse_allowed_origins(cls, v: str) -> List[str]:
        return v.split(",") if v else []

    class Config:
        env_file = (".env", ".env.development") if IS_DEV_MODE else (".env", ".env.production")
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()
