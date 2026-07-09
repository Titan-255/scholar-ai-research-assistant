import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Float
from sqlalchemy.orm import relationship
from app.core.database import Base

class DocumentPage(Base):
    __tablename__ = "document_pages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    file_id = Column(Integer, ForeignKey("uploaded_files.id", ondelete="CASCADE"), nullable=False, index=True)
    page_number = Column(Integer, nullable=False)
    page_text = Column(Text, nullable=False)
    character_count = Column(Integer, nullable=False)
    word_count = Column(Integer, nullable=False)
    is_ocr = Column(Boolean, default=False, nullable=False)
    confidence = Column(Float, nullable=True)
    language = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # Relationships
    uploaded_file = relationship("UploadedFile", back_populates="document_pages")

    def __repr__(self):
        return f"<DocumentPage file_id={self.file_id} page_number={self.page_number}>"
