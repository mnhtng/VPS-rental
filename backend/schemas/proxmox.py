from __future__ import annotations
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, field_validator
from enum import Enum

from backend.schemas import ProxmoxVMResponse


class VMPowerAction(str, Enum):
    """VM power action choices"""

    START = "start"
    STOP = "stop"
    SHUTDOWN = "shutdown"
    REBOOT = "reboot"
    RESET = "reset"
    SUSPEND = "suspend"
    RESUME = "resume"


class VMStatus(str, Enum):
    """VM status choices"""

    RUNNING = "running"
    STOPPED = "stopped"
    SUSPENDED = "suspended"


# ============================================================================
# VM Power Management Schemas
# ============================================================================


class VMPowerActionRequest(BaseModel):
    """Request to perform power action on VM"""

    action: VMPowerAction = Field(..., description="Power action to perform")

    model_config = {"use_enum_values": True}


class VMStatusResponse(BaseModel):
    """VM status information"""

    vmid: int = Field(..., description="VM ID")
    hostname: str = Field(..., description="VM hostname")
    status: str = Field(..., description="Current power status")
    uptime: Optional[int] = Field(None, description="Uptime in seconds")
    cpu_usage: Optional[float] = Field(None, description="CPU usage percentage")
    memory_used: Optional[int] = Field(None, description="Memory used in bytes")
    memory_total: Optional[int] = Field(None, description="Total memory in bytes")
    disk_used: Optional[int] = Field(None, description="Disk used in bytes")
    disk_total: Optional[int] = Field(None, description="Total disk in bytes")
    ip_address: Optional[str] = Field(None, description="Primary IP address")


class VMInfoResponse(BaseModel):
    """Comprehensive VM information"""

    node_name: str = Field(..., description="Proxmox node name")
    vm: Optional[ProxmoxVMResponse] = Field(None, description="VM basic information")
    vm_info: Dict[str, Any] = Field(
        default_factory=dict, description="Detailed VM information from Proxmox"
    )
    disk_info: Dict[str, Any] = Field(
        default_factory=dict, description="Disk configuration"
    )


# ============================================================================
# VNC Access Schemas
# ============================================================================


class VNCAccessRequest(BaseModel):
    """Request VNC access to VM"""

    pass  # No additional parameters needed


class VNCAccessResponse(BaseModel):
    """VNC access information"""

    vnc_url: str = Field(..., description="WebSocket URL for VNC connection")
    vnc_port: int = Field(..., description="VNC port number")
    vnc_password: Optional[str] = Field(None, description="VNC password")
    ticket: str = Field(..., description="Authentication ticket")
    expires_in: int = Field(default=7200, description="Ticket expiration in seconds")


# ============================================================================
# Snapshot Management Schemas
# ============================================================================


class SnapshotCreateRequest(BaseModel):
    """Request to create VM snapshot"""

    name: str = Field(..., min_length=1, max_length=40, description="Snapshot name")
    description: Optional[str] = Field(
        None, max_length=500, description="Snapshot description"
    )

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        # Proxmox snapshot name restrictions
        if not v.replace("-", "").replace("_", "").isalnum():
            raise ValueError(
                "Snapshot name must contain only alphanumeric characters, hyphens, and underscores"
            )
        return v


class SnapshotInfo(BaseModel):
    """Snapshot information"""

    name: str = Field(..., description="Snapshot name")
    description: Optional[str] = Field(None, description="Snapshot description")
    snaptime: Optional[int] = Field(None, description="Snapshot timestamp")
    vmstate: Optional[int] = Field(None, description="Whether VM state is included")
    parent: Optional[str] = Field(None, description="Parent snapshot name")


class SnapshotListResponse(BaseModel):
    """List of VM snapshots"""

    snapshots: List[SnapshotInfo] = Field(
        default_factory=list, description="List of snapshots"
    )
    total: int = Field(..., description="Total number of snapshots")
    max_snapshots: int = Field(..., description="Maximum allowed snapshots")


class SnapshotRestoreRequest(BaseModel):
    """Request to restore VM to snapshot"""

    snapshot_name: str = Field(..., description="Snapshot name to restore")


# ============================================================================
# VM Creation/Deployment Schemas (Admin)
# ============================================================================


class VMCreateRequest(BaseModel):
    """Request to create new VM from template"""

    user_id: str = Field(..., description="User ID who owns this VPS")
    vps_plan_id: str = Field(..., description="VPS plan ID")
    template_id: int = Field(..., description="Template VM ID to clone from")
    hostname: str = Field(
        ..., min_length=1, max_length=63, description="VM hostname (FQDN)"
    )
    storage: str = Field(default="local-lvm", description="Storage name")
    node: Optional[str] = Field(None, description="Target node (auto-select if None)")

    @field_validator("hostname")
    @classmethod
    def validate_hostname(cls, v: str) -> str:
        # Basic hostname validation
        if not v.replace("-", "").replace(".", "").isalnum():
            raise ValueError(
                "Hostname must contain only alphanumeric characters, hyphens, and dots"
            )
        if v.startswith("-") or v.endswith("-"):
            raise ValueError("Hostname cannot start or end with hyphen")
        return v.lower()


