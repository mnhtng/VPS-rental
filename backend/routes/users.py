import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, or_, select, func
from sqlalchemy.orm import selectinload
from typing import List, Dict, Any
import logging

from backend.db import get_session
from backend.models import User, Account
from backend.schemas import (
    UserCreate,
    UserUpdate,
    UserResponse,
)
from backend.utils import (
    hash_password,
    get_current_user,
    get_admin_user,
    Translator,
    get_translator,
)


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/users", tags=["User"])


@router.get(
    "",
    response_model=List[UserResponse],
    status_code=status.HTTP_200_OK,
    summary="[Admin] Get a list of users",
    description="Retrieve a list of users with optional pagination (Admin only)",
)
async def get_users(
    skip: int = 0,
    limit: int = None,
    session: Session = Depends(get_session),
    admin_user: User = Depends(get_admin_user),
    translator: Translator = Depends(get_translator),
):
    """
    Get list of users.

    Args:
        skip (int, optional): Number of users to skip. Defaults to 0.
        limit (int, optional): Maximum number of users to return. Defaults to None.
        session (Session, optional): Database session. Defaults to Depends(get_session).
        admin_user (User, optional): The authenticated admin user. Defaults to Depends(get_admin_user).
        translator (Translator, optional): Translator for i18n messages. Defaults to Depends(get_translator).

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
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f">>> Error retrieving users: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=translator.t("errors.internal_server"),
        )


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get a user by ID",
    description="Retrieve a user by their unique identifier",
)
async def get_user(
    user_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    translator: Translator = Depends(get_translator),
):
    """
    Get user by ID.

    Args:
        user_id (uuid.UUID): User ID.
        session (Session, optional): Database session. Defaults to Depends(get_session).
        current_user (User, optional): The authenticated user. Defaults to Depends(get_current_user).
        translator (Translator, optional): Translator for i18n messages. Defaults to Depends(get_translator).

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
                detail=translator.t("errors.forbidden"),
            )

        user = session.get(User, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=translator.t("user.not_found"),
            )

        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f">>> Error retrieving user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=translator.t("errors.internal_server"),
        )


