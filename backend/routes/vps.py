from fastapi import APIRouter, Depends, HTTPException, Query, status, Path, Body
from sqlmodel import Session, select
from typing import List, Dict, Any, Optional
import asyncio
import uuid
import logging
from datetime import datetime, timezone, timedelta

from backend.db import get_session
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
    VPSPlan,
)
from backend.schemas import (
    VPSSetupRequest,
    VPSCredentials,
    VPSSetupItem,
    VPSSetupResponse,
    VPSInstanceResponse,
    # Proxmox Schemas
    VMPowerActionRequest,
    VMInfoResponse,
    VNCAccessResponse,
    SnapshotCreateRequest,
    SnapshotListResponse,
    SnapshotRestoreRequest,
    SnapshotInfo,
    VMCreateRequest,
    VMDeploymentResponse,
    ClusterStatusResponse,
    ClusterResourcesResponse,
    OperationResponse,
    NodeInfo,
)
from backend.services import (
    CommonProxmoxService,
    ProxmoxVMService,
    ProxmoxClusterService,
    VPSService,
)


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/vps", tags=["VPS Management"])
admin_router = APIRouter(prefix="/admin/vps", tags=["Admin - VPS Management"])


@router.get(
    "/my-vps",
    response_model=List[VPSInstanceResponse],
    status_code=status.HTTP_200_OK,
    summary="List My VPS Instances",
    description="Retrieve a list of VPS instances owned by the current user",
)
async def list_my_vps(
    skip: int = 0,
    limit: int = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    List VPS instances for the current user

    Args:
        skip (int, optional): Number of VPS instances to skip. Defaults to 0.
        limit (int, optional): Maximum number of VPS instances to return. Defaults to None.
        current_user (User, optional): The current authenticated user. Defaults to Depends(get_current_user).
        session (Session, optional): Database session. Defaults to Depends(get_session).

    Raises:
        HTTPException: 500 if retrieval fails

    Returns:
        List[Dict[str, Any]]: List of VPS instances with details
    """
    try:
        statement = (
            select(VPSInstance)
            .where(VPSInstance.user_id == current_user.id)
            .where(VPSInstance.status.notin_(["terminated", "error"]))
            .order_by(VPSInstance.created_at.desc())
            .offset(skip)
        )
        if limit is not None:
            statement = statement.limit(limit)
        vps_list = session.exec(statement).all()

        return vps_list
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f">>> Failed to list user VPS: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve VPS instances",
        )


@router.get(
    "/{vps_id}/info",
    response_model=VMInfoResponse,
    status_code=status.HTTP_200_OK,
    summary="Get VPS Information",
    description="Retrieve detailed information about a specific VPS instance",
)
async def get_vps_info(
    vps_id: uuid.UUID = Path(..., description="VPS instance ID"),
    current_user: User = Depends(get_current_user),
    proxmox: ProxmoxConnection = Depends(get_default_proxmox),
    session: Session = Depends(get_session),
):
    """
    Get detailed information about a VPS

    Args:
        vps_id (uuid.UUID, optional): VPS instance ID. Defaults to Path(...).
        current_user (User, optional): The current authenticated user. Defaults to Depends(get_current_user).
        proxmox (ProxmoxConnection, optional): Proxmox connection instance. Defaults to Depends(get_default_proxmox).
        session (Session, optional): Database session. Defaults to Depends(get_session).

    Raises:
        HTTPException: 401 if user is not authenticated
        HTTPException: 404 if VPSInstance, ProxmoxVM, or ProxmoxNode not found
        HTTPException: 403 if user does not own the VPS
        HTTPException: 400 if VPS is terminated or not linked to a VM
        HTTPException: 500 if retrieval fails

    Returns:
        VMInfoResponse: Detailed information about the VPS
    """
    try:
        vps, vm, node = await VPSService.get_user_vps_instance(
            vps_id, current_user, session
        )

        vm_info = await ProxmoxVMService.get_vm_info(proxmox, node.name, vm.vmid)
        if vm_info.get("status") != "running":
            disk_info = {}
        else:
            disk_info = await ProxmoxVMService.get_vm_disk_usage(
                proxmox, node.name, vm.vmid
            )

        return VMInfoResponse(
            node_name=node.name,
            vm=vm,
            vm_info=vm_info,
            disk_info=disk_info,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f">>> Failed to get VM info: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get VM information",
        )


@router.get(
    "/{vps_id}/rrd",
    response_model=List[Dict[str, Any]],
    status_code=status.HTTP_200_OK,
    summary="Get VPS RRD Data",
    description="Retrieve RRD (Resource Usage Data) for a specific VPS instance",
)
async def get_vps_rrd_data(
    vps_id: uuid.UUID = Path(..., description="VPS instance ID"),
    timeframe: Optional[str] = Query(None, description="Timeframe for RRD data"),
    cf: Optional[str] = Query(None, description="Consolidation function for RRD data"),
    current_user: User = Depends(get_current_user),
    proxmox: ProxmoxConnection = Depends(get_default_proxmox),
    session: Session = Depends(get_session),
):
    """
    Get RRD data (Resource Usage Data) for a VPS

    Args:
        vps_id (uuid.UUID, optional): VPS instance ID. Defaults to Path(..., description="VPS instance ID").
        timeframe (Optional[str], optional): Timeframe for RRD data. Defaults to Query(None, description="Timeframe for RRD data").
        cf (Optional[str], optional): Consolidation function for RRD data. Defaults to Query(None, description="Consolidation function for RRD data").
        current_user (User, optional): The current authenticated user. Defaults to Depends(get_current_user).
        proxmox (ProxmoxConnection, optional): Proxmox connection instance. Defaults to Depends(get_default_proxmox).
        session (Session, optional): Database session. Defaults to Depends(get_session).

    Raises:
        HTTPException: 401 if user is not authenticated
        HTTPException: 404 if VPSInstance, ProxmoxVM, or ProxmoxNode not found
        HTTPException: 403 if user does not own the VPS
        HTTPException: 500 if retrieval fails

    Returns:
        List[Dict[str, Any]]: RRD data points for the VPS
    """
    try:
        vps, vm, node = await VPSService.get_user_vps_instance(
            vps_id, current_user, session
        )

        params = {}
        if timeframe:
            params["timeframe"] = timeframe
        if cf:
            params["cf"] = cf

        rrd_data = await ProxmoxVMService.get_rrddata(
            proxmox, node.name, vm.vmid, **params
        )

        return rrd_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get RRD data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get RRD data",
        )


@router.post("/{vps_id}/power", response_model=OperationResponse)
async def control_vps_power(
    vps_id: uuid.UUID = Path(..., description="VPS instance ID"),
    action_request: VMPowerActionRequest = Body(
        ..., description="Power action request"
    ),
    current_user: User = Depends(get_current_user),
    proxmox: ProxmoxConnection = Depends(get_default_proxmox),
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

    Args:
        vps_id (uuid.UUID): VPS instance ID
        action_request (VMPowerActionRequest): Power action request
        current_user (User): The current authenticated user
        proxmox (ProxmoxConnection): Proxmox connection instance
        session (Session): Database session

    Raises:
        HTTPException: 401 if user is not authenticated
        HTTPException: 404 if VPSInstance, ProxmoxVM, or ProxmoxNode not found
        HTTPException: 403 if user does not own the VPS
        HTTPException: 400 if invalid action
        HTTPException: 500 if operation fails

    Returns:
        OperationResponse: Result of the power action
    """
    try:
        vps, vm, node = await VPSService.get_user_vps_instance(
            vps_id, current_user, session
        )

        # Check if VPS is suspended (billing)
        if vps.status == "suspended":
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="VPS is suspended due to non-payment",
            )

        action = action_request.action
        result = None

        if action == "start":
            result = await ProxmoxVMService.start_vm(proxmox, node.name, vm.vmid)
        elif action == "stop":
            result = await ProxmoxVMService.stop_vm(proxmox, node.name, vm.vmid)
        elif action == "shutdown":
            result = await ProxmoxVMService.shutdown_vm(proxmox, node.name, vm.vmid)
        elif action == "reboot":
            result = await ProxmoxVMService.reboot_vm(proxmox, node.name, vm.vmid)
        elif action == "reset":
            result = await ProxmoxVMService.reset_vm(proxmox, node.name, vm.vmid)
        elif action == "suspend":
            result = await ProxmoxVMService.suspend_vm(proxmox, node.name, vm.vmid)
        elif action == "resume":
            result = await ProxmoxVMService.resume_vm(proxmox, node.name, vm.vmid)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid power action",
            )

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
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f">>> Failed to perform power action {action}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to perform power action",
        )


