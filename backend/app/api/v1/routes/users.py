import logging
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.schemas.responses import BaseResponse
from app.models.schemas.user import UserResponse, ProfileUpdate, PasswordChange
from app.services.user_service import UserService

logger = logging.getLogger("app.api.v1.routes.users")
router = APIRouter()

@router.get(
    "/me",
    response_model=BaseResponse[UserResponse],
    summary="Get current user profile",
    description="Loads metadata detail logs for the currently authenticated user."
)
async def get_me(current_user: User = Depends(get_current_user)):
    """Returns the current user details."""
    return BaseResponse(
        success=True,
        message="Current user profile loaded successfully",
        data=UserResponse.model_validate(current_user)
    )

@router.put(
    "/me",
    response_model=BaseResponse[UserResponse],
    summary="Update current user profile info",
    description="Updates user profile metadata details like full name or avatar URL."
)
async def update_me(
    data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates active user profile metadata."""
    updated = UserService.update_profile(db, current_user, data)
    return BaseResponse(
        success=True,
        message="Profile updated successfully",
        data=UserResponse.model_validate(updated)
    )

@router.put(
    "/change-password",
    response_model=BaseResponse[None],
    summary="Change user password credentials",
    description="Changes password by checking old hash and writing new hashed credentials."
)
async def change_password(
    data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Changes password for the currently authenticated user."""
    UserService.change_password(db, current_user, data.old_password, data.new_password)
    return BaseResponse(
        success=True,
        message="Password changed successfully",
        data=None
    )
