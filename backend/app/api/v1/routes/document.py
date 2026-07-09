import logging
import os
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.schemas.responses import BaseResponse
from app.models.schemas.document import ProcessingStatusResponse, DocumentPageSchema, DocumentMetadataSchema
from app.models.uploaded_file import UploadedFile
from app.models.document_processing import DocumentProcessing
from app.models.document_page import DocumentPage
from app.services.document_service import DocumentService
from app.api.deps import get_current_user
from app.models.user import User

logger = logging.getLogger("app.api.v1.routes.document")
router = APIRouter()

@router.post(
    "/document/process/{file_id}",
    response_model=BaseResponse[ProcessingStatusResponse],
    summary="Trigger document parsing",
    description="Launches background thread to process digital/scanned pages."
)
async def process_document(
    file_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    f = db.query(UploadedFile).filter(UploadedFile.uuid == file_id, UploadedFile.user_id == current_user.id).first()
    if not f:
        raise HTTPException(status_code=404, detail="File not found in your catalog library.")

    # Initialize status
    job = db.query(DocumentProcessing).filter(DocumentProcessing.file_id == f.id).first()
    if not job:
        job = DocumentProcessing(file_id=f.id, status="Queued")
        db.add(job)
    else:
        job.status = "Queued"
        job.error_message = None
        job.processing_completed = None
        job.processed_pages = 0
    
    f.processing_status = "Queued"
    f.processing_progress = 0
    db.commit()

    background_tasks.add_task(DocumentService.process_document_background, file_id)

    return BaseResponse(
        success=True,
        message="Document processing enqueued successfully.",
        data=ProcessingStatusResponse(
            status=job.status,
            progress=f.processing_progress,
            pages_processed=job.processed_pages or 0,
            total_pages=job.total_pages or 0,
            processing_time=job.processing_time,
            error_message=job.error_message
        )
    )

@router.get(
    "/document/status/{file_id}",
    response_model=BaseResponse[ProcessingStatusResponse],
    summary="Get processing status",
    description="Polls current status and progress % for the uploaded PDF."
)
async def get_document_status(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    f = db.query(UploadedFile).filter(UploadedFile.uuid == file_id, UploadedFile.user_id == current_user.id).first()
    if not f:
        raise HTTPException(status_code=404, detail="File not found in your catalog library.")

    job = db.query(DocumentProcessing).filter(DocumentProcessing.file_id == f.id).first()
    
    # Return placeholder if job doesn't exist yet
    status_str = job.status if job else f.processing_status
    progress_val = f.processing_progress or 0
    pages_proc = job.processed_pages if (job and job.processed_pages) else 0
    tot_pages = job.total_pages if (job and job.total_pages) else (f.page_count or 0)
    proc_time = job.processing_time if job else None
    err_msg = job.error_message if job else None

    return BaseResponse(
        success=True,
        message="Status loaded successfully.",
        data=ProcessingStatusResponse(
            status=status_str,
            progress=progress_val,
            pages_processed=pages_proc,
            total_pages=tot_pages,
            processing_time=proc_time,
            error_message=err_msg
        )
    )

@router.get(
    "/document/pages/{file_id}",
    response_model=BaseResponse[List[DocumentPageSchema]],
    summary="Get document pages",
    description="Loads all parsed page texts, word counts, and language metadata."
)
async def get_document_pages(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    f = db.query(UploadedFile).filter(UploadedFile.uuid == file_id, UploadedFile.user_id == current_user.id).first()
    if not f:
        raise HTTPException(status_code=404, detail="File not found in your catalog library.")

    pages = db.query(DocumentPage).filter(DocumentPage.file_id == f.id).order_by(DocumentPage.page_number).all()
    
    data = [
        DocumentPageSchema(
            page_number=p.page_number,
            page_text=p.page_text,
            character_count=p.character_count,
            word_count=p.word_count,
            is_ocr=p.is_ocr,
            confidence=p.confidence,
            language=p.language
        )
        for p in pages
    ]

    return BaseResponse(
        success=True,
        message="Document pages loaded successfully.",
        data=data
    )

@router.get(
    "/document/page/{file_id}/{page_number}",
    response_model=BaseResponse[DocumentPageSchema],
    summary="Get single page",
    description="Returns text details for a single page number."
)
async def get_document_page(
    file_id: str,
    page_number: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    f = db.query(UploadedFile).filter(UploadedFile.uuid == file_id, UploadedFile.user_id == current_user.id).first()
    if not f:
        raise HTTPException(status_code=404, detail="File not found in your catalog library.")

    page = db.query(DocumentPage).filter(DocumentPage.file_id == f.id, DocumentPage.page_number == page_number).first()
    if not page:
        raise HTTPException(status_code=404, detail=f"Page {page_number} not found for this file.")

    return BaseResponse(
        success=True,
        message=f"Page {page_number} loaded successfully.",
        data=DocumentPageSchema(
            page_number=page.page_number,
            page_text=page.page_text,
            character_count=page.character_count,
            word_count=page.word_count,
            is_ocr=page.is_ocr,
            confidence=page.confidence,
            language=page.language
        )
    )

@router.get(
    "/document/metadata/{file_id}",
    response_model=BaseResponse[DocumentMetadataSchema],
    summary="Get document metadata",
    description="Retrieves PDF attributes and layout details (Title, Author, Version, bookmarks)."
)
async def get_document_metadata(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    f = db.query(UploadedFile).filter(UploadedFile.uuid == file_id, UploadedFile.user_id == current_user.id).first()
    if not f:
        raise HTTPException(status_code=404, detail="File not found in your catalog library.")

    # Fetch locally
    try:
        local_path = DocumentService._download_file_locally(f)
        meta = DocumentService.extract_metadata(local_path)
        # Delete local copy if S3
        if f.storage_provider == "s3" and os.path.exists(local_path):
            try:
                os.remove(local_path)
            except Exception:
                pass
    except Exception as e:
        logger.error(f"Error fetching metadata: {e}")
        # Return fallback mock schema
        meta = {
            "file_name": f.original_filename,
            "title": f.original_filename,
            "author": "Unknown",
            "subject": "",
            "keywords": "",
            "creation_date": "",
            "modification_date": "",
            "pdf_version": "",
            "page_count": f.page_count or 1,
            "producer": "",
            "creator": "",
            "encryption_status": False,
            "bookmarks": "[]"
        }

    return BaseResponse(
        success=True,
        message="Metadata loaded successfully.",
        data=DocumentMetadataSchema(**meta)
    )

@router.post(
    "/document/reprocess/{file_id}",
    response_model=BaseResponse[ProcessingStatusResponse],
    summary="Reprocess document",
    description="Restarts extraction and OCR workflows."
)
async def reprocess_document(
    file_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    f = db.query(UploadedFile).filter(UploadedFile.uuid == file_id, UploadedFile.user_id == current_user.id).first()
    if not f:
        raise HTTPException(status_code=404, detail="File not found in your catalog library.")

    # Reset job
    job = db.query(DocumentProcessing).filter(DocumentProcessing.file_id == f.id).first()
    if not job:
        job = DocumentProcessing(file_id=f.id, status="Queued")
        db.add(job)
    else:
        job.status = "Queued"
        job.error_message = None
        job.processed_pages = 0
        job.processing_completed = None
    
    f.processing_status = "Queued"
    f.processing_progress = 0
    db.commit()

    background_tasks.add_task(DocumentService.process_document_background, file_id)

    return BaseResponse(
        success=True,
        message="Document reprocessing enqueued successfully.",
        data=ProcessingStatusResponse(
            status=job.status,
            progress=f.processing_progress,
            pages_processed=job.processed_pages or 0,
            total_pages=job.total_pages or 0,
            processing_time=job.processing_time,
            error_message=job.error_message
        )
    )
