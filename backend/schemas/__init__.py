"""
API Schemas Package
===================

Schema definitions for data validation and serialization.
Pydantic schemas for API request/response validation.
"""

from .auth import (
    AuthLogin,
    AuthLoginOAuth,
    AuthRegister,
    AuthToken,
    AuthResendVerification,
    AuthVerifyEmail,
    AuthForgotPassword,
    AuthResetPassword,
)

from .users import (
    UserBase,
    UserCreate,
    UserUpdate,
    UserChangePassword,
    UserPublic,
    UserResponse,
)

from .accounts import (
    AccountBase,
    AccountCreate,
    AccountUpdate,
    AccountPublic,
    AccountResponse,
)

from .sessions import (
    SessionBase,
    SessionCreate,
    SessionUpdate,
    SessionPublic,
    SessionResponse,
)

from .authenticators import (
    AuthenticatorBase,
    AuthenticatorCreate,
    AuthenticatorUpdate,
    AuthenticatorPublic,
    AuthenticatorResponse,
)

from .verification_tokens import (
    VerificationTokenBase,
    VerificationTokenCreate,
    VerificationTokenUpdate,
    VerificationTokenGenerate,
    VerificationTokenPublic,
    VerificationTokenResponse,
)

from .proxmox_clusters import (
    ProxmoxClusterBase,
    ProxmoxClusterCreate,
    ProxmoxClusterUpdate,
    ProxmoxClusterPublic,
    ProxmoxClusterResponse,
)

from .proxmox_nodes import (
    ProxmoxNodeBase,
    ProxmoxNodeCreate,
    ProxmoxNodeUpdate,
    ProxmoxNodePublic,
    ProxmoxNodeResponse,
    ProxmoxNodeResourceUsage,
)

from .proxmox_storages import (
    ProxmoxStorageBase,
    ProxmoxStorageCreate,
    ProxmoxStorageUpdate,
    ProxmoxStoragePublic,
    ProxmoxStorageResponse,
)

from .vm_templates import (
    VMTemplateBase,
    VMTemplateCreate,
    VMTemplateUpdate,
    VMTemplatePublic,
    VMTemplateResponse,
)

from .proxmox_vms import (
    ProxmoxVMBase,
    ProxmoxVMCreate,
    ProxmoxVMUpdate,
    ProxmoxVMPublic,
    ProxmoxVMResponse,
)

from .vps_plans import (
    VPSPlanBase,
    VPSPlanCreate,
    VPSPlanUpdate,
    VPSPlanPublic,
    VPSPlanResponse,
)

from .carts import (
    CartBase,
    CartCreate,
    CartUpdate,
    CartAdd,
    CartPublic,
    CartResponse,
)

from .orders import (
    OrderBase,
    OrderCreate,
    OrderUpdate,
    OrderPublic,
    OrderResponse,
)

from .order_items import (
    OrderItemBase,
    OrderItemCreate,
    OrderItemUpdate,
    OrderItemPublic,
    OrderItemResponse,
)

from .payment_transactions import (
    PaymentTransactionBase,
    PaymentTransactionCreate,
    PaymentTransactionUpdate,
    PaymentTransactionPublic,
    PaymentTransactionResponse,
)

from .vps_instances import (
    VPSInstanceBase,
    VPSInstanceCreate,
    VPSInstanceUpdate,
    VPSInstancePublic,
    VPSInstanceResponse,
)

from .vps_snapshots import (
    VPSSnapshotBase,
    VPSSnapshotCreate,
    VPSSnapshotUpdate,
    VPSSnapshotPublic,
    VPSSnapshotResponse,
)

from .promotions import (
    PromotionBase,
    PromotionCreate,
    PromotionUpdate,
    PromotionPublic,
    PromotionResponse,
)

from .user_promotions import (
    UserPromotionBase,
    UserPromotionCreate,
    UserPromotionUpdate,
    UserPromotionPublic,
    UserPromotionResponse,
)

from .support_tickets import (
    SupportTicketBase,
    SupportTicketCreate,
    SupportTicketUpdate,
    SupportTicketPublic,
    SupportTicketResponse,
)

from .support_ticket_replies import (
    SupportTicketReplyBase,
    SupportTicketReplyCreate,
    SupportTicketReplyUpdate,
    SupportTicketReplyPublic,
    SupportTicketReplyResponse,
)

from .conversations import (
    ConversationBase,
    ConversationCreate,
    ConversationUpdate,
    ConversationPublic,
    ConversationResponse,
)

from .knowledge_bases import (
    KnowledgeBase,
    KnowledgeBaseCreate,
    KnowledgeBaseUpdate,
    KnowledgeBasePublic,
    KnowledgeBaseResponse,
)

