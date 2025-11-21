# from fastapi import APIRouter, Depends, HTTPException, status
# from fastapi.security import HTTPBearer
# from sqlmodel import Session, select
# from datetime import timedelta
# from typing import Dict, Any
# from models.database import User, get_session
# from schemas.api import (
#     UserRegister, UserLogin, UserResponse, UserUpdate,
#     PasswordChange, Token
# )
# from core.auth import (
#     get_password_hash, verify_password, create_access_token,
#     generate_verification_token, send_verification_email,
#     get_current_active_user, verify_token
# )
# from core.settings import settings

# router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# @router.post("/register", response_model=Dict[str, str])
# async def register(user_data: UserRegister, session: Session = Depends(get_session)):
#     # Check if user already exists
#     statement = select(User).where(User.email == user_data.email)
#     existing_user = session.exec(statement).first()

#     if existing_user:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="User with this email already exists"
#         )

#     # Generate verification token
#     verification_token = generate_verification_token()

#     # Create new user
#     user = User(
#         email=user_data.email,
#         hashed_password=get_password_hash(user_data.password),
#         full_name=user_data.full_name,
#         phone=user_data.phone,
#         verification_token=verification_token
#     )

#     session.add(user)
#     session.commit()
#     session.refresh(user)

#     # Send verification email
#     if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
#         send_verification_email(user.email, verification_token)

#     return {"message": "User registered successfully. Please check your email to verify your account."}

# @router.post("/login", response_model=Token)
# async def login(user_credentials: UserLogin, session: Session = Depends(get_session)):
#     # Find user
#     statement = select(User).where(User.email == user_credentials.email)
#     user = session.exec(statement).first()

#     if not user or not verify_password(user_credentials.password, user.hashed_password):
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Incorrect email or password"
#         )

#     if not user.is_active:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Account is inactive"
#         )

#     # Create access token
#     access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
#     access_token = create_access_token(
#         data={"sub": user.email, "role": user.role},
#         expires_delta=access_token_expires
#     )

#     return {"access_token": access_token, "token_type": "bearer"}

# @router.get("/me", response_model=UserResponse)
# async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
#     return current_user

# @router.put("/me", response_model=UserResponse)
# async def update_profile(
#     user_update: UserUpdate,
#     current_user: User = Depends(get_current_active_user),
#     session: Session = Depends(get_session)
# ):
#     # Update user fields
#     if user_update.full_name is not None:
#         current_user.full_name = user_update.full_name
#     if user_update.phone is not None:
#         current_user.phone = user_update.phone

#     session.add(current_user)
#     session.commit()
#     session.refresh(current_user)

#     return current_user

# @router.post("/change-password")
# async def change_password(
#     password_change: PasswordChange,
#     current_user: User = Depends(get_current_active_user),
#     session: Session = Depends(get_session)
# ):
#     # Verify current password
#     if not verify_password(password_change.current_password, current_user.hashed_password):
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Current password is incorrect"
#         )

#     # Update password
#     current_user.hashed_password = get_password_hash(password_change.new_password)
#     session.add(current_user)
#     session.commit()

#     return {"message": "Password changed successfully"}

# @router.post("/verify-email")
# async def verify_email(token: str, session: Session = Depends(get_session)):
#     # Find user by verification token
#     statement = select(User).where(User.verification_token == token)
#     user = session.exec(statement).first()

#     if not user:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Invalid verification token"
#         )

#     # Update user verification status
#     user.is_verified = True
#     user.verification_token = None
#     session.add(user)
#     session.commit()

#     return {"message": "Email verified successfully"}

# @router.post("/resend-verification")
# async def resend_verification(
#     email: str,
#     session: Session = Depends(get_session)
# ):
#     # Find user
#     statement = select(User).where(User.email == email)
#     user = session.exec(statement).first()

#     if not user:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="User not found"
#         )

#     if user.is_verified:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Email is already verified"
#         )

#     # Generate new verification token
#     verification_token = generate_verification_token()
#     user.verification_token = verification_token
#     session.add(user)
#     session.commit()

#     # Send verification email
#     if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
#         send_verification_email(user.email, verification_token)

#     return {"message": "Verification email sent successfully"}
