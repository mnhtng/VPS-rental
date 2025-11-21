from datetime import datetime, timezone
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, or_, select, func
from sqlalchemy.orm import selectinload
from typing import List

from backend.db import get_session
from backend.models import User
from backend.schemas import (
    UserCreate,
    UserUpdate,
    UserChangePassword,
    UserResponse,
)
from backend.utils import hash_password, verify_password


router = APIRouter(prefix="/users", tags=["User"])


@router.get("/", response_model=List[UserResponse], status_code=status.HTTP_200_OK)
async def get_users(
    skip: int = 0, limit: int = None, session: Session = Depends(get_session)
):
    """
    Get list of users.

    Args:
        skip (int, optional): Number of users to skip. Defaults to 0.
        limit (int, optional): Maximum number of users to return. Defaults to None.

    Raises:
        HTTPException: 500 if an error occurs during the retrieval.

    Returns:
        List[UserResponse]: List of users.
    """
    try:
        statement = select(User).offset(skip)

        if limit is not None:
            statement = statement.limit(limit)

        users = session.exec(statement).all()

        return users
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving users: {str(e)}",
        )


@router.get("/{user_id}", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def get_user(user_id: uuid.UUID, session: Session = Depends(get_session)):
    """
    Get user by ID.

    Args:
        user_id (uuid.UUID): User ID.

    Raises:
        HTTPException: 404 if user not found.
        HTTPException: 500 if an error occurs during the retrieval.

    Returns:
        UserResponse: User information.
    """
    try:
        user = session.get(User, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        return user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving user: {str(e)}",
        )


@router.get(
    "/email/{email}", response_model=UserResponse, status_code=status.HTTP_200_OK
)
async def get_user_by_email(email: str, session: Session = Depends(get_session)):
    """
    Get user by email.

    Args:
        email (str): User email.

    Raises:
        HTTPException: 404 if user not found.
        HTTPException: 500 if an error occurs during the retrieval.

    Returns:
        UserResponse: User information.
    """
    try:
        statement = select(User).where(User.email == email)
        user = session.exec(statement).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        return user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving user by email: {str(e)}",
        )


@router.get("/count/", status_code=status.HTTP_200_OK)
async def get_user_count(session: Session = Depends(get_session)):
    """
    Get total number of users.

    Raises:
        HTTPException: 500 if an error occurs during the retrieval.

    Returns:
        dict: Dictionary with user count.
    """
    try:
        statement = select(func.count()).select_from(User)
        count = session.exec(statement).one()
        return {"user_count": count}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving user count: {str(e)}",
        )


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user_data: UserCreate, session: Session = Depends(get_session)):
    """
    Create a new user.

    Args:
        user_data (UserCreate): Data for the new user.

    Raises:
        HTTPException: 400 if email already registered.
        HTTPException: 500 if an error occurs during user creation.

    Returns:
        UserResponse: Created user information.
    """
    try:
        existing_user = session.exec(
            select(User).where(User.email == user_data.email)
        ).first()

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        hashed_password = hash_password(user_data.password)

        user_dict = user_data.model_dump()
        user_dict["password"] = hashed_password

        user = User(**user_dict)
        session.add(user)
        session.commit()
        session.refresh(user)

        return user
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating user: {str(e)}",
        )


@router.put("/{user_id}", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def update_user(
    user_id: uuid.UUID, user_data: UserUpdate, session: Session = Depends(get_session)
):
    """
    Update user information.

    Args:
        user_id (uuid.UUID): User ID.
        user_data (UserUpdate): Updated user information.

    Raises:
        HTTPException: 404 if user not found.
        HTTPException: 400 if email already in use.
        HTTPException: 500 if an error occurs during the update.

    Returns:
        UserResponse: Updated user information.
    """
    try:
        user = session.get(User, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        if user_data.email and user_data.email != user.email:
            existing_email = session.exec(
                select(User).where(User.email == user_data.email)
            ).first()
            if existing_email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already in use",
                )

        user_dict = user_data.model_dump(exclude_unset=True)
        for key, value in user_dict.items():
            setattr(user, key, value)

        session.add(user)
        session.commit()
        session.refresh(user)

        return user
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating user: {str(e)}",
        )


@router.post("/{user_id}/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    user_id: uuid.UUID,
    password_data: UserChangePassword,
    session: Session = Depends(get_session),
):
    """
    Change user password.

    Args:
        user_id (uuid.UUID): User ID.
        password_data (UserChangePassword): Old and new password data.

    Raises:
        HTTPException: 404 if user not found.
        HTTPException: 400 if current password is incorrect.
        HTTPException: 500 if an error occurs during the password change.

    Returns:
        dict: Success message.
    """
    try:
        user = session.get(User, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        if not verify_password(password_data.old_password, user.password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect",
            )

        user.password = hash_password(password_data.new_password)

        session.add(user)
        session.commit()

        return {"message": "Password changed successfully"}
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error changing password: {str(e)}",
        )


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: uuid.UUID, session: Session = Depends(get_session)):
    """
    Delete user by ID.

    Args:
        user_id (uuid.UUID): User ID.

    Raises:
        HTTPException: 404 if user not found.
        HTTPException: 500 if an error occurs during the deletion.

    Returns:
        dict: Success message.
    """
    try:
        user = session.get(User, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        session.delete(user)
        session.commit()

        return {"message": "User deleted successfully"}
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting user: {str(e)}",
        )


@router.get(
    "/{user_id}/verify-email",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
)
async def verify_email(user_id: uuid.UUID, session: Session = Depends(get_session)):
    """
    Verify user's email.

    Args:
        user_id (uuid.UUID): User ID.

    Raises:
        HTTPException: 404 if user not found.
        HTTPException: 400 if email already verified.
        HTTPException: 500 if an error occurs during the update.

    Returns:
        UserResponse: User information.
    """
    try:
        user = session.get(User, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        if user.email_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Email already verified"
            )

        user.email_verified = datetime.now(timezone.utc)

        session.add(user)
        session.commit()
        session.refresh(user)

        return user
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error verifying email: {str(e)}",
        )


@router.get(
    "/search/", response_model=List[UserResponse], status_code=status.HTTP_200_OK
)
async def search_users(query: str = "", session: Session = Depends(get_session)):
    """
    Search users by name, email, phone, address, or role.

    Args:
        query (str, optional): Search query string. Defaults to "".

    Raises:
        HTTPException: 500 if an error occurs during the search.

    Returns:
        List[UserResponse]: List of users matching the search criteria.
    """
    try:
        users = session.exec(
            select(User).where(
                or_(
                    User.name.ilike(f"%{query}%"),
                    User.email.ilike(f"%{query}%"),
                    User.phone.ilike(f"%{query}%"),
                    User.address.ilike(f"%{query}%"),
                    User.role.ilike(f"%{query}%"),
                )
            )
        ).all()

        return users
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error searching users: {str(e)}",
        )
