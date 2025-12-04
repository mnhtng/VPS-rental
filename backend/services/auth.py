from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
from sqlmodel import Session, select
from fastapi import HTTPException, status

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
)
from backend.utils import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
    generate_verification_token,
)


class AuthService:
    """Service for handling authentication-related business logic"""

    def __init__(self, session: Session):
        self.session = session

    def login_user(self, user_credentials: AuthLogin) -> Dict[str, Any]:
        """
        Authenticate user with email and password.

        Args:
            user_credentials (AuthLogin): User login credentials

        Raises:
            HTTPException: 401 if authentication fails

        Returns:
            Dict with user info and tokens
        """
        statement = select(User).where(User.email == user_credentials.email)
        user = self.session.exec(statement).first()

        if not user or not verify_password(user_credentials.password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )

        if not user.email_verified:
            verify_token = self._get_or_create_verification_token(user.email)
            return {
                "email_verified": False,
                "user": user,
                "verification_token": verify_token.token,
            }

        # Generate tokens
        access_token = self._create_user_access_token(user)
        refresh_token = self._create_user_refresh_token(user)

        return {
            "email_verified": True,
            "user": user,
            "access_token": access_token,
            "refresh_token": refresh_token,
        }

    def oauth_login(self, oauth_data: AuthLoginOAuth) -> Dict[str, Any]:
        """
        Authenticate user via OAuth.

        Args:
            oauth_data: OAuth login data

        Returns:
            Dict with access and refresh tokens
        """
        access_token_expires = timedelta(minutes=15)
        access_token = create_access_token(
            data={
                "sub": oauth_data.email,
                "role": oauth_data.role,
            },
            expires_delta=access_token_expires,
        )

        refresh_token_expires = timedelta(days=14)
        refresh_token = create_refresh_token(
            data={
                "sub": oauth_data.email,
                "role": oauth_data.role,
            },
            expires_delta=refresh_token_expires,
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
        }

    def register_user(self, user_data: AuthRegister) -> Dict[str, Any]:
        """
        Register a new user.

        Args:
            user_data: User registration data

        Raises:
            HTTPException: 400 if user with email already exists

        Returns:
            Dict with user, account, and verification token
        """
        statement = select(User).where(User.email == user_data.email)
        existing_user = self.session.exec(statement).first()

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists",
            )

        # Create new user
        user_dict = user_data.model_dump()
        user_dict["password"] = hash_password(user_data.password)
        user = User(**user_dict)

        self.session.add(user)
        self.session.flush()  # Flush to get user ID

        # Create credential account
        account = Account(
            user_id=user.id,
            type="credentials",
            provider="credentials",
            provider_account_id=str(user.id),
        )

        # Create verification token
        verify = VerificationToken(
            identifier=user.email,
            token=generate_verification_token(),
            expires=datetime.now(timezone.utc) + timedelta(hours=24),
        )

        self.session.add(account)
        self.session.add(verify)
        self.session.commit()
        self.session.refresh(user)
        self.session.refresh(account)
        self.session.refresh(verify)

        return {
            "user": user,
            "account": account,
            "verification_token": verify.token,
        }

    def resend_verification(self, data: AuthResendVerification) -> Dict[str, Any]:
        """
        Resend verification email.

        Args:
            data: Data containing user email

        Raises:
            HTTPException: 404 if user not found
            HTTPException: 400 if email already verified

        Returns:
            Dict with new verification token
        """
        statement = select(User).where(User.email == data.email)
        user = self.session.exec(statement).first()

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
        verify_token = self._get_or_create_verification_token(user.email)

        return {
            "verification_token": verify_token.token,
        }

    def verify_email(self, data: AuthVerifyEmail) -> User:
        """
        Verify user email using token.

        Args:
            data: Data containing verification token

        Raises:
            HTTPException: 400 if token invalid or expired
            HTTPException: 404 if user not found

        Returns:
            Verified user
        """
        statement = select(VerificationToken).where(
            VerificationToken.token == data.token
        )
        verify = self.session.exec(statement).first()

        if not verify or verify.expires < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "INVALID_TOKEN",
                    "message": "Invalid or expired verification token",
                },
            )

        statement = select(User).where(User.email == verify.identifier)
        user = self.session.exec(statement).first()

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
        self.session.add(user)
        self.session.delete(verify)
        self.session.commit()
        self.session.refresh(user)

        return user

    def forgot_password(self, data: AuthForgotPassword) -> Optional[Dict[str, Any]]:
        """
        Request password reset.

        Args:
            data: Data containing user email

        Returns:
            Dict with reset token if user exists and verified
        """
        statement = select(User).where(User.email == data.email)
        user = self.session.exec(statement).first()

        if not user or not user.email_verified:
            return None

        reset_token = generate_verification_token()

        statement = select(VerificationToken).where(
            VerificationToken.identifier == user.email
        )
        existing_token = self.session.exec(statement).first()

        if existing_token:
            self.session.delete(existing_token)

        verify = VerificationToken(
            identifier=user.email,
            token=reset_token,
            expires=datetime.now(timezone.utc) + timedelta(hours=1),
        )
        self.session.add(verify)
        self.session.commit()
        self.session.refresh(verify)

        return {
            "name": user.name,
            "reset_token": reset_token,
        }

    def resend_reset_password(self, data: AuthResendVerification) -> Dict[str, Any]:
        """
        Resend password reset email.

        Args:
            data: Data containing user email

        Raises:
            HTTPException: 404 if user not found

        Returns:
            Dict with new reset token
        """
        statement = select(User).where(User.email == data.email)
        user = self.session.exec(statement).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        reset_token = generate_verification_token()

        statement = select(VerificationToken).where(
            VerificationToken.identifier == user.email
        )
        existing_token = self.session.exec(statement).first()

        if existing_token:
            existing_token.token = reset_token
            existing_token.expires = datetime.now(timezone.utc) + timedelta(hours=1)
            self.session.add(existing_token)
        else:
            verify = VerificationToken(
                identifier=user.email,
                token=reset_token,
                expires=datetime.now(timezone.utc) + timedelta(hours=1),
            )
            self.session.add(verify)

        self.session.commit()

        return {
            "name": user.name,
            "reset_token": reset_token,
        }

    def reset_password(self, data: AuthResetPassword) -> User:
        """
        Reset user password using token.

        Args:
            data: Data containing reset token and new password

        Raises:
            HTTPException: 400 if token invalid or expired
            HTTPException: 404 if user not found

        Returns:
            User with updated password
        """
        statement = select(VerificationToken).where(
            VerificationToken.token == data.token,
            VerificationToken.identifier == data.email,
        )
        reset_token = self.session.exec(statement).first()

        if not reset_token or reset_token.expires < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token",
            )

        statement = select(User).where(User.email == data.email)
        user = self.session.exec(statement).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        user.password = hash_password(data.password)
        self.session.add(user)
        self.session.delete(reset_token)
        self.session.commit()
        self.session.refresh(user)

        return user

    def validate_reset_token(self, token: str, email: str) -> Dict[str, Any]:
        """
        Validate password reset token.

        Args:
            token: Reset token
            email: User email

        Raises:
            HTTPException: 400 if token invalid or expired
            HTTPException: 404 if user not found

        Returns:
            Dict with user info and token expiry
        """
        statement = select(VerificationToken).where(
            VerificationToken.token == token,
            VerificationToken.identifier == email,
        )
        reset_token = self.session.exec(statement).first()

        if not reset_token or reset_token.expires < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token",
            )

        statement = select(User).where(User.email == email)
        user = self.session.exec(statement).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        return {
            "user": user,
            "token_expiry": reset_token.expires,
        }

    def update_user_profile(self, user: User, user_update: UserUpdate) -> User:
        """
        Update user profile.

        Args:
            user: Current user
            user_update: Update data

        Returns:
            Updated user
        """
        update_data = user_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(user, key, value)

        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)

        return user

    def change_password(self, user: User, password_change: UserChangePassword) -> User:
        """
        Change user password.

        Args:
            user: Current user
            password_change: Password change data

        Raises:
            HTTPException: 400 if current password is incorrect

        Returns:
            User with updated password
        """
        if not verify_password(password_change.current_password, user.password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect",
            )

        user.password = hash_password(password_change.new_password)
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)

        return user

    def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """
        Refresh access token using refresh token.

        Args:
            refresh_token: JWT refresh token

        Returns:
            Dict with new access token

        Raises:
            HTTPException: If token invalid or user not found
        """
        payload = verify_refresh_token(refresh_token)

        email = payload.get("sub")
        statement = select(User).where(User.email == email)
        user = self.session.exec(statement).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )

        access_token = self._create_user_access_token(user)

        return {
            "access_token": access_token,
        }

    # ============================================================================
    # Private Helper Methods
    # ============================================================================
    def _get_or_create_verification_token(self, email: str) -> VerificationToken:
        """Get existing or create new verification token"""
        statement = select(VerificationToken).where(
            VerificationToken.identifier == email
        )
        verify_token = self.session.exec(statement).first()

        if verify_token and verify_token.expires > datetime.now(timezone.utc):
            return verify_token

        token_data = {
            "token": generate_verification_token(),
            "expires": datetime.now(timezone.utc) + timedelta(hours=24),
        }

        if verify_token:
            verify_token.token = token_data["token"]
            verify_token.expires = token_data["expires"]
            self.session.add(verify_token)
        else:
            verify_token = VerificationToken(
                identifier=email,
                token=token_data["token"],
                expires=token_data["expires"],
            )
            self.session.add(verify_token)

        self.session.commit()
        self.session.refresh(verify_token)

        return verify_token

    def _create_user_access_token(self, user: User) -> str:
        """Create access token for user."""
        access_token_expires = timedelta(minutes=15)
        return create_access_token(
            data={
                "sub": user.email,
                "role": user.role,
            },
            expires_delta=access_token_expires,
        )

    def _create_user_refresh_token(self, user: User) -> str:
        """Create refresh token for user."""
        refresh_token_expires = timedelta(days=14)
        return create_refresh_token(
            data={
                "sub": user.email,
                "role": user.role,
            },
            expires_delta=refresh_token_expires,
        )
