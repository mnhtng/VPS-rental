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


@router.get(
    "/",
    response_model=List[VPSPlanResponse],
    status_code=status.HTTP_200_OK,
    summary="Get a list of VPS plans",
    description="Retrieve a list of VPS plans with optional pagination",
)
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
    except HTTPException:
        raise
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
    summary="Get a VPS plan by ID",
    description="Retrieve a VPS plan by its unique identifier",
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
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f">>> Error fetching VPS plan {plan_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving VPS plan",
        )


@router.post(
    "/",
    response_model=VPSPlanResponse,
    status_code=status.HTTP_201_CREATED,
    summary="[Admin] Create a new VPS plan",
    description="Create a new VPS plan (Admin only)",
)
async def create_vps_plan(
    plan_data: VPSPlanCreate,
    session: Session = Depends(get_session),
    admin_user: User = Depends(get_admin_user),
):
    """
    Create a new VPS plan (Admin only)

    Args:
        plan_data (VPSPlanCreate): The data for the new VPS plan
        session (Session, optional): Database session. Defaults to Depends(get_session).
        admin_user (User, optional): The currently authenticated admin user. Defaults to Depends(get_admin_user).

    Raises:
        HTTPException: 401 if the user is not authenticated
        HTTPException: 403 if the user is not an admin
        HTTPException: 500 if there is an error creating the VPS plan

    Returns:
        VPSPlan: The newly created VPS plan object.
    """
    try:
        existing_plan = session.exec(
            select(VPSPlan).where(VPSPlan.name == plan_data.name)
        ).first()
        
        if existing_plan:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A plan with this name already exists",
            )

        plan = VPSPlan(**plan_data.model_dump())
        session.add(plan)
        session.commit()
        session.refresh(plan)

        return plan
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f">>> Error creating VPS plan: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating VPS plan",
        )


@router.put(
    "/{plan_id}",
    response_model=VPSPlanResponse,
    status_code=status.HTTP_200_OK,
    summary="[Admin] Update a VPS plan",
    description="Update the details of a VPS plan (Admin only)",
)
async def update_vps_plan(
    plan_id: uuid.UUID,
    plan_update: VPSPlanUpdate,
    session: Session = Depends(get_session),
    admin_user: User = Depends(get_admin_user),
):
    """
    Update a VPS plan (Admin only)

    Args:
        plan_id (int): The ID of the VPS plan to update
        plan_update (VPSPlanUpdate): The updated data for the VPS plan
        session (Session, optional): Database session. Defaults to Depends(get_session).
        admin_user (User, optional): The currently authenticated admin user. Defaults to Depends(get_admin_user).

    Raises:
        HTTPException: 401 if the user is not authenticated
        HTTPException: 403 if the user is not an admin
        HTTPException: 404 if the VPS plan is not found
        HTTPException: 500 if there is an error updating the VPS plan

    Returns:
        VPSPlan: The updated VPS plan object.
    """
    try:
        plan = session.get(VPSPlan, plan_id)
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="VPS plan not found",
            )

        update_data = plan_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(plan, field, value)

        session.add(plan)
        session.commit()
        session.refresh(plan)

        return plan
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f">>> Error updating VPS plan {plan_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating VPS plan",
        )


@router.delete(
    "/{plan_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="[Admin] Delete a VPS plan",
    description="Delete a VPS plan (Admin only)",
)
async def delete_vps_plan(
    plan_id: uuid.UUID,
    session: Session = Depends(get_session),
    admin_user: User = Depends(get_admin_user),
):
    """
    Delete a VPS plan (Admin only)

    Args:
        plan_id (int): The ID of the VPS plan to delete
        session (Session, optional): Database session. Defaults to Depends(get_session).
        admin_user (User, optional): The currently authenticated admin user. Defaults to Depends(get_admin_user).

    Raises:
        HTTPException: 401 if the user is not authenticated
        HTTPException: 403 if the user is not an admin
        HTTPException: 404 if the VPS plan is not found
        HTTPException: 500 if there is an error deleting the VPS plan

    Returns:
        dict: A message indicating successful deletion
    """
    try:
        plan = session.get(VPSPlan, plan_id)
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="VPS plan not found",
            )

        session.delete(plan)
        session.commit()

        return {"message": "VPS plan deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f">>> Error deleting VPS plan {plan_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting VPS plan",
        )


@router.get(
    "/search/",
    response_model=List[VPSPlanResponse],
    status_code=status.HTTP_200_OK,
    summary="Search VPS plans with filters",
    description="Search VPS plans using various filters like CPU, RAM, storage type, and price range",
)
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
    """
    Search VPS plans with filters

    Args:
        min_cpu (Optional[int], optional): _minimum CPU cores_. Defaults to Query(None, ge=1).
        max_cpu (Optional[int], optional): _maximum CPU cores_. Defaults to Query(None, le=16).
        min_ram (Optional[int], optional): _minimum RAM in GB_. Defaults to Query(None, ge=1).
        max_ram (Optional[int], optional): _maximum RAM in GB_. Defaults to Query(None, le=64).
        storage_type (Optional[str], optional): _type of storage (e.g., SSD, HDD)_. Defaults to Query(None).
        min_price (Optional[float], optional): _minimum monthly price_. Defaults to Query(None, ge=0).
        max_price (Optional[float], optional): _maximum monthly price_. Defaults to Query(None, ge=0).
        session (Session, optional): _Database session_. Defaults to Depends(get_session).

    Returns:
        List[VPSPlanResponse]: A list of VPS plans matching the filters
    """
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
