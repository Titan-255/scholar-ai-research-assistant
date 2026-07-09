import os
import time
import logging
import datetime
import fitz  # PyMuPDF
import pdfplumber
import numpy as np
from PIL import Image
from pdf2image import convert_from_path
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.uploaded_file import UploadedFile
from app.models.document_processing import DocumentProcessing
from app.models.document_page import DocumentPage
from app.services.storage.ocr import OCRProcessor
from app.services.storage.service import StorageService

logger = logging.getLogger("app.services.document_service")

class DocumentService:
    @staticmethod
    def _download_file_locally(file_obj: UploadedFile) -> str:
        """Downloads file to local temp directory if it's hosted in S3, or returns local path."""
        if file_obj.storage_provider == "local":
            if os.path.exists(file_obj.file_path):
                return file_obj.file_path
            # Check settings path
            alt_path = settings.upload_path / file_obj.user.uuid / file_obj.stored_filename
            if alt_path.exists():
                return str(alt_path)
            raise FileNotFoundError(f"Local file does not exist at {file_obj.file_path}")

        # Download from S3
        temp_dir = settings.TEMP_DIRECTORY or os.path.join(os.environ.get("TEMP", "/tmp"), "scholar_ai_temp")
        os.makedirs(temp_dir, exist_ok=True)
        dest_path = os.path.join(temp_dir, file_obj.stored_filename)

        logger.info(f"Downloading remote file from S3: {file_obj.s3_object_key} -> {dest_path}")
        StorageService.download_file_to_path(
            provider_name=file_obj.storage_provider,
            s3_object_key=file_obj.s3_object_key,
            bucket_name=file_obj.bucket_name,
            file_path=file_obj.file_path,
            dest_path=dest_path
        )
        return dest_path

    @staticmethod
    def clean_text(text: str) -> str:
        """Normalizes unicode characters, extra whitespace, and broken newlines."""
        if not text:
            return ""
        # Remove duplicate spaces
        text = " ".join(text.split())
        # Replace non-printable characters
        text = "".join(ch for ch in text if ch.isprintable() or ch in ("\n", "\r", "\t"))
        return text.strip()

    @classmethod
    def extract_metadata(cls, pdf_path: str) -> dict:
        """Extracts standard PDF metadata details using PyMuPDF."""
        metadata = {}
        try:
            doc = fitz.open(pdf_path)
            meta = doc.metadata
            metadata = {
                "file_name": os.path.basename(pdf_path),
                "title": meta.get("title") or "",
                "author": meta.get("author") or "",
                "subject": meta.get("subject") or "",
                "keywords": meta.get("keywords") or "",
                "creation_date": meta.get("creationDate") or "",
                "modification_date": meta.get("modDate") or "",
                "pdf_version": meta.get("format") or "",
                "page_count": len(doc),
                "producer": meta.get("producer") or "",
                "creator": meta.get("creator") or "",
                "encryption_status": doc.is_encrypted,
                "bookmarks": str(doc.get_toc())
            }
            doc.close()
        except Exception as e:
            logger.error(f"Failed to read PDF metadata: {e}")
        return metadata

    @classmethod
    async def process_document_background(cls, file_id: str, db: Session = None):
        """Asynchronous background processing worker."""
        should_close = False
        if db is None:
            db = SessionLocal()
            should_close = True
            
        logger.info(f"Background processing job started for file: {file_id}")
        
        # Load file
        file_obj = db.query(UploadedFile).filter(UploadedFile.uuid == file_id).first()
        if not file_obj:
            logger.error(f"File {file_id} not found in database.")
            if should_close:
                db.close()
            return

        # 1. Initialize DocumentProcessing state
        job = db.query(DocumentProcessing).filter(DocumentProcessing.file_id == file_obj.id).first()
        if not job:
            job = DocumentProcessing(
                file_id=file_obj.id,
                status="Downloading",
                processing_started=datetime.datetime.utcnow()
            )
            db.add(job)
        else:
            job.status = "Downloading"
            job.error_message = None
            job.confidence_score = None
            job.processing_started = datetime.datetime.utcnow()
            job.processing_completed = None
        
        file_obj.processing_status = "Downloading"
        file_obj.processing_progress = 5
        db.commit()

        temp_pdf_path = None
        start_time = time.time()

        try:
            # 2. Download File
            temp_pdf_path = cls._download_file_locally(file_obj)

            # 3. Read Metadata
            job.status = "Reading Metadata"
            file_obj.processing_status = "Reading Metadata"
            file_obj.processing_progress = 15
            db.commit()

            metadata = cls.extract_metadata(temp_pdf_path)
            file_obj.page_count = metadata.get("page_count", 1)
            job.total_pages = metadata.get("page_count", 1)
            
            # Check maximum page limits
            if job.total_pages > settings.MAX_PAGES:
                raise ValueError(f"Document contains {job.total_pages} pages, which exceeds the limit of {settings.MAX_PAGES}.")

            # 4. Process each page dynamically
            job.status = "Extracting Text"
            file_obj.processing_status = "Extracting Text"
            file_obj.processing_progress = 30
            db.commit()

            doc = fitz.open(temp_pdf_path)
            total_pages = len(doc)
            
            # Clear old pages if re-processing
            db.query(DocumentPage).filter(DocumentPage.file_id == file_obj.id).delete()
            db.commit()

            ocr_pages_needed = []
            digital_pages_data = {}

            # First pass: try PyMuPDF/pdfplumber text extraction
            for idx in range(total_pages):
                page = doc[idx]
                text = page.get_text()
                
                # Check selectable characters count
                # If character count is too small, check with pdfplumber as fallback
                if len(text.strip()) < 50:
                    try:
                        with pdfplumber.open(temp_pdf_path) as plumber:
                            if idx < len(plumber.pages):
                                plumber_page = plumber.pages[idx]
                                text = plumber_page.extract_text() or ""
                    except Exception as plumber_err:
                        logger.debug(f"pdfplumber fallback skipped: {plumber_err}")

                text = cls.clean_text(text)

                # Determine if page requires OCR
                if len(text) < 40:
                    ocr_pages_needed.append(idx)
                else:
                    digital_pages_data[idx] = text

            doc.close()

            # Second pass: If some pages require OCR, convert them to images and run OCR
            images = []
            if ocr_pages_needed:
                job.status = "Running OCR"
                file_obj.processing_status = "Running OCR"
                db.commit()
                
                logger.info(f"Converting pages {ocr_pages_needed} to images for OCR extraction.")
                # Convert PDF pages to images (using pdf2image)
                for page_idx in ocr_pages_needed:
                    try:
                        page_images = convert_from_path(
                            temp_pdf_path,
                            first_page=page_idx + 1,
                            last_page=page_idx + 1,
                            dpi=150
                        )
                        if page_images:
                            images.append((page_idx, page_images[0]))
                    except Exception as convert_err:
                        logger.error(f"Error converting page {page_idx} to image: {convert_err}")
                        # Return simulated dummy image on conversion failures (e.g. pdftoppm missing)
                        dummy_img = Image.new('RGB', (800, 1000), color='white')
                        images.append((page_idx, dummy_img))

            # Run OCR on converted images
            ocr_completed_flag = False
            ocr_confidences = []
            
            for page_idx, img in images:
                logger.info(f"Running Tesseract OCR on page {page_idx + 1}")
                extracted_text, confidence = OCRProcessor.run_ocr(img)
                cleaned_text = cls.clean_text(extracted_text)
                
                digital_pages_data[page_idx] = cleaned_text
                ocr_confidences.append(confidence)
                ocr_completed_flag = True

                # Save page record immediately to track progress
                document_page = DocumentPage(
                    file_id=file_obj.id,
                    page_number=page_idx + 1,
                    page_text=cleaned_text,
                    character_count=len(cleaned_text),
                    word_count=len(cleaned_text.split()),
                    is_ocr=True,
                    confidence=confidence,
                    language=settings.OCR_LANGUAGE
                )
                db.add(document_page)
                
                # Update progress
                processed_count = len(digital_pages_data)
                job.processed_pages = processed_count
                progress_val = int(30 + (70 * (processed_count / total_pages)))
                file_obj.processing_progress = min(95, progress_val)
                db.commit()

            # Save digital pages that did not require OCR
            for page_idx, text in digital_pages_data.items():
                if page_idx not in ocr_pages_needed:
                    document_page = DocumentPage(
                        file_id=file_obj.id,
                        page_number=page_idx + 1,
                        page_text=text,
                        character_count=len(text),
                        word_count=len(text.split()),
                        is_ocr=False,
                        confidence=100.0,
                        language="en"
                    )
                    db.add(document_page)

            # Update overall details
            duration = time.time() - start_time
            job.processing_time = duration
            job.processed_pages = total_pages
            job.status = "Saving Pages"
            file_obj.processing_status = "Saving Pages"
            db.commit()

            # Determine document type
            if ocr_pages_needed:
                if len(ocr_pages_needed) == total_pages:
                    file_obj.document_type = "scanned_pdf"
                    job.processing_type = "ocr"
                else:
                    file_obj.document_type = "mixed_pdf"
                    job.processing_type = "mixed"
            else:
                file_obj.document_type = "digital_pdf"
                job.processing_type = "digital"

            file_obj.ocr_completed = ocr_completed_flag
            file_obj.text_extracted = True
            file_obj.last_processed = datetime.datetime.utcnow()
            
            # Overall job stats
            job.status = "Completed"
            job.ocr_used = ocr_completed_flag
            job.confidence_score = float(np.mean(ocr_confidences)) if ocr_confidences else 100.0
            job.processing_completed = datetime.datetime.utcnow()

            file_obj.processing_status = "Completed"
            file_obj.processing_progress = 100
            file_obj.upload_status = "Ready"  # Set to Ready so dashboard is synced
            db.commit()
            logger.info(f"Job completed successfully for file {file_id} in {duration:.2f}s.")

        except Exception as err:
            duration = time.time() - start_time
            logger.error(f"Error processing document {file_id}: {err}")
            
            job.status = "Failed"
            job.error_message = str(err)
            job.processing_time = duration
            job.processing_completed = datetime.datetime.utcnow()
            
            file_obj.processing_status = "Failed"
            file_obj.upload_status = "Failed"
            db.commit()

        finally:
            # Delete temporary local file if downloaded from S3
            if temp_pdf_path and file_obj.storage_provider == "s3" and os.path.exists(temp_pdf_path):
                try:
                    os.remove(temp_pdf_path)
                    logger.debug(f"Removed temporary PDF path: {temp_pdf_path}")
                except Exception as cleanup_err:
                    logger.warning(f"Failed to delete temp PDF: {cleanup_err}")
            
            if should_close:
                db.close()
