# from fastapi import APIRouter, Depends, HTTPException, status, Query
# from sqlmodel import Session, select
# from typing import List, Optional
# from models.database import VPSPlan, get_session, User
# from schemas.api import VPSPlanCreate, VPSPlanUpdate, VPSPlanResponse
# from core.auth import get_current_active_user, get_admin_user

# router = APIRouter(prefix="/api/vps-plans", tags=["VPS Plans"])

# @router.get("/", response_model=List[VPSPlanResponse])
# async def get_vps_plans(
#     skip: int = Query(0, ge=0),
#     limit: int = Query(100, ge=1, le=1000),
#     active_only: bool = Query(True),
#     session: Session = Depends(get_session)
# ):
#     """Get all VPS plans with pagination and filtering"""
#     statement = select(VPSPlan)

#     if active_only:
#         statement = statement.where(VPSPlan.is_active == True)

#     statement = statement.offset(skip).limit(limit)
#     plans = session.exec(statement).all()

#     return plans

# @router.get("/{plan_id}", response_model=VPSPlanResponse)
# async def get_vps_plan(plan_id: int, session: Session = Depends(get_session)):
#     """Get a specific VPS plan by ID"""
#     plan = session.get(VPSPlan, plan_id)
#     if not plan:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="VPS plan not found"
#         )
#     return plan

# @router.post("/", response_model=VPSPlanResponse)
# async def create_vps_plan(
#     plan_data: VPSPlanCreate,
#     admin_user: User = Depends(get_admin_user),
#     session: Session = Depends(get_session)
# ):
#     """Create a new VPS plan (Admin only)"""
#     plan = VPSPlan(**plan_data.model_dump())
#     session.add(plan)
#     session.commit()
#     session.refresh(plan)
#     return plan

# @router.put("/{plan_id}", response_model=VPSPlanResponse)
# async def update_vps_plan(
#     plan_id: int,
#     plan_update: VPSPlanUpdate,
#     admin_user: User = Depends(get_admin_user),
#     session: Session = Depends(get_session)
# ):
#     """Update a VPS plan (Admin only)"""
#     plan = session.get(VPSPlan, plan_id)
#     if not plan:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="VPS plan not found"
#         )

#     # Update fields
#     update_data = plan_update.model_dump(exclude_unset=True)
#     for field, value in update_data.items():
#         setattr(plan, field, value)

#     session.add(plan)
#     session.commit()
#     session.refresh(plan)
#     return plan

# @router.delete("/{plan_id}")
# async def delete_vps_plan(
#     plan_id: int,
#     admin_user: User = Depends(get_admin_user),
#     session: Session = Depends(get_session)
# ):
#     """Delete a VPS plan (Admin only)"""
#     plan = session.get(VPSPlan, plan_id)
#     if not plan:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="VPS plan not found"
#         )

#     session.delete(plan)
#     session.commit()
#     return {"message": "VPS plan deleted successfully"}

# @router.get("/search/", response_model=List[VPSPlanResponse])
# async def search_vps_plans(
#     min_cpu: Optional[int] = Query(None, ge=1),
#     max_cpu: Optional[int] = Query(None, le=16),
#     min_ram: Optional[int] = Query(None, ge=1),
#     max_ram: Optional[int] = Query(None, le=64),
#     storage_type: Optional[str] = Query(None),
#     min_price: Optional[float] = Query(None, ge=0),
#     max_price: Optional[float] = Query(None, ge=0),
#     session: Session = Depends(get_session)
# ):
#     """Search VPS plans with filters"""
#     statement = select(VPSPlan).where(VPSPlan.is_active == True)

#     if min_cpu is not None:
#         statement = statement.where(VPSPlan.cpu_cores >= min_cpu)
#     if max_cpu is not None:
#         statement = statement.where(VPSPlan.cpu_cores <= max_cpu)
#     if min_ram is not None:
#         statement = statement.where(VPSPlan.ram_gb >= min_ram)
#     if max_ram is not None:
#         statement = statement.where(VPSPlan.ram_gb <= max_ram)
#     if storage_type is not None:
#         statement = statement.where(VPSPlan.storage_type == storage_type)
#     if min_price is not None:
#         statement = statement.where(VPSPlan.monthly_price >= min_price)
#     if max_price is not None:
#         statement = statement.where(VPSPlan.monthly_price <= max_price)

#     plans = session.exec(statement).all()
#     return plans

# @router.get("/categories/stats")
# async def get_plan_stats(session: Session = Depends(get_session)):
#     """Get statistics about VPS plans"""
#     statement = select(VPSPlan).where(VPSPlan.is_active == True)
#     plans = session.exec(statement).all()

#     if not plans:
#         return {
#             "total_plans": 0,
#             "cpu_range": {"min": 0, "max": 0},
#             "ram_range": {"min": 0, "max": 0},
#             "price_range": {"min": 0, "max": 0},
#             "storage_types": []
#         }

#     cpu_cores = [plan.cpu_cores for plan in plans]
#     ram_gbs = [plan.ram_gb for plan in plans]
#     prices = [plan.monthly_price for plan in plans]
#     storage_types = list(set([plan.storage_type for plan in plans]))

#     return {
#         "total_plans": len(plans),
#         "cpu_range": {"min": min(cpu_cores), "max": max(cpu_cores)},
#         "ram_range": {"min": min(ram_gbs), "max": max(ram_gbs)},
#         "price_range": {"min": min(prices), "max": max(prices)},
#         "storage_types": storage_types
#     }
