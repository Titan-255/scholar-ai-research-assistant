import logging
from typing import Tuple
from app.core.config import settings
from app.core.constants import PDF_MIME_TYPE

logger = logging.getLogger("app.utils.validators")

def validate_pdf_file(filename: str, content_type: str, file_size: int) -> Tuple[bool, str]:
    """
    Validates a file upload to ensure it is a PDF and within allowed size bounds.
    
    Returns:
        Tuple[bool, str]: (is_valid, error_message)
    """
    # 1. Validate Extension
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    if ext not in settings.ALLOWED_EXTENSIONS:
        msg = f"Invalid extension '{ext}'. Only PDF files are allowed."
        logger.warning(f"File validation failed for '{filename}': {msg}")
        return False, msg

    # 2. Validate MIME Type
    if content_type.lower() != PDF_MIME_TYPE:
        msg = f"Invalid MIME type '{content_type}'. Expected '{PDF_MIME_TYPE}'."
        logger.warning(f"File validation failed for '{filename}': {msg}")
        return False, msg

    # 3. Validate Size Bound
    if file_size > settings.MAX_FILE_SIZE:
        max_mb = settings.MAX_FILE_SIZE / (1024 * 1024)
        actual_mb = file_size / (1024 * 1024)
        msg = f"File too large ({actual_mb:.2f} MB). Maximum size is {max_mb:.0f} MB."
        logger.warning(f"File validation failed for '{filename}': {msg}")
        return False, msg

    return True, ""
