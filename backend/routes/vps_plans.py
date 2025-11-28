import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select
from typing import List, Optional
import logging

from backend.db import get_session
from backend.models import (
    VPSPlan,
    User,
)
from backend.schemas import (
    VPSPlanCreate,
    VPSPlanUpdate,
    VPSPlanResponse,
)
from backend.utils import get_current_user, get_admin_user


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/plans", tags=["VPS Plans"])


@router.get("/", response_model=List[VPSPlanResponse], status_code=status.HTTP_200_OK)
async def get_vps_plans(
    skip: int = 0,
    limit: int = None,
    session: Session = Depends(get_session),
):
    """
    Retrieve a list of VPS plans with optional pagination.

    Args:
        skip (int, optional): Number of records to skip. Defaults to 0.
        limit (int, optional): Maximum number of records to return. Defaults to None.
        session (Session, optional): Database session. Defaults to Depends(get_session).

    Raises:
        HTTPException: If there is an error retrieving VPS plans.

    Returns:
        List[VPSPlan]: A list of VPS plans.
    """
    try:
        statement = select(VPSPlan).offset(skip)

        if limit is not None:
            statement = statement.limit(limit)

        plans = session.exec(statement).all()

        return plans
    except Exception as e:
        logger.error(f">>> Error fetching VPS plans: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving VPS plans",
        )


@router.get(
    "/{plan_id}",
    response_model=VPSPlanResponse,
    status_code=status.HTTP_200_OK,
)
async def get_vps_plan(plan_id: uuid.UUID, session: Session = Depends(get_session)):
    """
    Retrieve a VPS plan by its ID.

    Args:
        plan_id (uuid.UUID): The unique identifier of the VPS plan.
        session (Session, optional): Database session. Defaults to Depends(get_session).

    Raises:
        HTTPException: 404 if the VPS plan is not found.
        HTTPException: 500 if there is an error retrieving the VPS plan.

    Returns:
        VPSPlan: The VPS plan object.
    """
    try:
        plan = session.get(VPSPlan, plan_id)
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="VPS plan not found",
            )

        return plan
    except Exception as e:
        logger.error(f">>> Error fetching VPS plan {plan_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving VPS plan",
        )


@router.put("/{plan_id}", response_model=VPSPlanResponse)
async def update_vps_plan(
    plan_id: int,
    plan_update: VPSPlanUpdate,
    admin_user: User = Depends(get_admin_user),
    session: Session = Depends(get_session),
):
    """Update a VPS plan (Admin only)"""
    plan = session.get(VPSPlan, plan_id)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="VPS plan not found"
        )

    # Update fields
    update_data = plan_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(plan, field, value)

    session.add(plan)
    session.commit()
    session.refresh(plan)
    return plan


@router.delete("/{plan_id}")
async def delete_vps_plan(
    plan_id: int,
    admin_user: User = Depends(get_admin_user),
    session: Session = Depends(get_session),
):
    """Delete a VPS plan (Admin only)"""
    plan = session.get(VPSPlan, plan_id)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="VPS plan not found"
        )

    session.delete(plan)
    session.commit()
    return {"message": "VPS plan deleted successfully"}


@router.get("/search/", response_model=List[VPSPlanResponse])
async def search_vps_plans(
    min_cpu: Optional[int] = Query(None, ge=1),
    max_cpu: Optional[int] = Query(None, le=16),
    min_ram: Optional[int] = Query(None, ge=1),
    max_ram: Optional[int] = Query(None, le=64),
    storage_type: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    session: Session = Depends(get_session),
):
    """Search VPS plans with filters"""
    statement = select(VPSPlan).where(VPSPlan.is_active == True)

    if min_cpu is not None:
        statement = statement.where(VPSPlan.cpu_cores >= min_cpu)
    if max_cpu is not None:
        statement = statement.where(VPSPlan.cpu_cores <= max_cpu)
    if min_ram is not None:
        statement = statement.where(VPSPlan.ram_gb >= min_ram)
    if max_ram is not None:
        statement = statement.where(VPSPlan.ram_gb <= max_ram)
    if storage_type is not None:
        statement = statement.where(VPSPlan.storage_type == storage_type)
    if min_price is not None:
        statement = statement.where(VPSPlan.monthly_price >= min_price)
    if max_price is not None:
        statement = statement.where(VPSPlan.monthly_price <= max_price)

    plans = session.exec(statement).all()
    return plans


@router.get("/categories/stats")
async def get_plan_stats(session: Session = Depends(get_session)):
    """Get statistics about VPS plans"""
    statement = select(VPSPlan).where(VPSPlan.is_active == True)
    plans = session.exec(statement).all()

    if not plans:
        return {
            "total_plans": 0,
            "cpu_range": {"min": 0, "max": 0},
            "ram_range": {"min": 0, "max": 0},
            "price_range": {"min": 0, "max": 0},
            "storage_types": [],
        }

    cpu_cores = [plan.cpu_cores for plan in plans]
    ram_gbs = [plan.ram_gb for plan in plans]
    prices = [plan.monthly_price for plan in plans]
    storage_types = list(set([plan.storage_type for plan in plans]))

    return {
        "total_plans": len(plans),
        "cpu_range": {"min": min(cpu_cores), "max": max(cpu_cores)},
        "ram_range": {"min": min(ram_gbs), "max": max(ram_gbs)},
        "price_range": {"min": min(prices), "max": max(prices)},
        "storage_types": storage_types,
    }
