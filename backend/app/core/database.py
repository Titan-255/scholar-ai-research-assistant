import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

logger = logging.getLogger("app.core.database")

# Detect SQLite to use proper arguments
is_sqlite = settings.DATABASE_URL.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}

try:
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args=connect_args,
        echo=False
    )
    SessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine
    )
    logger.info("SQLAlchemy engine successfully initialized.")
except Exception as e:
    logger.error(f"Error creating database engine: {e}")
    raise e

Base = declarative_base()

def get_db():
    """Dependency injection yield generator for database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
