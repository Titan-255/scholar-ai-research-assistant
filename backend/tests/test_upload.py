import io
from app.core.config import settings

def _get_auth_headers(client, email="upload_test@example.com"):
    payload = {
        "full_name": "Test User",
        "email": email,
        "password": "Password123!",
        "confirm_password": "Password123!"
    }
    res = client.post("/api/v1/auth/register", json=payload)
    token = res.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_upload_non_pdf_fails(client):
    """Tests that uploading an invalid extension (TXT) returns a 400 error."""
    headers = _get_auth_headers(client, "txt@example.com")
    file_content = b"This is a dummy text file content."
    files = {"file": ("test_file.txt", io.BytesIO(file_content), "text/plain")}
    
    response = client.post("/api/v1/upload", files=files, headers=headers)
    assert response.status_code == 400
    json_data = response.json()
    assert json_data["success"] is False
    assert "Only PDF files are allowed" in json_data["message"]

def test_upload_pdf_success(client):
    """Tests that uploading a valid PDF document succeeds."""
    headers = _get_auth_headers(client, "pdf_ok@example.com")
    # Standard minimal PDF header
    pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\n%%EOF"
    files = {"file": ("test_doc.pdf", io.BytesIO(pdf_content), "application/pdf")}
    
    response = client.post("/api/v1/upload", files=files, headers=headers)
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert json_data["message"] == "File uploaded successfully."
    
    # Verify metadata fields returned
    data = json_data["data"]
    assert data["original_name"] == "test_doc.pdf"
    assert data["stored_name"].endswith(".pdf")
    assert data["size_bytes"] == len(pdf_content)
    assert data["status"] == "Ready"

def test_upload_exceeding_size_fails(client, monkeypatch):
    """Tests that files exceeding configuration bounds are rejected."""
    headers = _get_auth_headers(client, "size@example.com")
    # Force max size to 10 bytes temporarily for this test
    monkeypatch.setattr(settings, "MAX_FILE_SIZE", 10)
    
    pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\n%%EOF"
    files = {"file": ("large_doc.pdf", io.BytesIO(pdf_content), "application/pdf")}
    
    response = client.post("/api/v1/upload", files=files, headers=headers)
    assert response.status_code == 400
    json_data = response.json()
    assert json_data["success"] is False
    assert "File too large" in json_data["message"]
