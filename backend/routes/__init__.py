"""
API Routes Package
==================

This package contains all FastAPI route definitions.
"""

from .auth import router as auth_router
from .users import router as users_router
from .proxmox import router as proxmox_router
from .proxmox import admin_router as proxmox_admin_router
from .proxmox_iaas import router as proxmox_iaas_router

__all__ = [
    "auth_router",
    "users_router",
    "proxmox_router",
    "proxmox_admin_router",
    "proxmox_iaas_router",
]
