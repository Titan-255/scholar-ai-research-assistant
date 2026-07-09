import logging
from fastapi import APIRouter, UploadFile, File, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.schemas.responses import BaseResponse
from app.models.schemas.upload import UploadResponse
from app.services.upload_service import UploadService
from app.core.constants import MSG_UPLOAD_SUCCESS
from app.api.deps import get_current_user
from app.models.user import User
from app.services.document_service import DocumentService

logger = logging.getLogger("app.api.v1.routes.upload")
router = APIRouter()

@router.post(
    "/upload", 
    response_model=BaseResponse[UploadResponse], 
    summary="Upload PDF document",
    description="Accepts a multipart file upload. Validates it is a PDF and stores it locally under UUID name."
)
async def upload_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Handles PDF document uploads.
    """
    logger.info(f"Received upload request for file: {file.filename} from user {current_user.uuid}")
    
    # Save the upload
    metadata = await UploadService.save_upload(db, file, current_user)
    
    # Enqueue background document intelligence pipeline processing
    background_tasks.add_task(DocumentService.process_document_background, metadata.id)
    
    # Create the response
    data = UploadResponse(
        original_name=metadata.original_name,
        stored_name=metadata.stored_name,
        size_bytes=metadata.size_bytes,
        upload_time=metadata.upload_time,
        status=metadata.status,
        storage_provider=metadata.storage_provider
    )
    
    return BaseResponse(
        success=True,
        message=MSG_UPLOAD_SUCCESS,
        data=data
    )
