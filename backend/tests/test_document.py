import io
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.uploaded_file import UploadedFile
from app.models.document_processing import DocumentProcessing
from app.models.document_page import DocumentPage
from app.services.document_service import DocumentService
from app.services.storage.ocr import OCRProcessor

@pytest.fixture
def mock_pdf_tools():
    with patch("fitz.open") as mock_fitz, \
         patch("pdfplumber.open") as mock_plumber, \
         patch("pdf2image.convert_from_path") as mock_convert, \
         patch("app.services.storage.ocr.pytesseract.image_to_data") as mock_tess:
         
        # Mock fitz document
        doc_instance = MagicMock()
        mock_fitz.return_value = doc_instance
        doc_instance.metadata = {
            "title": "Test Title",
            "author": "Test Author",
            "subject": "Test Subject",
            "keywords": "Test Keywords",
            "creationDate": "20260709",
            "modDate": "20260709",
            "format": "PDF 1.4",
            "producer": "Test Producer",
            "creator": "Test Creator"
        }
        doc_instance.is_encrypted = False
        doc_instance.get_toc.return_value = []
        doc_instance.__len__.return_value = 2
        
        # Mock pages
        page_1 = MagicMock()
        page_1.get_text.return_value = "This is digital selectable text on page 1."
        page_2 = MagicMock()
        page_2.get_text.return_value = ""  # Empty page -> will trigger OCR fallback
        doc_instance.__getitem__.side_effect = [page_1, page_2]
        
        # Mock pdf2image
        mock_convert.return_value = [MagicMock()]
        
        # Mock Tesseract
        mock_tess.return_value = {
            "text": ["This", "is", "ocr", "extracted", "text", "on", "page", "2."],
            "conf": [90, 95, 99, 90, 92, 95, 96, 98]
        }
        
        yield {
            "fitz": mock_fitz,
            "plumber": mock_plumber,
            "convert": mock_convert,
            "tess": mock_tess,
            "page_2": page_2
        }

def test_ocr_processor_fallback():
    # Verify OCRProcessor gracefully falls back if Tesseract binary is not installed
    with patch("app.services.storage.ocr.pytesseract.image_to_data", side_effect=FileNotFoundError("tesseract not found")):
        from PIL import Image
        dummy_img = Image.new("RGB", (100, 100), color="white")
        text, conf = OCRProcessor.run_ocr(dummy_img)
        assert "simulated" in text.lower()
        assert conf == 70.0

def test_document_pipeline_lifecycle(client, clean_db_session, mock_pdf_tools):
    # Set settings to Local storage
    with patch.object(settings, "STORAGE_PROVIDER", "local"):
        # Register user
        reg_payload = {
            "full_name": "Pipeline User",
            "email": "pipeline@example.com",
            "password": "Password123!",
            "confirm_password": "Password123!"
        }
        client.post("/api/v1/auth/register", json=reg_payload)
        
        login_res = client.post("/api/v1/auth/login", json={
            "email": "pipeline@example.com",
            "password": "Password123!"
        })
        token = login_res.json()["data"]["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Upload PDF
        pdf_content = b"%PDF-1.4\nmock pdf body"
        files = {"file": ("test_doc.pdf", io.BytesIO(pdf_content), "application/pdf")}
        upload_res = client.post("/api/v1/upload", files=files, headers=headers)
        assert upload_res.status_code == 200
        
        file_uuid = upload_res.json()["data"]["stored_name"].split(".pdf")[0]
        
        # Poll status
        status_res = client.get(f"/api/v1/document/status/{file_uuid}", headers=headers)
        assert status_res.status_code == 200
        assert status_res.json()["data"]["status"] in ["Queued", "Downloading", "Reading Metadata", "Extracting Text", "Running OCR", "Cleaning Text", "Saving Pages", "Completed"]
        
        # Run background task synchronously to verify it finishes successfully
        import asyncio
        asyncio.run(DocumentService.process_document_background(file_uuid, db=clean_db_session))
        
        # Poll status again -> should be Completed
        status_res_2 = client.get(f"/api/v1/document/status/{file_uuid}", headers=headers)
        assert status_res_2.status_code == 200
        assert status_res_2.json()["data"]["status"] == "Completed"
        assert status_res_2.json()["data"]["progress"] == 100
        
        # Fetch metadata
        meta_res = client.get(f"/api/v1/document/metadata/{file_uuid}", headers=headers)
        assert meta_res.status_code == 200
        assert meta_res.json()["data"]["title"] == "Test Title"
        assert meta_res.json()["data"]["author"] == "Test Author"
        
        # Fetch pages
        pages_res = client.get(f"/api/v1/document/pages/{file_uuid}", headers=headers)
        assert pages_res.status_code == 200
        pages = pages_res.json()["data"]
        assert len(pages) == 2
        
        # Page 1 should be digital
        assert pages[0]["page_number"] == 1
        assert "digital selectable text" in pages[0]["page_text"]
        assert not pages[0]["is_ocr"]
        
        # Page 2 should be OCR
        assert pages[1]["page_number"] == 2
        assert "ocr extracted text" in pages[1]["page_text"]
        assert pages[1]["is_ocr"]
        
        # Fetch page 2 details
        page_2_res = client.get(f"/api/v1/document/page/{file_uuid}/2", headers=headers)
        assert page_2_res.status_code == 200
        assert page_2_res.json()["data"]["word_count"] > 0
        
        # Reprocess
        reproc_res = client.post(f"/api/v1/document/reprocess/{file_uuid}", headers=headers)
        assert reproc_res.status_code == 200
        assert reproc_res.json()["data"]["status"] == "Queued"
