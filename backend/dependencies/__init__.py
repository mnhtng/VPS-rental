"""
Initialization of dependencies package
======================================

This package provides FastAPI dependencies injection utilities.
"""

from backend.dependencies.proxmox import (
    get_default_proxmox,
    get_proxmox_from_cluster,
    get_proxmox_from_node,
    get_proxmox_from_vm,
    ProxmoxConnection,
    ProxmoxWithCluster,
    ProxmoxWithNode,
    ProxmoxWithVM,
)

__all__ = [
    "get_default_proxmox",
    "get_proxmox_from_cluster",
    "get_proxmox_from_node",
    "get_proxmox_from_vm",
    "ProxmoxConnection",
    "ProxmoxWithCluster",
    "ProxmoxWithNode",
    "ProxmoxWithVM",
]
