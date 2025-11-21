from typing import Optional
from datetime import datetime, timedelta, timezone
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import Depends, HTTPException, status
import jwt
from sqlmodel import Session, select
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from backend.core import settings
from backend.db import get_session
from backend.models import User


ph = PasswordHasher()
security = HTTPBearer()  # JWT


def hash_password(password: str) -> str:
    """
    Hash a plain password using Argon2id.

    Args:
        password (str): The plain password to hash.

    Returns:
        str: The hashed password.
    """
    return ph.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against the hashed password.

    Args:
        plain_password (str): The plain password to verify.
        hashed_password (str): The hashed password to compare against.

    Returns:
        bool: True if the password matches, False otherwise.
    """
    try:
        return ph.verify(hashed_password, plain_password)
    except VerifyMismatchError:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.

    Args:
        data (dict): The data to include in the token payload.
        expires_delta (Optional[timedelta], optional): The expiration time for the token. Defaults to None.

    Returns:
        str: The encoded JWT token.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def verify_token(token: str) -> dict:
    """
    Verify a JWT token and return the payload.

    Args:
        token (str): The JWT token to verify.

    Raises:
        HTTPException: 401 if token is invalid or expired.

    Returns:
        dict: The token payload.
    """
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
            )
        return payload
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )


def generate_verification_token() -> str:
    """
    Generate a secure token for verification purposes: email verification, password reset, etc.

    Returns:
        str: A secure random token.
    """
    return secrets.token_urlsafe(32)


def send_verification_email(email: str, token: str) -> bool:
    """Send verification email with the given token"""
    try:
        msg = MIMEMultipart()
        msg["From"] = settings.SMTP_USERNAME
        msg["To"] = email
        msg["Subject"] = "Verify your VPS Rental account"

        verification_link = f"http://localhost:3000/verify-email?token={token}"
        body = f"""
        Welcome to VPS Rental!
        
        Please click the link below to verify your email address:
        {verification_link}
        
        If you didn't create an account, you can safely ignore this email.
        
        Best regards,
        VPS Rental Team
        """

        msg.attach(MIMEText(body, "plain"))

        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()

        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session),
) -> User:
    """
    Get the current authenticated user from the JWT token.

    Args:
        credentials (HTTPAuthorizationCredentials, optional): JWT token credentials. Defaults to Depends(security).

    Raises:
        HTTPException: 401 if token is invalid or user not found.

    Returns:
        User: The current authenticated user.
    """
    token = credentials.credentials
    payload = verify_token(token)
    email = payload.get("sub")

    statement = select(User).where(User.email == email)
    user = session.exec(statement).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )

    return user


def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Get the current authenticated admin user.

    Args:
        current_user (User, optional): The current authenticated user. Defaults to Depends(get_current_user).

    Raises:
        HTTPException: 403 if user is not an admin.

    Returns:
        User: The current authenticated admin user.
    """
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )
    return current_user
