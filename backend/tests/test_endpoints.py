import io
from fastapi.testclient import TestClient

from app.main import app
from app.core.security import create_access_token

client = TestClient(app)
test_token = create_access_token(data={"sub": "1", "email": "test@example.com", "role": "admin"})
auth_headers = {"Authorization": f"Bearer {test_token}"}


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


def test_organization_profile_endpoints() -> None:
    """Test retrieving and updating enterprise organization credentials vault."""
    # Test GET
    get_res = client.get("/api/v1/settings/organization", headers=auth_headers)
    assert get_res.status_code == 200
    data = get_res.json()
    assert "name" in data
    assert "certifications" in data

    # Test PUT/POST update
    payload = {
        "name": "Apex Enterprise Global Corp",
        "industry": "Aerospace & Mission Critical AI",
        "website": "https://apex-global.ai",
        "annual_revenue": "$85M",
        "employee_count": 280,
        "certifications": ["ISO 27001", "SOC 2 Type II", "FedRAMP High"],
        "clearances": ["DoD Secret", "Top Secret / SCI"],
        "core_skills": ["Cloud Migration", "Kubernetes", "DevSecOps", "Autonomous AI Agents"],
        "past_performance": ["$12M DHS Cloud Migration", "$8M DoD Edge AI Platform"]
    }
    update_res = client.put("/api/v1/settings/organization", json=payload, headers=auth_headers)
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["name"] == "Apex Enterprise Global Corp"
    assert "FedRAMP High" in updated_data["certifications"]
    assert updated_data["annual_revenue"] == "$85M"


def test_simulation_service_calculation() -> None:
    """Test What-If simulation service delta computation and lever sensitivity."""
    from unittest.mock import MagicMock
    from app.services.ai.simulation_service import SimulationService, SimulationRequest

    service = SimulationService()
    mock_rfp = MagicMock()
    mock_rfp.id = 999
    mock_rfp.title = "Defense Cloud RFP"

    mock_analysis = MagicMock()
    mock_analysis.overall_risk_score = "Medium"
    mock_analysis.confidence_score = 0.70
    mock_analysis.raw_response = {
        "telemetry": {
            "bid_recommendation": "Review Required",
            "readiness_score": 60,
            "win_probability_percent": 55,
            "critical_gaps": ["Missing FedRAMP High Certification", "Stringent Liquidated Damages SLA"]
        }
    }

    # Scenario: -5% price discount + Partner FedRAMP High + SLA penalty cap
    req = SimulationRequest(
        pricing_adjustment_pct=-5.0,
        cap_sla_penalties=True,
        partner_certifications=["FedRAMP High"],
        cure_period_days=30
    )

    result = service.run_simulation(
        rfp=mock_rfp,
        analysis=mock_analysis,
        simulation=req,
        org_info={"name": "Test Org"}
    )

    assert result["rfp_id"] == 999
    assert result["baseline"]["readiness_score"] == 60
    # Readiness should increase by 10 (partner) + 12 (SLA cap) + 3 (cure period) = +25 -> 85
    assert result["simulated"]["readiness_score"] >= 80
    # Win probability should increase with -5% discount and teaming
    assert result["simulated"]["win_probability_percent"] > result["baseline"]["win_probability_percent"]
    assert len(result["deltas"]["resolved_gaps"]) >= 2
    assert "strategic_narrative" in result


def test_simulate_endpoint_not_found() -> None:
    """Test that simulating an unanalyzed or non-existent RFP returns 404."""
    response = client.post(
        "/api/v1/rfps/999999/simulate",
        json={
            "pricing_adjustment_pct": -5.0,
            "cap_sla_penalties": True,
            "partner_certifications": ["FedRAMP High"]
        },
        headers=auth_headers
    )
    assert response.status_code == 404