__all__ = [
    # Auth schemas
    "AuthLogin",
    "AuthLoginOAuth",
    "AuthRegister",
    "AuthToken",
    "AuthResendVerification",
    "AuthVerifyEmail",
    "AuthForgotPassword",
    "AuthResetPassword",
    # User schemas
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserChangePassword",
    "UserPublic",
    "UserResponse",
    # Account schemas
    "AccountBase",
    "AccountCreate",
    "AccountUpdate",
    "AccountPublic",
    "AccountResponse",
    # Session schemas
    "SessionBase",
    "SessionCreate",
    "SessionUpdate",
    "SessionPublic",
    "SessionResponse",
    # Authenticator schemas
    "AuthenticatorBase",
    "AuthenticatorCreate",
    "AuthenticatorUpdate",
    "AuthenticatorPublic",
    "AuthenticatorResponse",
    # Verification Token schemas
    "VerificationTokenBase",
    "VerificationTokenCreate",
    "VerificationTokenUpdate",
    "VerificationTokenGenerate",
    "VerificationTokenPublic",
    "VerificationTokenResponse",
    # Proxmox Cluster schemas
    "ProxmoxClusterBase",
    "ProxmoxClusterCreate",
    "ProxmoxClusterUpdate",
    "ProxmoxClusterPublic",
    "ProxmoxClusterResponse",
    # Proxmox Node schemas
    "ProxmoxNodeBase",
    "ProxmoxNodeCreate",
    "ProxmoxNodeUpdate",
    "ProxmoxNodePublic",
    "ProxmoxNodeResponse",
    "ProxmoxNodeResourceUsage",
    # Proxmox Storage schemas
    "ProxmoxStorageBase",
    "ProxmoxStorageCreate",
    "ProxmoxStorageUpdate",
    "ProxmoxStoragePublic",
    "ProxmoxStorageResponse",
    # VM Template schemas
    "VMTemplateBase",
    "VMTemplateCreate",
    "VMTemplateUpdate",
    "VMTemplatePublic",
    "VMTemplateResponse",
    # Proxmox VM schemas
    "ProxmoxVMBase",
    "ProxmoxVMCreate",
    "ProxmoxVMUpdate",
    "ProxmoxVMPublic",
    "ProxmoxVMResponse",
    # VPS Plan schemas
    "VPSPlanBase",
    "VPSPlanCreate",
    "VPSPlanUpdate",
    "VPSPlanPublic",
    "VPSPlanResponse",
    # Cart schemas
    "CartBase",
    "CartCreate",
    "CartUpdate",
    "CartAdd",
    "CartPublic",
    "CartResponse",
    # Order schemas
    "OrderBase",
    "OrderCreate",
    "OrderUpdate",
    "OrderPublic",
    "OrderResponse",
    # Order Item schemas
    "OrderItemBase",
    "OrderItemCreate",
    "OrderItemUpdate",
    "OrderItemPublic",
    "OrderItemResponse",
    # Payment Transaction schemas
    "PaymentTransactionBase",
    "PaymentTransactionCreate",
    "PaymentTransactionUpdate",
    "PaymentTransactionPublic",
    "PaymentTransactionResponse",
    # VPS Instance schemas
    "VPSInstanceBase",
    "VPSInstanceCreate",
    "VPSInstanceUpdate",
    "VPSInstancePublic",
    "VPSInstanceResponse",
    # VPS Snapshot schemas
    "VPSSnapshotBase",
    "VPSSnapshotCreate",
    "VPSSnapshotUpdate",
    "VPSSnapshotPublic",
    "VPSSnapshotResponse",
    # Promotion schemas
    "PromotionBase",
    "PromotionCreate",
    "PromotionUpdate",
    "PromotionPublic",
    "PromotionResponse",
    # User Promotion schemas
    "UserPromotionBase",
    "UserPromotionCreate",
    "UserPromotionUpdate",
    "UserPromotionPublic",
    "UserPromotionResponse",
    # Support Ticket schemas
    "SupportTicketBase",
    "SupportTicketCreate",
    "SupportTicketUpdate",
    "SupportTicketPublic",
    "SupportTicketResponse",
    # Support Ticket Reply schemas
    "SupportTicketReplyBase",
    "SupportTicketReplyCreate",
    "SupportTicketReplyUpdate",
    "SupportTicketReplyPublic",
    "SupportTicketReplyResponse",
    # Conversation schemas
    "ConversationBase",
    "ConversationCreate",
    "ConversationUpdate",
    "ConversationPublic",
    "ConversationResponse",
    # Knowledge Base schemas
    "KnowledgeBase",
    "KnowledgeBaseCreate",
    "KnowledgeBaseUpdate",
    "KnowledgeBasePublic",
    "KnowledgeBaseResponse",
]

# Rebuild models to ensure all validators are applied after resolving potential circular imports
UserResponse.model_rebuild()
AccountResponse.model_rebuild()
SessionResponse.model_rebuild()
AuthenticatorResponse.model_rebuild()
VerificationTokenResponse.model_rebuild()
ProxmoxClusterResponse.model_rebuild()
ProxmoxNodeResponse.model_rebuild()
ProxmoxStorageResponse.model_rebuild()
VMTemplateResponse.model_rebuild()
ProxmoxVMResponse.model_rebuild()
VPSPlanResponse.model_rebuild()
CartResponse.model_rebuild()
OrderResponse.model_rebuild()
OrderItemResponse.model_rebuild()
PaymentTransactionResponse.model_rebuild()
VPSInstanceResponse.model_rebuild()
VPSSnapshotResponse.model_rebuild()
PromotionResponse.model_rebuild()
UserPromotionResponse.model_rebuild()
SupportTicketResponse.model_rebuild()
SupportTicketReplyResponse.model_rebuild()
ConversationResponse.model_rebuild()
KnowledgeBaseResponse.model_rebuild()
