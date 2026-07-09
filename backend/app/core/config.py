import json
import os
from pathlib import Path
from typing import List, Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "AI Research Assistant Backend"
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10 MB default
    ALLOWED_EXTENSIONS: List[str] = ["pdf"]
    DEBUG: bool = True
    DATABASE_URL: str = "sqlite:///./ai_research_assistant.db"
    JWT_SECRET_KEY: str = "35f492da0d7d4c82b95c3bb08ea03d6d5ef0a5bcf4bb4e35905f8842e2b34a6e"
    JWT_REFRESH_SECRET: str = "55ef48da0d7d4c82b95c3bb08ea03d6d5ef0a5bcf4bb4e35905f8842e2b34a6e"
    JWT_ACCESS_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_EXPIRE_DAYS: int = 7

    # AWS S3 Settings
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    AWS_S3_BUCKET: Optional[str] = None
    AWS_ENDPOINT_URL: Optional[str] = None
    STORAGE_PROVIDER: Optional[str] = None  # Force overrides e.g. "s3" or "local"

    @property
    def active_storage_provider(self) -> str:
        """Determines the active storage provider dynamically based on credentials."""
        if self.STORAGE_PROVIDER:
            return self.STORAGE_PROVIDER.lower()
        if self.AWS_ACCESS_KEY_ID and self.AWS_SECRET_ACCESS_KEY and self.AWS_S3_BUCKET:
            return "s3"
        return "local"

    # Allow loading from .env relative to this file
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @field_validator("ALLOWED_EXTENSIONS", mode="before")
    @classmethod
    def parse_allowed_extensions(cls, v):
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return [str(item).lower() for item in parsed]
            except json.JSONDecodeError:
                # Fallback to splitting by comma if it's not a JSON string
                return [item.strip().lower() for item in v.split(",") if item.strip()]
        return v

    @property
    def upload_path(self) -> Path:
        """Returns the absolute path to the upload directory."""
        # Find backend base directory
        backend_dir = Path(__file__).resolve().parents[2]
        path = backend_dir / self.UPLOAD_DIR
        return path

settings = Settings()
