"""
Role Routes
===========

FastAPI routes for role management.
✅ Sử dụng Pydantic schemas để tránh circular reference
✅ Không load toàn bộ users, chỉ đếm số lượng khi cần
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, func
from typing import List
import uuid

from backend.db.database import get_session
from backend.models import Role, User
from backend.schemas import (
    RoleCreate,
    RoleRead,
    RoleUpdate,
    RoleWithUsers,
)

router = APIRouter(prefix="/roles", tags=["roles"])


# ============================================================================
# ROLE CRUD ENDPOINTS
# ============================================================================


@router.post("", response_model=RoleRead, status_code=status.HTTP_201_CREATED)
def create_role(role_data: RoleCreate, session: Session = Depends(get_session)):
    """
    Tạo role mới.

    ✅ Sử dụng RoleCreate schema để validate
    ✅ Trả về RoleRead schema (không có users list)
    """
    # Check duplicate
    existing_role = session.exec(
        select(Role).where(Role.name == role_data.name)
    ).first()

    if existing_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Role with name '{role_data.name}' already exists",
        )

    # Create role
    role = Role(**role_data.model_dump())
    session.add(role)
    session.commit()
    session.refresh(role)

    return role


@router.get("", response_model=List[RoleRead])
def get_roles(session: Session = Depends(get_session)):
    """
    Lấy danh sách roles.

    ✅ Không load users (tránh circular reference)
    """
    roles = session.exec(select(Role)).all()
    return roles


@router.get("/{role_id}", response_model=RoleWithUsers)
def get_role_with_user_count(
    role_id: uuid.UUID, session: Session = Depends(get_session)
):
    """
    Lấy role kèm số lượng users.

    ✅ Không load toàn bộ users, chỉ đếm
    """
    role = session.get(Role, role_id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Role not found"
        )

    # Đếm users thay vì load hết
    user_count = session.exec(
        select(func.count(User.id)).where(User.role_id == role_id)
    ).one()

    # Convert sang schema
    return RoleWithUsers(**role.model_dump(), user_count=user_count)


@router.patch("/{role_id}", response_model=RoleRead)
def update_role(
    role_id: uuid.UUID, role_data: RoleUpdate, session: Session = Depends(get_session)
):
    """Update role information"""
    role = session.get(Role, role_id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Role not found"
        )

    # Check name unique nếu đổi name
    if role_data.name and role_data.name != role.name:
        existing = session.exec(select(Role).where(Role.name == role_data.name)).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role name already exists",
            )

    # Update fields
    role_dict = role_data.model_dump(exclude_unset=True)
    for key, value in role_dict.items():
        setattr(role, key, value)

    session.add(role)
    session.commit()
    session.refresh(role)

    return role


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(role_id: uuid.UUID, session: Session = Depends(get_session)):
    """
    Delete role.

    ⚠️ Lưu ý: Kiểm tra xem có users đang dùng role này không
    """
    role = session.get(Role, role_id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Role not found"
        )

    # Check if any users have this role
    users_count = session.exec(
        select(func.count(User.id)).where(User.role_id == role_id)
    ).one()

    if users_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete role. {users_count} user(s) are using this role",
        )

    session.delete(role)
    session.commit()

    return None
