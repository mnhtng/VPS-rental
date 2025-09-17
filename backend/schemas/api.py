from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from models.database import UserRole, OrderStatus, PaymentStatus, PaymentMethod, StorageType

# Auth Schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=2)
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str]
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: datetime

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

# VPS Plan Schemas
class VPSPlanCreate(BaseModel):
    name: str
    description: Optional[str] = None
    cpu_cores: int = Field(ge=1, le=16)
    ram_gb: int = Field(ge=1, le=64)
    storage_type: StorageType
    storage_gb: int = Field(ge=20, le=1000)
    bandwidth_gb: Optional[int] = None
    monthly_price: float = Field(ge=0)

class VPSPlanUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    cpu_cores: Optional[int] = Field(None, ge=1, le=16)
    ram_gb: Optional[int] = Field(None, ge=1, le=64)
    storage_type: Optional[StorageType] = None
    storage_gb: Optional[int] = Field(None, ge=20, le=1000)
    bandwidth_gb: Optional[int] = None
    monthly_price: Optional[float] = Field(None, ge=0)
    is_active: Optional[bool] = None

class VPSPlanResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    cpu_cores: int
    ram_gb: int
    storage_type: StorageType
    storage_gb: int
    bandwidth_gb: Optional[int]
    monthly_price: float
    is_active: bool
    created_at: datetime

# Cart and Order Schemas
class CartItem(BaseModel):
    vps_plan_id: int
    quantity: int = Field(ge=1, default=1)

class CartSummary(BaseModel):
    items: List[CartItem]
    total_amount: float

class OrderCreate(BaseModel):
    items: List[CartItem]
    payment_method: PaymentMethod
    billing_address: Optional[str] = None
    notes: Optional[str] = None

class OrderItemResponse(BaseModel):
    id: int
    vps_plan_id: int
    vps_plan: VPSPlanResponse
    quantity: int
    unit_price: float
    total_price: float

class OrderResponse(BaseModel):
    id: int
    order_number: str
    status: OrderStatus
    total_amount: float
    payment_method: Optional[PaymentMethod]
    billing_address: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    order_items: List[OrderItemResponse]

class OrderStatusUpdate(BaseModel):
    status: OrderStatus

# Payment Schemas
class PaymentResponse(BaseModel):
    id: int
    payment_method: PaymentMethod
    amount: float
    status: PaymentStatus
    transaction_id: Optional[str]
    qr_code_data: Optional[str]
    payment_url: Optional[str]
    created_at: datetime

class QRPaymentRequest(BaseModel):
    order_id: int
    bank_account: str = "1234567890"
    bank_name: str = "Vietcombank"

class MoMoPaymentRequest(BaseModel):
    order_id: int

class VNPayPaymentRequest(BaseModel):
    order_id: int

# Support Schemas
class SupportTicketCreate(BaseModel):
    subject: str = Field(min_length=5)
    description: str = Field(min_length=10)
    category: str = Field(default="general")
    priority: str = Field(default="medium")

class SupportMessageCreate(BaseModel):
    message: str = Field(min_length=1)

class SupportMessageResponse(BaseModel):
    id: int
    message: str
    is_staff_reply: bool
    created_at: datetime

class SupportTicketResponse(BaseModel):
    id: int
    subject: str
    description: str
    status: str
    priority: str
    category: str
    created_at: datetime
    updated_at: datetime
    messages: List[SupportMessageResponse] = []

# FAQ Schemas
class FAQResponse(BaseModel):
    id: int
    question: str
    answer: str
    category: str

class FAQCreate(BaseModel):
    question: str
    answer: str
    category: str = Field(default="general")
    order_index: int = Field(default=0)

# Admin Schemas
class UserListResponse(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str]
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: datetime

class SalesReport(BaseModel):
    total_orders: int
    total_revenue: float
    active_vps: int
    new_users: int
    period: str

class DashboardStats(BaseModel):
    total_users: int
    active_orders: int
    total_revenue: float
    pending_tickets: int
    monthly_growth: float
