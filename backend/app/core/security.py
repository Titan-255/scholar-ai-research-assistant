import datetime
import logging
from typing import Optional, Union, Any
import bcrypt
from jose import jwt, JWTError
from app.core.config import settings

logger = logging.getLogger("app.core.security")

ALGORITHM = "HS256"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain text password against a bcrypt hash using the native bcrypt library."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception as e:
        logger.error(f"Error verifying password hash: {e}")
        return False

def get_password_hash(password: str) -> str:
    """Hashes a plain text password using native bcrypt gensalt."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def create_access_token(subject: Union[str, Any], expires_delta: Optional[datetime.timedelta] = None) -> str:
    """Generates a secure short-lived access JWT token."""
    if expires_delta:
        expire = datetime.datetime.now(datetime.timezone.utc) + expires_delta
    else:
        expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=settings.JWT_ACCESS_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject), "type": "access"}
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(subject: Union[str, Any], expires_delta: Optional[datetime.timedelta] = None) -> str:
    """Generates a secure long-lived refresh JWT token."""
    if expires_delta:
        expire = datetime.datetime.now(datetime.timezone.utc) + expires_delta
    else:
        expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=settings.JWT_REFRESH_EXPIRE_DAYS)
    
    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    encoded_jwt = jwt.encode(to_encode, settings.JWT_REFRESH_SECRET, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str, is_refresh: bool = False) -> Optional[str]:
    """
    Decodes and validates a JWT token.
    
    Returns:
        Optional[str]: The subject (sub) of the token if valid, otherwise None.
    """
    secret = settings.JWT_REFRESH_SECRET if is_refresh else settings.JWT_SECRET_KEY
    expected_type = "refresh" if is_refresh else "access"
    
    try:
        payload = jwt.decode(token, secret, algorithms=[ALGORITHM])
        
        # Verify type
        token_type = payload.get("type")
        if token_type != expected_type:
            logger.warning(f"JWT Token validation failed: type mismatch. Expected {expected_type}, got {token_type}")
            return None
            
        subject = payload.get("sub")
        if subject is None:
            logger.warning("JWT Token validation failed: missing subject (sub) claim")
            return None
            
        return str(subject)
    except JWTError as e:
        logger.warning(f"JWT Token validation failed: {str(e)}")
        return None
