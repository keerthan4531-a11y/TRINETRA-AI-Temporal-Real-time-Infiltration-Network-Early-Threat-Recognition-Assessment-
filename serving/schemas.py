"""
Pydantic Schemas for Network Attack Forecasting API.
NOTE: These schemas form the strict contract with frontend/src/types/prediction.ts.
Keep both synchronized.
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional


class FeatureAttribution(BaseModel):
    feature: str = Field(..., description="Name of the driving network telemetry feature")
    importance: float = Field(..., description="Normalized attribution score [0, 1]")
    raw_value: float = Field(..., description="Observed value of the feature in current window")


class PredictionResponse(BaseModel):
    timestamp: float = Field(..., description="Window epoch timestamp")
    current_infil_probability: float = Field(..., description="Current infiltration risk probability [0, 1]")
    predicted_mitre_stage: str = Field(..., description="Mapped MITRE ATT&CK Tactic Name")
    tactic_id: str = Field(..., description="MITRE Tactic ID (e.g. TA0043)")
    stage_severity: str = Field(..., description="Severity level: NORMAL, LOW, MEDIUM, HIGH, CRITICAL")
    stage_description: str = Field(..., description="Operational definition of tactic")
    stage_color: str = Field(..., description="Hex color code for UI rendering")
    future_trajectory: List[float] = Field(..., description="K-step forward infiltration probability forecast")
    top_driving_features: List[FeatureAttribution] = Field(..., description="Top contributing features explaining prediction")
    window_features: Dict[str, float] = Field(..., description="Raw features of the window")


class FlaggedFlow(BaseModel):
    src_ip: str
    dst_ip: str
    src_port: int
    dst_port: int
    protocol: str
    bytes_transferred: int
    packets_transferred: int
    flags: str
    severity: str
    timestamp: float


class AnalyzeFileResponse(BaseModel):
    filename: str
    total_windows_processed: int
    max_infiltration_probability: float
    detected_stages: List[str]
    timeline: List[PredictionResponse]
    flagged_flows: List[FlaggedFlow]
