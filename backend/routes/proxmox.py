from fastapi import APIRouter, Depends, HTTPException, status, Path, Body
from sqlmodel import Session, select
from typing import List, Dict, Any
import uuid
import logging

from backend.db import get_session
from backend.core import settings
from backend.utils.auth_utils import get_current_user, get_admin_user
from backend.models.users import User
from backend.models.vps_instances import VPSInstance
from backend.models.proxmox_vms import ProxmoxVM
from backend.models.proxmox_nodes import ProxmoxNode
from backend.models.proxmox_clusters import ProxmoxCluster
from backend.models.vm_templates import VMTemplate
from backend.schemas.proxmox import (
    VMPowerActionRequest,
    VMStatusResponse,
    VMInfoResponse,
    VNCAccessResponse,
    SnapshotCreateRequest,
    SnapshotListResponse,
    SnapshotRestoreRequest,
    SnapshotInfo,
    VMCreateRequest,
    VMDeploymentResponse,
    VMConfigUpdateRequest,
    VMResizeDiskRequest,
    ClusterStatusResponse,
    ClusterResourcesResponse,
    TaskStatusResponse,
    OperationResponse,
    ErrorResponse,
    NodeInfo,
)
from backend.services.proxmox import (
    CommonProxmoxService,
    ProxmoxVMService,
    ProxmoxClusterService,
    ProxmoxNodeService,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/vps", tags=["VPS Management"])
admin_router = APIRouter(prefix="/admin/vps", tags=["Admin - VPS Management"])


# ============================================================================
# Helper Functions
# ============================================================================


async def get_user_vps_instance(
    vps_id: uuid.UUID,
    current_user: User,
    session: Session,
) -> tuple[VPSInstance, ProxmoxVM, ProxmoxNode]:
    """
    Get VPS instance and verify ownership

    Returns:
        tuple: (VPSInstance, ProxmoxVM, ProxmoxNode)
    """
    # Get VPS instance
    vps = session.get(VPSInstance, vps_id)
    if not vps:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="VPS instance not found",
        )

    # Verify ownership
    if vps.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this VPS",
        )

    # Check VPS status
    if vps.status == "terminated":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="VPS has been terminated",
        )

    # Get VM details
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

    # Get node details
    node = session.get(ProxmoxNode, vm.node_id)
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Node not found",
        )

    return vps, vm, node


async def get_proxmox_connection(cluster_id: uuid.UUID, session: Session):
    """Get Proxmox API connection for cluster"""
    cluster = session.get(ProxmoxCluster, cluster_id)
    if not cluster:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proxmox cluster not found",
        )

    try:
        proxmox = CommonProxmoxService.get_connection(
            host=settings.PROXMOX_HOST,
            port=settings.PROXMOX_PORT,
            user=settings.PROXMOX_USERNAME,
            password=settings.PROXMOX_PASSWORD,
            verify_ssl=False,
        )
        return proxmox
    except Exception as e:
        logger.error(f"Failed to connect to Proxmox cluster {cluster_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to connect to Proxmox cluster",
        )


# ============================================================================
# User Endpoints - VPS Power Management
# ============================================================================


