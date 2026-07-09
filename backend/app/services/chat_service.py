import datetime
import logging
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.user import User
from app.models.chat_session import ChatSession
from app.models.chat_message import ChatMessage
from app.models.schemas.chat import CreateSessionRequest, SendMessageRequest
from app.repositories.chat_repository import ChatRepository
from app.repositories.file_repository import FileRepository

logger = logging.getLogger("app.services.chat_service")

class ChatService:
    @staticmethod
    def create_chat_session(db: Session, user: User, data: CreateSessionRequest) -> ChatSession:
        """
        Creates a new chat session bound to a specific PDF and populates it with an AI greeting.
        """
        logger.info(f"Creating new chat session for user {user.uuid} and file {data.pdf_id}")
        
        # 1. Verify file exists and belongs to the user
        pdf = FileRepository.get_by_uuid_and_user(db, data.pdf_id, user.id)
        if not pdf:
            raise HTTPException(status_code=404, detail="Indexed document not found in your library.")
            
        title = data.title or pdf.original_filename
        
        # 2. Instantiate and save ChatSession
        session = ChatSession(
            user_id=user.id,
            title=title
        )
        ChatRepository.create_session(db, session)
        
        # 3. Save initial greeting message from AI
        greeting = ChatMessage(
            session_id=session.id,
            sender="ai",
            message=f"Hi! I have successfully read and indexed **{pdf.original_filename}**. Ask me any question about its contents!",
            referenced_pdf=pdf.original_filename
        )
        ChatRepository.create_message(db, greeting)
        
        return session

    @staticmethod
    def list_chat_sessions(db: Session, user: User) -> list:
        """Lists all chat sessions belonging to the user."""
        return ChatRepository.list_sessions_by_user_id(db, user.id)

    @staticmethod
    def get_chat_session(db: Session, session_uuid: str, user: User) -> ChatSession:
        """Retrieves details of a chat session, validating ownership."""
        session = ChatRepository.get_session_by_uuid_and_user(db, session_uuid, user.id)
        if not session:
            raise HTTPException(status_code=404, detail="Chat conversation thread not found.")
        return session

    @staticmethod
    def delete_chat_session(db: Session, session_uuid: str, user: User) -> None:
        """Deletes a chat session, validating ownership."""
        session = ChatRepository.get_session_by_uuid_and_user(db, session_uuid, user.id)
        if not session:
            raise HTTPException(status_code=404, detail="Chat conversation thread not found.")
        ChatRepository.delete_session(db, session)
        logger.info(f"Deleted chat session {session_uuid} for user {user.uuid}")

    @staticmethod
    def save_chat_message(db: Session, user: User, data: SendMessageRequest) -> list:
        """
        Saves user's message and creates a corresponding mock AI response.
        """
        # 1. Load and verify session ownership
        session = ChatRepository.get_session_by_uuid_and_user(db, data.session_id, user.id)
        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found.")

        # 2. Save User Message
        user_msg = ChatMessage(
            session_id=session.id,
            sender="user",
            message=data.message,
            referenced_pdf=data.referenced_pdf,
            page_number=data.page_number
        )
        ChatRepository.create_message(db, user_msg)

        # 3. Generate mock AI reply
        ai_reply_text = get_mock_ai_response(data.message, session.title)
        
        # 4. Save AI Message
        ai_msg = ChatMessage(
            session_id=session.id,
            sender="ai",
            message=ai_reply_text,
            referenced_pdf=data.referenced_pdf
        )
        ChatRepository.create_message(db, ai_msg)

        # 5. Update session last activity timestamps
        session.last_message_at = datetime.datetime.utcnow()
        session.updated_at = datetime.datetime.utcnow()
        db.commit()

        return [user_msg, ai_msg]

def get_mock_ai_response(user_query: str, doc_name: str) -> str:
    """Helper mock response logic identical to Phase 1 frontend requirements."""
    q = user_query.lower()
    words = [w.strip(".,!?") for w in q.split()]
    if any(greet in words for greet in ["hello", "hi", "hey"]):
        return f"Hello! How can I help you analyze **{doc_name}** today? You can ask me to summarize sections, explain terms, or locate specific data points."
    
    if any(sum_keyword in q for sum_keyword in ["summarize", "summary"]):
        return f"Here is a high-level executive summary of **{doc_name}**:\n\n- **Core Objectives**: Introduces a novel methodology designed to optimize efficiency and scalability in practical applications.\n- **Key Methodology**: Leverages attention-driven nodes and multi-headed weight profiles to capture long-range interactions.\n- **Experimental Results**: Outperforms standard baseline models by a margin of 14.2% in precision while maintaining equivalent computing latency.\n- **Conclusion**: Proposes future pathways involving sparse matrices to cut memory footprints in half."
    
    if any(auth_keyword in q for auth_keyword in ["author", "who wrote", "writer"]):
        return f"Based on the metadata of **{doc_name}**, the paper was authored by a team of leading AI researchers and engineers. If this is a popular preprint, you will find authors listed on the first page under the title."
        
    if any(math_keyword in q for math_keyword in ["equation", "formula", "math"]):
        return "Yes, the document outlines the core scoring function as:\n\n$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$$\n\nWhere $Q$ (queries), $K$ (keys), and $V$ (values) are input projections, and $d_k$ represents the scaling factor of the key dimensions. This scale prevents vanishing gradients in softmax."
        
    return f"That's an interesting question about **{doc_name}**. After analyzing the content, the document suggests that:\n\n1. **Context Matters**: The relationships are evaluated using dynamic weights based on the user request.\n2. **Implementation Details**: The system structures the data using vectorized blocks, minimizing typical token overlaps.\n3. **Implications**: Scaling this behavior allows linear retrieval rates without standard lookup penalties.\n\nWould you like me to look up specific references or extract a detailed quote for this?"
