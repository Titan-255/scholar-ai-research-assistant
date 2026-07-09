import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Float
from sqlalchemy.orm import relationship
from app.core.database import Base

class DocumentProcessing(Base):
    __tablename__ = "document_processing"

    id = Column(Integer, primary_key=True, autoincrement=True)
    file_id = Column(Integer, ForeignKey("uploaded_files.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    status = Column(String(50), default="Queued", nullable=False)
    processing_type = Column(String(50), nullable=True)  # "digital", "ocr", "mixed"
    processing_started = Column(DateTime, nullable=True)
    processing_completed = Column(DateTime, nullable=True)
    processing_time = Column(Float, nullable=True)
    total_pages = Column(Integer, nullable=True)
    processed_pages = Column(Integer, nullable=True)
    ocr_used = Column(Boolean, default=False, nullable=False)
    confidence_score = Column(Float, nullable=True)
    error_message = Column(String(1000), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    # Relationships
    uploaded_file = relationship("UploadedFile", back_populates="document_processing")

    def __repr__(self):
        return f"<DocumentProcessing file_id={self.file_id} status={self.status}>"
