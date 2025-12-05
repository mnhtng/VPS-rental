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
    AuthLoginOAuth,
    AuthResendVerification,
    AuthVerifyEmail,
    AuthForgotPassword,
    AuthResetPassword,
    UserUpdate,
    UserChangePassword,
    UserResponse,
)
from backend.utils import (
    get_current_user,
    get_admin_user,
)
from backend.services import AuthService


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/login",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    summary="User login",
    description="Login user and return JWT access token if email is verified. Sets refresh token in HttpOnly Secure cookie.",
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
        auth_service = AuthService(session)
        result = auth_service.login_user(user_credentials)

        if not result["email_verified"]:
            return {
                "message": "Email not verified",
                "data": {
                    "email_verified": False,
                    "email": result["user"].email,
                    "name": result["user"].name,
                    "verification_token": result["verification_token"],
                },
            }

        # Set refresh token in HttpOnly Secure cookie
        response.set_cookie(
            key=settings.REFRESH_TOKEN_NAME,
            value=result["refresh_token"],
            max_age=14 * 24 * 60 * 60,  # 14 days
            httponly=True,
            secure=settings.DEBUG == False,
            samesite="lax",
            path="/",
        )

        return {
            "message": "Login successful",
            "data": {
                "email_verified": True,
                "access_token": result["access_token"],
                "token_type": "bearer",
                "expires_in": 15 * 60,  # 15 minutes
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
    "/oauth-login",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    summary="OAuth login",
    description="Login user via OAuth token and return JWT access token. Sets refresh token in HttpOnly Secure cookie.",
)
async def oauth_login(
    response: Response,
    oauth_data: AuthLoginOAuth,
    session: Session = Depends(get_session),
):
    """
    Login user via OAuth token and return JWT access token.
    Sets refresh token in HttpOnly Secure cookie.

    Args:
        response (Response): FastAPI Response object to set cookies.
        oauth_data (AuthLoginOAuth): OAuth login data containing oauth user info.
        session (Session): Database session.
    Raises:
        HTTPException: 401 if token is invalid.
        HTTPException: 500 if there is an error during login.
    Returns:
        Dict containing access_token (short-lived, 15 min) in JSON.
        Refresh token (7 days) is set in HttpOnly Secure cookie.
    """
    try:
        auth_service = AuthService(session)
        result = auth_service.oauth_login(oauth_data)

        # Set refresh token in HttpOnly Secure cookie
        response.set_cookie(
            key=settings.REFRESH_TOKEN_NAME,
            value=result["refresh_token"],
            max_age=14 * 24 * 60 * 60,
            httponly=True,
            secure=settings.DEBUG == False,
            samesite="lax",
            path="/",
        )

        return {
            "message": "OAuth login successful",
            "data": {
                "access_token": result["access_token"],
                "token_type": "bearer",
                "expires_in": 15 * 60,
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f">>> Error during OAuth login: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error during OAuth login",
        )


@router.post(
    "/register",
    response_model=Dict[str, Any],
    status_code=status.HTTP_201_CREATED,
    summary="User registration",
    description="Register a new user and return verification token",
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
        auth_service = AuthService(session)
        result = auth_service.register_user(user_data)

        return {
            "message": "User registered successfully",
            "data": {
                "user": result["user"].to_dict(),
                "account": result["account"].to_dict(),
                "verification_token": result["verification_token"],
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
    summary="Resend verification email",
    description="Resend verification email to the user",
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
        auth_service = AuthService(session)
        result = auth_service.resend_verification(data)

        return {
            "message": "Verification email sent successfully",
            "data": {
                "verification_token": result["verification_token"],
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
    summary="Verify email",
    description="Verify the user's email using a token. Sets refresh token in HttpOnly Secure cookie.",
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
        auth_service = AuthService(session)
        user = auth_service.verify_email(data)

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
    summary="Resend reset password email",
    description="Resend password reset email to the user",
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
        auth_service = AuthService(session)
        result = auth_service.resend_reset_password(data)

        return {
            "message": "Password reset email sent successfully",
            "data": result,
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
    summary="Request password reset email",
    description="Request password reset email to be sent to the user",
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
        auth_service = AuthService(session)
        result = auth_service.forgot_password(data)

        if not result:
            return {
                "message": "If the email exists in our system, you will receive a password reset link shortly",
                "data": {},
            }

        return {
            "message": "Password reset link has been sent to your email. Please check your inbox (including spam folder).",
            "data": result,
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
    summary="Reset password",
    description="Reset user password using a valid reset token",
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
        auth_service = AuthService(session)
        user = auth_service.reset_password(data)

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
    summary="Validate reset token",
    description="Validate a password reset token",
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
        auth_service = AuthService(session)
        result = auth_service.validate_reset_token(token, email)

        return {
            "message": "Token is valid",
            "data": {
                "user": {
                    "email": result["user"].email,
                    "name": result["user"].name,
                },
                "token_expiry": result["token_expiry"].isoformat(),
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


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current user info",
    description="Get current authenticated user info",
)
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


@router.put(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Update current user profile",
    description="Update current authenticated user's profile",
)
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
        auth_service = AuthService(session)
        updated_user = auth_service.update_user_profile(current_user, user_update)
        return updated_user
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
    summary="Change user password",
    description="Change the password of the current authenticated user",
)
async def change_password(
    password_change: UserChangePassword,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    try:
        auth_service = AuthService(session)
        user = auth_service.change_password(current_user, password_change)

        return {
            "message": "Password changed successfully",
            "data": {
                "user": user.to_dict(),
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
    summary="Refresh access token",
    description="Refresh access token using refresh token from HttpOnly cookie",
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

        # Verify and refresh token
        try:
            auth_service = AuthService(session)
            result = auth_service.refresh_token(refresh_token)
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
                "access_token": result["access_token"],
                "token_type": "bearer",
                "expires_in": 15 * 60,
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
    summary="Logout user",
    description="Logout user by revoking refresh token and clearing cookie",
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
