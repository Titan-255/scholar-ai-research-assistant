def test_get_profile_unauthorized(client):
    """Tests that fetching profile details without authorization fails with 401."""
    response = client.get("/api/v1/users/me")
    assert response.status_code == 401

def test_get_profile_success(client):
    """Tests that fetching profile details with a valid bearer token succeeds."""
    # 1. Register & get access token
    reg_payload = {
        "full_name": "Profile User",
        "email": "profile@example.com",
        "password": "Password123!",
        "confirm_password": "Password123!"
    }
    res = client.post("/api/v1/auth/register", json=reg_payload)
    token = res.json()["data"]["access_token"]
    
    # 2. Get profile
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/users/me", headers=headers)
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert json_data["data"]["email"] == "profile@example.com"
    assert json_data["data"]["full_name"] == "Profile User"

def test_update_profile_success(client):
    """Tests that updating profile metadata succeeds."""
    # 1. Register & get access token
    reg_payload = {
        "full_name": "Update User",
        "email": "update@example.com",
        "password": "Password123!",
        "confirm_password": "Password123!"
    }
    res = client.post("/api/v1/auth/register", json=reg_payload)
    token = res.json()["data"]["access_token"]
    
    # 2. Update profile
    headers = {"Authorization": f"Bearer {token}"}
    update_payload = {
        "full_name": "New Full Name",
        "profile_picture": "http://example.com/avatar.png"
    }
    response = client.put("/api/v1/users/me", json=update_payload, headers=headers)
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert json_data["data"]["full_name"] == "New Full Name"
    assert json_data["data"]["profile_picture"] == "http://example.com/avatar.png"

def test_change_password_success(client):
    """Tests that changing active user password credentials succeeds."""
    # 1. Register & get access token
    reg_payload = {
        "full_name": "Change Pass User",
        "email": "changepass@example.com",
        "password": "Password123!",
        "confirm_password": "Password123!"
    }
    res = client.post("/api/v1/auth/register", json=reg_payload)
    token = res.json()["data"]["access_token"]
    
    # 2. Change password
    headers = {"Authorization": f"Bearer {token}"}
    change_payload = {
        "old_password": "Password123!",
        "new_password": "NewPassword123!"
    }
    response = client.put("/api/v1/users/change-password", json=change_payload, headers=headers)
    assert response.status_code == 200
    assert response.json()["success"] is True
    
    # 3. Verify logging in with new password succeeds
    login_payload = {
        "email": "changepass@example.com",
        "password": "NewPassword123!"
    }
    login_res = client.post("/api/v1/auth/login", json=login_payload)
    assert login_res.status_code == 200
    assert login_res.json()["success"] is True
