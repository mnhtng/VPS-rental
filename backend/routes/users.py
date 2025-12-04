import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, or_, select, func
from sqlalchemy.orm import selectinload
from typing import List, Dict, Any
import logging

from backend.db import get_session
from backend.models import User
from backend.schemas import (
    UserCreate,
    UserUpdate,
    UserResponse,
)
from backend.utils import (
    hash_password,
    get_current_user,
    get_admin_user,
)


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/users", tags=["User"])


@router.get("/", response_model=List[UserResponse], status_code=status.HTTP_200_OK)
async def get_users(
    skip: int = 0,
    limit: int = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_admin_user),
):
    """
    Get list of users.

    Args:
        skip (int, optional): Number of users to skip. Defaults to 0.
        limit (int, optional): Maximum number of users to return. Defaults to None.

    Raises:
        HTTPException: 401 if not authenticated.
        HTTPException: 403 if not admin.
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
        logger.error(f">>> Error retrieving users: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving users",
        )


@router.get("/{user_id}", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def get_user(
    user_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get user by ID.

    Args:
        user_id (uuid.UUID): User ID.

    Raises:
        HTTPException: 401 if not authenticated.
        HTTPException: 403 if trying to view other user's profile without admin permission.
        HTTPException: 404 if user not found.
        HTTPException: 500 if an error occurs during the retrieval.

    Returns:
        UserResponse: User information.
    """
    try:
        if current_user.role != "ADMIN" and current_user.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this user",
            )

        user = session.get(User, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f">>> Error retrieving user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving user",
        )


@router.get(
    "/email/{email}",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
)
async def get_user_by_email(
    email: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_admin_user),
):
    """
    Get user by email.

    Args:
        email (str): User email.

    Raises:
        HTTPException: 401 if not authenticated.
        HTTPException: 403 if not admin.
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
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f">>> Error retrieving user by email: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving user by email",
        )


@router.get("/count/", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
async def get_user_count(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_admin_user),
):
    """
    Get total number of users.

    Raises:
        HTTPException: 401 if not authenticated.
        HTTPException: 403 if not admin.
        HTTPException: 500 if an error occurs during the retrieval.

    Returns:
        Dictionary containing the user count.
    """
    try:
        statement = select(func.count()).select_from(User)
        count = session.exec(statement).one()
        return {"user_count": count}
    except Exception as e:
        logger.error(f">>> Error retrieving user count: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving user count",
        )


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_admin_user),
):
    """
    Create a new user.

    Args:
        user_data (UserCreate): Data for the new user.

    Raises:
        HTTPException: 401 if not authenticated.
        HTTPException: 403 if not admin.
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
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f">>> Error creating user: {str(e)}")
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating user",
        )


@router.put("/{user_id}", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def update_user(
    user_id: uuid.UUID,
    user_data: UserUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_admin_user),
):
    """
    Update user information.

    Args:
        user_id (uuid.UUID): User ID.
        user_data (UserUpdate): Updated user information.

    Raises:
        HTTPException: 401 if not authenticated.
        HTTPException: 403 if not admin.
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
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f">>> Error updating user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating user",
        )


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_admin_user),
):
    """
    Delete user by ID.

    Args:
        user_id (uuid.UUID): User ID.

    Raises:
        HTTPException: 401 if not authenticated.
        HTTPException: 403 if not admin.
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
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f">>> Error deleting user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting user",
        )


@router.get(
    "/search/",
    response_model=List[UserResponse],
    status_code=status.HTTP_200_OK,
)
async def search_users(
    query: str = "",
    session: Session = Depends(get_session),
    current_user: User = Depends(get_admin_user),
):
    """
    Search users by name, email, phone, address, or role.

    Args:
        query (str, optional): Search query string. Defaults to "".

    Raises:
        HTTPException: 401 if not authenticated.
        HTTPException: 403 if not admin.
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
        logger.error(f">>> Error searching users: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error searching users",
        )
