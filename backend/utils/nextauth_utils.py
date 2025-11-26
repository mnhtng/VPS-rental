"""
Utility functions for NextAuth session validation
"""
from typing import Optional
from fastapi import Cookie, HTTPException, status, Depends
from sqlmodel import Session, select
import requests

from backend.db import get_session
from backend.models import User
from backend.core import settings


async def get_current_user_from_nextauth(
    session_token: Optional[str] = Cookie(None, alias="pcloud-auth.session-token"),
    session: Session = Depends(get_session),
) -> User:
    """
    Get the current authenticated user from NextAuth session token.
    
    This validates the NextAuth session by calling the NextAuth session endpoint
    or by decrypting the session token (requires NextAuth secret).
    
    Args:
        session_token: NextAuth session token from cookie
        session: Database session
        
    Raises:
        HTTPException: 401 if session is invalid or user not found
        
    Returns:
        User: The current authenticated user
    """
    if not session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No session token found",
        )
    
    try:
        # Option 1: Validate with NextAuth API endpoint
        # You would need to expose a NextAuth endpoint or validate internally
        
        # Option 2: Decrypt the JWE token (requires jose library and AUTH_SECRET)
        from jose import jwe
        
        # Decrypt the NextAuth session token
        try:
            decrypted = jwe.decrypt(session_token, settings.NEXTAUTH_SECRET)
            # Parse the session data
            import json
            session_data = json.loads(decrypted.decode())
            email = session_data.get("user", {}).get("email")
            
            if not email:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid session data",
                )
            
            # Get user from database
            statement = select(User).where(User.email == email)
            user = session.exec(statement).first()
            
            if user is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found",
                )
            
            return user
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid session token: {str(e)}",
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Session validation failed: {str(e)}",
        )


async def get_current_user_hybrid(
    credentials: Optional[str] = None,
    session_token: Optional[str] = Cookie(None, alias="pcloud-auth.session-token"),
    session: Session = Depends(get_session),
) -> User:
    """
    Hybrid authentication: supports both FastAPI JWT and NextAuth session tokens.
    
    Tries Bearer token first, then falls back to NextAuth session cookie.
    """
    from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
    from backend.utils.auth_utils import get_current_user, verify_token
    
    # Try Bearer token first
    if credentials:
        try:
            from backend.utils.auth_utils import security
            creds = HTTPAuthorizationCredentials(
                scheme="Bearer",
                credentials=credentials
            )
            return await get_current_user(creds, session)
        except:
            pass
    
    # Fall back to NextAuth session
    return await get_current_user_from_nextauth(session_token, session)
