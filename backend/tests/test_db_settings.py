import pytest

def test_settings_lifecycle_with_db(client):
    """Tests default settings generation, retrieval, updates, and persistence in SQL DB."""
    # 1. Register & login
    reg_payload = {
        "full_name": "Settings User",
        "email": "settings@example.com",
        "password": "Password123!",
        "confirm_password": "Password123!"
    }
    res = client.post("/api/v1/auth/register", json=reg_payload)
    token = res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get settings (should initialize defaults)
    get_res = client.get("/api/v1/settings", headers=headers)
    assert get_res.status_code == 200
    settings_data = get_res.json()["data"]
    assert settings_data["theme"] == "light"
    assert settings_data["language"] == "English"
    assert settings_data["notification_enabled"] is True

    # 3. Update settings
    update_payload = {
        "theme": "dark",
        "language": "Spanish",
        "notification_enabled": False
    }
    put_res = client.put("/api/v1/settings", json=update_payload, headers=headers)
    assert put_res.status_code == 200
    updated_data = put_res.json()["data"]
    assert updated_data["theme"] == "dark"
    assert updated_data["language"] == "Spanish"
    assert updated_data["notification_enabled"] is False

    # 4. Get settings again to verify they are permanently stored in DB
    verify_res = client.get("/api/v1/settings", headers=headers)
    assert verify_res.status_code == 200
    final_data = verify_res.json()["data"]
    assert final_data["theme"] == "dark"
    assert final_data["language"] == "Spanish"
    assert final_data["notification_enabled"] is False
