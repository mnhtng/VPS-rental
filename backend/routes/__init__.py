"""
API Routes Package
==================

This package contains all FastAPI route definitions.
"""

from .auth import router as auth_router
from .users import router as users_router
from .vps import router as vps_router
from .vps import admin_router as vps_admin_router
from .proxmox import router as proxmox_router
from .vps_plans import router as vps_plans_router
from .cart import router as cart_router
from .promotion import router as promotion_router
from .payment import router as payment_router
from .vnc_websocket import router as vnc_websocket_router
from .orders import router as orders_router

__all__ = [
    "auth_router",
    "users_router",
    "vps_router",
    "vps_admin_router",
    "proxmox_router",
    "vps_plans_router",
    "cart_router",
    "promotion_router",
    "payment_router",
    "vnc_websocket_router",
    "orders_router",
]

