import io
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_check() -> None:
    """Test standard health check router."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "bidwise-analysis"


def test_health_check_v1() -> None:
    """Test API v1 health check router."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "bidwise-analysis"


def test_analyze_unsupported_file() -> None:
    """Test that uploading an unsupported format returns HTTP 400."""
    file_content = b"dummy file content"
    files = {"file": ("test.txt", file_content, "text/plain")}
    
    # Root endpoint
    response = client.post("/analyze", files=files)
    assert response.status_code == 400
    assert "not supported" in response.json()["detail"]
    
    # API v1 endpoint
    response = client.post("/api/v1/analyze", files=files)
    assert response.status_code == 400
    assert "not supported" in response.json()["detail"]


def test_analyze_empty_file() -> None:
    """Test that uploading an empty file returns HTTP 400."""
    files = {"file": ("test.pdf", b"", "application/pdf")}
    
    # Root endpoint
    response = client.post("/analyze", files=files)
    assert response.status_code == 400
    assert "empty" in response.json()["detail"]

    # API v1 endpoint
    response = client.post("/api/v1/analyze", files=files)
    assert response.status_code == 400
    assert "empty" in response.json()["detail"]
