import logging
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.user import User
from app.models.schemas.user import ProfileUpdate
from app.models.schemas.settings import SettingsUpdate
from app.repositories.user_repository import UserRepository
from app.core.security import verify_password, get_password_hash

logger = logging.getLogger("app.services.user_service")

class UserService:
    @staticmethod
    def update_profile(db: Session, user: User, update_data: ProfileUpdate) -> User:
        """
        Updates the authenticated user's profile metadata.
        """
        logger.info(f"Updating profile details for user UUID {user.uuid}")
        
        if update_data.full_name is not None:
            user.full_name = update_data.full_name
            
        if update_data.profile_picture is not None:
            user.profile_picture = update_data.profile_picture

        UserRepository.update(db, user)
        logger.info(f"Profile updated successfully for user UUID {user.uuid}")
        return user

    @staticmethod
    def change_password(db: Session, user: User, old_pwd: str, new_pwd: str) -> None:
        """
        Verifies old password credentials and changes to hashed new password.
        """
        logger.info(f"Processing password change request for user UUID {user.uuid}")
        
        # 1. Verify old password
        if not verify_password(old_pwd, user.password_hash):
            logger.warning(f"Failed password change attempt for user UUID {user.uuid}: Invalid old password")
            raise HTTPException(status_code=400, detail="Invalid current password.")
            
        # 2. Prevent setting same password
        if old_pwd == new_pwd:
            raise HTTPException(status_code=400, detail="New password cannot be the same as current password.")

        # 3. Hash and save new password
        user.password_hash = get_password_hash(new_pwd)
        UserRepository.update(db, user)
        logger.info(f"Password changed successfully for user UUID {user.uuid}")

    @staticmethod
    def get_user_settings(db: Session, user: User) -> "UserSettings":
        """Retrieves user settings, initializing them to defaults if missing."""
        from app.models.user_settings import UserSettings
        settings = user.settings
        if not settings:
            logger.info(f"Initializing default settings for user UUID {user.uuid}")
            settings = UserSettings(
                user_id=user.id,
                theme="light",
                language="English",
                notification_enabled=True,
                timezone="UTC"
            )
            db.add(settings)
            db.commit()
            db.refresh(settings)
        return settings

    @staticmethod
    def update_user_settings(db: Session, user: User, update_data: SettingsUpdate) -> "UserSettings":
        """Updates user settings preferences."""
        from app.models.user_settings import UserSettings
        settings = UserService.get_user_settings(db, user)
        
        if update_data.theme is not None:
            settings.theme = update_data.theme
        if update_data.language is not None:
            settings.language = update_data.language
        if update_data.notification_enabled is not None:
            settings.notification_enabled = update_data.notification_enabled
        if update_data.timezone is not None:
            settings.timezone = update_data.timezone
            
        db.commit()
        db.refresh(settings)
        logger.info(f"Updated settings preferences for user UUID {user.uuid}")
        return settings