@router.get("/{vps_id}/vnc", response_model=VNCAccessResponse)
async def get_vps_vnc_access(
    vps_id: uuid.UUID = Path(..., description="VPS instance ID"),
    current_user: User = Depends(get_current_user),
    proxmox: ProxmoxConnection = Depends(get_default_proxmox),
    session: Session = Depends(get_session),
):
    """
    Get VNC access credentials for VPS

    Returns WebSocket URL and authentication credentials for VNC console access
    """
    vps, vps, vm, node = await VPSService.get_user_vps_instance(
        vps_id, current_user, session
    )

    # Check if VPS is active
    if vps.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="VPS must be active to access VNC console",
        )

    try:
        vnc_info = await ProxmoxVMService.get_vnc_info(proxmox, node.name, vm.vmid)

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


@router.get(
    "/{vps_id}/snapshots",
    response_model=SnapshotListResponse,
    status_code=status.HTTP_200_OK,
    summary="List VPS Snapshots",
    description="Retrieve a list of snapshots for a specific VPS instance",
)
async def list_vps_snapshots(
    vps_id: uuid.UUID = Path(..., description="VPS instance ID"),
    current_user: User = Depends(get_current_user),
    proxmox: ProxmoxConnection = Depends(get_default_proxmox),
    session: Session = Depends(get_session),
):
    """
    List snapshots for a VPS

    Args:
        vps_id (uuid.UUID, optional): VPS instance ID. Defaults to Path(..., description="VPS instance ID").
        current_user (User, optional): Current authenticated user. Defaults to Depends(get_current_user).
        proxmox (ProxmoxConnection, optional): Proxmox connection instance. Defaults to Depends(get_default_proxmox).
        session (Session, optional): Database session. Defaults to Depends(get_session).

    Raises:
        HTTPException: 401 if user is not authenticated
        HTTPException: 404 if VPSInstance, ProxmoxVM, or ProxmoxNode not found
        HTTPException: 403 if user does not own the VPS
        HTTPException: 500 if retrieval fails

    Returns:
        SnapshotListResponse: List of snapshots for the VPS
    """
    try:
        vps, vm, node = await VPSService.get_user_vps_instance(
            vps_id, current_user, session
        )

        snapshots_raw = await ProxmoxVMService.list_snapshots(
            proxmox, node.name, vm.vmid
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

        return SnapshotListResponse(
            snapshots=snapshots,
            total=len(snapshots),
            max_snapshots=(
                session.get(VPSPlan, vps.vps_plan_id).max_snapshots
                if vps.vps_plan_id
                else 1
            ),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f">>> Failed to list snapshots: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list snapshots",
        )


@router.post(
    "/{vps_id}/snapshots",
    response_model=OperationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create VPS Snapshot",
    description="Create a new snapshot for a specific VPS instance",
)
async def create_vps_snapshot(
    vps_id: uuid.UUID = Path(..., description="VPS instance ID"),
    snapshot_request: SnapshotCreateRequest = Body(...),
    current_user: User = Depends(get_current_user),
    proxmox: ProxmoxConnection = Depends(get_default_proxmox),
    session: Session = Depends(get_session),
):
    """
    Create a snapshot for a VPS

    Args:
        vps_id (uuid.UUID, optional): VPS instance ID. Defaults to Path(...).
        snapshot_request (SnapshotCreateRequest, optional): Snapshot creation request data. Defaults to Body(...).
        current_user (User, optional): Current authenticated user. Defaults to Depends(get_current_user).
        proxmox (ProxmoxConnection, optional): Proxmox connection instance. Defaults to Depends(get_default_proxmox).
        session (Session, optional): Database session. Defaults to Depends(get_session).

    Raises:
        HTTPException: 401 if user is not authenticated
        HTTPException: 404 if VPSInstance, ProxmoxVM, or ProxmoxNode not found
        HTTPException: 403 if user does not own the VPS
        HTTPException: 500 if creation fails

    Returns:
        OperationResponse: Result of the snapshot creation
    """
    try:
        vps, vm, node = await VPSService.get_user_vps_instance(
            vps_id, current_user, session
        )

        if vps.status != "active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="VPS must be active to create snapshots",
            )

        existing_snapshots = await ProxmoxVMService.list_snapshots(
            proxmox, node.name, vm.vmid
        )

        # Filter out 'current' which is not a real snapshot
        real_snapshots = [s for s in existing_snapshots if s.get("name") != "current"]

        vps_plan = session.get(VPSPlan, vps.vps_plan_id)
        max_snapshots = vps_plan.max_snapshots if vps_plan else 1

        if len(real_snapshots) >= max_snapshots:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Snapshot limit reached for this VPS plan",
            )

        if any(
            snap.get("name") == snapshot_request.name for snap in existing_snapshots
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Snapshot with this name already exists",
            )

        result = await ProxmoxVMService.create_snapshot(
            proxmox,
            node.name,
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
        logger.error(f">>> Failed to create snapshot: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create snapshot",
        )


@router.post(
    "/{vps_id}/snapshots/restore",
    response_model=OperationResponse,
    status_code=status.HTTP_200_OK,
    summary="Restore VPS to Snapshot",
    description="Restore a VPS instance to a specific snapshot",
)
async def restore_vps_snapshot(
    vps_id: uuid.UUID = Path(..., description="VPS instance ID"),
    restore_request: SnapshotRestoreRequest = Body(...),
    current_user: User = Depends(get_current_user),
    proxmox: ProxmoxConnection = Depends(get_default_proxmox),
    session: Session = Depends(get_session),
):
    """
    Restore a VPS to a specific snapshot

    Args:
        vps_id (uuid.UUID, optional): VPS instance ID. Defaults to Path(...).
        restore_request (SnapshotRestoreRequest, optional): Snapshot restore request data. Defaults to Body(...).
        current_user (User, optional): Current authenticated user. Defaults to Depends(get_current_user).
        proxmox (ProxmoxConnection, optional): Proxmox connection instance. Defaults to Depends(get_default_proxmox).
        session (Session, optional): Database session. Defaults to Depends(get_session).

    Raises:
        HTTPException: 401 if user is not authenticated
        HTTPException: 404 if VPSInstance, ProxmoxVM, or ProxmoxNode not found
        HTTPException: 403 if user does not own the VPS
        HTTPException: 500 if restoration fails

    Returns:
        OperationResponse: Result of the snapshot restoration
    """
    try:
        vps, vm, node = await VPSService.get_user_vps_instance(
            vps_id, current_user, session
        )

        snapshots = await ProxmoxVMService.list_snapshots(proxmox, node.name, vm.vmid)
        if not any(
            snap.get("name") == restore_request.snapshot_name for snap in snapshots
        ):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Snapshot not found",
            )

        result = await ProxmoxVMService.rollback_snapshot(
            proxmox, node.name, vm.vmid, restore_request.snapshot_name
        )

        return OperationResponse(
            success=result.get("success", False),
            message=result.get("message", "Snapshot restore initiated"),
            task_id=result.get("task"),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f">>> Failed to restore snapshot: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to restore snapshot",
        )


