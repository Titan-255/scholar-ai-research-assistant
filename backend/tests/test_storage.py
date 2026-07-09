import io
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.core.config import settings
from app.services.storage.service import StorageService
from app.services.storage.provider import S3StorageProvider, LocalStorageProvider

@pytest.fixture
def mock_s3():
    with patch("boto3.client") as mock_client:
        client_instance = MagicMock()
        mock_client.return_value = client_instance
        
        # Mock put_object response
        client_instance.put_object.return_value = {
            "ETag": '"mocketag123"',
            "ResponseMetadata": {"HTTPStatusCode": 200}
        }
        
        # Mock generate_presigned_url response
        client_instance.generate_presigned_url.return_value = "https://mock-s3-presigned-url.com/users/test/pdfs/mock.pdf"
        
        yield client_instance

def test_local_storage_provider(clean_db_session):
    # Test local storage provider upload/download/delete
    provider = LocalStorageProvider()
    user_uuid = "test-user-local"
    file_uuid = "test-file-local"
    file_data = b"%PDF-1.4 mock pdf data"
    
    # Upload
    info = provider.upload_file(user_uuid, file_uuid, file_data, "doc.pdf", "application/pdf")
    assert info["storage_provider"] == "local"
    assert info["storage_size"] == len(file_data)
    assert info["s3_object_key"] is None
    
    # Exists
    assert provider.file_exists(None, file_path=info["file_path"])
    
    # Download
    url = provider.download_url(file_uuid, file_path=info["file_path"])
    assert "direct=true" in url
    
    # Delete
    assert provider.delete_file(None, file_path=info["file_path"])
    assert not provider.file_exists(None, file_path=info["file_path"])

def test_s3_storage_provider(mock_s3):
    # Set settings to pretend S3 is configured
    with patch.object(settings, "AWS_ACCESS_KEY_ID", "mock_key"), \
         patch.object(settings, "AWS_SECRET_ACCESS_KEY", "mock_secret"), \
         patch.object(settings, "AWS_S3_BUCKET", "mock-bucket"):
         
        assert settings.active_storage_provider == "s3"
        
        provider = S3StorageProvider()
        user_uuid = "test-user-s3"
        file_uuid = "test-file-s3"
        file_data = b"%PDF-1.4 mock pdf data"
        
        # Upload
        info = provider.upload_file(user_uuid, file_uuid, file_data, "doc.pdf", "application/pdf")
        assert info["storage_provider"] == "s3"
        assert info["s3_object_key"] == f"users/{user_uuid}/pdfs/{file_uuid}.pdf"
        assert info["bucket_name"] == "mock-bucket"
        assert info["etag"] == "mocketag123"
        
        mock_s3.put_object.assert_called_once()
        
        # Download
        url = provider.download_url(info["s3_object_key"])
        assert url == "https://mock-s3-presigned-url.com/users/test/pdfs/mock.pdf"
        mock_s3.generate_presigned_url.assert_called_once()
        
        # Delete
        provider.delete_file(info["s3_object_key"])
        mock_s3.delete_object.assert_called_once_with(Bucket="mock-bucket", Key=info["s3_object_key"])

def test_api_upload_and_download_flow_s3(client, mock_s3):
    # Test upload & download using S3
    with patch.object(settings, "AWS_ACCESS_KEY_ID", "mock_key"), \
         patch.object(settings, "AWS_SECRET_ACCESS_KEY", "mock_secret"), \
         patch.object(settings, "AWS_S3_BUCKET", "mock-bucket"):
         
        # Register and login first
        reg_payload = {
            "full_name": "S3 Tester",
            "email": "s3test@example.com",
            "password": "Password123!",
            "confirm_password": "Password123!"
        }
        client.post("/api/v1/auth/register", json=reg_payload)
        
        login_res = client.post("/api/v1/auth/login", json={
            "email": "s3test@example.com",
            "password": "Password123!"
        })
        token = login_res.json()["data"]["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Upload PDF file
        pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\n%%EOF"
        files = {"file": ("cloud.pdf", io.BytesIO(pdf_content), "application/pdf")}
        upload_res = client.post("/api/v1/upload", files=files, headers=headers)
        assert upload_res.status_code == 200
        
        data = upload_res.json()["data"]
        assert data["storage_provider"] == "s3"
        stored_name = data["stored_name"]
        file_uuid = stored_name.split(".pdf")[0]
        
        # Get list of files
        list_res = client.get("/api/v1/files", headers=headers)
        assert list_res.status_code == 200
        files_list = list_res.json()["data"]
        assert len(files_list) == 1
        assert files_list[0]["storage_provider"] == "s3"
        
        # Get file metadata details
        meta_res = client.get(f"/api/v1/files/{file_uuid}", headers=headers)
        assert meta_res.status_code == 200
        assert meta_res.json()["data"]["storage_provider"] == "s3"
        
        # Download (JSON response)
        dl_res = client.get(f"/api/v1/files/download/{file_uuid}", headers=headers)
        assert dl_res.status_code == 200
        assert "mock-s3-presigned-url.com" in dl_res.json()["data"]["url"]
        
        # Download direct (RedirectResponse)
        dl_direct_res = client.get(f"/api/v1/files/download/{file_uuid}?direct=true", headers=headers, follow_redirects=False)
        assert dl_direct_res.status_code == 307
        assert dl_direct_res.headers["location"] == "https://mock-s3-presigned-url.com/users/test/pdfs/mock.pdf"
        
        # Delete
        del_res = client.delete(f"/api/v1/files/{file_uuid}", headers=headers)
        assert del_res.status_code == 200
