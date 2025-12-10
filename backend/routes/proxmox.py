from platform import node
import uuid
from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional
from sqlmodel import Session, select
from datetime import datetime, timezone
from pydantic import BaseModel, Field

from backend.db import get_session
from backend.core import settings
from backend.models import (
    ProxmoxCluster,
    ProxmoxNode,
    ProxmoxVM,
    ProxmoxStorage,
    VMTemplate,
)
from backend.schemas import (
    ProxmoxNodePublic,
    ProxmoxVMCreate,
    ProxmoxVMUpdate,
    ProxmoxClusterCreate,
    ProxmoxClusterUpdate,
    VMTemplateCreate,
    VMTemplateUpdate,
)
from backend.services import (
    CommonProxmoxService,
    ProxmoxAccessService,
    ProxmoxClusterService,
    ProxmoxNodeService,
    ProxmoxStorageService,
    ProxmoxPoolService,
    ProxmoxTemplateService,
    ProxmoxVMService,
)
from backend.dependencies import (
    get_default_proxmox,
    get_proxmox_from_cluster,
    get_proxmox_from_node,
    get_proxmox_from_vm,
    ProxmoxConnection,
    ProxmoxWithCluster,
    ProxmoxWithNode,
    ProxmoxWithVM,
)


router = APIRouter(prefix="/proxmox", tags=["Proxmox"])


# ============================================================================
# Pydantic Models for Requests/Responses
# ============================================================================


class ConnectionTestRequest(BaseModel):
    """Request model for testing Proxmox connection"""

    host: str = Field(..., description="Proxmox host address")
    port: int = Field(default=8006, description="Proxmox API port")
    user: str = Field(..., description="Proxmox username")
    password: str = Field(..., description="Proxmox password")
    verify_ssl: bool = Field(default=False, description="Verify SSL certificate")


class VMActionRequest(BaseModel):
    """Request model for VM actions"""

    node_name: str = Field(..., description="Node name where VM is located")


class VMCreateRequest(BaseModel):
    """Request model for creating a VM"""

    node_name: str = Field(..., description="Node name")
    hostname: str = Field(..., description="VM hostname")
    cores: int = Field(..., description="Number of CPU cores")
    memory: int = Field(..., description="RAM in GB")
    storage: str = Field(..., description="Storage name")
    disk_size: int = Field(..., description="Disk size in GB")
    template_vmid: Optional[int] = Field(
        None, description="Template VMID to clone from"
    )


class SnapshotCreateRequest(BaseModel):
    """Request model for creating a snapshot"""

    node_name: str = Field(..., description="Node name")
    snapname: str = Field(..., description="Snapshot name")
    description: Optional[str] = Field("", description="Snapshot description")


class SnapshotActionRequest(BaseModel):
    """Request model for snapshot actions"""

    node_name: str = Field(..., description="Node name")
    snapname: str = Field(..., description="Snapshot name")


class VMConfigUpdateRequest(BaseModel):
    """Request model for updating VM configuration"""

    node_name: str = Field(..., description="Node name")
    cores: Optional[int] = Field(None, description="Number of CPU cores")
    memory: Optional[int] = Field(None, description="RAM in MB")
    description: Optional[str] = Field(None, description="VM description")


class DiskResizeRequest(BaseModel):
    """Request model for resizing VM disk"""

    node_name: str = Field(..., description="Node name")
    disk: str = Field(..., description="Disk identifier (e.g., scsi0)")
    size: str = Field(..., description="Size increment (e.g., +10G)")


# ============================================================================
# Cluster Management Endpoints
# ============================================================================


@router.post("/clusters/test-connection")
def test_connection(
    request: ConnectionTestRequest, session: Session = Depends(get_session)
):
    """Test connection to a Proxmox cluster"""
    result = CommonProxmoxService.test_connection(
        host=request.host,
        port=request.port,
        user=request.user,
        password=request.password,
    )
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"],
        )
    return result


@router.get("/clusters")
def list_clusters(session: Session = Depends(get_session)):
    """List all registered Proxmox clusters"""
    clusters = session.exec(select(ProxmoxCluster)).all()
    return [cluster.to_dict() for cluster in clusters]


@router.post("/clusters")
def create_cluster(
    cluster_data: ProxmoxClusterCreate, session: Session = Depends(get_session)
):
    """Register a new Proxmox cluster"""
    # Test connection first
    test_result = CommonProxmoxService.test_connection(
        host=cluster_data.api_host,
        port=cluster_data.api_port or 8006,
        user=cluster_data.api_user,
        password=cluster_data.api_password or "",
        verify_ssl=cluster_data.verify_ssl,
    )

    if not test_result["success"]:
        raise HTTPException(
            status_code=400, detail=f"Connection failed: {test_result['error']}"
        )

    # Create cluster record
    cluster = ProxmoxCluster(
        name=cluster_data.name,
        api_host=cluster_data.api_host,
        api_port=cluster_data.api_port or 8006,
        api_user=cluster_data.api_user,
        api_password=cluster_data.api_password,
        api_token_id=cluster_data.api_token_id,
        api_token_secret=cluster_data.api_token_secret,
        verify_ssl=cluster_data.verify_ssl,
        status=cluster_data.status or "active",
        version=test_result.get("version"),
    )

    session.add(cluster)
    session.commit()
    session.refresh(cluster)

    return cluster.to_dict()


