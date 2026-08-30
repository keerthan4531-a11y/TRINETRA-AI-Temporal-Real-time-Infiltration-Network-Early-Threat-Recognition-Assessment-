"""
API Integration Tests for FastAPI Service.
Verifies REST health check, file analysis pipeline, and WebSocket endpoints.
"""

import io
import pytest
from fastapi.testclient import TestClient
from serving.api import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["input_dim"] == 22
    assert data["sequence_length"] == 10
    assert data["rollout_k_steps"] == 5
    assert data["alert_threshold"] == 0.75
    assert data["persistence_windows"] == 2


def test_history_endpoint():
    response = client.get("/api/history?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert "count" in data
    assert "history" in data
    assert isinstance(data["history"], list)


def test_websocket_endpoint():
    with client.websocket_connect("/ws/live") as websocket:
        websocket.send_text("ping")
        # Connection established and message processed without error


def test_analyze_unsupported_extension():
    fake_file = io.BytesIO(b"fake image data")
    response = client.post(
        "/api/analyze",
        files={"file": ("test.png", fake_file, "image/png")}
    )
    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]


def test_analyze_real_flow_csv():
    # Construct a valid NetFlow test CSV with 15 rows (> 10 sequence length)
    csv_header = "StartTime,Dur,Proto,SrcAddr,Sport,Dir,DstAddr,Dport,State,sTos,dTos,TotPkts,TotBytes,Label\n"
    csv_rows = []
    for i in range(15):
        csv_rows.append(f"2011/08/10 10:00:{i:02d}.000,1.0,tcp,147.32.84.165,4444,->,147.32.80.9,80,CON,0,0,10,5000,flow=Background\n")
    
    csv_content = (csv_header + "".join(csv_rows)).encode("utf-8")
    flow_file = io.BytesIO(csv_content)

    response = client.post(
        "/api/analyze",
        files={"file": ("test_flow.csv", flow_file, "text/csv")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "test_flow.csv"
    assert "total_windows_processed" in data
    assert "max_infiltration_probability" in data
    assert "timeline" in data
    assert len(data["timeline"]) > 0
    
    first_pred = data["timeline"][0]
    assert "current_infil_probability" in first_pred
    assert "predicted_mitre_stage" in first_pred
    assert "future_trajectory" in first_pred
    assert len(first_pred["future_trajectory"]) == 5
    assert "top_driving_features" in first_pred
    assert len(first_pred["top_driving_features"]) == 5
