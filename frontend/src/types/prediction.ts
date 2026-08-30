/**
 * TypeScript Interfaces strictly mirroring backend Pydantic schemas in serving/schemas.py.
 * Must be kept synchronized with backend contract.
 */

export interface FeatureAttribution {
  feature: string;
  importance: number;
  raw_value: number;
}

export interface PredictionResponse {
  timestamp: number;
  current_infil_probability: number;
  predicted_mitre_stage: string;
  tactic_id: string;
  stage_severity: 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  stage_description: string;
  stage_color: string;
  future_trajectory: number[];
  top_driving_features: FeatureAttribution[];
  window_features: Record<string, number>;
}

export interface FlaggedFlow {
  src_ip: string;
  dst_ip: string;
  src_port: number;
  dst_port: number;
  protocol: string;
  bytes_transferred: number;
  packets_transferred: number;
  flags: string;
  severity: string;
  timestamp: number;
}

export interface AnalyzeFileResponse {
  filename: string;
  total_windows_processed: number;
  max_infiltration_probability: number;
  detected_stages: string[];
  timeline: PredictionResponse[];
  flagged_flows: FlaggedFlow[];
}

export interface SystemHealth {
  status: string;
  device: string;
  input_dim: number;
  sequence_length: number;
  rollout_k_steps: number;
}
