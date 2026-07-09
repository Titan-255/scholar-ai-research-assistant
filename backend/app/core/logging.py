import logging
import os
import sys
from pathlib import Path
from .config import settings

def setup_logging():
    """Sets up the centralized logging configuration."""
    backend_dir = Path(__file__).resolve().parents[2]
    log_file = backend_dir / "app.log"

    log_level = logging.DEBUG if settings.DEBUG else logging.INFO

    # Create formatters
    formatter = logging.Formatter(
        fmt="[%(asctime)s] %(levelname)s [%(name)s:%(filename)s:%(lineno)d] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    # Console Handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    console_handler.setLevel(log_level)

    # File Handler
    file_handler = logging.FileHandler(log_file, encoding="utf-8")
    file_handler.setFormatter(formatter)
    file_handler.setLevel(log_level)

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # Remove existing handlers to avoid duplicates
    if root_logger.hasHandlers():
        root_logger.handlers.clear()
        
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)

    # Log configuration success
    logging.getLogger("app.core.logging").info(
        f"Logging system initialized. Log file: {log_file}. Level: {logging.getLevelName(log_level)}"
    )

setup_logging()
logger = logging.getLogger("app")
