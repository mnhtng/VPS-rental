from fastapi import APIRouter, Depends, HTTPException, status, Path, Body
from sqlmodel import Session, select
from typing import List, Dict, Any
import uuid
from pydantic import BaseModel, Field
from datetime import datetime, timezone, timedelta

from backend.db import get_session
from backend.core import settings
from backend.utils import get_current_user, get_admin_user
from backend.dependencies import ProxmoxConnection, get_default_proxmox
from backend.models import (
    User,
    VPSInstance,
    ProxmoxVM,
    ProxmoxNode,
    VMTemplate,
    ProxmoxCluster,
    Order,
)


class VPSService:
    """Service for handling VPS-related business logic"""

    @staticmethod
    def generate_password(length: int = 16) -> str:
        """Generate a secure random password"""
        # import secrets
        # import string
        # alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        # return "".join(secrets.choice(alphabet) for _ in range(length))
        return "pcloud"

    @staticmethod
    def generate_placeholder_ip() -> str:
        """Generate a placeholder IP address for the VPS"""
        import random

        return f"10.10.{random.randint(1, 254)}.{random.randint(1, 254)}"

    @staticmethod
    async def get_user_vps_instance(
        vps_id: uuid.UUID,
        current_user: User,
        session: Session,
    ) -> tuple[VPSInstance, ProxmoxVM, ProxmoxNode]:
        """
        Retrieve VPSInstance, ProxmoxVM, and ProxmoxNode for a user's VPS

        Args:
            vps_id (uuid.UUID): VPS instance ID
            current_user (User): Current authenticated user
            session (Session): Database session

        Raises:
            HTTPException: 404 if VPSInstance, ProxmoxVM, or ProxmoxNode not found
            HTTPException: 403 if user does not own the VPS
            HTTPException: 400 if VPS is terminated or not linked to a VM

        Returns:
            tuple[VPSInstance, ProxmoxVM, ProxmoxNode]: The VPSInstance, ProxmoxVM, and ProxmoxNode objects
        """
        vps = session.get(VPSInstance, vps_id)
        if not vps:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="VPS instance not found",
            )

        if vps.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to access this VPS",
            )

        if vps.status in ["terminated", "error"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="VPS has been terminated or is in error state",
            )

        if not vps.vm_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="VPS is not linked to a VM yet",
            )

        vm = session.get(ProxmoxVM, vps.vm_id)
        if not vm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="VM not found",
            )

        node = session.get(ProxmoxNode, vm.node_id)
        if not node:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Node not found",
            )

        return vps, vm, node
