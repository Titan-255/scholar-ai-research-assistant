import datetime
import logging
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.user import User
from app.models.schemas.auth import RegisterRequest, LoginRequest
from app.repositories.user_repository import UserRepository
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_token
)

logger = logging.getLogger("app.services.auth_service")

# In-memory dictionary to store reset tokens (placeholder architecture)
RESET_TOKENS_DB = {}

class AuthService:
    @staticmethod
    def register_user(db: Session, data: RegisterRequest) -> dict:
        """
        Validates unique email address, hashes password, saves User to DB, 
        and returns access/refresh session tokens.
        """
        logger.info(f"Attempting registration for email: {data.email}")
        
        # 1. Verify email uniqueness
        existing_user = UserRepository.get_by_email(db, data.email)
        if existing_user:
            logger.warning(f"Registration failed: Email {data.email} is already registered.")
            raise HTTPException(status_code=409, detail="An account with this email already exists.")

        # 2. Hash password and instantiate user model
        hashed_pwd = get_password_hash(data.password)
        new_user = User(
            full_name=data.full_name,
            email=data.email,
            password_hash=hashed_pwd
        )

        # 3. Save to database
        UserRepository.create(db, new_user)
        logger.info(f"User UUID {new_user.uuid} successfully registered.")

        # 4. Generate Session tokens
        access_token = create_access_token(new_user.uuid)
        refresh_token = create_refresh_token(new_user.uuid)

        return {
            "user": new_user,
            "access_token": access_token,
            "refresh_token": refresh_token
        }

    @staticmethod
    def login_user(db: Session, data: LoginRequest) -> dict:
        """
        Queries user by email, verifies password, updates last_login timestamp,
        and returns tokens.
        """
        logger.info(f"Login attempt for email: {data.email}")
        
        # 1. Retrieve user
        user = UserRepository.get_by_email(db, data.email)
        if not user or not verify_password(data.password, user.password_hash):
            logger.warning(f"Login failed: Invalid credentials for email {data.email}")
            raise HTTPException(status_code=401, detail="Invalid email or password.")

        if not user.is_active:
            raise HTTPException(status_code=400, detail="User account is deactivated.")

        # 2. Update login timestamp
        user.last_login = datetime.datetime.utcnow()
        UserRepository.update(db, user)
        logger.info(f"User UUID {user.uuid} successfully logged in.")

        # 3. Generate Session tokens
        access_token = create_access_token(user.uuid)
        refresh_token = create_refresh_token(user.uuid)

        return {
            "user": user,
            "access_token": access_token,
            "refresh_token": refresh_token
        }

    @staticmethod
    def refresh_session(db: Session, refresh_token: str) -> dict:
        """
        Validates refresh token and generates a new access token.
        """
        # Decode and validate refresh token
        user_uuid = verify_token(refresh_token, is_refresh=True)
        if not user_uuid:
            raise HTTPException(status_code=401, detail="Invalid or expired refresh token.")

        # Load user from DB
        user = UserRepository.get_by_uuid(db, user_uuid)
        if not user:
            raise HTTPException(status_code=401, detail="User associated with token not found.")

        if not user.is_active:
            raise HTTPException(status_code=400, detail="User account is deactivated.")

        # Generate new access token
        new_access_token = create_access_token(user.uuid)
        
        return {
            "access_token": new_access_token,
            "refresh_token": refresh_token,  # reuse existing refresh token as per OAuth2 standards
            "user": user
        }

    @staticmethod
    def generate_password_reset_token(db: Session, email: str) -> str:
        """
        Placeholder forgot-password architecture.
        Generates a token, stores it locally, and logs it.
        """
        user = UserRepository.get_by_email(db, email)
        if not user:
            # Prevent user enumeration by returning generic success even if email doesn't exist
            logger.warning(f"Forgot password requested for unregistered email: {email}")
            return "reset-token-placeholder"

        # Generate a temporary token using standard JWT token builder
        reset_token = create_access_token(user.uuid, expires_delta=datetime.timedelta(hours=1))
        
        # Save token to temporary registry
        RESET_TOKENS_DB[reset_token] = user.uuid
        logger.info(f"Generated reset token for user {email}: {reset_token}")
        return reset_token

    @staticmethod
    def reset_password(db: Session, token: str, new_pwd: str) -> None:
        """
        Accepts reset token and updates user password hash.
        """
        # Retrieve user UUID from registry
        user_uuid = RESET_TOKENS_DB.get(token)
        if not user_uuid:
            # Fall back to decoding token to check if it's a valid JWT
            user_uuid = verify_token(token)
            if not user_uuid:
                raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

        user = UserRepository.get_by_uuid(db, user_uuid)
        if not user:
            raise HTTPException(status_code=400, detail="User associated with reset token not found.")

        # Update password
        user.password_hash = get_password_hash(new_pwd)
        UserRepository.update(db, user)
        
        # Remove from temporary DB
        RESET_TOKENS_DB.pop(token, None)
        logger.info(f"Password reset successfully for user UUID {user.uuid}")