@router.delete(
    "/{vps_id}/snapshots/{snapshot_name}",
    response_model=OperationResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete VPS Snapshot",
    description="Delete a specific snapshot of a VPS instance",
)
async def delete_vps_snapshot(
    vps_id: uuid.UUID = Path(..., description="VPS instance ID"),
    snapshot_name: str = Path(..., description="Snapshot name to delete"),
    current_user: User = Depends(get_current_user),
    proxmox: ProxmoxConnection = Depends(get_default_proxmox),
    session: Session = Depends(get_session),
):
    """Delete a VPS snapshot"""
    try:
        vps, vm, node = await VPSService.get_user_vps_instance(
            vps_id, current_user, session
        )

        snapshots = await ProxmoxVMService.list_snapshots(proxmox, node.name, vm.vmid)
        if not any(snap.get("name") == snapshot_name for snap in snapshots):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Snapshot not found",
            )

        result = await ProxmoxVMService.delete_snapshot(
            proxmox, node.name, vm.vmid, snapshot_name
        )

        return OperationResponse(
            success=result.get("success", False),
            message=result.get("message", "Snapshot deletion initiated"),
            task_id=result.get("task"),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f">>> Failed to delete snapshot: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete snapshot",
        )


# ============================================================================
# Admin Endpoints - VM Creation and Management
# ============================================================================


