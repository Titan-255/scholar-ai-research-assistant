import logging
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.core.config import settings
from app.models.schemas.responses import BaseResponse
from app.models.schemas.settings import SettingsResponse, SettingsUpdate
from app.services.user_service import UserService

logger = logging.getLogger("app.api.v1.routes.settings")
router = APIRouter()

@router.get(
    "",
    response_model=BaseResponse[SettingsResponse],
    summary="Get user workspace settings",
    description="Loads theme, language, and notification flags for the authenticated user."
)
async def get_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves user workspace settings."""
    user_settings = UserService.get_user_settings(db, current_user)
    data = SettingsResponse(
        theme=user_settings.theme,
        language=user_settings.language,
        notification_enabled=user_settings.notification_enabled,
        timezone=user_settings.timezone,
        storage_provider=settings.active_storage_provider.upper()
    )
    return BaseResponse(
        success=True,
        message="Settings loaded successfully.",
        data=data
    )

@router.put(
    "",
    response_model=BaseResponse[SettingsResponse],
    summary="Update user workspace settings",
    description="Updates and persists theme, language, and notification preferences."
)
async def update_settings(
    data: SettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates user workspace settings."""
    user_settings = UserService.update_user_settings(db, current_user, data)
    resp_data = SettingsResponse(
        theme=user_settings.theme,
        language=user_settings.language,
        notification_enabled=user_settings.notification_enabled,
        timezone=user_settings.timezone,
        storage_provider=settings.active_storage_provider.upper()
    )
    return BaseResponse(
        success=True,
        message="Settings updated successfully.",
        data=resp_data
    )
