"""
User Routes
===========

FastAPI routes for user management.
✅ Sử dụng Pydantic schemas để tránh circular reference
✅ Hash password trước khi lưu
✅ Eager loading để tránh N+1 query
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from typing import List
import uuid

from backend.db.database import get_session
from backend.models import User, Role
from backend.schemas import (
    UserCreate,
    UserRead,
    UserReadWithRole,
    UserUpdate,
    UserChangePassword,
    UserInList,
)

# Password hashing
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter(prefix="/users", tags=["users"])


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================


def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)


# ============================================================================
# USER CRUD ENDPOINTS
# ============================================================================


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(user_data: UserCreate, session: Session = Depends(get_session)):
    """
    Tạo user mới.

    ✅ Password được validate qua schema
    ✅ Password được hash trước khi lưu
    ✅ Trả về UserRead (KHÔNG có password)
    """
    # Check email exists
    existing_user = session.exec(
        select(User).where(User.email == user_data.email)
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )

    # Check role exists
    role = session.get(Role, user_data.role_id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Role not found"
        )

    # Hash password
    hashed_password = hash_password(user_data.password)

    # Create user
    user_dict = user_data.model_dump()
    user_dict["password"] = hashed_password

    user = User(**user_dict)
    session.add(user)
    session.commit()
    session.refresh(user)

    return user


@router.get("", response_model=List[UserInList])
def get_users(skip: int = 0, limit: int = 100, session: Session = Depends(get_session)):
    """
    Lấy danh sách users.

    ✅ Sử dụng UserInList schema (nhỏ gọn)
    ✅ Eager loading để tránh N+1 query
    """
    # Eager load role để tránh N+1 query
    statement = select(User).options(selectinload(User.role)).offset(skip).limit(limit)

    users = session.exec(statement).all()

    # Convert to schema
    result = []
    for user in users:
        result.append(
            UserInList(
                id=user.id,
                name=user.name,
                email=user.email,
                role_name=user.role.name if user.role else "Unknown",
                created_at=user.created_at,
            )
        )

    return result


@router.get("/{user_id}", response_model=UserReadWithRole)
def get_user(user_id: uuid.UUID, session: Session = Depends(get_session)):
    """
    Lấy user by ID kèm role details.

    ✅ Sử dụng UserReadWithRole schema
    ✅ Tránh circular reference với RoleInUser
    """
    # Eager load role
    statement = select(User).options(selectinload(User.role)).where(User.id == user_id)

    user = session.exec(statement).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    return user


@router.patch("/{user_id}", response_model=UserRead)
def update_user(
    user_id: uuid.UUID, user_data: UserUpdate, session: Session = Depends(get_session)
):
    """
    Update user information.

    ✅ Không cho phép update password (dùng endpoint riêng)
    ✅ Validate email unique
    """
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Check email unique nếu đổi email
    if user_data.email and user_data.email != user.email:
        existing = session.exec(
            select(User).where(User.email == user_data.email)
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Email already in use"
            )

    # Check role exists nếu đổi role
    if user_data.role_id:
        role = session.get(Role, user_data.role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Role not found"
            )

    # Update fields
    user_dict = user_data.model_dump(exclude_unset=True)
    for key, value in user_dict.items():
        setattr(user, key, value)

    session.add(user)
    session.commit()
    session.refresh(user)

    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: uuid.UUID, session: Session = Depends(get_session)):
    """Delete user"""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    session.delete(user)
    session.commit()

    return None


# ============================================================================
# PASSWORD MANAGEMENT
# ============================================================================


@router.post("/{user_id}/change-password", response_model=dict)
def change_password(
    user_id: uuid.UUID,
    password_data: UserChangePassword,
    session: Session = Depends(get_session),
):
    """
    Đổi password cho user.

    ✅ Validate old password
    ✅ Validate new password strength qua schema
    ✅ Hash password trước khi lưu
    """
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Verify old password
    if not verify_password(password_data.old_password, user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    # Hash and update new password
    user.password = hash_password(password_data.new_password)

    session.add(user)
    session.commit()

    return {"message": "Password changed successfully"}