@admin_router.get(
    "/",
    response_model=List[VPSInstanceResponse],
    status_code=status.HTTP_200_OK,
    summary="[Admin] List All VPS Instances",
    description="Retrieve a list of all VPS instances for admin management (Admin Only)",
)
async def admin_list_all_vps(
    skip: int = Query(0, description="Number of records to skip"),
    limit: int = Query(None, description="Maximum number of records to return"),
    status_filter: Optional[str] = Query(
        None, alias="status", description="Filter by VPS status"
    ),
    admin_user: User = Depends(get_admin_user),
    session: Session = Depends(get_session),
):
    """
    List all VPS instances for admin management

    Args:
        skip: Number of records to skip for pagination
        limit: Maximum number of records to return
        status_filter: Optional filter by VPS status (active, stopped, terminated, etc.)
        admin_user: Current admin user
        session: Database session

    Raises:
        HTTPException: 401 if not authenticated
        HTTPException: 403 if not admin
        HTTPException: 500 if retrieval fails

    Returns:
        List of VPS instances with user, plan, and VM details
    """
    try:
        statement = select(VPSInstance).order_by(VPSInstance.created_at.desc())

        if status_filter:
            statement = statement.where(VPSInstance.status == status_filter)

        if skip is not None:
            statement = statement.offset(skip)
        if limit is not None:
            statement = statement.limit(limit)

        vps_list = session.exec(statement).all()
        return vps_list
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f">>> Failed to list all VPS: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve VPS instances",
        )