@router.get("/clusters/{cluster_id}")
def get_cluster(cluster_id: uuid.UUID, session: Session = Depends(get_session)):
    """Get cluster details by ID"""
    cluster = session.get(ProxmoxCluster, cluster_id)
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")
    return cluster.to_dict()


@router.put("/clusters/{cluster_id}")
def update_cluster(
    cluster_id: uuid.UUID,
    cluster_data: ProxmoxClusterUpdate,
    session: Session = Depends(get_session),
):
    """Update cluster configuration"""
    cluster = session.get(ProxmoxCluster, cluster_id)
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")

    # Update fields
    update_data = cluster_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(cluster, key, value)

    cluster.updated_at = datetime.now(timezone.utc)
    session.add(cluster)
    session.commit()
    session.refresh(cluster)

    return cluster.to_dict()


@router.delete("/clusters/{cluster_id}")
def delete_cluster(cluster_id: uuid.UUID, session: Session = Depends(get_session)):
    """Delete a cluster record"""
    cluster = session.get(ProxmoxCluster, cluster_id)
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")

    session.delete(cluster)
    session.commit()

    return {"message": "Cluster deleted successfully"}


@router.get("/clusters/{cluster_id}/version")
def get_cluster_version(
    proxmox_data: ProxmoxWithCluster = Depends(get_proxmox_from_cluster),
):
    """Get Proxmox version information"""
    proxmox, cluster = proxmox_data

    try:
        return CommonProxmoxService.get_version(proxmox)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/clusters/{cluster_id}/sync")
