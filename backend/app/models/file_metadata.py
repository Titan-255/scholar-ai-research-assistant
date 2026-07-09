import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class FileMetadata(Base):
    __tablename__ = "file_metadata"

    id = Column(Integer, primary_key=True, autoincrement=True)
    file_id = Column(Integer, ForeignKey("uploaded_files.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    total_chunks = Column(Integer, default=0, nullable=False)
    embedding_status = Column(String(50), default="pending", nullable=False)
    processing_status = Column(String(50), default="pending", nullable=False)
    ocr_completed = Column(Boolean, default=False, nullable=False)
    chunking_completed = Column(Boolean, default=False, nullable=False)
    vectorized = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # Relationships
    uploaded_file = relationship("UploadedFile", back_populates="file_metadata")

    def __repr__(self):
        return f"<FileMetadata for file_id {self.file_id}>"
