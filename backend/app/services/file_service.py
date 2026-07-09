import logging
import os
from pathlib import Path
from typing import List, Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.user import User
from app.models.uploaded_file import UploadedFile
from app.models.schemas.upload import FileMetadata as FileMetadataSchema
from app.utils.helpers import prevent_directory_traversal
from app.repositories.file_repository import FileRepository

from app.services.storage.service import StorageService

logger = logging.getLogger("app.services.file_service")

class FileService:
    @classmethod
    def list_files(cls, db: Session, user: User) -> List[FileMetadataSchema]:
        """Lists all files in the catalog owned by the specified user."""
        files = FileRepository.list_by_user_id(db, user.id)
        return [
            FileMetadataSchema(
                id=f.uuid,
                original_name=f.original_filename,
                stored_name=f.stored_filename,
                size_bytes=f.file_size,
                upload_time=f.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                status=f.processing_status or f.upload_status or "Ready",
                storage_provider=f.storage_provider,
                progress=f.processing_progress or 0
            )
            for f in files
        ]

    @classmethod
    def get_file_metadata(cls, db: Session, file_uuid: str, user: User) -> Optional[FileMetadataSchema]:
        """Retrieves metadata for a specific file by its UUID if owned by the user."""
        f = FileRepository.get_by_uuid_and_user(db, file_uuid, user.id)
        if f:
            return FileMetadataSchema(
                id=f.uuid,
                original_name=f.original_filename,
                stored_name=f.stored_filename,
                size_bytes=f.file_size,
                upload_time=f.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                status=f.processing_status or f.upload_status or "Ready",
                storage_provider=f.storage_provider,
                progress=f.processing_progress or 0
            )
        return None

    @classmethod
    def get_file_path(cls, db: Session, file_uuid: str, user: User) -> Path:
        """
        Resolves the absolute path to a file by UUID for the specific user, preventing directory traversal.
        """
        f = FileRepository.get_by_uuid_and_user(db, file_uuid, user.id)
        if not f:
            raise HTTPException(status_code=404, detail="File not found in catalog library.")

        if f.storage_provider == "local":
            file_path = Path(f.file_path)
            # Verify safety
            prevent_directory_traversal(file_path, settings.upload_path)
            if not file_path.exists():
                logger.warning(f"File {f.stored_filename} is missing from disk. Removing metadata from database.")
                FileRepository.delete_file(db, f)
                raise HTTPException(status_code=404, detail="File missing from storage.")
            return file_path
        
        return Path(f.file_path)

    @classmethod
    def delete_file(cls, db: Session, file_uuid: str, user: User) -> bool:
        """
        Deletes the file from storage provider and database if owned by the user.
        """
        f = FileRepository.get_by_uuid_and_user(db, file_uuid, user.id)
        if not f:
            raise HTTPException(status_code=404, detail="File not found in catalog library.")

        # Delete from storage provider (S3 or Local)
        try:
            StorageService.delete_file(
                provider_name=f.storage_provider,
                s3_object_key=f.s3_object_key,
                bucket_name=f.bucket_name,
                file_path=f.file_path
            )
            logger.info(f"File {f.stored_filename} deleted from {f.storage_provider} successfully.")
        except Exception as e:
            logger.error(f"Failed to delete file {f.stored_filename} from storage: {e}")
            raise HTTPException(status_code=500, detail="Failed to delete file asset from storage backend.")

        # Delete from DB (cascades file_metadata)
        FileRepository.delete_file(db, f)
        logger.info(f"File record {file_uuid} removed from database.")
        return True
