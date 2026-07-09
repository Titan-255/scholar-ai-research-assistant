import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.schemas.responses import BaseResponse
from app.models.schemas.user import TokenResponse
from app.models.schemas.auth import RegisterRequest, LoginRequest, ForgotPassword, ResetPassword
from app.services.auth_service import AuthService
from pydantic import BaseModel

logger = logging.getLogger("app.api.v1.routes.auth")
router = APIRouter()

class RefreshRequest(BaseModel):
    refresh_token: str

@router.post(
    "/register",
    response_model=BaseResponse[TokenResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Validates unique email address and password strength, creates the user, and returns tokens."
)
async def register(data: RegisterRequest, db: Session = Depends(get_db)):
    """Handles new user registration."""
    res = AuthService.register_user(db, data)
    return BaseResponse(
        success=True,
        message="Registration successful",
        data=TokenResponse(
            access_token=res["access_token"],
            refresh_token=res["refresh_token"],
            user=res["user"]
        )
    )

@router.post(
    "/login",
    response_model=BaseResponse[TokenResponse],
    summary="Login user and issue tokens",
    description="Validates credentials and returns access and refresh JWT tokens."
)
async def login(data: LoginRequest, db: Session = Depends(get_db)):
    """Handles user authentication and login session creation."""
    res = AuthService.login_user(db, data)
    return BaseResponse(
        success=True,
        message="Login successful",
        data=TokenResponse(
            access_token=res["access_token"],
            refresh_token=res["refresh_token"],
            user=res["user"]
        )
    )

@router.post(
    "/logout",
    response_model=BaseResponse[None],
    summary="Logout user session",
    description="Placeholder endpoint to log out the user and invalidate state."
)
async def logout():
    """Handles logout. The client simply deletes the stored JWTs."""
    return BaseResponse(
        success=True,
        message="Logged out successfully",
        data=None
    )

@router.post(
    "/refresh",
    response_model=BaseResponse[TokenResponse],
    summary="Generate new access token using refresh token",
    description="Validates a refresh token and generates a new access token."
)
async def refresh(data: RefreshRequest, db: Session = Depends(get_db)):
    """Refreshes the user's active session and generates a new access token."""
    res = AuthService.refresh_session(db, data.refresh_token)
    return BaseResponse(
        success=True,
        message="Token refreshed successfully",
        data=TokenResponse(
            access_token=res["access_token"],
            refresh_token=res["refresh_token"],
            user=res["user"]
        )
    )

@router.post(
    "/forgot-password",
    response_model=BaseResponse[dict],
    summary="Initiate forgot password reset",
    description="Placeholder architecture. Generates a secure reset token and returns it."
)
async def forgot_password(data: ForgotPassword, db: Session = Depends(get_db)):
    """Initiates password reset procedure."""
    token = AuthService.generate_password_reset_token(db, data.email)
    return BaseResponse(
        success=True,
        message="If the email exists, a password reset link has been generated.",
        data={"reset_token": token}
    )

@router.post(
    "/reset-password",
    response_model=BaseResponse[None],
    summary="Reset password with token",
    description="Accepts a reset token and updates the user's password hash."
)
async def reset_password(data: ResetPassword, db: Session = Depends(get_db)):
    """Resets user password with valid reset token credentials."""
    AuthService.reset_password(db, data.token, data.new_password)
    return BaseResponse(
        success=True,
        message="Password has been reset successfully.",
        data=None
    )
