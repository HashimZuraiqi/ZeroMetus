"""
Authentication routes for user registration, login, and profile management.
"""

from datetime import timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.config import settings
from app.schemas.auth import (
    UserCreate, UserLogin, UserResponse, UserUpdate,
    Token, PasswordChange, AuthResponse, RegisterResponse
)
from app.services.auth_service import (
    create_user, authenticate_user, get_user_by_email, get_user_by_id,
    update_last_login, create_access_token, decode_access_token,
    verify_password, change_password, update_user_profile
)
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Security scheme
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """Get current authenticated user from JWT token."""
    if not credentials:
        return None
    
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if not payload:
        return None
    
    user_id = payload.get("sub")
    if not user_id:
        return None
    
    user = await get_user_by_id(db, user_id)
    return user


async def require_auth(
    user: Optional[User] = Depends(get_current_user)
) -> User:
    """Require authenticated user."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )
    return user


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user account.
    
    - Email must be unique
    - Password must be at least 8 characters
    """
    # Check if email already exists
    existing_user = await get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user = await create_user(
        db=db,
        email=user_data.email,
        password=user_data.password,
        display_name=user_data.display_name
    )
    
    return RegisterResponse(
        success=True,
        message="Registration successful. Please log in.",
        user=UserResponse.model_validate(user)
    )


@router.post("/login", response_model=Token)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate user and return JWT token.
    """
    user = await authenticate_user(db, credentials.email, credentials.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )
    
    # Update last login
    await update_last_login(db, user)
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email},
        expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.access_token_expire_minutes * 60,
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    user: User = Depends(require_auth)
):
    """
    Get current authenticated user's profile.
    """
    return UserResponse.model_validate(user)


@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(
    update_data: UserUpdate,
    user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db)
):
    """
    Update current user's profile.
    """
    updated_user = await update_user_profile(
        db=db,
        user=user,
        display_name=update_data.display_name,
        avatar_url=update_data.avatar_url
    )
    
    return UserResponse.model_validate(updated_user)


@router.post("/change-password", response_model=AuthResponse)
async def change_user_password(
    password_data: PasswordChange,
    user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db)
):
    """
    Change current user's password.
    """
    # Verify current password
    if not verify_password(password_data.current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Change password
    await change_password(db, user, password_data.new_password)
    
    return AuthResponse(
        success=True,
        message="Password changed successfully"
    )


@router.post("/logout", response_model=AuthResponse)
async def logout(
    user: User = Depends(require_auth)
):
    """
    Log out current user.
    
    Note: JWT tokens are stateless, so this endpoint is mainly for client-side cleanup.
    In production, you might want to implement token blacklisting.
    """
    return AuthResponse(
        success=True,
        message="Logged out successfully"
    )


@router.get("/verify-token", response_model=AuthResponse)
async def verify_token(
    user: User = Depends(require_auth)
):
    """
    Verify if the current token is valid.
    """
    return AuthResponse(
        success=True,
        message="Token is valid"
    )
