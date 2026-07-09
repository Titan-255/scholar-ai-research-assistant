import datetime
import logging
import uuid
import os
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
import aiofiles
from app.core.config import settings
from app.models.user import User
from app.models.uploaded_file import UploadedFile
from app.models.file_metadata import FileMetadata
from app.models.schemas.upload import FileMetadata as FileMetadataSchema
from app.utils.validators import validate_pdf_file
from app.utils.helpers import sanitize_filename
from app.repositories.file_repository import FileRepository

from app.services.storage.service import StorageService

logger = logging.getLogger("app.services.upload_service")

class UploadService:
    @staticmethod
    async def save_upload(db: Session, file: UploadFile, user: User) -> FileMetadataSchema:
        """
        Validates, sanitizes, writes, and registers a PDF upload in the SQL database using StorageService.
        """
        # 1. Read file size
        try:
            file.file.seek(0, 2)
            file_size = file.file.tell()
            file.file.seek(0)
        except Exception as e:
            logger.error(f"Error reading file size for {file.filename}: {e}")
            raise HTTPException(status_code=400, detail="Unable to read file content size.")

        # 2. Validate file
        filename = file.filename or "uploaded_file.pdf"
        content_type = file.content_type or "application/octet-stream"
        
        is_valid, err_msg = validate_pdf_file(filename, content_type, file_size)
        if not is_valid:
            raise HTTPException(status_code=400, detail=err_msg)

        # 3. Sanitize filename & Generate stored UUID name
        sanitized_name = sanitize_filename(filename)
        file_uuid = str(uuid.uuid4())
        stored_name = f"{file_uuid}.pdf"

        # Read the file contents
        try:
            file_data = await file.read()
        except Exception as e:
            logger.error(f"Error reading file content for {sanitized_name}: {e}")
            raise HTTPException(status_code=500, detail="Failed to read file content.")

        # 4. Upload file using StorageService
        logger.info(f"Uploading file {sanitized_name} as {stored_name} for user {user.uuid}")
        try:
            storage_info = StorageService.upload_file(
                user_uuid=user.uuid,
                file_uuid=file_uuid,
                file_data=file_data,
                filename=sanitized_name,
                content_type=content_type
            )
        except Exception as e:
            logger.error(f"Error uploading file {stored_name} to storage: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to upload file to storage backend: {str(e)}")

        # 5. Create database records
        try:
            uploaded_file = UploadedFile(
                uuid=file_uuid,
                user_id=user.id,
                original_filename=sanitized_name,
                stored_filename=storage_info["stored_filename"],
                file_size=file_size,
                mime_type=content_type,
                file_path=storage_info["file_path"],
                upload_status="Ready",
                total_pages=1,  # Default placeholder
                language="en",   # Default placeholder
                storage_provider=storage_info["storage_provider"],
                s3_object_key=storage_info["s3_object_key"],
                bucket_name=storage_info["bucket_name"],
                storage_url=storage_info["storage_url"],
                etag=storage_info["etag"],
                upload_completed=storage_info["upload_completed"],
                storage_size=storage_info["storage_size"]
            )
            FileRepository.create_file(db, uploaded_file)
            
            # Create corresponding processing metadata
            file_meta = FileMetadata(
                file_id=uploaded_file.id,
                total_chunks=0,
                embedding_status="pending",
                processing_status="pending",
                ocr_completed=False,
                chunking_completed=False,
                vectorized=False
            )
            FileRepository.create_metadata(db, file_meta)
            
            logger.info(f"File {sanitized_name} registered in DB with UUID {file_uuid} for user {user.uuid} on provider {uploaded_file.storage_provider}")
        except Exception as e:
            # Clean up uploaded storage asset if database writes fail
            try:
                StorageService.delete_file(
                    provider_name=storage_info["storage_provider"],
                    s3_object_key=storage_info["s3_object_key"],
                    bucket_name=storage_info["bucket_name"],
                    file_path=storage_info["file_path"]
                )
            except Exception as clean_err:
                logger.error(f"Failed to clean up uploaded asset {stored_name} after DB failure: {clean_err}")
                
            logger.error(f"Failed to register uploaded file in database: {e}")
            raise HTTPException(status_code=500, detail="Failed to register file in database.")

        return FileMetadataSchema(
            id=uploaded_file.uuid,
            original_name=uploaded_file.original_filename,
            stored_name=uploaded_file.stored_filename,
            size_bytes=uploaded_file.file_size,
            upload_time=uploaded_file.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            status=uploaded_file.upload_status,
            storage_provider=uploaded_file.storage_provider
        )
