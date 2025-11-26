import uuid
from argon2 import hash_password
from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie
from fastapi.security import HTTPBearer
from sqlmodel import Session, select
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
import logging

from backend.core import settings
from backend.db import get_session
from backend.models import User, Account, VerificationToken
from backend.schemas import (
    AuthLogin,
    AuthRegister,
    AuthToken,
    AuthResendVerification,
    AuthVerifyEmail,
    AuthForgotPassword,
    AuthResetPassword,
    UserUpdate,
    UserChangePassword,
    UserResponse,
)
from backend.utils import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
    verify_token,
    generate_verification_token,
    get_current_user,
    get_admin_user,
)


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/login",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
)
async def login(
    response: Response,
    user_credentials: AuthLogin,
    session: Session = Depends(get_session),
):
    """
    Login user and return JWT access token if email is verified.
    Sets refresh token in HttpOnly Secure cookie.

    Args:
        response (Response): FastAPI Response object to set cookies.
        user_credentials (AuthLogin): User login credentials.
        session (Session): Database session.

    Raises:
        HTTPException: 401 if credentials are incorrect.
        HTTPException: 403 if email is not verified.
        HTTPException: 500 if there is an error during login.

    Returns:
        Dict containing access_token (short-lived, 15 min) in JSON.
        Refresh token (7 days) is set in HttpOnly Secure cookie.
    """
    try:
        statement = select(User).where(User.email == user_credentials.email)
        user = session.exec(statement).first()

        if not user or not verify_password(user_credentials.password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )

        if not user.email_verified:
            statement = select(VerificationToken).where(
                VerificationToken.identifier == user.email
            )
            verify_token = session.exec(statement).first()

            if not verify_token or verify_token.expires < datetime.now(timezone.utc):
                verify_dict = {
                    "identifier": user.email,
                    "token": generate_verification_token(),
                    "expires": datetime.now(timezone.utc) + timedelta(hours=24),
                }

                if verify_token:
                    verify_token.token = verify_dict["token"]
                    verify_token.expires = verify_dict["expires"]
                    session.add(verify_token)
                else:
                    verify_token = VerificationToken(**verify_dict)
                    session.add(verify_token)

                session.commit()
                session.refresh(verify_token)

            return {
                "message": "Email not verified",
                "data": {
                    "email_verified": False,
                    "email": user.email,
                    "name": user.name,
                    "verification_token": verify_token.token,
                },
            }

        # Create short-lived access token (15 minutes)
        access_token_expires = timedelta(minutes=15)
        access_token = create_access_token(
            data={
                "sub": user.email,
                "role": user.role,
            },
            expires_delta=access_token_expires,
        )

        # Create long-lived refresh token (14 days) - JWT only, no database
        refresh_token_expires = timedelta(days=14)
        refresh_token = create_refresh_token(
            data={
                "sub": user.email,
                "role": user.role,
            },
            expires_delta=refresh_token_expires,
        )

        # Set refresh token in HttpOnly Secure cookie
        cookie_name = settings.REFRESH_TOKEN_NAME
        max_age = 14 * 24 * 60 * 60  # 14 days in seconds

        response.set_cookie(
            key=cookie_name,
            value=refresh_token,
            max_age=max_age,
            httponly=True,  # Prevent JavaScript access
            secure=settings.DEBUG == False,  # HTTPS only in production
            samesite="lax",  # CSRF protection
            path="/",  # Available for all paths
        )

        return {
            "message": "Login successful",
            "data": {
                "email_verified": True,
                "access_token": access_token,
                "token_type": "bearer",
                "expires_in": 15 * 60,  # 15 minutes in seconds
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f">>> Error during login: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error during login",
        )


@router.post(
    "/register",
    response_model=Dict[str, Any],
    status_code=status.HTTP_201_CREATED,
)
async def register(user_data: AuthRegister, session: Session = Depends(get_session)):
    """
    Register a new user.

    Args:
        user_data (AuthRegister): User registration data.

    Raises:
        HTTPException: 400 if user with email already exists.
        HTTPException: 500 if there is an error during user registration.

    Returns:
        Registration success message, verification token, and user/account data.
    """
    try:
        statement = select(User).where(User.email == user_data.email)
        existing_user = session.exec(statement).first()

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists",
            )

        # Create new user
        user_dict = user_data.model_dump()
        user_dict["password"] = hash_password(user_data.password)
        user = User(**user_dict)

        session.add(user)
        session.flush()  # Flush to get user.id

        # Create credential account for the user
        account = Account(
            user_id=user.id,
            type="credentials",
            provider="credentials",
            provider_account_id=str(user.id),
        )

        # Create verification token
        verify_dict = {
            "identifier": user.email,
            "token": generate_verification_token(),
            "expires": datetime.now(timezone.utc) + timedelta(hours=24),  # 24 hours
        }
        verify = VerificationToken(**verify_dict)

        session.add(account)
        session.add(verify)
        session.commit()
        session.refresh(user)
        session.refresh(account)
        session.refresh(verify)

        return {
            "message": "User registered successfully",
            "data": {
                "user": user.to_dict(),
                "account": account.to_dict(),
                "verification_token": verify.token,
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f">>> Error registering user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error registering user",
        )


@router.post(
    "/resend-verification",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
)
async def resend_verification(
    data: AuthResendVerification, session: Session = Depends(get_session)
):
    """
    Resend verification email to the user.

    Args:
        data (AuthResendVerification): Data containing the user's email.

    Raises:
        HTTPException: 404 if user not found.
        HTTPException: 400 if email is already verified.
        HTTPException: 500 if an error occurs during the process.

    Returns:
        A success message and the new verification token.
    """
    try:
        statement = select(User).where(User.email == data.email)
        user = session.exec(statement).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        if user.email_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already verified",
            )

        # Create or update verification token
        verify_dict = {
            "identifier": user.email,
            "token": generate_verification_token(),
            "expires": datetime.now(timezone.utc) + timedelta(hours=24),  # 24 hours
        }

        statement = select(VerificationToken).where(
            VerificationToken.identifier == user.email
        )
        existing_token = session.exec(statement).first()

        if existing_token:
            existing_token.token = verify_dict["token"]
            existing_token.expires = verify_dict["expires"]
            session.add(existing_token)
        else:
            verify = VerificationToken(**verify_dict)
            session.add(verify)

        session.commit()

        return {
            "message": "Verification email sent successfully",
            "data": {
                "verification_token": verify_dict["token"],
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f">>> Error resending verification email: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error resending verification email",
        )


@router.post(
    "/verify-email",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
)
async def verify_email(data: AuthVerifyEmail, session: Session = Depends(get_session)):
    """
    Verify the user's email using a token.

    Args:
        data (AuthVerifyEmail): Data containing the verification token.

    Raises:
        HTTPException: 400 if token is invalid or expired.
        HTTPException: 404 if user not found.
        HTTPException: 400 if email is already verified.
        HTTPException: 500 if an error occurs during the verification.

    Returns:
        A success message and the verified user data.
    """
    try:
        statement = select(VerificationToken).where(
            VerificationToken.token == data.token
        )
        verify = session.exec(statement).first()

        if not verify or verify.expires < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "INVALID_TOKEN",
                    "message": "Invalid or expired verification token",
                },
            )

        statement = select(User).where(User.email == verify.identifier)
        user = session.exec(statement).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "USER_NOT_FOUND",
                    "message": "User not found",
                },
            )

        if user.email_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "ALREADY_VERIFIED",
                    "message": "Email is already verified",
                },
            )

        user.email_verified = datetime.now(timezone.utc)
        session.add(user)
        session.delete(verify)
        session.commit()
        session.refresh(user)

        return {
            "message": "Email verified successfully",
            "data": {
                "user": user.to_dict(),
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f">>> Error verifying email: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error verifying email",
        )


@router.post(
    "/resend-reset-password",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
)
async def resend_reset_password_email(
    data: AuthResendVerification, session: Session = Depends(get_session)
):
    """
    Resend password reset email to the user.

    Args:
        data (AuthResendVerification): Data containing the user's email.

    Raises:
        HTTPException: 404 if user not found.
        HTTPException: 500 if an error occurs during the process.

    Returns:
        A success message and the new reset token.
    """
    try:
        statement = select(User).where(User.email == data.email)
        user = session.exec(statement).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        reset_token = generate_verification_token()

        statement = select(VerificationToken).where(
            VerificationToken.identifier == user.email
        )
        existing_token = session.exec(statement).first()

        if existing_token:
            existing_token.token = reset_token
            existing_token.expires = datetime.now(timezone.utc) + timedelta(hours=1)
            session.add(existing_token)
        else:
            verify_dict = {
                "identifier": user.email,
                "token": reset_token,
                "expires": datetime.now(timezone.utc) + timedelta(hours=1),  # 1 hour
            }
            verify = VerificationToken(**verify_dict)
            session.add(verify)

        session.commit()

        return {
            "message": "Password reset email sent successfully",
            "data": {
                "name": user.name,
                "reset_token": reset_token,
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f">>> Error resending reset password email: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error resending reset password email",
        )


@router.post(
    "/forgot-password",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
)
async def forgot_password(
    data: AuthForgotPassword, session: Session = Depends(get_session)
):
    """
    Request password reset email.

    Args:
        data (AuthForgotPassword): Data containing the user's email.

    Raises:
        HTTPException: 500 if an error occurs during the process.

    Returns:
        Success message (always returns success for security reasons).
    """
    try:
        statement = select(User).where(User.email == data.email)
        user = session.exec(statement).first()

        if not user or not user.email_verified:
            return {
                "message": "If the email exists in our system, you will receive a password reset link shortly",
                "data": {},
            }

        reset_token = generate_verification_token()

        statement = select(VerificationToken).where(
            VerificationToken.identifier == user.email
        )
        existing_token = session.exec(statement).first()

        if existing_token:
            session.delete(existing_token)

        verify_dict = {
            "identifier": user.email,
            "token": reset_token,
            "expires": datetime.now(timezone.utc) + timedelta(hours=1),  # 1 hour
        }
        verify = VerificationToken(**verify_dict)
        session.add(verify)
        session.commit()
        session.refresh(verify)

        return {
            "message": "Password reset link has been sent to your email. Please check your inbox (including spam folder).",
            "data": {
                "name": user.name,
                "reset_token": reset_token,
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f">>> Error during forgot password: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing password reset request",
        )


@router.post(
    "/reset-password",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
)
async def reset_password(
    data: AuthResetPassword, session: Session = Depends(get_session)
):
    """
    Reset user password using a valid reset token.

    Args:
        data (AuthResetPassword): Data containing reset token, email, and new password.

    Raises:
        HTTPException: 400 if token is invalid or expired.
        HTTPException: 404 if user not found.
        HTTPException: 500 if an error occurs during the reset.

    Returns:
        Success message and user data.
    """
    try:
        statement = select(VerificationToken).where(
            VerificationToken.token == data.token,
            VerificationToken.identifier == data.email,
        )
        reset_token = session.exec(statement).first()

        if not reset_token or reset_token.expires < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token",
            )

        statement = select(User).where(User.email == data.email)
        user = session.exec(statement).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        user.password = hash_password(data.password)
        session.add(user)
        session.delete(reset_token)
        session.commit()
        session.refresh(user)

        return {
            "message": "Password has been reset successfully",
            "data": {
                "name": user.name,
                "email": user.email,
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f">>> Error resetting password: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error resetting password",
        )


@router.get(
    "/validate-reset-token",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
)
async def validate_reset_token(
    token: str, email: str, session: Session = Depends(get_session)
):
    """
    Validate a password reset token.

    Args:
        token (str): Reset token.
        email (str): User's email.

    Raises:
        HTTPException: 400 if token is invalid or expired.
        HTTPException: 404 if user not found.

    Returns:
        Token validity status and user data.
    """
    try:
        statement = select(VerificationToken).where(
            VerificationToken.token == token,
            VerificationToken.identifier == email,
        )
        reset_token = session.exec(statement).first()

        if not reset_token or reset_token.expires < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token",
            )

        statement = select(User).where(User.email == email)
        user = session.exec(statement).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        return {
            "message": "Token is valid",
            "data": {
                "user": {
                    "email": user.email,
                    "name": user.name,
                },
                "token_expiry": reset_token.expires.isoformat(),
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f">>> Error validating reset token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error validating reset token",
        )


@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user info.

    Args:
        current_user (User, optional): The current authenticated user. Defaults to Depends(get_current_user).

    Raises:
        HTTPException: 4
        HTTPException:
        HTTPException: 500 if an error occurs during retrieval.

    Returns:
        Current user information.
    """
    try:
        return current_user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f">>> Error retrieving current user info: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving current user info",
        )


@router.put("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def update_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Update current authenticated user's profile.

    Args:
        user_update (UserUpdate): User update data.
        current_user (User, optional): The current authenticated user. Defaults to Depends(get_current_user).
        session (Session, optional): Database session. Defaults to Depends(get_session).

    Raises:
        HTTPException: 500 if an error occurs during update.

    Returns:
        Updated user information.
    """
    try:
        update_data = user_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(current_user, key, value)

        session.add(current_user)
        session.commit()
        session.refresh(current_user)

        return current_user
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f">>> Error updating user profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating user profile",
        )


@router.post(
    "/change-password",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
)
async def change_password(
    password_change: UserChangePassword,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    try:
        if not verify_password(password_change.current_password, current_user.password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect",
            )

        current_user.password = hash_password(password_change.new_password)
        session.add(current_user)
        session.commit()
        session.refresh(current_user)

        return {
            "message": "Password changed successfully",
            "data": {
                "user": current_user.to_dict(),
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f">>> Error changing password: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error changing password",
        )


@router.post(
    "/refresh-token",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
)
async def refresh_access_token(
    response: Response,
    refresh_token: Optional[str] = Cookie(None, alias=settings.REFRESH_TOKEN_NAME),
    session: Session = Depends(get_session),
):
    """
    Refresh access token using refresh token from HttpOnly cookie.

    This endpoint validates the refresh token and issues a new access token.
    Optionally rotates the refresh token for enhanced security.

    Args:
        response (Response): FastAPI Response object to set new cookies.
        refresh_token (Optional[str]): Refresh token from HttpOnly cookie.
        session (Session): Database session.

    Raises:
        HTTPException: 401 if refresh token is missing, invalid, or expired.
        HTTPException: 500 if there is an error during token refresh.

    Returns:
        Dict containing new access_token (15 min).
    """
    try:
        if not refresh_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token not found",
            )

        # Verify JWT refresh token
        try:
            payload = verify_refresh_token(refresh_token)
        except HTTPException:
            # Clear invalid cookie
            response.delete_cookie(
                key=settings.REFRESH_TOKEN_NAME,
                path="/",
                httponly=True,
                secure=settings.DEBUG == False,
                samesite="lax",
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
            )

        # Get user from payload
        email = payload.get("sub")
        statement = select(User).where(User.email == email)
        user = session.exec(statement).first()

        if not user:
            response.delete_cookie(
                key=settings.REFRESH_TOKEN_NAME,
                path="/",
                httponly=True,
                secure=settings.DEBUG == False,
                samesite="lax",
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )

        # Create new access token (15 minutes)
        access_token_expires = timedelta(minutes=15)
        access_token = create_access_token(
            data={
                "sub": user.email,
                "role": user.role,
            },
            expires_delta=access_token_expires,
        )

        # Optional: Rotate refresh token for enhanced security
        # Uncomment to enable refresh token rotation
        # new_refresh_token = create_refresh_token(
        #     data={"sub": user.email, "role": user.role},
        #     expires_delta=timedelta(days=7),
        # )
        #
        # response.set_cookie(
        #     key=settings.REFRESH_TOKEN_NAME,
        #     value=new_refresh_token,
        #     max_age=14 * 24 * 60 * 60,
        #     httponly=True,
        #     secure=settings.DEBUG == False,
        #     samesite="lax",
        #     path="/",
        # )

        return {
            "message": "Access token refreshed successfully",
            "data": {
                "access_token": access_token,
                "token_type": "bearer",
                "expires_in": 15 * 60,  # 15 minutes in seconds
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f">>> Error refreshing token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error refreshing access token",
        )


@router.post(
    "/logout",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
)
async def logout(
    response: Response,
    refresh_token: Optional[str] = Cookie(None, alias=settings.REFRESH_TOKEN_NAME),
):
    """
    Logout user by revoking refresh token and clearing cookie.

    Args:
        response (Response): FastAPI Response object to clear cookies.
        refresh_token (Optional[str]): Refresh token from HttpOnly cookie.

    Returns:
        Dict with logout success message.
    """
    try:
        response.delete_cookie(
            key=settings.REFRESH_TOKEN_NAME,
            path="/",
            httponly=True,
            secure=settings.DEBUG == False,
            samesite="lax",
        )

        return {
            "message": "Logged out successfully",
            "data": {},
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f">>> Error during logout: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error during logout",
        )
