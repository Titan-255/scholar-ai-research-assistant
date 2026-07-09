import os
import re
from pathlib import Path
from fastapi import HTTPException

def sanitize_filename(filename: str) -> str:
    """
    Sanitizes a filename to prevent directory traversal and remove unsafe characters.
    """
    # Get only the base name (prevents directory traversal e.g. ../../../etc/passwd)
    base_name = os.path.basename(filename)
    
    # Remove any character that isn't alphanumeric, space, dot, hyphen, or underscore
    sanitized = re.sub(r'[^a-zA-Z0-9._\s-]', '', base_name)
    
    # Strip leading/trailing whitespaces and reduce multiple spaces
    sanitized = re.sub(r'\s+', ' ', sanitized).strip()
    
    # Ensure it's not empty
    if not sanitized or sanitized in (".", ".."):
        return "unnamed_file.pdf"
        
    return sanitized

def prevent_directory_traversal(target_path: Path, base_dir: Path) -> None:
    """
    Raises an HTTPException if the resolved target path is outside of base directory.
    """
    try:
        # Resolve path to absolute
        resolved_target = target_path.resolve()
        resolved_base = base_dir.resolve()
        
        # Verify resolved_target starts with resolved_base path prefix
        if not str(resolved_target).startswith(str(resolved_base)):
            raise HTTPException(status_code=403, detail="Access denied: Directory traversal detected.")
    except Exception:
        raise HTTPException(status_code=403, detail="Access denied: Directory traversal detected.")

def format_file_size(size_bytes: int) -> str:
    """
    Converts a file size in bytes to a human-readable string.
    """
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.1f} TB"
