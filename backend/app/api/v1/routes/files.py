import logging
from typing import List
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.schemas.responses import BaseResponse
from app.models.schemas.upload import FileMetadata, DownloadResponse
from app.services.file_service import FileService
from app.core.constants import MSG_FILES_RETRIEVED, MSG_METADATA_RETRIEVED, MSG_FILE_DELETED
from app.api.deps import get_current_user
from app.models.user import User
from app.repositories.file_repository import FileRepository
from app.services.storage.service import StorageService

logger = logging.getLogger("app.api.v1.routes.files")
router = APIRouter()

@router.get(
    "/files",
    response_model=BaseResponse[List[FileMetadata]],
    summary="List all uploaded documents",
    description="Reads relational database and lists all file metadata currently indexed for the user."
)
async def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists all uploaded documents."""
    files = FileService.list_files(db, current_user)
    return BaseResponse(
        success=True,
        message=MSG_FILES_RETRIEVED,
        data=files
    )

@router.get(
    "/files/{id}",
    response_model=BaseResponse[FileMetadata],
    summary="Get document metadata details",
    description="Loads metadata detail entry for a given UUID identifier owned by the current user."
)
async def get_document_details(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves metadata detail logs for a file."""
    meta = FileService.get_file_metadata(db, id, current_user)
    if not meta:
        raise HTTPException(status_code=404, detail=f"File with ID {id} not found.")
    return BaseResponse(
        success=True,
        message=MSG_METADATA_RETRIEVED,
        data=meta
    )

@router.delete(
    "/files/{id}",
    response_model=BaseResponse[None],
    summary="Delete uploaded document",
    description="Deletes file content from disk storage and strips index database record."
)
async def delete_document(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes document asset and cleans database entries."""
    logger.info(f"Received request to delete document: {id} from user {current_user.uuid}")
    FileService.delete_file(db, id, current_user)
    return BaseResponse(
        success=True,
        message=MSG_FILE_DELETED,
        data=None
    )

@router.get(
    "/files/download/{id}",
    summary="Download original document file",
    description="Retrieves pre-signed URL or streams the file directly."
)
async def download_document(
    id: str,
    request: Request,
    direct: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Serves secure pre-signed URLs or streams the file asset."""
    logger.info(f"Received download request for file: {id} from user {current_user.uuid} (direct={direct})")
    
    # 1. Fetch file from database
    f = FileRepository.get_by_uuid_and_user(db, id, current_user.id)
    if not f:
        raise HTTPException(status_code=404, detail="File not found in catalog library.")

    # 2. Handle direct download/view request (HTTP stream or redirect)
    if direct:
        if f.storage_provider == "s3":
            url = StorageService.download_url(
                provider_name=f.storage_provider,
                s3_object_key=f.s3_object_key,
                bucket_name=f.bucket_name,
                file_path=f.file_path,
                original_filename=f.original_filename
            )
            return RedirectResponse(url=url)
        else:
            file_path = FileService.get_file_path(db, id, current_user)
            return FileResponse(
                path=file_path,
                media_type="application/pdf",
                filename=f.original_filename
            )

    # 3. Handle standard download request (S3 -> JSON presigned URL, local -> direct FileResponse for compatibility)
    if f.storage_provider == "s3":
        url = StorageService.download_url(
            provider_name=f.storage_provider,
            s3_object_key=f.s3_object_key,
            bucket_name=f.bucket_name,
            file_path=f.file_path,
            original_filename=f.original_filename
        )
        return BaseResponse(
            success=True,
            message="Secure download link generated successfully.",
            data=DownloadResponse(url=url)
        )
    else:
        file_path = FileService.get_file_path(db, id, current_user)
        return FileResponse(
            path=file_path,
            media_type="application/pdf",
            filename=f.original_filename
        )
