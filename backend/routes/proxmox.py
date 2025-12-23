import uuid
from fastapi import APIRouter, HTTPException, Path, status, Depends, Query
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
    ProxmoxClusterService,
    ProxmoxNodeService,
    ProxmoxStorageService,
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


class VMConfigRequest(BaseModel):
    """Request model for updating VM configuration"""

    name: Optional[str] = Field(None, description="VM name")
    cores: Optional[int] = Field(None, description="Number of CPU cores")
    memory: Optional[int] = Field(None, description="RAM in MB")
    description: Optional[str] = Field(None, description="VM description")
    ciuser: Optional[str] = Field(None, description="Username for VM access")
    cipassword: Optional[str] = Field(None, description="Password for VM access")
    ipconfig0: Optional[str] = Field(None, description="IP configuration for VM")


class DiskResizeRequest(BaseModel):
    """Request model for resizing VM disk"""

    node_name: str = Field(..., description="Node name")
    disk: str = Field(..., description="Disk identifier (e.g., scsi0)")
    size: str = Field(..., description="Size increment (e.g., +10G)")


# ============================================================================
# Cluster Management Endpoints
# ============================================================================
@router.post("/clusters/test-connection")
async def test_connection(
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
async def list_clusters(session: Session = Depends(get_session)):
    """List all registered Proxmox clusters"""
    clusters = session.exec(select(ProxmoxCluster)).all()
    return [cluster.to_dict() for cluster in clusters]


@router.get("/clusters/{cluster_id}")
async def get_cluster(cluster_id: uuid.UUID, session: Session = Depends(get_session)):
    """Get cluster details by ID"""
    cluster = session.get(ProxmoxCluster, cluster_id)
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")
    return cluster.to_dict()


@router.post("/clusters")
async def create_cluster(
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


@router.put("/clusters/{cluster_id}")
async def update_cluster(
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
async def delete_cluster(
    cluster_id: uuid.UUID, session: Session = Depends(get_session)
):
    """Delete a cluster record"""
    cluster = session.get(ProxmoxCluster, cluster_id)
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")

    session.delete(cluster)
    session.commit()

    return {"message": "Cluster deleted successfully"}


@router.get("/clusters/{cluster_id}/version")
async def get_cluster_version(
    proxmox_data: ProxmoxWithCluster = Depends(get_proxmox_from_cluster),
):
    """Get Proxmox version information"""
    proxmox, cluster = proxmox_data

    try:
        return await CommonProxmoxService.get_version(proxmox)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Node Management Endpoints
# ============================================================================


@router.get("/clusters/{cluster_id}/nodes")
async def list_nodes(cluster_id: uuid.UUID, session: Session = Depends(get_session)):
    """List all nodes in a cluster"""
    nodes = session.exec(
        select(ProxmoxNode).where(ProxmoxNode.cluster_id == cluster_id)
    ).all()
    return [node.to_dict() for node in nodes]


@router.get("/nodes/{node_id}")
async def get_node(node_id: uuid.UUID, session: Session = Depends(get_session)):
    """Get node details"""
    node = session.get(ProxmoxNode, node_id)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    return node.to_dict()


@router.get("/nodes/{node_id}/status")
async def get_node_live_status(
    proxmox_data: ProxmoxWithNode = Depends(get_proxmox_from_node),
):
    """Get live status of a node from Proxmox"""
    proxmox, node, cluster = proxmox_data

    try:
        return await ProxmoxNodeService.get_node_status(proxmox, node.name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Storage Management Endpoints
# ============================================================================


@router.get("/nodes/{node_id}/storages")
async def list_storages(node_id: uuid.UUID, session: Session = Depends(get_session)):
    """List storages for a node"""
    storages = session.exec(
        select(ProxmoxStorage).where(ProxmoxStorage.node_id == node_id)
    ).all()
    return [storage.to_dict() for storage in storages]


@router.get("/nodes/{node_id}/storages/live")
async def list_live_storages(
    proxmox_data: ProxmoxWithNode = Depends(get_proxmox_from_node),
):
    """Get live storage information from Proxmox"""
    proxmox, node, cluster = proxmox_data

    try:
        return await ProxmoxStorageService.get_storages(proxmox, node.name)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


# ============================================================================
# VM Management Endpoints
# ============================================================================


@router.get("/clusters/{cluster_id}/vms")
async def list_cluster_vms(
    cluster_id: uuid.UUID, session: Session = Depends(get_session)
):
    """List all VMs in a cluster"""
    vms = session.exec(
        select(ProxmoxVM).where(ProxmoxVM.cluster_id == cluster_id)
    ).all()
    return [vm.to_dict() for vm in vms]


@router.get("/nodes/{node_id}/vms/live")
async def list_live_vms(proxmox_data: ProxmoxWithNode = Depends(get_proxmox_from_node)):
    """Get live VM list from Proxmox"""
    proxmox, node, cluster = proxmox_data

    try:
        return ProxmoxVMService.get_vms(proxmox, node.name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/vms/{vm_id}")
async def get_vm(vm_id: uuid.UUID, session: Session = Depends(get_session)):
    """Get VM details"""
    vm = session.get(ProxmoxVM, vm_id)
    if not vm:
        raise HTTPException(status_code=404, detail="VM not found")
    return vm.to_dict()


@router.get("/vms/{vm_id}/status")
async def get_vm_live_status(
    proxmox_data: ProxmoxWithVM = Depends(get_proxmox_from_vm),
):
    """Get live VM status from Proxmox"""
    proxmox, vm, template, node, cluster = proxmox_data

    try:
        return ProxmoxVMService.get_vm_status(proxmox, node.name, vm.vmid)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/vms/{vm_id}/config")
async def get_vm_config(proxmox_data: ProxmoxWithVM = Depends(get_proxmox_from_vm)):
    """Get VM configuration from Proxmox"""
    proxmox, vm, node = proxmox_data

    try:
        return ProxmoxVMService.get_vm_config(proxmox, node.name, vm.vmid)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/vms/{vm_id}/config")
async def set_vm_config(
    vm_id: int,
    config_data: VMConfigRequest,
    # proxmox_data: ProxmoxWithVM = Depends(get_proxmox_from_vm),
    session: Session = Depends(get_session),
):
    """Set VM configuration"""
    # proxmox, vm, node = proxmox_data
    proxmox = CommonProxmoxService.get_connection(
        host=settings.PROXMOX_HOST,
        port=settings.PROXMOX_PORT,
        user=settings.PROXMOX_USER,
        password=settings.PROXMOX_PASSWORD,
        verify_ssl=False,
    )

    try:
        result = ProxmoxVMService.update_vm_config(
            proxmox, "pve", vm_id, **config_data.model_dump(exclude_unset=True)
        )

        # config_dict = config_data.model_dump(exclude_unset=True)
        # for key, value in config_dict.items():
        #     if key in {"cores", "memory"}:
        #         if key == "cores":
        #             vm.vcpu = value
        #         elif key == "memory":
        #             vm.ram_gb = value // 1024  # Convert MB to GB
        #     else:
        #         setattr(vm, key, value)

        # session.add(vm)
        # session.commit()

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/vms/{vm_id}/ip",
    status_code=status.HTTP_200_OK,
    summary="Get VM IP Address",
    description="Retrieve the IP address of a VM using Proxmox Guest Agent",
)
async def get_vm_network(
    vm_id: int = Path(..., description="VM ID"),
    proxmoxWithVM: ProxmoxWithVM = Depends(get_proxmox_from_vm),
):
    """Get VM IP address from Proxmox"""
    proxmox, vm, template, node, cluster = proxmoxWithVM

    try:
        return await ProxmoxVMService.get_vm_network(proxmox, node.name, vm_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/vms/{vm_id}/disk-usage",
    status_code=status.HTTP_200_OK,
    summary="Get VM Disk Usage",
    description="Retrieve the disk usage information of a VM",
)
async def get_vm_disk_usage(
    vm_id: int = Path(..., description="VM ID"),
    proxmoxWithVM: ProxmoxWithVM = Depends(get_proxmox_from_vm),
):
    """Get VM disk usage from Proxmox"""
    proxmox, vm, template, node, cluster = proxmoxWithVM

    try:
        return await ProxmoxVMService.get_vm_disk_usage(proxmox, node.name, vm_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/vms/{vm_id}/rrddata",
    status_code=status.HTTP_200_OK,
    summary="Get VM RRD Data",
    description="Retrieve the RRD data (performance metrics) of a VM",
)
async def get_vm_rrddata(
    vm_id: int = Path(..., description="VM ID"),
    timeframe: Optional[str] = Query(None, description="Timeframe for RRD data"),
    cf: Optional[str] = Query(None, description="Consolidation function"),
    proxmoxWithVM: ProxmoxWithVM = Depends(get_proxmox_from_vm),
):
    """Get VM RRD data from Proxmox"""
    proxmox, vm, template, node, cluster = proxmoxWithVM

    try:
        params = {}
        if timeframe:
            params["timeframe"] = timeframe
        if cf:
            params["cf"] = cf

        return await ProxmoxVMService.get_rrddata(proxmox, node.name, vm_id, **params)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/vms/{vm_id}/start")
async def start_vm(
    proxmox_data: ProxmoxWithVM = Depends(get_proxmox_from_vm),
    session: Session = Depends(get_session),
):
    """Start a VM"""
    proxmox, vm, template, node, cluster = proxmox_data

    try:
        result = await ProxmoxVMService.start_vm(proxmox, node.name, vm.vmid)

        vm.power_status = "running"
        session.add(vm)
        session.commit()

        return result
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/vms/{vm_id}/clone",
    summary="Clone a VM",
    description="Clone a VM from an existing VM.",
)
async def clone_vm(
    vm_id: int,
    proxmox_data: ProxmoxWithVM = Depends(get_proxmox_from_vm),
):
    """Clone a VM"""
    proxmox, vm, template, node, cluster = proxmox_data

    try:
        result = await ProxmoxVMService.create_vm(
            proxmox, node.name, vm_id, template.template_vmid, "cloned-vm"
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.post("/vms/{vm_id}/stop")
async def stop_vm(
    proxmox_data: ProxmoxWithVM = Depends(get_proxmox_from_vm),
    session: Session = Depends(get_session),
):
    """Stop a VM"""
    proxmox, vm, template, node, cluster = proxmox_data

    try:
        result = await ProxmoxVMService.stop_vm(proxmox, node.name, vm.vmid)

        vm.power_status = "stopped"
        session.add(vm)
        session.commit()

        return result
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/vms/{vm_id}/shutdown")
async def shutdown_vm(
    vm_id: str | int, proxmox: ProxmoxConnection = Depends(get_default_proxmox)
):
    """Gracefully shutdown a VM"""
    try:
        return await ProxmoxVMService.shutdown_vm(proxmox, "pve", vm_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/vms/{vm_id}/reboot")
async def reboot_vm(proxmox_data: ProxmoxWithVM = Depends(get_proxmox_from_vm)):
    """Reboot a VM"""
    proxmox, vm, template, node, cluster = proxmox_data

    try:
        return await ProxmoxVMService.reboot_vm(proxmox, node.name, vm.vmid)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/vms/{vm_id}/reset")
async def reset_vm(proxmox_data: ProxmoxWithVM = Depends(get_proxmox_from_vm)):
    """Reset (hard reboot) a VM"""
    proxmox, vm, template, node, cluster = proxmox_data

    try:
        return await ProxmoxVMService.reset_vm(proxmox, node.name, vm.vmid)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/vms/{vm_id}/suspend")
async def suspend_vm(
    proxmox_data: ProxmoxWithVM = Depends(get_proxmox_from_vm),
    session: Session = Depends(get_session),
):
    """Suspend a VM"""
    proxmox, vm, template, node, cluster = proxmox_data

    try:
        result = await ProxmoxVMService.suspend_vm(proxmox, node.name, vm.vmid)

        # Update VM power status
        vm.power_status = "suspended"
        vm.updated_at = datetime.now(timezone.utc)
        session.add(vm)
        session.commit()

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/vms/{vm_id}/resume")
async def resume_vm(
    proxmox_data: ProxmoxWithVM = Depends(get_proxmox_from_vm),
    session: Session = Depends(get_session),
):
    """Resume a suspended VM"""
    proxmox, vm, template, node, cluster = proxmox_data

    try:
        result = await ProxmoxVMService.resume_vm(proxmox, node.name, vm.vmid)

        # Update VM power status
        vm.power_status = "running"
        vm.updated_at = datetime.now(timezone.utc)
        session.add(vm)
        session.commit()

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/vms/{vm_id}")
async def delete_vm(
    vm_id: str | int, proxmox: ProxmoxConnection = Depends(get_default_proxmox)
):
    """Delete a VM"""
    try:
        result = await ProxmoxVMService.delete_vm(proxmox, "pve", vm_id)
        return {"message": "VM deleted successfully", "task": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/vms/{vm_id}/resize-disk")
async def resize_vm_disk(
    resize_data: DiskResizeRequest,
    proxmox_data: ProxmoxWithVM = Depends(get_proxmox_from_vm),
):
    """Resize VM disk"""
    proxmox, vm, template, node, cluster = proxmox_data

    try:
        return await ProxmoxVMService.resize_vm_disk(
            proxmox, node.name, vm.vmid, resize_data.disk, resize_data.size
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/vms/{vm_id}/vnc")
async def get_vm_vnc(
    vm_id: int,
    session: Session = Depends(get_session),
):
    """Get VNC connection info for a VM"""

    proxmox = CommonProxmoxService.get_connection(
        host=settings.PROXMOX_HOST,
        port=settings.PROXMOX_PORT,
        user=settings.PROXMOX_USER,
        password=settings.PROXMOX_PASSWORD,
        verify_ssl=False,
    )

    try:
        vnc_info = await ProxmoxVMService.get_vnc_info(proxmox, "pve", vm_id)

        # Add host and node info for WebSocket connection
        vnc_info["host"] = settings.PROXMOX_HOST
        vnc_info["port"] = settings.PROXMOX_PORT
        vnc_info["node"] = "pve"
        vnc_info["vmid"] = vm_id

        # Add auth ticket for WebSocket proxy authentication
        # Get the auth ticket from proxmox connection
        auth_ticket = None
        if hasattr(proxmox, "_store") and "ticket" in proxmox._store:
            auth_ticket = proxmox._store["ticket"]
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
                auth_ticket = auth_data.get("ticket")

        vnc_info["authTicket"] = auth_ticket

        return vnc_info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Snapshot Management Endpoints
# ============================================================================


@router.get("/vms/{vm_id}/snapshots")
async def list_snapshots(proxmox_data: ProxmoxWithVM = Depends(get_proxmox_from_vm)):
    """List all snapshots for a VM"""
    proxmox, vm, template, node, cluster = proxmox_data

    try:
        result = await ProxmoxVMService.list_snapshots(proxmox, node.name, vm.vmid)

        snapshots = [
            {
                "name": snap.get("name"),
                "description": snap.get("description", ""),
                "vmid": snap.get("vmid"),
                "snaptime": snap.get("snaptime"),
                "size": snap.get("size", 0),
            }
            for snap in result
        ]
        return snapshots
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/vms/{vm_id}/snapshots")
async def create_snapshot(
    snapshot_data: SnapshotCreateRequest,
    proxmox_data: ProxmoxWithVM = Depends(get_proxmox_from_vm),
):
    """Create a snapshot for a VM"""
    proxmox, vm, template, node, cluster = proxmox_data

    try:
        return await ProxmoxVMService.create_snapshot(
            proxmox,
            node.name,
            vm.vmid,
            snapshot_data.snapname,
            snapshot_data.description or "",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/vms/{vm_id}/snapshots/rollback")
async def rollback_snapshot(
    snapshot_data: SnapshotActionRequest,
    proxmox_data: ProxmoxWithVM = Depends(get_proxmox_from_vm),
):
    """Rollback to a snapshot"""
    proxmox, vm, template, node, cluster = proxmox_data

    try:
        return await ProxmoxVMService.rollback_snapshot(
            proxmox, node.name, vm.vmid, snapshot_data.snapname
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/vms/{vm_id}/snapshots/{snapname}")
async def delete_snapshot(
    snapname: str,
    node_name: str = Query(..., description="Node name"),
    proxmox_data: ProxmoxWithVM = Depends(get_proxmox_from_vm),
):
    """Delete a snapshot"""
    proxmox, vm, template, node, cluster = proxmox_data

    try:
        return await CommonProxmoxService.delete_snapshot(
            proxmox, node_name, vm.vmid, snapname
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Template Management Endpoints
# ============================================================================


@router.get("/clusters/{cluster_id}/templates")
async def list_templates(
    cluster_id: uuid.UUID, session: Session = Depends(get_session)
):
    """List all VM templates in a cluster"""
    templates = session.exec(
        select(VMTemplate).where(VMTemplate.cluster_id == cluster_id)
    ).all()
    return [template.to_dict() for template in templates]


@router.get("/templates/{template_id}")
async def get_template(template_id: uuid.UUID, session: Session = Depends(get_session)):
    """Get template details"""
    template = session.get(VMTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template.to_dict()


@router.get("/clusters/{cluster_id}/next-vmid")
async def get_next_vmid(
    proxmox_data: ProxmoxWithCluster = Depends(get_proxmox_from_cluster),
):
    """Get next available VM ID"""
    proxmox, cluster = proxmox_data

    try:
        return {"vmid": await CommonProxmoxService.get_next_vmid(proxmox)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/clusters/{cluster_id}/resources")
async def get_cluster_resources(
    resource_type: Optional[str] = Query(
        None, description="Filter by type (vm, storage, node)"
    ),
    proxmox_data: ProxmoxWithCluster = Depends(get_proxmox_from_cluster),
):
    """Get all cluster resources"""
    proxmox, cluster = proxmox_data

    try:

        result = await ProxmoxClusterService.get_cluster_resources(
            proxmox, resource_type
        )
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result["data"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/clusters/{cluster_id}/status")
async def get_cluster_status(
    proxmox_data: ProxmoxWithCluster = Depends(get_proxmox_from_cluster),
):
    """Get cluster status information"""
    proxmox, cluster = proxmox_data

    try:
        result = await ProxmoxClusterService.get_cluster_status(proxmox)
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result["data"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/clusters/{cluster_id}/options")
async def get_cluster_options(
    proxmox_data: ProxmoxWithCluster = Depends(get_proxmox_from_cluster),
):
    """Get cluster configuration options"""
    proxmox, cluster = proxmox_data

    try:
        result = await ProxmoxClusterService.get_cluster_options(proxmox)
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result["data"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/clusters/{cluster_id}/options")
async def update_cluster_options(
    options: dict,
    proxmox_data: ProxmoxWithCluster = Depends(get_proxmox_from_cluster),
):
    """Update cluster configuration options"""
    proxmox, cluster = proxmox_data

    try:
        result = await ProxmoxClusterService.update_cluster_options(proxmox, **options)
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/clusters/{cluster_id}/tasks")
async def get_cluster_tasks(
    proxmox_data: ProxmoxWithCluster = Depends(get_proxmox_from_cluster),
):
    """Get all cluster tasks"""
    proxmox, cluster = proxmox_data

    try:
        result = await ProxmoxClusterService.get_cluster_tasks(proxmox)
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result["data"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tasks/{upid}/status")
async def get_task_status(
    upid: str,
    proxmox_data: ProxmoxWithCluster = Depends(get_proxmox_from_cluster),
):
    """Get status of a specific task by UPID"""
    proxmox, cluster = proxmox_data

    try:
        return await CommonProxmoxService.get_task_status(proxmox, upid)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/clusters/{cluster_id}/storages")
async def list_cluster_storages(
    proxmox_data: ProxmoxWithCluster = Depends(get_proxmox_from_cluster),
):
    """List all storages in cluster"""
    proxmox, cluster = proxmox_data

    try:
        result = await ProxmoxStorageService.get_storages(proxmox)
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result["data"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/clusters/{cluster_id}/storages/{storage_name}")
async def get_storage_config(
    storage_name: str,
    proxmox_data: ProxmoxWithCluster = Depends(get_proxmox_from_cluster),
):
    """Get storage configuration"""
    proxmox, cluster = proxmox_data

    try:
        result = await ProxmoxStorageService.get_storage_config(proxmox, storage_name)
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result["data"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/nodes/{node_id}/storage-status")
async def get_node_storage_status(
    storage: Optional[str] = Query(None, description="Filter by storage name"),
    content: Optional[str] = Query(None, description="Filter by content type"),
    proxmox_data: ProxmoxWithNode = Depends(get_proxmox_from_node),
):
    """Get storage status on a specific node"""
    proxmox, node, cluster = proxmox_data

    try:
        result = await ProxmoxStorageService.get_node_storage_status(
            proxmox, node.name, storage, content
        )
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result["data"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/nodes/{node_id}/storages/{storage_name}/content")
async def get_storage_content(
    storage_name: str,
    content_type: Optional[str] = Query(None, description="Filter by content type"),
    vmid: Optional[int] = Query(None, description="Filter by VM ID"),
    proxmox_data: ProxmoxWithNode = Depends(get_proxmox_from_node),
):
    """Get storage content (volumes, ISOs, templates)"""
    proxmox, node, cluster = proxmox_data

    try:
        result = await ProxmoxStorageService.get_storage_content(
            proxmox, node.name, storage_name, content_type, vmid
        )
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result["data"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
