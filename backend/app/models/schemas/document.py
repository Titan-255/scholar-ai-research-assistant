from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ProcessingStatusResponse(BaseModel):
    status: str = Field(..., description="Current processing job state (e.g. Queued, Completed, Failed)")
    progress: int = Field(..., description="Job progress percentage (0-100)")
    pages_processed: int = Field(..., description="Number of pages successfully parsed")
    total_pages: int = Field(..., description="Total pages in the PDF document")
    processing_time: Optional[float] = Field(None, description="Total execution duration in seconds")
    error_message: Optional[str] = Field(None, description="Detailed error log if status is Failed")

class DocumentPageSchema(BaseModel):
    page_number: int
    page_text: str
    character_count: int
    word_count: int
    is_ocr: bool
    confidence: Optional[float] = None
    language: Optional[str] = None

class DocumentMetadataSchema(BaseModel):
    file_name: str
    title: Optional[str] = ""
    author: Optional[str] = ""
    subject: Optional[str] = ""
    keywords: Optional[str] = ""
    creation_date: Optional[str] = ""
    modification_date: Optional[str] = ""
    pdf_version: Optional[str] = ""
    page_count: int
    producer: Optional[str] = ""
    creator: Optional[str] = ""
    encryption_status: bool
    bookmarks: Optional[str] = ""
