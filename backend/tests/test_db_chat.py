import io
import pytest

def test_chat_lifecycle_with_db(client):
    """Tests full end-to-end chat session and messaging operations connected to SQL DB."""
    # 1. Register & login to obtain JWT token
    reg_payload = {
        "full_name": "Chat User",
        "email": "chatter@example.com",
        "password": "Password123!",
        "confirm_password": "Password123!"
    }
    res = client.post("/api/v1/auth/register", json=reg_payload)
    token = res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Upload a dummy PDF file (required to bind a chat session)
    pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\n%%EOF"
    files = {"file": ("literature.pdf", io.BytesIO(pdf_content), "application/pdf")}
    upload_res = client.post("/api/v1/upload", files=files, headers=headers)
    assert upload_res.status_code == 200
    pdf_id = upload_res.json()["data"]["stored_name"].split(".pdf")[0]  # get UUID string

    # 3. Create chat session bound to the PDF
    session_payload = {"pdf_id": pdf_id, "title": "My literature chat"}
    session_res = client.post("/api/v1/chat/session", json=session_payload, headers=headers)
    assert session_res.status_code == 201
    session_data = session_res.json()["data"]
    session_uuid = session_data["uuid"]
    assert session_data["title"] == "My literature chat"

    # 4. List active sessions (should contain 1 entry)
    list_res = client.get("/api/v1/chat/sessions", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()["data"]) == 1
    assert list_res.json()["data"][0]["uuid"] == session_uuid

    # 5. Load conversation details (should return AI greeting message)
    detail_res = client.get(f"/api/v1/chat/session/{session_uuid}", headers=headers)
    assert detail_res.status_code == 200
    messages = detail_res.json()["data"]["messages"]
    assert len(messages) == 1
    assert messages[0]["sender"] == "ai"
    assert "literature.pdf" in messages[0]["message"]

    # 6. Send message to the session and verify mock AI response
    msg_payload = {
        "session_id": session_uuid,
        "message": "please summarize this document",
        "referenced_pdf": "literature.pdf"
    }
    msg_res = client.post("/api/v1/chat/message", json=msg_payload, headers=headers)
    assert msg_res.status_code == 200
    exchanged_messages = msg_res.json()["data"]
    assert len(exchanged_messages) == 2  # returns user message and AI response
    assert exchanged_messages[0]["sender"] == "user"
    assert exchanged_messages[0]["message"] == "please summarize this document"
    assert exchanged_messages[1]["sender"] == "ai"
    assert "Core Objectives" in exchanged_messages[1]["message"]  # matches summary mock

    # 7. Delete the chat session
    del_res = client.delete(f"/api/v1/chat/session/{session_uuid}", headers=headers)
    assert del_res.status_code == 200

    # 8. List sessions again (should be empty)
    final_list_res = client.get("/api/v1/chat/sessions", headers=headers)
    assert len(final_list_res.json()["data"]) == 0