class VMDeploymentResponse(BaseModel):
    """Response for VM deployment"""

    task_id: str = Field(..., description="Deployment task ID")
    vmid: int = Field(..., description="Assigned VM ID")
    hostname: str = Field(..., description="VM hostname")
    status: str = Field(default="creating", description="Deployment status")
    message: str = Field(..., description="Status message")


# ============================================================================
# VM Configuration Update Schemas
# ============================================================================


class VMConfigUpdateRequest(BaseModel):
    """Request to update VM configuration"""

    cores: Optional[int] = Field(None, ge=1, le=32, description="Number of CPU cores")
    memory: Optional[int] = Field(
        None, ge=512, le=65536, description="RAM in MB"
    )  # 512MB to 64GB
    description: Optional[str] = Field(
        None, max_length=500, description="VM description"
    )


class VMResizeDiskRequest(BaseModel):
    """Request to resize VM disk"""

    disk: str = Field(..., description="Disk identifier (e.g., 'scsi0', 'virtio0')")
    size: str = Field(
        ..., description="Size to add (e.g., '+10G' to add 10GB, not absolute size)"
    )

    @field_validator("size")
    @classmethod
    def validate_size(cls, v: str) -> str:
        if not v.startswith("+"):
            raise ValueError("Size must start with '+' to indicate increment")
        if not v[1:-1].isdigit() or v[-1] not in ["G", "M", "T"]:
            raise ValueError("Size format must be like '+10G' or '+512M'")
        return v


# ============================================================================
# Cluster Management Schemas (Admin)
# ============================================================================


class NodeInfo(BaseModel):
    """Proxmox node information"""

    node: str = Field(..., description="Node name")
    status: str = Field(..., description="Node status")
    uptime: Optional[int] = Field(None, description="Uptime in seconds")
    cpu_usage: Optional[float] = Field(None, description="CPU usage percentage")
    memory_used: Optional[int] = Field(None, description="Memory used in bytes")
    memory_total: Optional[int] = Field(None, description="Total memory in bytes")
    disk_used: Optional[int] = Field(None, description="Root disk used in bytes")
    disk_total: Optional[int] = Field(None, description="Root disk total in bytes")


class ClusterStatusResponse(BaseModel):
    """Cluster status overview"""

    nodes: List[NodeInfo] = Field(default_factory=list, description="List of nodes")
    total_vms: int = Field(..., description="Total number of VMs in cluster")
    running_vms: int = Field(..., description="Number of running VMs")
    total_storage: int = Field(..., description="Total storage in bytes")
    used_storage: int = Field(..., description="Used storage in bytes")


class ClusterResourcesResponse(BaseModel):
    """Cluster resources"""

    resources: List[Dict[str, Any]] = Field(
        default_factory=list, description="List of all cluster resources"
    )
    vms: List[Dict[str, Any]] = Field(default_factory=list, description="List of VMs")
    nodes: List[Dict[str, Any]] = Field(
        default_factory=list, description="List of nodes"
    )
    storage: List[Dict[str, Any]] = Field(
        default_factory=list, description="List of storage"
    )


# ============================================================================
# Task Management Schemas
# ============================================================================


class TaskStatusResponse(BaseModel):
    """Task execution status"""

    status: str = Field(..., description="Task status (running, stopped)")
    exitstatus: Optional[str] = Field(None, description="Exit status if completed")
    upid: str = Field(..., description="Unique Process ID")
    type: str = Field(..., description="Task type")
    node: str = Field(..., description="Node where task is running")
    pid: Optional[int] = Field(None, description="Process ID")
    pstart: Optional[int] = Field(None, description="Task start timestamp")
    starttime: Optional[int] = Field(None, description="Start timestamp")
    user: Optional[str] = Field(None, description="User who started the task")


# ============================================================================
# Generic Response Schemas
# ============================================================================


class OperationResponse(BaseModel):
    """Generic operation response"""

    success: bool = Field(..., description="Whether operation succeeded")
    message: str = Field(..., description="Response message")
    task_id: Optional[str] = Field(None, description="Task ID if async operation")
    data: Optional[Dict[str, Any]] = Field(None, description="Additional data")


class ErrorResponse(BaseModel):
    """Error response"""

    success: bool = Field(default=False, description="Always false for errors")
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Error details")