@admin_router.get(
    "/statistics",
    status_code=status.HTTP_200_OK,
    summary="[Admin] Get VPS Statistics",
    description="Get VPS instance statistics for admin dashboard (Admin Only)",
)
async def admin_get_vps_statistics(
    admin_user: User = Depends(get_admin_user),
    session: Session = Depends(get_session),
):
    """
    Get VPS instance statistics for admin dashboard

    Args:
        admin_user (User, optional): Current admin user. Defaults to Depends(get_admin_user).
        session (Session, optional): Database session. Defaults to Depends(get_session).

    Raises:
        HTTPException: 401 if not authenticated
        HTTPException: 403 if not admin
        HTTPException: 500 if retrieval fails

    Returns:
        Dict[str, int]: VPS statistics including total, running, stopped, terminated, creating, and error counts
    """
    try:
        statement = select(VPSInstance)
        all_vps = session.exec(statement).all()

        total = len(all_vps)
        active = sum(1 for v in all_vps if v.status == "active")
        suspended = sum(1 for v in all_vps if v.status == "suspended")
        terminated = sum(1 for v in all_vps if v.status == "terminated")
        creating = sum(1 for v in all_vps if v.status == "creating")
        error = sum(1 for v in all_vps if v.status == "error")

        return {
            "total": total,
            "active": active,
            "suspended": suspended,
            "terminated": terminated,
            "creating": creating,
            "error": error,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f">>> Failed to get VPS statistics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get VPS statistics",
        )


