"""
Business Logic Services Package
================================

This package contains service layer implementations for business logic.

Standardized Return Formats
---------------------------
- For query (GET) operations -> List[Dict]/Dict
- For mutation (POST/PUT/DELETE) operations/async tasks -> {"success": bool, "task": Any, "message": str}
- For error cases -> Raise exceptions/return {"success": False, "error": str}
"""

from .payment import PaymentService
from .proxmox import (
    CommonProxmoxService,
    ProxmoxAccessService,
    ProxmoxClusterService,
    ProxmoxNodeService,
    ProxmoxStorageService,
    ProxmoxPoolService,
    ProxmoxTemplateService,
    ProxmoxVMService,
)

from .promotion import PromotionService
from .auth import AuthService

__all__ = [
    # Auth Service
    "AuthService",
    # Payment Service
    "PaymentService",
    # Promotion Service
    "PromotionService",
    # Proxmox Service
    "CommonProxmoxService",
    "ProxmoxAccessService",
    "ProxmoxClusterService",
    "ProxmoxNodeService",
    "ProxmoxStorageService",
    "ProxmoxPoolService",
    "ProxmoxTemplateService",
    "ProxmoxVMService",
]
