def test_registration_success(client):
    """Tests that registering a valid user account succeeds."""
    payload = {
        "full_name": "Test User",
        "email": "test@example.com",
        "password": "Password123!",
        "confirm_password": "Password123!"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    json_data = response.json()
    assert json_data["success"] is True
    assert "access_token" in json_data["data"]
    assert "refresh_token" in json_data["data"]
    assert json_data["data"]["user"]["email"] == "test@example.com"
    assert json_data["data"]["user"]["full_name"] == "Test User"

def test_registration_duplicate_email_fails(client):
    """Tests that registering with an already existing email address fails with 409."""
    payload = {
        "full_name": "User One",
        "email": "duplicate@example.com",
        "password": "Password123!",
        "confirm_password": "Password123!"
    }
    # First registration
    client.post("/api/v1/auth/register", json=payload)
    
    # Second registration with same email
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 409
    assert response.json()["success"] is False
    assert "already exists" in response.json()["message"]

def test_registration_weak_password_fails(client):
    """Tests that registering with a weak password fails validation with 422."""
    payload = {
        "full_name": "Test User",
        "email": "weak@example.com",
        "password": "weak",
        "confirm_password": "weak"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422
    assert response.json()["success"] is False

def test_login_success(client):
    """Tests that logging in with valid credentials succeeds."""
    # Register first
    reg_payload = {
        "full_name": "Login User",
        "email": "login@example.com",
        "password": "Password123!",
        "confirm_password": "Password123!"
    }
    client.post("/api/v1/auth/register", json=reg_payload)
    
    # Login
    login_payload = {
        "email": "login@example.com",
        "password": "Password123!"
    }
    response = client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert "access_token" in json_data["data"]

def test_login_invalid_credentials_fails(client):
    """Tests that logging in with incorrect credentials fails with 401."""
    login_payload = {
        "email": "unknown@example.com",
        "password": "Password123!"
    }
    response = client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 401
    assert response.json()["success"] is False

def test_token_refresh(client):
    """Tests that a refresh token can be used to generate a new access token."""
    # Register
    reg_payload = {
        "full_name": "Refresh User",
        "email": "refresh@example.com",
        "password": "Password123!",
        "confirm_password": "Password123!"
    }
    res = client.post("/api/v1/auth/register", json=reg_payload)
    refresh_token = res.json()["data"]["refresh_token"]
    
    # Refresh
    refresh_payload = {"refresh_token": refresh_token}
    response = client.post("/api/v1/auth/refresh", json=refresh_payload)
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert "access_token" in json_data["data"]