@admin_router.post(
    "/{vps_id}/power",
    response_model=OperationResponse,
    status_code=status.HTTP_200_OK,
    summary="Admin VPS Power Control",
    description="Control VPS power state as admin (start, stop, reboot)",
)
async def admin_control_vps_power(
    vps_id: uuid.UUID = Path(..., description="VPS instance ID"),
    power_request: VMPowerActionRequest = Body(..., description="Power action request"),
    admin_user: User = Depends(get_admin_user),
    proxmox: ProxmoxConnection = Depends(get_default_proxmox),
    session: Session = Depends(get_session),
):
    """
    Control VPS power state as admin (no ownership check)

    Available actions:
    - start: Start the VPS
    - stop: Force stop (immediate)
    - shutdown: Graceful shutdown
    - reboot: Graceful reboot
    - reset: Force reset

    Args:
        vps_id (uuid.UUID): VPS instance ID
        power_request (VMPowerActionRequest): Power action request
        admin_user (User): Current admin user
        proxmox (ProxmoxConnection): Proxmox connection instance
        session (Session): Database session

    Raises:
        HTTPException: 401 if not authenticated
        HTTPException: 403 if not admin
        HTTPException: 404 if VPSInstance, ProxmoxVM, or ProxmoxNode not found
        HTTPException: 400 if invalid action or VPS is terminated
        HTTPException: 500 if operation fails

    Returns:
        OperationResponse: Result of the power action
    """
    try:
        vps = session.get(VPSInstance, vps_id)
        if not vps:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="VPS instance not found",
            )

        if vps.status == "terminated":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot control terminated VPS",
            )

        vm = session.get(ProxmoxVM, vps.vm_id)
        if not vm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proxmox VM not found",
            )

        node = session.get(ProxmoxNode, vm.node_id)
        if not node:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proxmox node not found",
            )

        action = power_request.action
        result = None

        if action == "start":
            result = await ProxmoxVMService.start_vm(proxmox, node.name, vm.vmid)
        elif action == "stop":
            result = await ProxmoxVMService.stop_vm(proxmox, node.name, vm.vmid)
        elif action == "shutdown":
            result = await ProxmoxVMService.shutdown_vm(proxmox, node.name, vm.vmid)
        elif action == "reboot":
            result = await ProxmoxVMService.reboot_vm(proxmox, node.name, vm.vmid)
        elif action == "reset":
            result = await ProxmoxVMService.reset_vm(proxmox, node.name, vm.vmid)
        elif action == "suspend":
            result = await ProxmoxVMService.suspend_vm(proxmox, node.name, vm.vmid)
        elif action == "resume":
            result = await ProxmoxVMService.resume_vm(proxmox, node.name, vm.vmid)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid power action",
            )

        if action in ["start", "resume"]:
            vm.power_status = "running"
        elif action in ["stop", "shutdown"]:
            vm.power_status = "stopped"
        elif action == "suspend":
            vm.power_status = "suspended"

        session.add(vm)
        session.commit()
        session.refresh(vm)
        print(">>> Status after: ", vm.power_status)

        return OperationResponse(
            success=result.get("success", False),
            message=result.get("message", f"Power action '{action}' executed"),
            task_id=result.get("task"),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f">>> Failed to control VPS power: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to control VPS power",
        )


@admin_router.post("/deploy", response_model=VMDeploymentResponse)
async def deploy_vps_for_user(
    vm_request: VMCreateRequest = Body(...),
    admin_user: User = Depends(get_admin_user),
    proxmox: ProxmoxConnection = Depends(get_default_proxmox),
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
        statement = select(ProxmoxNode).where(ProxmoxNode.name == vm_request.node)
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

    try:
        # Get next available VMID
        vmid = await CommonProxmoxService.get_next_vmid(proxmox)

        # Create VM from template
        result = await ProxmoxVMService.create_vm(
            proxmox=proxmox,
            node=node.name,
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
    admin_user: User = Depends(get_admin_user),
    proxmox: ProxmoxConnection = Depends(get_default_proxmox),
    session: Session = Depends(get_session),
):
    """Get Proxmox cluster status overview"""
    try:
        cluster_status = await ProxmoxClusterService.get_cluster_status(proxmox)
        resources = await ProxmoxClusterService.get_cluster_resources(proxmox)

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
    admin_user: User = Depends(get_admin_user),
    proxmox: ProxmoxConnection = Depends(get_default_proxmox),
    session: Session = Depends(get_session),
):
    """Get all cluster resources (VMs, nodes, storage)"""
    try:
        resources = await ProxmoxClusterService.get_cluster_resources(proxmox)

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


