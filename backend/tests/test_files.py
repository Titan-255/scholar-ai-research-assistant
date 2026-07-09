import io

def _get_auth_headers(client, email="files_test@example.com"):
    payload = {
        "full_name": "Test User",
        "email": email,
        "password": "Password123!",
        "confirm_password": "Password123!"
    }
    res = client.post("/api/v1/auth/register", json=payload)
    token = res.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_files_lifecycle(client):
    """Tests document list, details, download, and delete flow securely."""
    headers = _get_auth_headers(client)

    # 1. Initially catalog list should be empty
    response = client.get("/api/v1/files", headers=headers)
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert len(response.json()["data"]) == 0

    # 2. Upload a file
    pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\n%%EOF"
    files = {"file": ("lifecycle_test.pdf", io.BytesIO(pdf_content), "application/pdf")}
    upload_res = client.post("/api/v1/upload", files=files, headers=headers)
    assert upload_res.status_code == 200
    
    # 3. List files again to get file ID
    list_res = client.get("/api/v1/files", headers=headers)
    assert list_res.status_code == 200
    data = list_res.json()["data"]
    assert len(data) == 1
    file_id = data[0]["id"]
    assert data[0]["original_name"] == "lifecycle_test.pdf"

    # 4. Fetch details of uploaded file
    detail_res = client.get(f"/api/v1/files/{file_id}", headers=headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["data"]["original_name"] == "lifecycle_test.pdf"

    # 5. Fetch details of invalid ID (should return 404)
    invalid_detail_res = client.get("/api/v1/files/invalid-id-123", headers=headers)
    assert invalid_detail_res.status_code == 404
    assert invalid_detail_res.json()["success"] is False

    # 6. Download file
    download_res = client.get(f"/api/v1/files/download/{file_id}", headers=headers)
    assert download_res.status_code == 200
    assert download_res.content == pdf_content
    assert download_res.headers["content-type"] == "application/pdf"
    assert "attachment" in download_res.headers["content-disposition"]
    assert "lifecycle_test.pdf" in download_res.headers["content-disposition"]

    # 7. Delete file
    delete_res = client.delete(f"/api/v1/files/{file_id}", headers=headers)
    assert delete_res.status_code == 200
    assert delete_res.json()["success"] is True

    # 8. List files should be empty again
    final_list_res = client.get("/api/v1/files", headers=headers)
    assert len(final_list_res.json()["data"]) == 0

    # 9. Downloading deleted file should return 404
    final_download_res = client.get(f"/api/v1/files/download/{file_id}", headers=headers)
    assert final_download_res.status_code == 404
