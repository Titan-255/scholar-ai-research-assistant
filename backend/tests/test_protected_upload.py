import io

def test_upload_route_unauthorized(client):
    """Tests that uploading files without a JWT token returns a 401 error."""
    pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\n%%EOF"
    files = {"file": ("unauth.pdf", io.BytesIO(pdf_content), "application/pdf")}
    response = client.post("/api/v1/upload", files=files)
    assert response.status_code == 401

def test_files_catalog_unauthorized(client):
    """Tests that listing or deleting documents without a JWT token returns 401."""
    response = client.get("/api/v1/files")
    assert response.status_code == 401
    
    response = client.delete("/api/v1/files/some-id")
    assert response.status_code == 401

def test_secure_upload_and_lifecycle(client):
    """Tests upload, list, download, and delete flow using valid JWT credentials."""
    # 1. Register & get token
    reg_payload = {
        "full_name": "Auth Uploader",
        "email": "uploader@example.com",
        "password": "Password123!",
        "confirm_password": "Password123!"
    }
    res = client.post("/api/v1/auth/register", json=reg_payload)
    token = res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Upload file securely
    pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\n%%EOF"
    files = {"file": ("secure_doc.pdf", io.BytesIO(pdf_content), "application/pdf")}
    upload_res = client.post("/api/v1/upload", files=files, headers=headers)
    assert upload_res.status_code == 200
    assert upload_res.json()["success"] is True
    
    # 3. List catalog (should return 1 file)
    list_res = client.get("/api/v1/files", headers=headers)
    assert list_res.status_code == 200
    data = list_res.json()["data"]
    assert len(data) == 1
    file_id = data[0]["id"]
    assert data[0]["original_name"] == "secure_doc.pdf"
    
    # 4. Download file
    download_res = client.get(f"/api/v1/files/download/{file_id}", headers=headers)
    assert download_res.status_code == 200
    assert download_res.content == pdf_content
    
    # 5. Delete file
    delete_res = client.delete(f"/api/v1/files/{file_id}", headers=headers)
    assert delete_res.status_code == 200
    
    # 6. List catalog again (should be empty)
    final_list_res = client.get("/api/v1/files", headers=headers)
    assert len(final_list_res.json()["data"]) == 0

def test_user_file_isolation(client):
    """Tests that User B cannot see or delete User A's uploaded document assets."""
    # 1. Register User A and upload a file
    res_a = client.post("/api/v1/auth/register", json={
        "full_name": "User A",
        "email": "usera@example.com",
        "password": "Password123!",
        "confirm_password": "Password123!"
    })
    token_a = res_a.json()["data"]["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}
    
    pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\n%%EOF"
    files = {"file": ("usera_doc.pdf", io.BytesIO(pdf_content), "application/pdf")}
    upload_res = client.post("/api/v1/upload", files=files, headers=headers_a)
    file_id = upload_res.json()["data"]["stored_name"].split(".")[0]  # Extract UUID from stored_name
    
    # 2. Register User B and list catalog (should be empty)
    res_b = client.post("/api/v1/auth/register", json={
        "full_name": "User B",
        "email": "userb@example.com",
        "password": "Password123!",
        "confirm_password": "Password123!"
    })
    token_b = res_b.json()["data"]["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}
    
    list_b = client.get("/api/v1/files", headers=headers_b)
    assert len(list_b.json()["data"]) == 0
    
    # 3. User B tries to download User A's file (should return 404)
    download_res = client.get(f"/api/v1/files/download/{file_id}", headers=headers_b)
    assert download_res.status_code == 404
    
    # 4. User B tries to delete User A's file (should return 404)
    delete_res = client.delete(f"/api/v1/files/{file_id}", headers=headers_b)
    assert delete_res.status_code == 404