@router.post(
    "/setup",
    response_model=VPSSetupResponse,
    summary="Setup VPS after payment",
    description="Provision VPS instances for a paid order using Proxmox",
)
async def setup_vps(
    data: VPSSetupRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    proxmox: ProxmoxConnection = Depends(get_default_proxmox),
) -> VPSSetupResponse:
    """
    Setup VPS instances after successful payment.

    This endpoint:
    1. Finds the user's latest paid order that hasn't been provisioned
    2. For each order item, clones the VM template to create a new VPS
    3. Creates database records for ProxmoxVM and VPSInstance
    4. Returns VPS credentials for email notification

    Args:
        data (VPSSetupRequest): Request data containing order number
        session (Session): Database session
        current_user (User): Currently authenticated user
        proxmox (ProxmoxConnection): Proxmox API connection

    Raises:
        HTTPException: If order not found, all items provisioned, or errors occur

    Returns:
        VPSSetupResponse: Details of provisioned VPS instances
    """
    try:
        statement = select(Order).where(Order.order_number == data.order_number)
        order = session.exec(statement).first()

        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found",
            )

        # Check if all order items are already provisioned
        unprovisioned_items = [
            item for item in order.order_items if not item.vps_instance
        ]

        if not unprovisioned_items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="All order items have already been provisioned",
            )

        provisioned_vps: List[VPSSetupItem] = []

        for order_item in unprovisioned_items:
            try:
                template = session.get(VMTemplate, order_item.template_id)
                if not template:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Template not found for any order items",
                    )

                node = None
                if template.node_id and template.cluster_id:
                    statement = select(ProxmoxNode).where(
                        ProxmoxNode.id == template.node_id,
                        ProxmoxNode.cluster_id == template.cluster_id,
                        ProxmoxNode.status == "online",
                    )
                    node = session.exec(statement).first()

                if not node:
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail="No available node for provisioning",
                    )

                new_vmid = await CommonProxmoxService.get_next_vmid(proxmox)
                clone_result = await ProxmoxVMService.create_vm(
                    proxmox=proxmox,
                    node=node.name,
                    vmid=new_vmid,
                    template_id=template.template_vmid,
                    name=order_item.hostname,
                )

                if not clone_result.get("success"):
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Failed to create VM",
                    )

                start_result = await ProxmoxVMService.start_vm(
                    proxmox, node.name, new_vmid
                )

                if not start_result.get("success"):
                    logger.warning(f">>> VM {new_vmid} created but failed to start")
                    ip_address = VPSService.generate_placeholder_ip()
                else:
                    # Retry getting IP with delay - VM needs time to boot and get IP
                    max_retries = 100  # 100 retries * 5 seconds = 500 seconds max
                    retry_delay = 5  # seconds

                    for attempt in range(max_retries):
                        await asyncio.sleep(retry_delay)

                        network_addr = await ProxmoxVMService.get_vm_network(
                            proxmox, node.name, new_vmid
                        )

                        if network_addr:
                            valid_ips = [
                                ip
                                for ip in network_addr
                                if ip.get("ip_address", "").startswith("192.168.")
                                or ip.get("ip_address", "").startswith("10.10.")
                            ]
                            if len(valid_ips) == 2:
                                break

                    if not network_addr:
                        logger.warning(
                            f">>> Failed to retrieve IP for VM {new_vmid} after multiple attempts"
                        )
                        network_addr = [
                            {
                                "ip_address": VPSService.generate_placeholder_ip(),
                                "mac_address": None,
                            }
                        ]

                ip_addr = None
                sub_ip_addr = None
                mac_addr = None
                for ip in network_addr:
                    if not ip_addr:
                        ip_addr = ip.get("ip_address")
                        mac_addr = ip.get("mac_address")
                    else:
                        sub_ip_addr = ip.get("ip_address")

                print(">>> IP Address:", ip_addr, sub_ip_addr, mac_addr)

                username = template.default_user
                password = VPSService.generate_password()

                # Check if VM already exists in database (from previous failed attempt)
                existing_vm = session.exec(
                    select(ProxmoxVM).where(
                        ProxmoxVM.cluster_id == node.cluster_id,
                        ProxmoxVM.node_id == node.id,
                        ProxmoxVM.vmid == str(new_vmid),
                    )
                ).first()

                if existing_vm:
                    # Update existing VM record
                    existing_vm.template_id = template.id
                    existing_vm.hostname = order_item.hostname
                    existing_vm.ip_address = ip_addr
                    existing_vm.mac_address = mac_addr
                    existing_vm.username = username
                    existing_vm.password = password
                    existing_vm.vcpu = order_item.configuration.get("vcpu", 1)
                    existing_vm.ram_gb = order_item.configuration.get("ram_gb", 1)
                    existing_vm.storage_gb = order_item.configuration.get(
                        "storage_gb", 20
                    )
                    existing_vm.storage_type = order_item.configuration.get(
                        "storage_type", "SSD"
                    )
                    existing_vm.bandwidth_mbps = order_item.configuration.get(
                        "bandwidth_mbps", 1000
                    )
                    existing_vm.power_status = (
                        "stopped" if not start_result.get("success") else "running"
                    )
                    session.add(existing_vm)
                    new_vm = existing_vm
                else:
                    new_vm = ProxmoxVM(
                        cluster_id=node.cluster_id,
                        node_id=node.id,
                        template_id=template.id,
                        vmid=new_vmid,
                        hostname=order_item.hostname,
                        ip_address=ip_addr,
                        mac_address=mac_addr,
                        username=username,
                        password=password,
                        ssh_port=22,
                        vcpu=order_item.configuration.get("vcpu", 1),
                        ram_gb=order_item.configuration.get("ram_gb", 1),
                        storage_gb=order_item.configuration.get("storage_gb", 20),
                        storage_type=order_item.configuration.get(
                            "storage_type", "SSD"
                        ),
                        bandwidth_mbps=order_item.configuration.get(
                            "bandwidth_mbps", 1000
                        ),
                        power_status=(
                            "stopped" if not start_result.get("success") else "running"
                        ),
                    )
                    session.add(new_vm)

                session.flush()

                expires_at = datetime.now(timezone.utc) + timedelta(
                    days=30 * order_item.duration_months
                )

                vps_instance = VPSInstance(
                    user_id=current_user.id,
                    vps_plan_id=order_item.vps_plan_id,
                    order_item_id=order_item.id,
                    vm_id=new_vm.id,
                    status="active",
                    expires_at=expires_at,
                    auto_renew=False,
                )
                session.add(vps_instance)
                session.flush()

                vps_info = {
                    "name": order_item.vps_plan.name if order_item.vps_plan else "VPS",
                    "hostname": order_item.hostname,
                    "os": order_item.os,
                    "cpu": order_item.configuration.get("vcpu", 1),
                    "ram": order_item.configuration.get("ram_gb", 1),
                    "storage": order_item.configuration.get("storage_gb", 20),
                    "storage_type": order_item.configuration.get("storage_type", "SSD"),
                    "network_speed": order_item.configuration.get(
                        "bandwidth_mbps", 1000
                    ),
                }

                provisioned_vps.append(
                    VPSSetupItem(
                        order_item_id=str(order_item.id),
                        vps_instance_id=str(vps_instance.id),
                        vm_id=str(new_vm.id),
                        vmid=new_vmid,
                        hostname=order_item.hostname,
                        status="active",
                        credentials=VPSCredentials(
                            ip_address=ip_addr,
                            sub_ip_addresses=sub_ip_addr,
                            username=username,
                            password=password,
                            ssh_port=22,
                        ),
                        vps_info=vps_info,
                    )
                )
            except HTTPException:
                raise
            except Exception as e:
                logger.error(
                    f">>> Error provisioning VPS for item {order_item.id}: {str(e)}"
                )
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error provisioning VPS",
                )

        session.commit()

        success = len(provisioned_vps) > 0

        if success:
            message = (
                f"Provisioned {len(provisioned_vps)} VPS for order {order.order_number}"
            )
        else:
            message = "Failed to provision any VPS"

        return VPSSetupResponse(
            success=success,
            message=message,
            order_number=order.order_number,
            order_date=order.created_at.isoformat(),
            customer_name=current_user.name or current_user.email,
            customer_email=current_user.email,
            vps_list=provisioned_vps,
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f">>> VPS setup error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to setup VPS instances",
        )
