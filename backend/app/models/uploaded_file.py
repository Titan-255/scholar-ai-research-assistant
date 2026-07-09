import datetime
import uuid
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class UploadedFile(Base):
    __tablename__ = "uploaded_files"

    id = Column(Integer, primary_key=True, autoincrement=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_path = Column(String(500), nullable=False)  # Local file path fallback
    upload_status = Column(String(50), default="Processing", nullable=False)
    total_pages = Column(Integer, nullable=True)
    language = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    # Cloud Storage Extensions
    storage_provider = Column(String(50), default="local", nullable=False, index=True)
    s3_object_key = Column(String(500), nullable=True)
    bucket_name = Column(String(255), nullable=True)
    storage_url = Column(String(1000), nullable=True)
    etag = Column(String(255), nullable=True)
    upload_completed = Column(Boolean, default=False, nullable=False)
    storage_size = Column(Integer, nullable=True)

    # Relationships
    user = relationship("User", back_populates="uploaded_files")
    file_metadata = relationship("FileMetadata", back_populates="uploaded_file", uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<UploadedFile {self.original_filename} ({self.upload_status})>"