@router.get(
    "/email/{email}",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="[Admin] Get a user by email",
    description="Retrieve a user by their email address (Admin only)",
)
async def get_user_by_email(
    email: str,
    session: Session = Depends(get_session),
    admin_user: User = Depends(get_admin_user),
    translator: Translator = Depends(get_translator),
):
    """
    Get user by email.

    Args:
        email (str): User email.
        session (Session, optional): Database session. Defaults to Depends(get_session).
        admin_user (User, optional): The authenticated admin user. Defaults to Depends(get_admin_user).
        translator (Translator, optional): Translator for i18n messages. Defaults to Depends(get_translator).

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
                detail=translator.t("user.not_found"),
            )

        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f">>> Error retrieving user by email: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=translator.t("errors.internal_server"),
        )


@router.get(
    "/count",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    summary="[Admin] Get total number of users",
    description="Retrieve the total count of users (Admin only)",
)
async def get_user_count(
    session: Session = Depends(get_session),
    admin_user: User = Depends(get_admin_user),
    translator: Translator = Depends(get_translator),
):
    """
    Get total number of users.

    Args:
        session (Session, optional): Database session. Defaults to Depends(get_session).
        admin_user (User, optional): The authenticated admin user. Defaults to Depends(get_admin_user).
        translator (Translator, optional): Translator for i18n messages. Defaults to Depends(get_translator).

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
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f">>> Error retrieving user count: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=translator.t("errors.internal_server"),
        )


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="[Admin] Create a new user",
    description="Create a new user (Admin only)",
)
async def create_user(
    user_data: UserCreate,
    session: Session = Depends(get_session),
    admin_user: User = Depends(get_admin_user),
    translator: Translator = Depends(get_translator),
):
    """
    Create a new user.

    Args:
        user_data (UserCreate): Data for the new user.
        session (Session, optional): Database session. Defaults to Depends(get_session).
        admin_user (User, optional): The authenticated admin user. Defaults to Depends(get_admin_user).
        translator (Translator, optional): Translator for i18n messages. Defaults to Depends(get_translator).

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
                detail=translator.t("auth.user_exists"),
            )

        hashed_password = hash_password(user_data.password)

        user_dict = user_data.model_dump(exclude={"verify_email"})
        user_dict["password"] = hashed_password

        if user_data.verify_email:
            user_dict["email_verified"] = datetime.now(timezone.utc)

        user = User(**user_dict)
        session.add(user)
        session.flush()

        # Create credential account
        account = Account(
            user_id=user.id,
            type="credentials",
            provider="credentials",
            provider_account_id=str(user.id),
        )

        session.add(account)
        session.commit()
        session.refresh(user)
        session.refresh(account)

        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f">>> Error creating user: {str(e)}")
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=translator.t("errors.internal_server"),
        )


@router.put(
    "/{user_id}",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="[Admin] Update a user",
    description="Update user information (Admin only)",
)
async def update_user(
    user_id: uuid.UUID,
    user_data: UserUpdate,
    session: Session = Depends(get_session),
    admin_user: User = Depends(get_admin_user),
    translator: Translator = Depends(get_translator),
):
    """
    Update user information.

    Args:
        user_id (uuid.UUID): User ID.
        user_data (UserUpdate): Updated user information.
        session (Session, optional): Database session. Defaults to Depends(get_session).
        admin_user (User, optional): The authenticated admin user. Defaults to Depends(get_admin_user).
        translator (Translator, optional): Translator for i18n messages. Defaults to Depends(get_translator).

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
                status_code=status.HTTP_404_NOT_FOUND,
                detail=translator.t("user.not_found"),
            )

        if user_data.email and user_data.email != user.email:
            existing_email = session.exec(
                select(User).where(User.email == user_data.email)
            ).first()
            if existing_email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=translator.t("auth.user_exists"),
                )

        user_dict = user_data.model_dump(exclude_unset=True, exclude={"verify_email"})
        for key, value in user_dict.items():
            setattr(user, key, value)

        # Handle email verification
        if user_data.verify_email is True:
            user.email_verified = datetime.now(timezone.utc)
        elif user_data.verify_email is False:
            user.email_verified = None

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
            detail=translator.t("errors.internal_server"),
        )


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="[Admin] Delete a user",
    description="Delete user by ID (Admin only)",
)
async def delete_user(
    user_id: uuid.UUID,
    session: Session = Depends(get_session),
    admin_user: User = Depends(get_admin_user),
    translator: Translator = Depends(get_translator),
):
    """
    Delete user by ID.

    Args:
        user_id (uuid.UUID): User ID.
        session (Session, optional): Database session. Defaults to Depends(get_session).
        admin_user (User, optional): The authenticated admin user. Defaults to Depends(get_admin_user).
        translator (Translator, optional): Translator for i18n messages. Defaults to Depends(get_translator).

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
                status_code=status.HTTP_404_NOT_FOUND,
                detail=translator.t("user.not_found"),
            )

        session.delete(user)
        session.commit()

        return {"message": translator.t("user.user_deleted")}
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f">>> Error deleting user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=translator.t("errors.internal_server"),
        )


@router.get(
    "/search",
    response_model=List[UserResponse],
    status_code=status.HTTP_200_OK,
    summary="[Admin] Search users",
    description="Search users by name, email, phone, address, or role (Admin only)",
)
async def search_users(
    query: str = "",
    session: Session = Depends(get_session),
    admin_user: User = Depends(get_admin_user),
    translator: Translator = Depends(get_translator),
):
    """
    Search users by name, email, phone, address, or role.

    Args:
        query (str, optional): Search query string. Defaults to "".
        session (Session, optional): Database session. Defaults to Depends(get_session).
        admin_user (User, optional): The authenticated admin user. Defaults to Depends(get_admin_user).
        translator (Translator, optional): Translator for i18n messages. Defaults to Depends(get_translator).

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
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f">>> Error searching users: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=translator.t("errors.internal_server"),
        )