def sync_cluster_resources(
    proxmox_data: ProxmoxWithCluster = Depends(get_proxmox_from_cluster),
    session: Session = Depends(get_session),
):
    """Sync nodes and storages from Proxmox to database"""
    proxmox, cluster = proxmox_data

    try:

        # Sync nodes
        nodes_data = CommonProxmoxService.get_nodes(proxmox)
        synced_nodes = []

        for node_data in nodes_data:
            node_name = node_data.get("node")

            # Check if node exists
            existing_node = session.exec(
                select(ProxmoxNode).where(
                    ProxmoxNode.cluster_id == cluster_id,
                    ProxmoxNode.name == node_name,
                )
            ).first()

            node_status = ProxmoxNodeService.get_node_status(proxmox, node_name)

            if existing_node:
                # Update existing node
                existing_node.status = node_data.get("status", "online")
                existing_node.cpu_cores = node_status.get("cpuinfo", {}).get("cpus")
                existing_node.total_memory_gb = node_status.get("memory", {}).get(
                    "total", 0
                ) // (1024 * 1024 * 1024)
                existing_node.updated_at = datetime.now(timezone.utc)
                session.add(existing_node)
                synced_nodes.append(existing_node.name)
            else:
                # Create new node
                new_node = ProxmoxNode(
                    cluster_id=cluster_id,
                    name=node_name,
                    ip_address=node_data.get("ip", "127.0.0.1"),
                    status=node_data.get("status", "online"),
                    cpu_cores=node_status.get("cpuinfo", {}).get("cpus"),
                    total_memory_gb=node_status.get("memory", {}).get("total", 0)
                    // (1024 * 1024 * 1024),
                )
                session.add(new_node)
                synced_nodes.append(new_node.name)

        session.commit()

        return {
            "message": "Cluster resources synced successfully",
            "synced_nodes": synced_nodes,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Node Management Endpoints
# ============================================================================


@router.get("/clusters/{cluster_id}/nodes")
def list_nodes(cluster_id: uuid.UUID, session: Session = Depends(get_session)):
    """List all nodes in a cluster"""
    nodes = session.exec(
        select(ProxmoxNode).where(ProxmoxNode.cluster_id == cluster_id)
    ).all()
    return [node.to_dict() for node in nodes]


@router.get("/nodes/{node_id}")
def get_node(node_id: uuid.UUID, session: Session = Depends(get_session)):
    """Get node details"""
    node = session.get(ProxmoxNode, node_id)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    return node.to_dict()


@router.get("/nodes/{node_id}/status")
def get_node_live_status(
    proxmox_data: ProxmoxWithNode = Depends(get_proxmox_from_node),
):
    """Get live status of a node from Proxmox"""
    proxmox, node, cluster = proxmox_data

    try:
        return CommonProxmoxService.get_node_status(proxmox, node.name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Storage Management Endpoints
# ============================================================================


@router.get("/nodes/{node_id}/storages")
def list_storages(node_id: uuid.UUID, session: Session = Depends(get_session)):
    """List storages for a node"""
    storages = session.exec(
        select(ProxmoxStorage).where(ProxmoxStorage.node_id == node_id)
    ).all()
    return [storage.to_dict() for storage in storages]


@router.get("/nodes/{node_id}/storages/live")
def list_live_storages(proxmox_data: ProxmoxWithNode = Depends(get_proxmox_from_node)):
    """Get live storage information from Proxmox"""
    proxmox, node, cluster = proxmox_data

    try:
        return CommonProxmoxService.get_storages(proxmox, node.name)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


# ============================================================================
# VM Management Endpoints
# ============================================================================


@router.get("/clusters/{cluster_id}/vms")
def list_cluster_vms(cluster_id: uuid.UUID, session: Session = Depends(get_session)):
    """List all VMs in a cluster"""
    vms = session.exec(
        select(ProxmoxVM).where(ProxmoxVM.cluster_id == cluster_id)
    ).all()
    return [vm.to_dict() for vm in vms]


@router.get("/nodes/{node_id}/vms")
def list_node_vms(node_id: uuid.UUID, session: Session = Depends(get_session)):
    """List all VMs on a node"""
    vms = session.exec(select(ProxmoxVM).where(ProxmoxVM.node_id == node_id)).all()
    return [vm.to_dict() for vm in vms]


@router.get("/nodes/{node_id}/vms/live")
def list_live_vms(proxmox_data: ProxmoxWithNode = Depends(get_proxmox_from_node)):
    """Get live VM list from Proxmox"""
    proxmox, node, cluster = proxmox_data

    try:
        return CommonProxmoxService.get_vms(proxmox, node.name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/vms/{vm_id}")
def get_vm(vm_id: uuid.UUID, session: Session = Depends(get_session)):
    """Get VM details"""
    vm = session.get(ProxmoxVM, vm_id)
    if not vm:
        raise HTTPException(status_code=404, detail="VM not found")
    return vm.to_dict()


@router.get("/vms/{vm_id}/status")
def get_vm_live_status(proxmox_data: ProxmoxWithVM = Depends(get_proxmox_from_vm)):
    """Get live VM status from Proxmox"""
    proxmox, vm, node, cluster = proxmox_data

    try:
        return CommonProxmoxService.get_vm_status(proxmox, node.name, vm.vmid)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/vms/{vm_id}/config")
def get_vm_config(proxmox_data: ProxmoxWithVM = Depends(get_proxmox_from_vm)):
    """Get VM configuration from Proxmox"""
    proxmox, vm, node, cluster = proxmox_data

    try:
        return CommonProxmoxService.get_vm_config(proxmox, node.name, vm.vmid)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/vms/{vm_id}/start")
def start_vm(
    proxmox_data: ProxmoxWithVM = Depends(get_proxmox_from_vm),
    session: Session = Depends(get_session),
):
    """Start a VM"""
    proxmox, vm, node, cluster = proxmox_data

    try:
        result = CommonProxmoxService.start_vm(proxmox, node.name, vm.vmid)

        # Update VM power status
        vm.power_status = "running"
        vm.updated_at = datetime.now(timezone.utc)
        session.add(vm)
        session.commit()

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/vms/{vm_id}/clone")
def clone_vm(vm_id: int, proxmox_data: ProxmoxWithVM = Depends(get_proxmox_from_vm)):
    """Clone a VM"""
    proxmox, vm, node, cluster = proxmox_data

    try:
        result = ProxmoxVMService.create_vm(proxmox, node.name, vm.vmid, vm_id)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.post("/vms/{vm_id}/stop")
def stop_vm(
    proxmox_data: ProxmoxWithVM = Depends(get_proxmox_from_vm),
    session: Session = Depends(get_session),
):
    """Stop a VM"""
    proxmox, vm, node, cluster = proxmox_data

    try:
        result = CommonProxmoxService.stop_vm(proxmox, node.name, vm.vmid)

        # Update VM power status
        vm.power_status = "stopped"
        vm.updated_at = datetime.now(timezone.utc)
        session.add(vm)
        session.commit()

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/vms/{vm_id}/shutdown")
def shutdown_vm(
    vm_id: str | int, proxmox: ProxmoxConnection = Depends(get_default_proxmox)
):
    """Gracefully shutdown a VM"""
    try:
        return ProxmoxVMService.shutdown_vm(proxmox, "pve", vm_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/vms/{vm_id}/reboot")
def reboot_vm(proxmox_data: ProxmoxWithVM = Depends(get_proxmox_from_vm)):
    """Reboot a VM"""
    proxmox, vm, node, cluster = proxmox_data

    try:
        return CommonProxmoxService.reboot_vm(proxmox, node.name, vm.vmid)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/vms/{vm_id}/reset")
def reset_vm(proxmox_data: ProxmoxWithVM = Depends(get_proxmox_from_vm)):
    """Reset (hard reboot) a VM"""
    proxmox, vm, node, cluster = proxmox_data

    try:
        return CommonProxmoxService.reset_vm(proxmox, node.name, vm.vmid)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/vms/{vm_id}/suspend")
def suspend_vm(
    proxmox_data: ProxmoxWithVM = Depends(get_proxmox_from_vm),
    session: Session = Depends(get_session),
):
    """Suspend a VM"""
    proxmox, vm, node, cluster = proxmox_data

    try:
        result = CommonProxmoxService.suspend_vm(proxmox, node.name, vm.vmid)

        # Update VM power status
        vm.power_status = "suspended"
        vm.updated_at = datetime.now(timezone.utc)
        session.add(vm)
        session.commit()

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/vms/{vm_id}/resume")
def resume_vm(
    proxmox_data: ProxmoxWithVM = Depends(get_proxmox_from_vm),
    session: Session = Depends(get_session),
):
    """Resume a suspended VM"""
    proxmox, vm, node, cluster = proxmox_data

    try:
        result = CommonProxmoxService.resume_vm(proxmox, node.name, vm.vmid)

        # Update VM power status
        vm.power_status = "running"
        vm.updated_at = datetime.now(timezone.utc)
        session.add(vm)
        session.commit()

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/vms/{vm_id}")
def delete_vm(
    vm_id: str | int, proxmox: ProxmoxConnection = Depends(get_default_proxmox)
):
    """Delete a VM"""
    try:
        result = ProxmoxVMService.delete_vm(proxmox, "pve", vm_id)
        return {"message": "VM deleted successfully", "task": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/vms/{vm_id}/config")
def update_vm_configuration(
    config: VMConfigUpdateRequest,
    proxmox_data: ProxmoxWithVM = Depends(get_proxmox_from_vm),
    session: Session = Depends(get_session),
):
    """Update VM configuration"""
    proxmox, vm, node, cluster = proxmox_data

    try:

        # Build config update
        update_config = {}
        if config.cores:
            update_config["cores"] = config.cores
        if config.memory:
            update_config["memory"] = config.memory
        if config.description:
            update_config["description"] = config.description

        result = CommonProxmoxService.update_vm_config(
            proxmox, node.name, vm.vmid, **update_config
        )

        # Update database
        if config.cores:
            vm.vcpu = config.cores
        if config.memory:
            vm.ram_gb = config.memory // 1024
        vm.updated_at = datetime.now(timezone.utc)
        session.add(vm)
        session.commit()

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/vms/{vm_id}/resize-disk")
def resize_vm_disk(
    resize_data: DiskResizeRequest,
    proxmox_data: ProxmoxWithVM = Depends(get_proxmox_from_vm),
):
    """Resize VM disk"""
    proxmox, vm, node, cluster = proxmox_data

    try:
        return CommonProxmoxService.resize_vm_disk(
            proxmox, node.name, vm.vmid, resize_data.disk, resize_data.size
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/vms/{vm_id}/vnc")
def get_vm_vnc(
    vm_id: int,
    session: Session = Depends(get_session),
):
    """Get VNC connection info for a VM"""
    # proxmox, vm, node, cluster = proxmox_data

    proxmox = CommonProxmoxService.get_connection(
        host=settings.PROXMOX_HOST,
        port=settings.PROXMOX_PORT,
        user=settings.PROXMOX_USER,
        password=settings.PROXMOX_PASSWORD,
        verify_ssl=False,
    )

    try:
        vnc_info = ProxmoxVMService.get_vnc_info(proxmox, "pve", vm_id)

        # Add host and node info for WebSocket connection
        vnc_info["host"] = settings.PROXMOX_HOST
        vnc_info["port"] = settings.PROXMOX_PORT
        vnc_info["node"] = "pve"
        vnc_info["vmid"] = vm_id

        # Add auth ticket for WebSocket proxy authentication
        # Get the auth ticket from proxmox connection
        if hasattr(proxmox, "_store") and "ticket" in proxmox._store:
            vnc_info["authTicket"] = proxmox._store["ticket"]
        else:
            # Fallback: login again to get fresh ticket
            import requests

            login_url = f"https://{settings.PROXMOX_HOST}:{settings.PROXMOX_PORT}/api2/json/access/ticket"
            response = requests.post(
                login_url,
                data={
                    "username": settings.PROXMOX_USER,
                    "password": settings.PROXMOX_PASSWORD,
                },
                verify=False,
            )
            if response.ok:
                auth_data = response.json().get("data", {})
                vnc_info["authTicket"] = auth_data.get("ticket")

        return vnc_info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Snapshot Management Endpoints
# ============================================================================


@router.get("/vms/{vm_id}/snapshots")
def list_snapshots(proxmox_data: ProxmoxWithVM = Depends(get_proxmox_from_vm)):
    """List all snapshots for a VM"""
    proxmox, vm, node, cluster = proxmox_data

    try:
        return CommonProxmoxService.list_snapshots(proxmox, node.name, vm.vmid)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/vms/{vm_id}/snapshots")
def create_snapshot(
    snapshot_data: SnapshotCreateRequest,
    proxmox_data: ProxmoxWithVM = Depends(get_proxmox_from_vm),
):
    """Create a snapshot for a VM"""
    proxmox, vm, node, cluster = proxmox_data

    try:
        return CommonProxmoxService.create_snapshot(
            proxmox,
            node.name,
            vm.vmid,
            snapshot_data.snapname,
            snapshot_data.description or "",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/vms/{vm_id}/snapshots/rollback")
def rollback_snapshot(
    snapshot_data: SnapshotActionRequest,
    proxmox_data: ProxmoxWithVM = Depends(get_proxmox_from_vm),
):
    """Rollback to a snapshot"""
    proxmox, vm, node, cluster = proxmox_data

    try:
        return CommonProxmoxService.rollback_snapshot(
            proxmox, node.name, vm.vmid, snapshot_data.snapname
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/vms/{vm_id}/snapshots/{snapname}")
def delete_snapshot(
    snapname: str,
    node_name: str = Query(..., description="Node name"),
    proxmox_data: ProxmoxWithVM = Depends(get_proxmox_from_vm),
):
    """Delete a snapshot"""
    proxmox, vm, node, cluster = proxmox_data

    try:
        return CommonProxmoxService.delete_snapshot(
            proxmox, node_name, vm.vmid, snapname
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Template Management Endpoints
# ============================================================================


@router.get("/clusters/{cluster_id}/templates")
def list_templates(cluster_id: uuid.UUID, session: Session = Depends(get_session)):
    """List all VM templates in a cluster"""
    templates = session.exec(
        select(VMTemplate).where(VMTemplate.cluster_id == cluster_id)
    ).all()
    return [template.to_dict() for template in templates]


@router.get("/templates/{template_id}")
def get_template(template_id: uuid.UUID, session: Session = Depends(get_session)):
    """Get template details"""
    template = session.get(VMTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template.to_dict()


# ============================================================================
# Utility Endpoints
# ============================================================================


@router.get("/clusters/{cluster_id}/next-vmid")
def get_next_vmid(proxmox_data: ProxmoxWithCluster = Depends(get_proxmox_from_cluster)):
    """Get next available VM ID"""
    proxmox, cluster = proxmox_data

    try:
        return {"vmid": CommonProxmoxService.get_next_vmid(proxmox)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/clusters/{cluster_id}/resources")
def get_cluster_resources(
    resource_type: Optional[str] = Query(
        None, description="Filter by type (vm, storage, node)"
    ),
    proxmox_data: ProxmoxWithCluster = Depends(get_proxmox_from_cluster),
):
    """Get all cluster resources"""
    proxmox, cluster = proxmox_data

    try:

        result = ProxmoxClusterService.get_cluster_resources(proxmox, resource_type)
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result["data"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Advanced Cluster Management Endpoints
# ============================================================================


@router.get("/clusters/{cluster_id}/status")
def get_cluster_status(
    proxmox_data: ProxmoxWithCluster = Depends(get_proxmox_from_cluster),
):
    """Get cluster status information"""
    proxmox, cluster = proxmox_data

    try:
        result = ProxmoxClusterService.get_cluster_status(proxmox)
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result["data"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/clusters/{cluster_id}/options")
def get_cluster_options(
    proxmox_data: ProxmoxWithCluster = Depends(get_proxmox_from_cluster),
):
    """Get cluster configuration options"""
    proxmox, cluster = proxmox_data

    try:
        result = ProxmoxClusterService.get_cluster_options(proxmox)
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result["data"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/clusters/{cluster_id}/options")
def update_cluster_options(
    options: dict,
    proxmox_data: ProxmoxWithCluster = Depends(get_proxmox_from_cluster),
):
    """Update cluster configuration options"""
    proxmox, cluster = proxmox_data

    try:
        result = ProxmoxClusterService.update_cluster_options(proxmox, **options)
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/clusters/{cluster_id}/tasks")
def get_cluster_tasks(
    proxmox_data: ProxmoxWithCluster = Depends(get_proxmox_from_cluster),
):
    """Get all cluster tasks"""
    proxmox, cluster = proxmox_data

    try:
        result = ProxmoxClusterService.get_cluster_tasks(proxmox)
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result["data"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tasks/{upid}/status")
def get_task_status(
    upid: str,
    proxmox_data: ProxmoxWithCluster = Depends(get_proxmox_from_cluster),
):
    """Get status of a specific task by UPID"""
    proxmox, cluster = proxmox_data

    try:
        return CommonProxmoxService.get_task_status(proxmox, upid)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Backup Management Endpoints
# ============================================================================


class BackupJobCreateRequest(BaseModel):
    """Request model for creating backup job"""

    schedule: str = Field(..., description="Backup schedule (cron format)")
    storage: str = Field(..., description="Storage for backups")
    vmid: Optional[str] = Field(None, description="VM IDs (comma-separated)")
    node: Optional[str] = Field(None, description="Node name")
    all: Optional[bool] = Field(False, description="Backup all VMs")
    mode: str = Field(default="snapshot", description="Backup mode")
    compress: str = Field(default="zstd", description="Compression type")
    retention_keep_last: Optional[int] = Field(None, description="Keep last N backups")
    retention_keep_daily: Optional[int] = Field(None, description="Keep daily backups")
    retention_keep_weekly: Optional[int] = Field(
        None, description="Keep weekly backups"
    )
    retention_keep_monthly: Optional[int] = Field(
        None, description="Keep monthly backups"
    )
    enabled: bool = Field(default=True, description="Enable backup job")


class BackupJobUpdateRequest(BaseModel):
    """Request model for updating backup job"""

    schedule: Optional[str] = Field(None, description="Backup schedule")
    storage: Optional[str] = Field(None, description="Storage for backups")
    vmid: Optional[str] = Field(None, description="VM IDs")
    enabled: Optional[bool] = Field(None, description="Enable/disable backup job")


@router.get("/clusters/{cluster_id}/backup-jobs")
def list_backup_jobs(
    proxmox_data: ProxmoxWithCluster = Depends(get_proxmox_from_cluster),
):
    """List all backup jobs in cluster"""
    proxmox, cluster = proxmox_data

    try:
        result = ProxmoxClusterService.get_backup_jobs(proxmox)
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result["data"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/clusters/{cluster_id}/backup-jobs")
def create_backup_job(
    backup_job: BackupJobCreateRequest,
    proxmox_data: ProxmoxWithCluster = Depends(get_proxmox_from_cluster),
):
    """Create a new backup job"""
    proxmox, cluster = proxmox_data

    try:

        # Build retention policy
        retention = {}
        if backup_job.retention_keep_last:
            retention["keep-last"] = backup_job.retention_keep_last
        if backup_job.retention_keep_daily:
            retention["keep-daily"] = backup_job.retention_keep_daily
        if backup_job.retention_keep_weekly:
            retention["keep-weekly"] = backup_job.retention_keep_weekly
        if backup_job.retention_keep_monthly:
            retention["keep-monthly"] = backup_job.retention_keep_monthly

        result = ProxmoxClusterService.create_backup_job(
            proxmox,
            schedule=backup_job.schedule,
            storage=backup_job.storage,
            vmid=backup_job.vmid,
            node=backup_job.node,
            all=backup_job.all,
            mode=backup_job.mode,
            compress=backup_job.compress,
            retention=retention if retention else None,
            enabled=backup_job.enabled,
        )

        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/clusters/{cluster_id}/backup-jobs/{job_id}")
def update_backup_job(
    job_id: str,
    backup_job: BackupJobUpdateRequest,
    proxmox_data: ProxmoxWithCluster = Depends(get_proxmox_from_cluster),
):
    """Update a backup job"""
    proxmox, cluster = proxmox_data

    try:

        update_data = backup_job.model_dump(exclude_unset=True)
        result = ProxmoxClusterService.update_backup_job(proxmox, job_id, **update_data)

        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/clusters/{cluster_id}/backup-jobs/{job_id}")
def delete_backup_job(
    job_id: str, proxmox_data: ProxmoxWithCluster = Depends(get_proxmox_from_cluster)
):
    """Delete a backup job"""
    proxmox, cluster = proxmox_data

    try:
        result = ProxmoxClusterService.delete_backup_job(proxmox, job_id)

        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Storage Content & Volume Management Endpoints
# ============================================================================


class VolumeAllocateRequest(BaseModel):
    """Request model for allocating disk image"""

    filename: str = Field(..., description="Volume filename")
    size: str = Field(..., description="Size (e.g., 10G)")
    vmid: int = Field(..., description="VM ID")
    format: str = Field(default="raw", description="Image format (raw, qcow2)")


class VolumeCopyRequest(BaseModel):
    """Request model for copying volume"""

    target_storage: str = Field(..., description="Target storage name")
    target_node: Optional[str] = Field(None, description="Target node name")
    target_vmid: Optional[int] = Field(None, description="Target VM ID")


@router.get("/clusters/{cluster_id}/storages")
def list_cluster_storages(
    proxmox_data: ProxmoxWithCluster = Depends(get_proxmox_from_cluster),
):
    """List all storages in cluster"""
    proxmox, cluster = proxmox_data

    try:
        result = ProxmoxStorageService.get_storages(proxmox)
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result["data"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/clusters/{cluster_id}/storages/{storage_name}")
def get_storage_config(
    storage_name: str,
    proxmox_data: ProxmoxWithCluster = Depends(get_proxmox_from_cluster),
):
    """Get storage configuration"""
    proxmox, cluster = proxmox_data

    try:
        result = ProxmoxStorageService.get_storage_config(proxmox, storage_name)
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result["data"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/nodes/{node_id}/storage-status")
def get_node_storage_status(
    storage: Optional[str] = Query(None, description="Filter by storage name"),
    content: Optional[str] = Query(None, description="Filter by content type"),
    proxmox_data: ProxmoxWithNode = Depends(get_proxmox_from_node),
):
    """Get storage status on a specific node"""
    proxmox, node, cluster = proxmox_data

    try:
        result = ProxmoxStorageService.get_node_storage_status(
            proxmox, node.name, storage, content
        )
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result["data"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/nodes/{node_id}/storages/{storage_name}/content")
def get_storage_content(
    storage_name: str,
    content_type: Optional[str] = Query(None, description="Filter by content type"),
    vmid: Optional[int] = Query(None, description="Filter by VM ID"),
    proxmox_data: ProxmoxWithNode = Depends(get_proxmox_from_node),
):
    """Get storage content (volumes, ISOs, templates)"""
    proxmox, node, cluster = proxmox_data

    try:
        result = ProxmoxStorageService.get_storage_content(
            proxmox, node.name, storage_name, content_type, vmid
        )
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result["data"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/nodes/{node_id}/storages/{storage_name}/allocate")
def allocate_disk_image(
    storage_name: str,
    volume_data: VolumeAllocateRequest,
    proxmox_data: ProxmoxWithNode = Depends(get_proxmox_from_node),
):
    """Allocate a new disk image"""
    proxmox, node, cluster = proxmox_data

    try:
        result = ProxmoxStorageService.allocate_disk_image(
            proxmox,
            node.name,
            storage_name,
            volume_data.filename,
            volume_data.size,
            volume_data.vmid,
            volume_data.format,
        )
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/nodes/{node_id}/storages/{storage_name}/volumes/{volume_id}/copy")
def copy_volume(
    storage_name: str,
    volume_id: str,
    copy_data: VolumeCopyRequest,
    proxmox_data: ProxmoxWithNode = Depends(get_proxmox_from_node),
):
    """Copy a volume to another storage/node"""
    proxmox, node, cluster = proxmox_data

    try:
        result = ProxmoxStorageService.copy_volume(
            proxmox,
            node.name,
            storage_name,
            volume_id,
            copy_data.target_storage,
            copy_data.target_node,
            copy_data.target_vmid,
        )
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/nodes/{node_id}/storages/{storage_name}/volumes/{volume_id}")
def delete_volume(
    storage_name: str,
    volume_id: str,
    proxmox_data: ProxmoxWithNode = Depends(get_proxmox_from_node),
):
    """Delete a volume"""
    proxmox, node, cluster = proxmox_data

    try:
        result = ProxmoxStorageService.delete_volume(
            proxmox, node.name, storage_name, volume_id
        )
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Pool Management Endpoints
# ============================================================================


class PoolCreateRequest(BaseModel):
    """Request model for creating pool"""

    poolid: str = Field(..., description="Pool ID")
    comment: Optional[str] = Field(None, description="Pool description")


class PoolUpdateRequest(BaseModel):
    """Request model for updating pool"""

    comment: Optional[str] = Field(None, description="Pool description")


class PoolAddVMsRequest(BaseModel):
    """Request model for adding VMs to pool"""

    vms: str = Field(..., description="Comma-separated VM IDs")


@router.get("/clusters/{cluster_id}/pools")
def list_pools(proxmox_data: ProxmoxWithCluster = Depends(get_proxmox_from_cluster)):
    """List all pools in cluster"""
    proxmox, cluster = proxmox_data

    try:
        result = ProxmoxPoolService.get_pools(proxmox)
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result["data"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/clusters/{cluster_id}/pools/{pool_id}")
def get_pool_details(
    pool_id: str, proxmox_data: ProxmoxWithCluster = Depends(get_proxmox_from_cluster)
):
    """Get pool details including members"""
    proxmox, cluster = proxmox_data

    try:
        result = ProxmoxPoolService.get_pool(proxmox, pool_id)
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result["data"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/clusters/{cluster_id}/pools")
def create_pool(
    pool_data: PoolCreateRequest,
    proxmox_data: ProxmoxWithCluster = Depends(get_proxmox_from_cluster),
):
    """Create a new pool"""
    proxmox, cluster = proxmox_data

    try:
        result = ProxmoxPoolService.create_pool(
            proxmox, pool_data.poolid, pool_data.comment
        )
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/clusters/{cluster_id}/pools/{pool_id}")
def update_pool(
    pool_id: str,
    pool_data: PoolUpdateRequest,
    proxmox_data: ProxmoxWithCluster = Depends(get_proxmox_from_cluster),
):
    """Update pool configuration"""
    proxmox, cluster = proxmox_data

    try:
        result = ProxmoxPoolService.update_pool(proxmox, pool_id, pool_data.comment)
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/clusters/{cluster_id}/pools/{pool_id}")
def delete_pool(
    pool_id: str, proxmox_data: ProxmoxWithCluster = Depends(get_proxmox_from_cluster)
):
    """Delete a pool"""
    proxmox, cluster = proxmox_data

    try:
        result = ProxmoxPoolService.delete_pool(proxmox, pool_id)
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/clusters/{cluster_id}/pools/{pool_id}/vms/{vmid}")
def add_vm_to_pool(
    pool_id: str,
    vmid: int,
    proxmox_data: ProxmoxWithCluster = Depends(get_proxmox_from_cluster),
):
    """Add a VM to pool"""
    proxmox, cluster = proxmox_data

    try:
        result = ProxmoxPoolService.add_vm_to_pool(proxmox, pool_id, vmid)
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/clusters/{cluster_id}/pools/{pool_id}/vms/{vmid}")
def remove_vm_from_pool(
    pool_id: str,
    vmid: int,
    proxmox_data: ProxmoxWithCluster = Depends(get_proxmox_from_cluster),
):
    """Remove a VM from pool"""
    proxmox, cluster = proxmox_data

    try:
        result = ProxmoxPoolService.remove_vm_from_pool(proxmox, pool_id, vmid)
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/clusters/{cluster_id}/pools/{pool_id}/vms/batch")
def add_multiple_vms_to_pool(
    pool_id: str,
    vms_data: PoolAddVMsRequest,
    proxmox_data: ProxmoxWithCluster = Depends(get_proxmox_from_cluster),
):
    """Add multiple VMs to pool"""
    proxmox, cluster = proxmox_data

    try:
        result = ProxmoxPoolService.add_multiple_vms_to_pool(
            proxmox, pool_id, vms_data.vms
        )
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/clusters/{cluster_id}/pools/{pool_id}/vms")
def get_pool_vms(
    pool_id: str, proxmox_data: ProxmoxWithCluster = Depends(get_proxmox_from_cluster)
):
    """Get all VMs in a pool"""
    proxmox, cluster = proxmox_data

    try:
        result = ProxmoxPoolService.get_pool_vms(proxmox, pool_id)
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result["data"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Node Advanced Management Endpoints
# ============================================================================


class NetworkInterfaceRequest(BaseModel):
    """Request model for network interface operations"""

    iface: str = Field(..., description="Interface name")
    type: str = Field(..., description="Interface type (bridge, bond, vlan, etc.)")
    autostart: Optional[bool] = Field(True, description="Start at boot")
    bridge_ports: Optional[str] = Field(None, description="Bridge ports")
    bond_mode: Optional[str] = Field(None, description="Bond mode")
    address: Optional[str] = Field(None, description="IP address")
    netmask: Optional[str] = Field(None, description="Netmask")
    gateway: Optional[str] = Field(None, description="Gateway")


@router.get("/nodes/{node_id}/network")
def get_node_network_interfaces(
    proxmox_data: ProxmoxWithNode = Depends(get_proxmox_from_node),
):
    """Get network interfaces on a node"""
    proxmox, node, cluster = proxmox_data

    try:
        result = ProxmoxNodeService.get_network_interfaces(proxmox, node.name)
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result["data"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/nodes/{node_id}/disks")
def get_node_disks(proxmox_data: ProxmoxWithNode = Depends(get_proxmox_from_node)):
    """Get disk information on a node"""
    proxmox, node, cluster = proxmox_data

    try:
        result = ProxmoxNodeService.get_disks(proxmox, node.name)
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result["data"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/nodes/{node_id}/services")
def get_node_services(proxmox_data: ProxmoxWithNode = Depends(get_proxmox_from_node)):
    """Get system services on a node"""
    proxmox, node, cluster = proxmox_data

    try:
        result = ProxmoxNodeService.get_services(proxmox, node.name)
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result["data"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/nodes/{node_id}/services/{service}/start")
def start_node_service(
    service: str, proxmox_data: ProxmoxWithNode = Depends(get_proxmox_from_node)
):
    """Start a system service on a node"""
    proxmox, node, cluster = proxmox_data

    try:
        result = ProxmoxNodeService.start_service(proxmox, node.name, service)
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/nodes/{node_id}/services/{service}/stop")
def stop_node_service(
    service: str, proxmox_data: ProxmoxWithNode = Depends(get_proxmox_from_node)
):
    """Stop a system service on a node"""
    proxmox, node, cluster = proxmox_data

    try:
        result = ProxmoxNodeService.stop_service(proxmox, node.name, service)
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/nodes/{node_id}/services/{service}/restart")
def restart_node_service(
    service: str, proxmox_data: ProxmoxWithNode = Depends(get_proxmox_from_node)
):
    """Restart a system service on a node"""
    proxmox, node, cluster = proxmox_data

    try:
        result = ProxmoxNodeService.restart_service(proxmox, node.name, service)
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/nodes/{node_id}/time")
def get_node_time(proxmox_data: ProxmoxWithNode = Depends(get_proxmox_from_node)):
    """Get node time information"""
    proxmox, node, cluster = proxmox_data

    try:
        result = ProxmoxNodeService.get_node_time(proxmox, node.name)
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result["data"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/nodes/{node_id}/tasks")
def get_node_tasks(
    limit: Optional[int] = Query(100, description="Limit number of tasks"),
    proxmox_data: ProxmoxWithNode = Depends(get_proxmox_from_node),
):
    """Get tasks running on a node"""
    proxmox, node, cluster = proxmox_data

    try:
        result = ProxmoxNodeService.get_node_tasks(proxmox, node.name, limit)
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result["data"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
