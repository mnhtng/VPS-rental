from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie, Request
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
    Translator,
    get_translator,
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
    translator: Translator = Depends(get_translator),
):
    """
    Login user and return JWT access token if email is verified.
    Sets refresh token in HttpOnly Secure cookie.

    Args:
        response (Response): FastAPI response object for setting cookies.
        user_credentials (AuthLogin): User login credentials (email, password).
        session (Session, optional): Database session. Defaults to Depends(get_session).
        translator (Translator, optional): Translator for i18n messages. Defaults to Depends(get_translator).

    Raises:
        HTTPException: 400 if email or password is incorrect.
        HTTPException: 500 if there is a server error.

    Returns:
        Dict[str, Any]: Login result with access token or verification status.
    """
    try:
        auth_service = AuthService(session)
        result = auth_service.login_user(user_credentials)

        if not result["email_verified"]:
            return {
                "message": translator.t("auth.email_not_verified"),
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
            "message": translator.t("auth.login_success"),
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
            detail=translator.t("auth.error_login"),
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
    translator: Translator = Depends(get_translator),
):
    """
    Login user via OAuth token and return JWT access token.
    Sets refresh token in HttpOnly Secure cookie.

    Args:
        response (Response): FastAPI response object for setting cookies.
        oauth_data (AuthLoginOAuth): OAuth login data.
        session (Session, optional): Database session. Defaults to Depends(get_session).
        translator (Translator, optional): Translator for i18n messages. Defaults to Depends(get_translator).

    Raises:
        HTTPException: 400 if OAuth token is invalid.
        HTTPException: 500 if there is a server error.

    Returns:
        Dict[str, Any]: Login result with access token.
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
            "message": translator.t("auth.oauth_login_success"),
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
            detail=translator.t("auth.error_login"),
        )


@router.post(
    "/register",
    response_model=Dict[str, Any],
    status_code=status.HTTP_201_CREATED,
    summary="User registration",
    description="Register a new user and return verification token",
)
async def register(
    user_data: AuthRegister,
    session: Session = Depends(get_session),
    translator: Translator = Depends(get_translator),
):
    """
    Register a new user.

    Args:
        user_data (AuthRegister): User registration data (name, email, password).
        session (Session, optional): Database session. Defaults to Depends(get_session).
        translator (Translator, optional): Translator for i18n messages. Defaults to Depends(get_translator).

    Raises:
        HTTPException: 400 if email is already registered.
        HTTPException: 500 if there is a server error.

    Returns:
        Dict[str, Any]: Registration result with user info and verification token.
    """
    try:
        auth_service = AuthService(session)
        result = auth_service.register_user(user_data)

        return {
            "message": translator.t("auth.register_success"),
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
            detail=translator.t("auth.error_register"),
        )


@router.post(
    "/resend-verification",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    summary="Resend verification email",
    description="Resend verification email to the user",
)
async def resend_verification(
    data: AuthResendVerification,
    session: Session = Depends(get_session),
    translator: Translator = Depends(get_translator),
):
    """
    Resend verification email to the user.

    Args:
        data (AuthResendVerification): Request containing user email.
        session (Session, optional): Database session. Defaults to Depends(get_session).
        translator (Translator, optional): Translator for i18n messages. Defaults to Depends(get_translator).

    Raises:
        HTTPException: 404 if user not found.
        HTTPException: 400 if email already verified.
        HTTPException: 500 if there is a server error.

    Returns:
        Dict[str, Any]: Result with new verification token.
    """
    try:
        auth_service = AuthService(session)
        result = auth_service.resend_verification(data)

        return {
            "message": translator.t("auth.verification_sent"),
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
            detail=translator.t("auth.error_verify_email"),
        )


@router.post(
    "/verify-email",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    summary="Verify email",
    description="Verify the user's email using a token. Sets refresh token in HttpOnly Secure cookie.",
)
async def verify_email(
    data: AuthVerifyEmail,
    session: Session = Depends(get_session),
    translator: Translator = Depends(get_translator),
):
    """
    Verify the user's email using a token.

    Args:
        data (AuthVerifyEmail): Request containing verification token.
        session (Session, optional): Database session. Defaults to Depends(get_session).
        translator (Translator, optional): Translator for i18n messages. Defaults to Depends(get_translator).

    Raises:
        HTTPException: 400 if token is invalid or expired.
        HTTPException: 500 if there is a server error.

    Returns:
        Dict[str, Any]: Result with verified user info.
    """
    try:
        auth_service = AuthService(session)
        user = auth_service.verify_email(data)

        return {
            "message": translator.t("auth.email_verified"),
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
            detail=translator.t("auth.error_verify_email"),
        )


@router.post(
    "/resend-reset-password",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    summary="Resend reset password email",
    description="Resend password reset email to the user",
)
async def resend_reset_password_email(
    data: AuthResendVerification,
    session: Session = Depends(get_session),
    translator: Translator = Depends(get_translator),
):
    """
    Resend password reset email to the user.

    Args:
        data (AuthResendVerification): Request containing user email.
        session (Session, optional): Database session. Defaults to Depends(get_session).
        translator (Translator, optional): Translator for i18n messages. Defaults to Depends(get_translator).

    Raises:
        HTTPException: 404 if user not found.
        HTTPException: 500 if there is a server error.

    Returns:
        Dict[str, Any]: Result with reset token info.
    """
    try:
        auth_service = AuthService(session)
        result = auth_service.resend_reset_password(data)

        return {
            "message": translator.t("auth.password_reset_sent"),
            "data": result,
        }
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f">>> Error resending reset password email: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=translator.t("auth.error_reset_password"),
        )


@router.post(
    "/forgot-password",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    summary="Request password reset email",
    description="Request password reset email to be sent to the user",
)
async def forgot_password(
    data: AuthForgotPassword,
    session: Session = Depends(get_session),
    translator: Translator = Depends(get_translator),
):
    """
    Request password reset email.

    Args:
        data (AuthForgotPassword): Request containing user email.
        session (Session, optional): Database session. Defaults to Depends(get_session).
        translator (Translator, optional): Translator for i18n messages. Defaults to Depends(get_translator).

    Raises:
        HTTPException: 500 if there is a server error.

    Returns:
        Dict[str, Any]: Result with reset token info (always returns success for security).
    """
    try:
        auth_service = AuthService(session)
        result = auth_service.forgot_password(data)

        if not result:
            return {
                "message": translator.t("auth.password_reset_sent"),
                "data": {},
            }

        return {
            "message": translator.t("auth.password_reset_sent"),
            "data": result,
        }
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f">>> Error during forgot password: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=translator.t("auth.error_reset_password"),
        )


@router.post(
    "/reset-password",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    summary="Reset password",
    description="Reset user password using a valid reset token",
)
async def reset_password(
    data: AuthResetPassword,
    session: Session = Depends(get_session),
    translator: Translator = Depends(get_translator),
):
    """
    Reset user password using a valid reset token.

    Args:
        data (AuthResetPassword): Request containing token, email and new password.
        session (Session, optional): Database session. Defaults to Depends(get_session).
        translator (Translator, optional): Translator for i18n messages. Defaults to Depends(get_translator).

    Raises:
        HTTPException: 400 if token is invalid or expired.
        HTTPException: 500 if there is a server error.

    Returns:
        Dict[str, Any]: Result with user info after password reset.
    """
    try:
        auth_service = AuthService(session)
        user = auth_service.reset_password(data)

        return {
            "message": translator.t("auth.password_reset_success"),
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
            detail=translator.t("auth.error_reset_password"),
        )


@router.get(
    "/validate-reset-token",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    summary="Validate reset token",
    description="Validate a password reset token",
)
async def validate_reset_token(
    token: str,
    email: str,
    session: Session = Depends(get_session),
    translator: Translator = Depends(get_translator),
):
    """
    Validate a password reset token.

    Args:
        token (str): Password reset token.
        email (str): User email.
        session (Session, optional): Database session. Defaults to Depends(get_session).
        translator (Translator, optional): Translator for i18n messages. Defaults to Depends(get_translator).

    Raises:
        HTTPException: 400 if token is invalid or expired.
        HTTPException: 500 if there is a server error.

    Returns:
        Dict[str, Any]: Result with user info and token expiry.
    """
    try:
        auth_service = AuthService(session)
        result = auth_service.validate_reset_token(token, email)

        return {
            "message": translator.t("auth.token_valid"),
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
            detail=translator.t("auth.error_reset_password"),
        )


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current user info",
    description="Get current authenticated user info",
)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
    translator: Translator = Depends(get_translator),
):
    """
    Get current authenticated user info.

    Args:
        current_user (User, optional): The authenticated user. Defaults to Depends(get_current_user).
        translator (Translator, optional): Translator for i18n messages. Defaults to Depends(get_translator).

    Raises:
        HTTPException: 401 if not authenticated.
        HTTPException: 500 if there is a server error.

    Returns:
        UserResponse: Current user information.
    """
    try:
        return current_user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f">>> Error retrieving current user info: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=translator.t("errors.internal_server"),
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
    translator: Translator = Depends(get_translator),
):
    """
    Update current authenticated user's profile.

    Args:
        user_update (UserUpdate): Updated user data.
        current_user (User, optional): The authenticated user. Defaults to Depends(get_current_user).
        session (Session, optional): Database session. Defaults to Depends(get_session).
        translator (Translator, optional): Translator for i18n messages. Defaults to Depends(get_translator).

    Raises:
        HTTPException: 401 if not authenticated.
        HTTPException: 400 if email already in use.
        HTTPException: 500 if there is a server error.

    Returns:
        UserResponse: Updated user information.
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
            detail=translator.t("errors.internal_server"),
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
    translator: Translator = Depends(get_translator),
):
    """
    Change the password of the current authenticated user.

    Args:
        password_change (UserChangePassword): Current and new password.
        current_user (User, optional): The authenticated user. Defaults to Depends(get_current_user).
        session (Session, optional): Database session. Defaults to Depends(get_session).
        translator (Translator, optional): Translator for i18n messages. Defaults to Depends(get_translator).

    Raises:
        HTTPException: 401 if not authenticated.
        HTTPException: 400 if current password is incorrect.
        HTTPException: 500 if there is a server error.

    Returns:
        Dict[str, Any]: Result with user info after password change.
    """
    try:
        auth_service = AuthService(session)
        user = auth_service.change_password(current_user, password_change)

        return {
            "message": translator.t("auth.password_changed"),
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
            detail=translator.t("auth.error_change_password"),
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
    translator: Translator = Depends(get_translator),
):
    """
    Refresh access token using refresh token from HttpOnly cookie.

    Args:
        response (Response): FastAPI response object for cookie operations.
        refresh_token (Optional[str], optional): Refresh token from cookie. Defaults to Cookie(None).
        session (Session, optional): Database session. Defaults to Depends(get_session).
        translator (Translator, optional): Translator for i18n messages. Defaults to Depends(get_translator).

    Raises:
        HTTPException: 401 if refresh token is missing or invalid.
        HTTPException: 500 if there is a server error.

    Returns:
        Dict[str, Any]: Result with new access token.
    """
    try:
        if not refresh_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=translator.t("auth.refresh_token_not_found"),
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
                detail=translator.t("auth.invalid_refresh_token"),
            )

        return {
            "message": translator.t("auth.token_refreshed"),
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
            detail=translator.t("errors.internal_server"),
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
    translator: Translator = Depends(get_translator),
):
    """
    Logout user by revoking refresh token and clearing cookie.

    Args:
        response (Response): FastAPI response object for cookie operations.
        refresh_token (Optional[str], optional): Refresh token from cookie. Defaults to Cookie(None).
        translator (Translator, optional): Translator for i18n messages. Defaults to Depends(get_translator).

    Raises:
        HTTPException: 500 if there is a server error.

    Returns:
        Dict[str, Any]: Logout success message.
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
            "message": translator.t("auth.logout_success"),
            "data": {},
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f">>> Error during logout: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=translator.t("errors.internal_server"),
        )
