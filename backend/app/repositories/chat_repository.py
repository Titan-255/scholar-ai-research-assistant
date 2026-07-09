from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.chat_session import ChatSession
from app.models.chat_message import ChatMessage

class ChatRepository:
    @staticmethod
    def get_session_by_uuid(db: Session, session_uuid: str) -> Optional[ChatSession]:
        """Loads ChatSession by UUID."""
        return db.query(ChatSession).filter(ChatSession.uuid == session_uuid).first()

    @staticmethod
    def get_session_by_uuid_and_user(db: Session, session_uuid: str, user_id: int) -> Optional[ChatSession]:
        """Loads ChatSession by UUID verifying it belongs to the user."""
        return db.query(ChatSession).filter(
            ChatSession.uuid == session_uuid,
            ChatSession.user_id == user_id
        ).first()

    @staticmethod
    def list_sessions_by_user_id(db: Session, user_id: int) -> List[ChatSession]:
        """Lists all chat sessions for a user, sorted by updated date."""
        return db.query(ChatSession).filter(
            ChatSession.user_id == user_id
        ).order_by(ChatSession.last_message_at.desc()).all()

    @staticmethod
    def create_session(db: Session, session_obj: ChatSession) -> ChatSession:
        """Saves a new chat session."""
        db.add(session_obj)
        db.commit()
        db.refresh(session_obj)
        return session_obj

    @staticmethod
    def create_message(db: Session, message_obj: ChatMessage) -> ChatMessage:
        """Saves a chat message and updates session activity logs."""
        db.add(message_obj)
        db.commit()
        db.refresh(message_obj)
        return message_obj

    @staticmethod
    def delete_session(db: Session, session_obj: ChatSession) -> None:
        """Deletes a chat session (cascades message deletion)."""
        db.delete(session_obj)
        db.commit()
