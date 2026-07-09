from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class CreateSessionRequest(BaseModel):
    pdf_id: str = Field(..., description="UUID of the uploaded PDF file to bind to this chat")
    title: Optional[str] = Field(None, description="Optional custom title for the chat session")

class SendMessageRequest(BaseModel):
    session_id: str = Field(..., description="UUID of the active chat session")
    message: str = Field(..., min_length=1, description="Message text")
    referenced_pdf: Optional[str] = Field(None, description="Filename of referenced PDF if applicable")
    page_number: Optional[int] = Field(None, description="Page number reference")

class ChatMessageResponse(BaseModel):
    uuid: str
    sender: str
    message: str
    referenced_pdf: Optional[str] = None
    page_number: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}

class ChatSessionResponse(BaseModel):
    uuid: str
    title: str
    created_at: datetime
    updated_at: datetime
    last_message_at: datetime

    model_config = {"from_attributes": True}

class ChatSessionDetailResponse(BaseModel):
    uuid: str
    title: str
    created_at: datetime
    updated_at: datetime
    last_message_at: datetime
    messages: List[ChatMessageResponse]

    model_config = {"from_attributes": True}
