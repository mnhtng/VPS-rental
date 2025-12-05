"""
Proxmox Dependency Injection
Provides FastAPI dependencies for automatic Proxmox connection management
"""

from typing import Tuple, Optional
from uuid import UUID
from fastapi import Depends, HTTPException, Path
from sqlmodel import Session
from proxmoxer import ProxmoxAPI

from backend.db import get_session
from backend.core import settings
from backend.models import ProxmoxCluster, ProxmoxNode, ProxmoxVM
from backend.services.proxmox import CommonProxmoxService


# Type Aliases
ProxmoxConnection = ProxmoxAPI
ProxmoxWithCluster = Tuple[ProxmoxAPI, ProxmoxCluster]
ProxmoxWithNode = Tuple[ProxmoxAPI, ProxmoxNode, ProxmoxCluster]
ProxmoxWithVM = Tuple[ProxmoxAPI, ProxmoxVM, ProxmoxNode, ProxmoxCluster]


def get_default_proxmox() -> ProxmoxAPI:
    """
    Get Proxmox connection using default settings.
    Auto-cached by singleton pattern.
    """
    return CommonProxmoxService.get_connection(
        host=settings.PROXMOX_HOST,
        port=settings.PROXMOX_PORT,
        user=settings.PROXMOX_USER,
        password=settings.PROXMOX_PASSWORD,
        verify_ssl=False,
    )


# ============================================================================
# Cluster-based Dependencies
# ============================================================================


def get_proxmox_from_cluster(
    cluster_id: UUID = Path(..., description="Cluster ID"),
    session: Session = Depends(get_session),
) -> ProxmoxWithCluster:
    """
    Get Proxmox connection from cluster ID.
    Returns: (proxmox_connection, cluster)
    """
    cluster = session.get(ProxmoxCluster, cluster_id)
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")

    proxmox = CommonProxmoxService.get_connection(
        host=cluster.api_host,
        port=cluster.api_port,
        user=cluster.api_user,
        password=cluster.api_password,
        verify_ssl=cluster.verify_ssl,
    )

    return proxmox, cluster


# ============================================================================
# Node-based Dependencies
# ============================================================================


def get_proxmox_from_node(
    node_id: UUID = Path(..., description="Node ID"),
    session: Session = Depends(get_session),
) -> ProxmoxWithNode:
    """
    Get Proxmox connection from node ID.
    Returns: (proxmox_connection, node, cluster)
    """
    node = session.get(ProxmoxNode, node_id)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    cluster = session.get(ProxmoxCluster, node.cluster_id)
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")

    proxmox = CommonProxmoxService.get_connection(
        host=cluster.api_host,
        port=cluster.api_port,
        user=cluster.api_user,
        password=cluster.api_password,
        verify_ssl=cluster.verify_ssl,
    )

    return proxmox, node, cluster


# ============================================================================
# VM-based Dependencies
# ============================================================================


def get_proxmox_from_vm(
    vm_id: int = Path(..., description="VM ID"),
    session: Session = Depends(get_session),
) -> ProxmoxWithVM:
    """
    Get Proxmox connection from VM ID.
    Returns: (proxmox_connection, vm, node, cluster)
    """
    vm = session.get(ProxmoxVM, vm_id)
    if not vm:
        raise HTTPException(status_code=404, detail="VM not found")

    node = session.get(ProxmoxNode, vm.node_id)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    cluster = session.get(ProxmoxCluster, vm.cluster_id)
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")

    proxmox = CommonProxmoxService.get_connection(
        host=cluster.api_host,
        port=cluster.api_port,
        user=cluster.api_user,
        password=cluster.api_password,
        verify_ssl=cluster.verify_ssl,
    )

    return proxmox, vm, node, cluster
