import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import logger
from app.api.v1.routes import health, upload, files, auth, users, chat, settings as settings_router, document
from app.core.database import Base, engine
from app.middleware.request_logger import RequestLoggerMiddleware
from app.middleware.error_handler import register_error_handlers
from app.models.schemas.upload import RootResponse

# Import all SQLAlchemy models to ensure they are registered on Base metadata
from app.models.user import User
from app.models.uploaded_file import UploadedFile
from app.models.file_metadata import FileMetadata
from app.models.chat_session import ChatSession
from app.models.chat_message import ChatMessage
from app.models.user_settings import UserSettings
from app.models.document_processing import DocumentProcessing
from app.models.document_page import DocumentPage

# Startup / Shutdown lifecycles
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME}...")
    logger.info("Initializing database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified/created successfully.")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        
    logger.info("Initializing uploads folder structures...")
    settings.upload_path.mkdir(parents=True, exist_ok=True)
    yield
    # Shutdown actions
    logger.info(f"Shutting down {settings.APP_NAME}...")

# Initialize FastAPI App with customized Swagger Metadata
app = FastAPI(
    title=settings.APP_NAME,
    description="REST APIs for the AI Research Assistant. Handled secure local PDF indexing, lists, and downloads.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# 1. CORS Rules configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Add request logging middleware
app.add_middleware(RequestLoggerMiddleware)

# 3. Register global error handlers
register_error_handlers(app)

# 4. Include Versioned API Routers
app.include_router(health.router, prefix="/api/v1", tags=["Health"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(upload.router, prefix="/api/v1", tags=["Upload"])
app.include_router(files.router, prefix="/api/v1", tags=["Files Catalog"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])
app.include_router(settings_router.router, prefix="/api/v1/settings", tags=["Settings"])
app.include_router(document.router, prefix="/api/v1", tags=["Document Intelligence"])

# 5. Root Entry point
@app.get("/", response_model=RootResponse, tags=["Root"], summary="Api Root Overview")
async def root():
    """Returns basic overview metadata about the AI Research Assistant API."""
    return RootResponse(
        application=settings.APP_NAME,
        status="running",
        version="1.0"
    )
