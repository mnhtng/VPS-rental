"""
Models Package
==============

This package contains all the database models used in the backend application.
Each model represents a table in the database and is defined using SQLModel.
"""

import logging
from typing import Type, Union

# User Management Models
from .users import User
from .accounts import Account
from .sessions import Session
from .authenticators import Authenticator
from .verification_tokens import VerificationToken

# VPS Management Models
from .vps_plans import VPSPlan
from .vps_instances import VPSInstance
from .vps_snapshots import VPSSnapshot

# E-commerce Models
from .carts import Cart
from .orders import Order
from .order_items import OrderItem
from .payment_transactions import PaymentTransaction
from .promotions import Promotion
from .user_promotions import UserPromotion

# Infrastructure Models (Proxmox)
from .proxmox_clusters import ProxmoxCluster
from .proxmox_nodes import ProxmoxNode
from .proxmox_storages import ProxmoxStorage
from .vm_templates import VMTemplate
from .proxmox_vms import ProxmoxVM

# Support Models
from .support_tickets import SupportTicket
from .support_ticket_replies import SupportTicketReply
from .conversations import Conversation
from .knowledge_bases import KnowledgeBase

# Package metadata
__version__ = "1.0.0"
__author__ = "MnhTng"

# Setup logging
logger = logging.getLogger(__name__)


# Public API
__all__ = [
    # Metadata
    "__version__",
    "__author__",
    # Type aliases
    "ModelType",
    "ModelInstance",
    # Models
    "User",
    "Account",
    "Session",
    "Authenticator",
    "VerificationToken",
    "VPSPlan",
    "VPSInstance",
    "VPSSnapshot",
    "Cart",
    "Order",
    "OrderItem",
    "PaymentTransaction",
    "Promotion",
    "UserPromotion",
    "ProxmoxCluster",
    "ProxmoxNode",
    "ProxmoxStorage",
    "VMTemplate",
    "ProxmoxVM",
    "SupportTicket",
    "SupportTicketReply",
    "Conversation",
    "KnowledgeBase",
]


# Type aliases for better type hints
ModelType = Union[
    Type[User],
    Type[Account],
    Type[Session],
    Type[Authenticator],
    Type[VerificationToken],
    Type[VPSPlan],
    Type[VPSInstance],
    Type[VPSSnapshot],
    Type[Cart],
    Type[Order],
    Type[OrderItem],
    Type[PaymentTransaction],
    Type[Promotion],
    Type[UserPromotion],
    Type[ProxmoxCluster],
    Type[ProxmoxNode],
    Type[ProxmoxStorage],
    Type[VMTemplate],
    Type[ProxmoxVM],
    Type[SupportTicket],
    Type[SupportTicketReply],
    Type[Conversation],
    Type[KnowledgeBase],
]

ModelInstance = Union[
    User,
    Account,
    Session,
    Authenticator,
    VerificationToken,
    VPSPlan,
    VPSInstance,
    VPSSnapshot,
    Cart,
    Order,
    OrderItem,
    PaymentTransaction,
    Promotion,
    UserPromotion,
    ProxmoxCluster,
    ProxmoxNode,
    ProxmoxStorage,
    VMTemplate,
    ProxmoxVM,
    SupportTicket,
    SupportTicketReply,
    Conversation,
    KnowledgeBase,
]

logger.info("Backend models package initialized with %d models.", len(__all__) - 4)
