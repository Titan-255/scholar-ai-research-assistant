from pydantic import BaseModel

class HealthResponse(BaseModel):
    status: str = "healthy"

class RootResponse(BaseModel):
    application: str = "AI Research Assistant"
    status: str = "running"
    version: str = "1.0"

class FileMetadata(BaseModel):
    id: str
    original_name: str
    stored_name: str
    size_bytes: int
    upload_time: str
    status: str
    storage_provider: str = "local"

class UploadResponse(BaseModel):
    original_name: str
    stored_name: str
    size_bytes: int
    upload_time: str
    status: str
    storage_provider: str = "local"

class DownloadResponse(BaseModel):
    url: str
