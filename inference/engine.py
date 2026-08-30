"""
Unified Inference Engine.
The SINGLE source of truth for both the CLI and the Web API/Dashboard.
Ingests real network window -> performs forward rollout -> maps ATT&CK stage -> computes SHAP/attributions.
NO MOCK DATA ALLOWED.
"""

import yaml
import torch
import numpy as np
from pathlib import Path
from typing import Dict, Any, List, Optional

from model.world_model import NetworkWorldModel
from model.rollout import ForwardRolloutEngine
from model.attack_stage_mapping import get_stage_metadata
from explainability.shap_explain import ModelExplainer
from features.normalize import FeatureNormalizer


class InferenceEngine:
    """Core shared inference engine powering both CLI and Web SOC Dashboard."""

    def __init__(self, config_path: str = "config/settings.yaml"):
        self.config_path = Path(config_path)
        if not self.config_path.exists():
            raise FileNotFoundError(f"[!] Configuration file not found at {config_path}")

        with open(self.config_path, "r") as f:
            self.cfg = yaml.safe_load(f)

        self.device = self.cfg["environment"]["device"]
        if self.device == "cuda" and not torch.cuda.is_available():
            self.device = "cpu"

        # Feature schema names
        self.feature_names = (
            self.cfg["features"]["flow_features"] +
            self.cfg["features"]["packet_features"]
        )
        self.input_dim = len(self.feature_names)
        self.seq_len = self.cfg["model"]["sequence_length"]
        self.k_steps = self.cfg["model"]["rollout_steps_k"]

        # Initialize model architecture
        self.model = NetworkWorldModel(
            input_dim=self.input_dim,
            hidden_dim=self.cfg["model"]["hidden_dim"],
            num_layers=self.cfg["model"]["num_layers"],
            num_stages=5,
            dropout=self.cfg["model"]["dropout"]
        )

        # Load weights if available
        weights_path = Path(self.cfg["model"]["saved_weights_path"])
        if weights_path.exists():
            self.model.load_state_dict(torch.load(weights_path, map_location=self.device))
            print(f"[+] Loaded trained World Model weights from {weights_path}")
        else:
            print(f"[*] Warning: Trained weights not found at {weights_path}. Model uninitialized (run training first).")

        self.model.to(self.device)
        self.model.eval()

        # Scaler
        self.normalizer = FeatureNormalizer(self.cfg["model"]["scaler_path"])

        # Rollout engine
        self.rollout_engine = ForwardRolloutEngine(self.model, k_steps=self.k_steps, device=self.device)

        # Explainer
        self.explainer = ModelExplainer(self.model, feature_names=self.feature_names)

        # Sliding window buffer: maintains last `seq_len` state vectors
        self.state_buffer = []

    def reset_buffer(self):
        """Clears sequence buffer for a fresh session."""
        self.state_buffer = []

    def push_state_vector(self, state_vec: np.ndarray) -> bool:
        """Appends a new 1-second state vector to the sliding window buffer."""
        if state_vec is None or len(state_vec) != self.input_dim:
            raise ValueError(f"[!] Invalid state vector dimension: expected {self.input_dim}, got {len(state_vec) if state_vec is not None else 0}")

        self.state_buffer.append(state_vec)
        if len(self.state_buffer) > self.seq_len:
            self.state_buffer.pop(0)

        return len(self.state_buffer) >= self.seq_len

    def process_window(self, state_vec: np.ndarray, timestamp_epoch: float = 0.0) -> Optional[Dict[str, Any]]:
        """
        Ingests a real 1-second state vector, updates internal state, and generates
        a comprehensive real-time forecast.
        Returns None if buffer is still warming up (< seq_len).
        """
        ready = self.push_state_vector(state_vec)
        if not ready:
            return None # Waiting for full sequence window

        current_sequence = np.array(self.state_buffer) # (seq_len, D)

        # 1. Forward simulation rollout
        rollout_res = self.rollout_engine.rollout(current_sequence)
        future_probs = rollout_res["future_probabilities"]
        future_stages = rollout_res["future_stages"]

        # Current instantaneous forecast (t+1)
        current_infil_prob = float(future_probs[0])
        current_stage_idx = int(future_stages[0])
        stage_meta = get_stage_metadata(current_stage_idx)

        # 2. Real Feature Attribution (Explainability)
        top_features = self.explainer.explain_sequence(current_sequence, top_k=5)

        # 3. Assemble response contract
        return {
            "timestamp": timestamp_epoch,
            "current_infil_probability": round(current_infil_prob, 4),
            "predicted_mitre_stage": stage_meta["name"],
            "tactic_id": stage_meta["tactic_id"],
            "stage_severity": stage_meta["severity"],
            "stage_description": stage_meta["description"],
            "stage_color": stage_meta["color"],
            "future_trajectory": [round(p, 4) for p in future_probs],
            "top_driving_features": top_features,
            "window_features": {
                name: round(float(state_vec[i]), 4) for i, name in enumerate(self.feature_names)
            }
        }
