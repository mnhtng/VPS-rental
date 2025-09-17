from sqlmodel import SQLModel, Field, Relationship, Session, create_engine, select
from typing import Optional, List
from datetime import datetime
from enum import Enum
from core.settings import settings
import uuid

# Database connection
engine = create_engine(settings.DATABASE_URL, echo=True)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

# Enums
class UserRole(str, Enum):
    CUSTOMER = "customer"
    ADMIN = "admin"

class OrderStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    CANCELLED = "cancelled"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"

class PaymentMethod(str, Enum):
    QR_CODE = "qr_code"
    MOMO = "momo"
    VNPAY = "vnpay"

class StorageType(str, Enum):
    SSD = "SSD"
    NVME = "NVMe"

# User Model
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    full_name: str
    phone: Optional[str] = None
    role: UserRole = Field(default=UserRole.CUSTOMER)
    is_active: bool = Field(default=True)
    is_verified: bool = Field(default=False)
    verification_token: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    orders: List["Order"] = Relationship(back_populates="user")
    support_tickets: List["SupportTicket"] = Relationship(back_populates="user")

# VPS Plan Model
class VPSPlan(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    description: Optional[str] = None
    cpu_cores: int = Field(ge=1, le=16)
    ram_gb: int = Field(ge=1, le=64)
    storage_type: StorageType
    storage_gb: int = Field(ge=20, le=1000)
    bandwidth_gb: Optional[int] = None  # None for unlimited
    monthly_price: float = Field(ge=0)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    order_items: List["OrderItem"] = Relationship(back_populates="vps_plan")

# Order Model
class Order(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    order_number: str = Field(unique=True, index=True)
    status: OrderStatus = Field(default=OrderStatus.PENDING)
    total_amount: float = Field(ge=0)
    payment_method: Optional[PaymentMethod] = None
    billing_address: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    user: User = Relationship(back_populates="orders")
    order_items: List["OrderItem"] = Relationship(back_populates="order")
    payments: List["Payment"] = Relationship(back_populates="order")
    vps_instances: List["VPSInstance"] = Relationship(back_populates="order")

# Order Item Model
class OrderItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    order_id: int = Field(foreign_key="order.id")
    vps_plan_id: int = Field(foreign_key="vpsplan.id")
    quantity: int = Field(ge=1, default=1)
    unit_price: float = Field(ge=0)
    total_price: float = Field(ge=0)
    
    # Relationships
    order: Order = Relationship(back_populates="order_items")
    vps_plan: VPSPlan = Relationship(back_populates="order_items")

# Payment Model
class Payment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    order_id: int = Field(foreign_key="order.id")
    payment_method: PaymentMethod
    amount: float = Field(ge=0)
    status: PaymentStatus = Field(default=PaymentStatus.PENDING)
    transaction_id: Optional[str] = None
    external_transaction_id: Optional[str] = None
    qr_code_data: Optional[str] = None
    payment_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    order: Order = Relationship(back_populates="payments")

# VPS Instance Model (Active VPS servers)
class VPSInstance(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    order_id: int = Field(foreign_key="order.id")
    instance_id: str = Field(unique=True)  # Cloud provider instance ID
    name: str
    ip_address: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    ssh_key: Optional[str] = None
    status: str = Field(default="provisioning")  # provisioning, active, stopped, terminated
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    order: Order = Relationship(back_populates="vps_instances")

# Support Ticket Model
class SupportTicket(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    subject: str
    description: str
    status: str = Field(default="open")  # open, in_progress, resolved, closed
    priority: str = Field(default="medium")  # low, medium, high, urgent
    category: str = Field(default="general")  # general, technical, billing
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    user: User = Relationship(back_populates="support_tickets")
    messages: List["SupportMessage"] = Relationship(back_populates="ticket")

# Support Message Model
class SupportMessage(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    ticket_id: int = Field(foreign_key="supportticket.id")
    sender_id: int = Field(foreign_key="user.id")
    message: str
    is_staff_reply: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    ticket: SupportTicket = Relationship(back_populates="messages")

# FAQ Model
class FAQ(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    question: str
    answer: str
    category: str = Field(default="general")
    is_active: bool = Field(default=True)
    order_index: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
