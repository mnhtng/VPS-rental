import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from fastapi import HTTPException
from sqlmodel import Session, select

from backend.db import engine
from backend.models import VPSInstance, ProxmoxVM, ProxmoxNode
from backend.services.proxmox import ProxmoxVMService, CommonProxmoxService
from backend.dependencies import ProxmoxConnection


logger = logging.getLogger(__name__)

# Grace period before terminating suspended VPS (in hours)
GRACE_PERIOD_HOURS = 24


class VPSCleanupScheduler:
    """
    Scheduler for automatic VPS expiration cleanup.

    This scheduler runs every 5 minutes to check for expired VPS instances
    and handles them in two phases:
    1. Phase 1: Suspend expired active VPS (stop VM, set status to 'suspended')
    2. Phase 2: Terminate VPS that have been expired for 24+ hours (delete VM)
    """

    def __init__(self, check_interval_minutes: int = 5):
        """
        Initialize the VPS cleanup scheduler.

        Args:
            check_interval_minutes: How often to check for expired VPS (default: 5 minutes)
        """
        self.scheduler = AsyncIOScheduler()
        self.check_interval = check_interval_minutes
        self._running = False

    def start(self):
        """Start the scheduler."""
        if self._running:
            logger.warning(">>> VPS Cleanup Scheduler is already running")
            return

        self.scheduler.add_job(
            self._cleanup_expired_vps,
            trigger=IntervalTrigger(minutes=self.check_interval),
            id="vps_cleanup_job",
            name="VPS Expiration Cleanup",
            replace_existing=True,
        )
        self.scheduler.start()
        self._running = True
        logger.info(
            f">>> VPS Cleanup Scheduler started, running every {self.check_interval} minutes"
        )

    def shutdown(self):
        """Shutdown the scheduler gracefully."""
        if self._running:
            self.scheduler.shutdown(wait=True)
            self._running = False
            logger.info(">>> VPS Cleanup Scheduler stopped")

    async def _cleanup_expired_vps(self):
        """
        Main cleanup job that runs periodically.

        Implements 2-phase cleanup:
        - Phase 1: Suspend expired active VPS
        - Phase 2: Terminate VPS that have been expired for 24+ hours
        """
        logger.info(">>> Running VPS expiration cleanup check...")

        try:
            with Session(engine) as session:
                now = datetime.now(timezone.utc)
                grace_period_cutoff = now - timedelta(hours=GRACE_PERIOD_HOURS)

                # Phase 1
                await self._suspend_expired_vps(session, now)

                # Phase 2
                await self._terminate_suspended_vps(session, grace_period_cutoff)
        except Exception as e:
            logger.error(f">>> Error during VPS cleanup: {str(e)}", exc_info=True)

    async def _suspend_expired_vps(self, session: Session, now: datetime):
        """
        Phase 1: Suspend expired active VPS instances.

        Finds VPS where expires_at < now AND status = 'active',
        stops the VM and sets status to 'suspended'.

        Args:
            session: Database session
            now: Current UTC datetime
        """
        statement = select(VPSInstance).where(
            VPSInstance.expires_at < now,
            VPSInstance.status == "active",
        )
        expired_active_vps = session.exec(statement).all()

        if not expired_active_vps:
            logger.info(">>> Phase 1: No expired active VPS instances found")
            return

        logger.info(
            f">>> Phase 1: Found {len(expired_active_vps)} expired active VPS instance(s) to suspend"
        )

        for vps in expired_active_vps:
            await self._suspend_vps(session, vps)

    async def _suspend_vps(self, session: Session, vps: VPSInstance):
        """
        Suspend a single VPS instance (stop VM, don't delete).

        Args:
            session: Database session
            vps: VPS instance to suspend
        """
        logger.info(
            f">>> Suspending VPS {vps.id} - expired at: {vps.expires_at.isoformat()}"
        )

        try:
            if not vps.vm_id:
                logger.warning(
                    f">>> VPS {vps.id} has no VM linked, marking as suspended"
                )
                vps.status = "suspended"
                session.add(vps)
                session.commit()
                return

            vm = session.get(ProxmoxVM, vps.vm_id)
            if not vm:
                logger.warning(
                    f">>> VM {vps.vm_id} not found for VPS {vps.id}, marking as suspended"
                )
                vps.status = "suspended"
                session.add(vps)
                session.commit()
                return

            node = session.get(ProxmoxNode, vm.node_id)
            if not node:
                logger.warning(
                    f">>> Node {vm.node_id} not found for VM {vm.vmid}, marking VPS as error"
                )
                vps.status = "error"
                session.add(vps)
                session.commit()
                return

            proxmox = CommonProxmoxService.get_connection()

            await self._stop_vm_with_retry(proxmox, node.name, vm.vmid)

            vps.status = "suspended"
            vm.power_status = "stopped"
            session.add(vps)
            session.add(vm)
            session.commit()

            logger.info(f">>> VPS {vps.id} suspended successfully")
        except Exception as e:
            logger.error(
                f">>> Failed to suspend VPS {vps.id}: {str(e)}", exc_info=True
            )
            try:
                vps.status = "error"
                session.add(vps)
                session.commit()
            except Exception:
                session.rollback()

    async def _terminate_suspended_vps(self, session: Session, grace_period_cutoff: datetime):
        """
        Phase 2: Terminate VPS that have been expired for 24+ hours.

        Finds VPS where expires_at < (now - 24h) AND status = 'suspended',
        deletes the VM and sets status to 'terminated'.

        Args:
            session: Database session
            grace_period_cutoff: Datetime threshold (now - 24 hours)
        """
        statement = select(VPSInstance).where(
            VPSInstance.expires_at < grace_period_cutoff,
            VPSInstance.status == "suspended",
        )
        suspended_vps_list = session.exec(statement).all()

        if not suspended_vps_list:
            logger.info(">>> Phase 2: No suspended VPS instances past grace period")
            return

        logger.info(
            f">>> Phase 2: Found {len(suspended_vps_list)} suspended VPS instance(s) to terminate"
        )

        for vps in suspended_vps_list:
            await self._terminate_vps(session, vps)

    async def _terminate_vps(self, session: Session, vps: VPSInstance):
        """
        Terminate a single VPS instance (delete VM from Proxmox).

        Args:
            session: Database session
            vps: VPS instance to terminate
        """
        logger.info(
            f">>> Terminating VPS {vps.id} - expired at: {vps.expires_at.isoformat()}"
        )

        try:
            if not vps.vm_id:
                logger.warning(
                    f">>> VPS {vps.id} has no VM linked, marking as terminated"
                )
                vps.status = "terminated"
                session.add(vps)
                session.commit()
                return

            vm = session.get(ProxmoxVM, vps.vm_id)
            if not vm:
                logger.warning(
                    f">>> VM {vps.vm_id} not found for VPS {vps.id}, marking as terminated"
                )
                vps.status = "terminated"
                session.add(vps)
                session.commit()
                return

            node = session.get(ProxmoxNode, vm.node_id)
            if not node:
                logger.warning(
                    f">>> Node {vm.node_id} not found for VM {vm.vmid}, marking VPS as error"
                )
                vps.status = "error"
                session.add(vps)
                session.commit()
                return

            proxmox = CommonProxmoxService.get_connection()

            # Handle Terminate VPS
            await self._stop_vm_with_retry(proxmox, node.name, vm.vmid)

            logger.info(f">>> Deleting VM {vm.vmid} from Proxmox")
            await ProxmoxVMService.delete_vm(proxmox, node.name, vm.vmid)

            vps.status = "terminated"
            session.add(vps)
            session.delete(vm)

            session.commit()
            logger.info(f">>> VPS {vps.id} terminated successfully")
        except Exception as e:
            logger.error(
                f">>> Failed to terminate VPS {vps.id}: {str(e)}", exc_info=True
            )
            try:
                vps.status = "error"
                session.add(vps)
                session.commit()
            except Exception:
                session.rollback()

    async def _stop_vm_with_retry(
        self,
        proxmox: ProxmoxConnection,
        node_name: str,
        vmid: int,
        wait_seconds: int = 30,
        max_retries: int = 10,
    ):
        """
        Stop a VM with retry logic until it's fully stopped.

        Args:
            proxmox: Proxmox API connection
            node_name: Name of the Proxmox node
            vmid: VM ID to stop
            wait_seconds: Seconds to wait between retries (default: 30)
            max_retries: Maximum number of stop attempts (default: 10)
        """
        for attempt in range(1, max_retries + 1):
            logger.info(f">>> Stopping VM {vmid} (attempt {attempt}/{max_retries})")

            try:
                vm_info = await ProxmoxVMService.get_vm_info(proxmox, node_name, vmid)
                current_status = vm_info.get("status", "unknown")

                if current_status == "stopped":
                    logger.info(f">>> VM {vmid} is already stopped")
                    return

                await ProxmoxVMService.stop_vm(proxmox, node_name, vmid)

                logger.info(f">>> Waiting {wait_seconds}s for VM {vmid} to stop...")
                await asyncio.sleep(wait_seconds)

                vm_info = await ProxmoxVMService.get_vm_info(proxmox, node_name, vmid)
                current_status = vm_info.get("status", "unknown")

                if current_status == "stopped":
                    logger.info(
                        f">>> VM {vmid} stopped successfully after {attempt} attempt(s)"
                    )
                    return
                else:
                    logger.warning(
                        f">>> VM {vmid} still running (status: {current_status}), retrying..."
                    )
            except Exception as e:
                logger.error(f">>> Error stopping VM {vmid}: {str(e)}")
                if attempt == max_retries:
                    raise
        # Max retries exceeded
        raise Exception(f">>> Failed to stop VM {vmid} after {max_retries} attempts")
