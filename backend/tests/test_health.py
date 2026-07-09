def test_root_endpoint(client):
    """Tests the root overview endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["application"] == "AI Research Assistant Backend"
    assert json_data["status"] == "running"
    assert json_data["version"] == "1.0"

def test_health_check_endpoint(client):
    """Tests the service health liveness check."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert json_data["message"] == "Service is healthy."
    assert json_data["data"]["status"] == "healthy"
