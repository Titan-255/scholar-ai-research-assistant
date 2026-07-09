import logging
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.schemas.responses import BaseResponse
from app.models.schemas.chat import (
    CreateSessionRequest,
    SendMessageRequest,
    ChatMessageResponse,
    ChatSessionResponse,
    ChatSessionDetailResponse
)
from app.services.chat_service import ChatService

logger = logging.getLogger("app.api.v1.routes.chat")
router = APIRouter()

@router.post(
    "/session",
    response_model=BaseResponse[ChatSessionResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create a new chat session",
    description="Initializes a new AI chat conversation bound to a specific uploaded PDF."
)
async def create_session(
    data: CreateSessionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Creates a new chat session thread."""
    session = ChatService.create_chat_session(db, current_user, data)
    return BaseResponse(
        success=True,
        message="Chat session created successfully.",
        data=ChatSessionResponse.model_validate(session)
    )

@router.get(
    "/sessions",
    response_model=BaseResponse[List[ChatSessionResponse]],
    summary="List all user chat sessions",
    description="Loads list of all active chat sessions belonging to the current user."
)
async def list_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists all user chat sessions."""
    sessions = ChatService.list_chat_sessions(db, current_user)
    return BaseResponse(
        success=True,
        message="Chat sessions loaded successfully.",
        data=[ChatSessionResponse.model_validate(s) for s in sessions]
    )

@router.get(
    "/session/{id}",
    response_model=BaseResponse[ChatSessionDetailResponse],
    summary="Load chat session conversation history",
    description="Retrieves a specific chat session and all messages exchanged within it."
)
async def get_session_detail(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Loads detail information and message logs for a session."""
    session = ChatService.get_chat_session(db, id, current_user)
    return BaseResponse(
        success=True,
        message="Conversation loaded successfully.",
        data=ChatSessionDetailResponse.model_validate(session)
    )

@router.delete(
    "/session/{id}",
    response_model=BaseResponse[None],
    summary="Delete chat session thread",
    description="Deletes a chat session and all associated message logs."
)
async def delete_session(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes a chat session thread."""
    ChatService.delete_chat_session(db, id, current_user)
    return BaseResponse(
        success=True,
        message="Chat session deleted successfully.",
        data=None
    )

@router.post(
    "/message",
    response_model=BaseResponse[List[ChatMessageResponse]],
    summary="Send a chat message and receive AI response",
    description="Saves a user message and returns user input paired with AI mock response."
)
async def send_message(
    data: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Sends a message to the AI and saves the log."""
    messages = ChatService.save_chat_message(db, current_user, data)
    return BaseResponse(
        success=True,
        message="Message processed successfully.",
        data=[ChatMessageResponse.model_validate(m) for m in messages]
    )