@router.get("/my-vps", response_model=List[Dict[str, Any]])
async def list_my_vps(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """List all VPS instances owned by current user"""
    statement = (
        select(VPSInstance)
        .where(VPSInstance.user_id == current_user.id)
        .where(VPSInstance.status != "terminated")
    )
    vps_list = session.exec(statement).all()

    result = []
    for vps in vps_list:
        vps_data = {
            "id": str(vps.id),
            "status": vps.status,
            "expires_at": vps.expires_at.isoformat(),
            "auto_renew": vps.auto_renew,
            "created_at": vps.created_at.isoformat(),
        }

        # Add VM details if available
        if vps.vm_id:
            vm = session.get(ProxmoxVM, vps.vm_id)
            if vm:
                vps_data.update(
                    {
                        "vmid": vm.vmid,
                        "hostname": vm.hostname,
                        "ip_address": vm.ip_address,
                        "vcpu": vm.vcpu,
                        "ram_gb": vm.ram_gb,
                        "storage_gb": vm.storage_gb,
                        "power_status": vm.power_status,
                    }
                )

        result.append(vps_data)

    return result


@router.get("/{vps_id}/status", response_model=VMStatusResponse)
async def get_vps_status(
    vps_id: uuid.UUID = Path(..., description="VPS instance ID"),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get current status of a VPS"""
    vps, vm, node = await get_user_vps_instance(vps_id, current_user, session)
    proxmox = await get_proxmox_connection(vm.cluster_id, session)

    try:
        vm_status = ProxmoxVMService.get_vm_status(proxmox, node.node_name, vm.vmid)

        return VMStatusResponse(
            vmid=vm.vmid,
            hostname=vm.hostname,
            status=vm_status.get("status", "unknown"),
            uptime=vm_status.get("uptime"),
            cpu_usage=vm_status.get("cpu"),
            memory_used=vm_status.get("mem"),
            memory_total=vm_status.get("maxmem"),
            disk_used=vm_status.get("disk"),
            disk_total=vm_status.get("maxdisk"),
            ip_address=vm.ip_address,
        )
    except Exception as e:
        logger.error(f"Failed to get VM status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get VM status",
        )


@router.get("/{vps_id}/info", response_model=VMInfoResponse)
async def get_vps_info(
    vps_id: uuid.UUID = Path(..., description="VPS instance ID"),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get comprehensive information about a VPS"""
    vps, vm, node = await get_user_vps_instance(vps_id, current_user, session)
    proxmox = await get_proxmox_connection(vm.cluster_id, session)

    try:
        vm_info = ProxmoxVMService.get_vm_info(proxmox, node.node_name, vm.vmid)

        # Get template name if available
        template_name = None
        if vm.template_id:
            template = session.get(VMTemplate, vm.template_id)
            if template:
                template_name = template.template_name

        return VMInfoResponse(
            vmid=vm.vmid,
            node=node.node_name,
            hostname=vm.hostname,
            description=vm_info.get("description"),
            status=vm_info.get("status", "unknown"),
            uptime=vm_info.get("uptime"),
            cores=vm_info.get("cores", vm.vcpu),
            memory=vm_info.get("memory", vm.ram_gb * 1024),
            disk_info=vm_info.get("disk_info", {}),
            network_info=vm_info.get("network_info", {}),
            ip_address=vm.ip_address,
            os_type=vm_info.get("ostype"),
            template_used=template_name,
        )
    except Exception as e:
        logger.error(f"Failed to get VM info: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get VM information",
        )


@router.post("/{vps_id}/power", response_model=OperationResponse)
async def control_vps_power(
    vps_id: uuid.UUID = Path(..., description="VPS instance ID"),
    action_request: VMPowerActionRequest = Body(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Control VPS power state

    Available actions:
    - start: Start the VPS
    - stop: Force stop (immediate, may cause data loss)
    - shutdown: Graceful shutdown
    - reboot: Graceful reboot
    - reset: Force reset
    - suspend: Suspend/pause the VPS
    - resume: Resume from suspended state
    """
    vps, vm, node = await get_user_vps_instance(vps_id, current_user, session)

    # Check if VPS is suspended (billing)
    if vps.status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="VPS is suspended due to payment. Please renew your subscription.",
        )

    proxmox = await get_proxmox_connection(vm.cluster_id, session)

    try:
        action = action_request.action
        result = None

        if action == "start":
            result = ProxmoxVMService.start_vm(proxmox, node.node_name, vm.vmid)
        elif action == "stop":
            result = ProxmoxVMService.stop_vm(proxmox, node.node_name, vm.vmid)
        elif action == "shutdown":
            result = ProxmoxVMService.shutdown_vm(proxmox, node.node_name, vm.vmid)
        elif action == "reboot":
            result = ProxmoxVMService.reboot_vm(proxmox, node.node_name, vm.vmid)
        elif action == "reset":
            result = ProxmoxVMService.reset_vm(proxmox, node.node_name, vm.vmid)
        elif action == "suspend":
            result = ProxmoxVMService.suspend_vm(proxmox, node.node_name, vm.vmid)
        elif action == "resume":
            result = ProxmoxVMService.resume_vm(proxmox, node.node_name, vm.vmid)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid action: {action}",
            )

        # Update VM power status in database
        if action in ["start", "resume"]:
            vm.power_status = "running"
        elif action in ["stop", "shutdown"]:
            vm.power_status = "stopped"
        elif action == "suspend":
            vm.power_status = "suspended"

        session.add(vm)
        session.commit()

        return OperationResponse(
            success=result.get("success", False),
            message=result.get("message", "Operation completed"),
            task_id=result.get("task"),
        )

    except Exception as e:
        logger.error(f"Failed to perform power action {action}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to {action} VPS",
        )


@router.get("/{vps_id}/vnc", response_model=VNCAccessResponse)
async def get_vps_vnc_access(
    vps_id: uuid.UUID = Path(..., description="VPS instance ID"),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Get VNC access credentials for VPS

    Returns WebSocket URL and authentication credentials for VNC console access
    """
    vps, vm, node = await get_user_vps_instance(vps_id, current_user, session)

    # Check if VPS is active
    if vps.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="VPS must be active to access VNC console",
        )

    proxmox = await get_proxmox_connection(vm.cluster_id, session)

    try:
        vnc_info = ProxmoxVMService.get_vnc_info(proxmox, node.node_name, vm.vmid)

        # Get cluster for building VNC URL
        cluster = session.get(ProxmoxCluster, vm.cluster_id)

        # Build WebSocket URL for VNC
        vnc_port = vnc_info["task"]["port"]
        ticket = vnc_info["task"]["ticket"]

        # WebSocket URL format: wss://host:port/?vncticket=ticket
        vnc_url = f"wss://{cluster.host}:{vnc_port}/?vncticket={ticket}"

        return VNCAccessResponse(
            vnc_url=vnc_url,
            vnc_port=vnc_port,
            vnc_password=vm.vnc_password,
            ticket=ticket,
            expires_in=7200,  # VNC ticket typically expires in 2 hours
        )

    except Exception as e:
        logger.error(f"Failed to get VNC info: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get VNC access information",
        )


# ============================================================================
# User Endpoints - Snapshot Management
# ============================================================================


@router.get("/{vps_id}/snapshots", response_model=SnapshotListResponse)
async def list_vps_snapshots(
    vps_id: uuid.UUID = Path(..., description="VPS instance ID"),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """List all snapshots for a VPS"""
    vps, vm, node = await get_user_vps_instance(vps_id, current_user, session)
    proxmox = await get_proxmox_connection(vm.cluster_id, session)

    try:
        snapshots_raw = ProxmoxVMService.list_snapshots(
            proxmox, node.node_name, vm.vmid
        )

        # Filter out 'current' snapshot which is not a real snapshot
        snapshots = [
            SnapshotInfo(
                name=snap.get("name"),
                description=snap.get("description"),
                snaptime=snap.get("snaptime"),
                vmstate=snap.get("vmstate"),
                parent=snap.get("parent"),
            )
            for snap in snapshots_raw
            if snap.get("name") != "current"
        ]

        return SnapshotListResponse(snapshots=snapshots, total=len(snapshots))

    except Exception as e:
        logger.error(f"Failed to list snapshots: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list snapshots",
        )


@router.post("/{vps_id}/snapshots", response_model=OperationResponse)
async def create_vps_snapshot(
    vps_id: uuid.UUID = Path(..., description="VPS instance ID"),
    snapshot_request: SnapshotCreateRequest = Body(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Create a snapshot of VPS

    Note: Creating snapshots may temporarily affect VPS performance
    """
    vps, vm, node = await get_user_vps_instance(vps_id, current_user, session)

    # Check VPS status
    if vps.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="VPS must be active to create snapshots",
        )

    proxmox = await get_proxmox_connection(vm.cluster_id, session)

    try:
        # Check if snapshot name already exists
        existing_snapshots = ProxmoxVMService.list_snapshots(
            proxmox, node.node_name, vm.vmid
        )
        if any(
            snap.get("name") == snapshot_request.name for snap in existing_snapshots
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Snapshot with this name already exists",
            )

        result = ProxmoxVMService.create_snapshot(
            proxmox,
            node.node_name,
            vm.vmid,
            snapshot_request.name,
            snapshot_request.description or "",
        )

        return OperationResponse(
            success=result.get("success", False),
            message=result.get("message", "Snapshot creation initiated"),
            task_id=result.get("task"),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create snapshot: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create snapshot",
        )


@router.post("/{vps_id}/snapshots/restore", response_model=OperationResponse)
async def restore_vps_snapshot(
    vps_id: uuid.UUID = Path(..., description="VPS instance ID"),
    restore_request: SnapshotRestoreRequest = Body(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Restore VPS to a snapshot

    Warning: This will revert all changes made after the snapshot was created
    """
    vps, vm, node = await get_user_vps_instance(vps_id, current_user, session)
    proxmox = await get_proxmox_connection(vm.cluster_id, session)

    try:
        # Verify snapshot exists
        snapshots = ProxmoxVMService.list_snapshots(proxmox, node.node_name, vm.vmid)
        if not any(
            snap.get("name") == restore_request.snapshot_name for snap in snapshots
        ):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Snapshot not found",
            )

        result = ProxmoxVMService.rollback_snapshot(
            proxmox, node.node_name, vm.vmid, restore_request.snapshot_name
        )

        return OperationResponse(
            success=result.get("success", False),
            message=result.get("message", "Snapshot restore initiated"),
            task_id=result.get("task"),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to restore snapshot: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to restore snapshot",
        )


@router.delete("/{vps_id}/snapshots/{snapshot_name}", response_model=OperationResponse)
async def delete_vps_snapshot(
    vps_id: uuid.UUID = Path(..., description="VPS instance ID"),
    snapshot_name: str = Path(..., description="Snapshot name to delete"),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Delete a VPS snapshot"""
    vps, vm, node = await get_user_vps_instance(vps_id, current_user, session)
    proxmox = await get_proxmox_connection(vm.cluster_id, session)

    try:
        # Verify snapshot exists
        snapshots = ProxmoxVMService.list_snapshots(proxmox, node.node_name, vm.vmid)
        if not any(snap.get("name") == snapshot_name for snap in snapshots):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Snapshot not found",
            )

        result = ProxmoxVMService.delete_snapshot(
            proxmox, node.node_name, vm.vmid, snapshot_name
        )

        return OperationResponse(
            success=result.get("success", False),
            message=result.get("message", "Snapshot deletion initiated"),
            task_id=result.get("task"),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete snapshot: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete snapshot",
        )


# ============================================================================
# Admin Endpoints - VM Creation and Management
# ============================================================================


@admin_router.post("/deploy", response_model=VMDeploymentResponse)
async def deploy_vps_for_user(
    vm_request: VMCreateRequest = Body(...),
    current_user: User = Depends(get_admin_user),
    session: Session = Depends(get_session),
):
    """
    Deploy a new VPS for a user from template

    This endpoint is for admins to provision VPS after user payment
    """
    # Verify user exists
    user_id = uuid.UUID(vm_request.user_id)
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Verify VPS plan exists
    from backend.models.vps_plans import VPSPlan

    plan_id = uuid.UUID(vm_request.vps_plan_id)
    plan = session.get(VPSPlan, plan_id)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="VPS plan not found",
        )

    # Get template
    template = session.get(VMTemplate, vm_request.template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found",
        )

    # Select node (auto-select if not specified)
    node = None
    if vm_request.node:
        statement = select(ProxmoxNode).where(ProxmoxNode.node_name == vm_request.node)
        node = session.exec(statement).first()
    else:
        # Auto-select node with most available resources
        statement = select(ProxmoxNode).where(ProxmoxNode.status == "online")
        nodes = session.exec(statement).all()
        if not nodes:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="No available nodes",
            )
        # Simple selection: first available node
        # TODO: Implement smarter selection based on resources
        node = nodes[0]

    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Node not found",
        )

    # Get Proxmox connection
    proxmox = await get_proxmox_connection(node.cluster_id, session)

    try:
        # Get next available VMID
        vmid = CommonProxmoxService.get_next_vmid(proxmox)

        # Create VM from template
        result = ProxmoxVMService.create_vm(
            proxmox=proxmox,
            node=node.node_name,
            vmid=vmid,
            name=vm_request.hostname,
            cores=plan.vcpu,
            memory=plan.ram_gb * 1024,
            storage=vm_request.storage,
            template_id=vm_request.template_id,
        )

        # Create ProxmoxVM record
        new_vm = ProxmoxVM(
            cluster_id=node.cluster_id,
            node_id=node.id,
            template_id=template.id,
            vmid=vmid,
            hostname=vm_request.hostname,
            vcpu=plan.vcpu,
            ram_gb=plan.ram_gb,
            storage_gb=plan.storage_gb,
            storage_type=plan.storage_type,
            bandwidth_mbps=plan.bandwidth_mbps,
            power_status="stopped",
        )
        session.add(new_vm)
        session.flush()

        # Create VPSInstance record
        from datetime import datetime, timedelta

        expires_at = datetime.utcnow() + timedelta(days=30)  # Default 30 days
        vps_instance = VPSInstance(
            user_id=user_id,
            vps_plan_id=plan_id,
            vm_id=new_vm.id,
            status="creating",
            expires_at=expires_at,
        )
        session.add(vps_instance)
        session.commit()

        return VMDeploymentResponse(
            task_id=result.get("task", ""),
            vmid=vmid,
            hostname=vm_request.hostname,
            status="creating",
            message="VPS deployment initiated successfully",
        )

    except Exception as e:
        session.rollback()
        logger.error(f"Failed to deploy VPS: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to deploy VPS: {str(e)}",
        )


@admin_router.get("/cluster/status", response_model=ClusterStatusResponse)
async def get_cluster_status(
    cluster_id: uuid.UUID = Path(..., description="Cluster ID"),
    current_user: User = Depends(get_admin_user),
    session: Session = Depends(get_session),
):
    """Get Proxmox cluster status overview"""
    proxmox = await get_proxmox_connection(cluster_id, session)

    try:
        cluster_status = ProxmoxClusterService.get_cluster_status(proxmox)
        resources = ProxmoxClusterService.get_cluster_resources(proxmox)

        # Parse nodes
        nodes_info = []
        for item in cluster_status:
            if item.get("type") == "node":
                nodes_info.append(
                    NodeInfo(
                        node=item.get("name", ""),
                        status=item.get("status", "unknown"),
                        uptime=item.get("uptime"),
                        cpu_usage=item.get("cpu"),
                        memory_used=item.get("mem"),
                        memory_total=item.get("maxmem"),
                        disk_used=item.get("disk"),
                        disk_total=item.get("maxdisk"),
                    )
                )

        # Count VMs
        vms = [r for r in resources if r.get("type") in ["qemu", "lxc"]]
        running_vms = len([vm for vm in vms if vm.get("status") == "running"])

        # Calculate storage
        storage_items = [r for r in resources if r.get("type") == "storage"]
        total_storage = sum(s.get("maxdisk", 0) for s in storage_items)
        used_storage = sum(s.get("disk", 0) for s in storage_items)

        return ClusterStatusResponse(
            nodes=nodes_info,
            total_vms=len(vms),
            running_vms=running_vms,
            total_storage=total_storage,
            used_storage=used_storage,
        )

    except Exception as e:
        logger.error(f"Failed to get cluster status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get cluster status",
        )


@admin_router.get(
    "/cluster/{cluster_id}/resources", response_model=ClusterResourcesResponse
)
async def get_cluster_resources(
    cluster_id: uuid.UUID = Path(..., description="Cluster ID"),
    current_user: User = Depends(get_admin_user),
    session: Session = Depends(get_session),
):
    """Get all cluster resources (VMs, nodes, storage)"""
    proxmox = await get_proxmox_connection(cluster_id, session)

    try:
        resources = ProxmoxClusterService.get_cluster_resources(proxmox)

        vms = [r for r in resources if r.get("type") in ["qemu", "lxc"]]
        nodes = [r for r in resources if r.get("type") == "node"]
        storage = [r for r in resources if r.get("type") == "storage"]

        return ClusterResourcesResponse(
            resources=resources, vms=vms, nodes=nodes, storage=storage
        )

    except Exception as e:
        logger.error(f"Failed to get cluster resources: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get cluster resources",
        )


@admin_router.get("/task/{node}/{upid}", response_model=TaskStatusResponse)
async def get_task_status(
    node: str = Path(..., description="Node name"),
    upid: str = Path(..., description="Task UPID"),
    cluster_id: uuid.UUID = Path(..., description="Cluster ID"),
    current_user: User = Depends(get_admin_user),
    session: Session = Depends(get_session),
):
    """Get Proxmox task status"""
    proxmox = await get_proxmox_connection(cluster_id, session)

    try:
        task_status = CommonProxmoxService.get_task_status(proxmox, node, upid)

        return TaskStatusResponse(
            status=task_status.get("status", "unknown"),
            exitstatus=task_status.get("exitstatus"),
            upid=upid,
            type=task_status.get("type", "unknown"),
            node=node,
            pid=task_status.get("pid"),
            pstart=task_status.get("pstart"),
            starttime=task_status.get("starttime"),
            user=task_status.get("user"),
        )

    except Exception as e:
        logger.error(f"Failed to get task status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get task status",
        )
