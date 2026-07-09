import os
import shutil
import tempfile
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.core.database import Base, get_db
from app.main import app

# 1. Setup Test Database (in-memory SQLite)
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False}
)
TestSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine
)

@pytest.fixture(scope="session", autouse=True)
def init_test_db():
    """Autocreates database tables before the test run starts and drops them at the end."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture(autouse=True)
def clean_db_session():
    """Provides a transaction-isolated database session for each test, rolling back changes at the end."""
    connection = test_engine.connect()
    transaction = connection.begin()
    db = TestSessionLocal(bind=connection)
    
    # Override app get_db dependency
    def _override_get_db():
        try:
            yield db
        finally:
            pass
            
    app.dependency_overrides[get_db] = _override_get_db
    
    yield db
    
    db.close()
    transaction.rollback()
    connection.close()
    app.dependency_overrides.pop(get_db, None)

@pytest.fixture(scope="session", autouse=True)
def test_settings_override():
    """Overrides settings for the test session, creating a temporary upload directory."""
    temp_dir = tempfile.mkdtemp()
    original_upload_dir = settings.UPLOAD_DIR
    settings.UPLOAD_DIR = temp_dir
    
    # Force re-evaluation of settings paths
    settings.upload_path.mkdir(parents=True, exist_ok=True)
    
    yield
    
    # Cleanup temp directory after test run
    try:
        shutil.rmtree(temp_dir)
    except Exception:
        pass
    
    # Restore original setting
    settings.UPLOAD_DIR = original_upload_dir

@pytest.fixture
def client():
    """Provides a TestClient connected to the FastAPI application instance."""
    with TestClient(app) as test_client:
        yield test_client
