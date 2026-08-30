"""
K-Step Forward Simulation (Rollout) Engine.
Given current sequence of real traffic states S_{t-W}...S_t:
Simulates K steps into the future: S_{t+1}, S_{t+2}, ..., S_{t+K}.
Outputs:
- Time-series infiltration probability trajectory
- Predicted attack stage at each future step
- Full stage probability distributions (including Stage 2 elevated risk detection)
- Simulated future state vectors
"""

import torch
import numpy as np
from typing import List, Dict, Any, Optional
from model.world_model import NetworkWorldModel
from model.attack_stage_mapping import MITRE_TACTIC_INFO


class ForwardRolloutEngine:
    """Simulates multi-step forward trajectories using the learned World Model."""

    def __init__(self, model: NetworkWorldModel, k_steps: int = 5, device: str = "cpu"):
        self.model = model
        self.k_steps = k_steps
        self.device = device
        self.model.to(self.device)
        self.model.eval()

    def rollout(self, current_sequence: np.ndarray, k_steps: Optional[int] = None) -> Dict[str, Any]:
        """
        Args:
            current_sequence: Array of shape (seq_len, input_dim) representing real window history.
            k_steps: Optional override for number of forward steps K.
        Returns:
            Dictionary containing:
            - future_probabilities: List of K infiltration probabilities [0.0 - 1.0]
            - future_stages: List of K predicted MITRE ATT&CK stage indices
            - future_stage_names: List of K human-readable MITRE stage names
            - future_stage_probs: List of K full 5-class probability distributions
            - initial_access_warnings: List of boolean flags if Stage 2 prob >= 0.15
            - trajectory_states: Simulated future state vectors (K, D)
        """
        if current_sequence is None or len(current_sequence) == 0:
            raise ValueError("[!] Cannot perform rollout on empty sequence. Real state required.")

        horizon = k_steps if k_steps is not None else self.k_steps

        # Convert to tensor: (1, seq_len, D)
        x_curr = torch.tensor(current_sequence, dtype=torch.float32, device=self.device).unsqueeze(0)

        future_probs = []
        future_stages = []
        future_stage_names = []
        future_stage_probs = []
        ia_warnings = []
        future_states = []

        with torch.no_grad():
            working_seq = x_curr.clone()

            for step in range(horizon):
                next_state_pred, prob_pred, stage_logits = self.model(working_seq)

                prob = float(prob_pred.squeeze().item())
                s_probs = torch.softmax(stage_logits, dim=-1).squeeze().cpu().numpy()
                
                # Hierarchical Decision Rule: prevent vote splitting across attack classes
                # If binary infiltration risk >= 0.50 OR cumulative attack probability > benign prob:
                total_attack_prob = float(np.sum(s_probs[1:]))
                if prob >= 0.50 or total_attack_prob > s_probs[0]:
                    stage = int(1 + np.argmax(s_probs[1:]))
                else:
                    stage = int(np.argmax(s_probs))

                stg_info = MITRE_TACTIC_INFO.get(stage, {"name": f"Stage {stage}"})
                state_vec = next_state_pred.squeeze().cpu().numpy()

                # Secondary warning signal: check if Stage 2 (Initial Access) is elevated (>= 0.15)
                ia_elevated = bool(s_probs[2] >= 0.15)

                future_probs.append(round(prob, 4))
                future_stages.append(stage)
                future_stage_names.append(stg_info["name"])
                future_stage_probs.append([round(float(p), 4) for p in s_probs])
                ia_warnings.append(ia_elevated)
                future_states.append(state_vec)

                # Autoregressive update: append predicted S_{t+1} and shift window
                next_state_tensor = next_state_pred.unsqueeze(1) # (1, 1, D)
                working_seq = torch.cat([working_seq[:, 1:, :], next_state_tensor], dim=1)

        return {
            "horizon_steps": horizon,
            "future_probabilities": future_probs,
            "future_stages": future_stages,
            "future_stage_names": future_stage_names,
            "future_stage_probs": future_stage_probs,
            "initial_access_warnings": ia_warnings,
            "trajectory_states": np.array(future_states)
        }
