"""
Network Attack World Model (Compact PyTorch LSTM).
Learns state transition dynamics P(S_{t+1} | S_t).
Specifically designed for 4GB VRAM constraints (param count < 100K).
Outputs:
1. Next-state prediction: S_{t+1} in R^{input_dim} (transition dynamics)
2. Infiltration risk score: probability in [0, 1]
3. Multi-class MITRE ATT&CK stage logits (5 classes)
"""

import torch
import torch.nn as nn
from typing import Tuple, Dict, Any


class NetworkWorldModel(nn.Module):
    """
    Compact LSTM World Model for Network State Transitions & Attack Forecasting.
    Multi-task architecture:
    - Transition Dynamics Head: predicts next state vector S_{t+1}
    - Attack Forecasting Head: predicts infiltration probability
    - ATT&CK Stage Head: predicts tactic class (Recon, Initial Access, Lateral, C2, Exfil)
    """

    def __init__(
        self,
        input_dim: int = 22,
        hidden_dim: int = 64,
        num_layers: int = 2,
        num_stages: int = 5,
        dropout: float = 0.2
    ):
        super().__init__()
        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        self.num_stages = num_stages

        # Recurrent Core (State Transition Dynamics)
        self.lstm = nn.LSTM(
            input_size=input_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0.0
        )

        # 1. State Transition Head: P(S_{t+1} | S_t)
        self.next_state_head = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, input_dim)
        )

        # 2. Infiltration Probability Head (Binary classification / risk score)
        self.infiltration_head = nn.Sequential(
            nn.Linear(hidden_dim, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
            nn.Sigmoid()
        )

        # 3. MITRE ATT&CK Stage Head (Multi-class classification)
        self.stage_head = nn.Sequential(
            nn.Linear(hidden_dim, 32),
            nn.ReLU(),
            nn.Linear(32, num_stages)
        )

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        """
        Args:
            x: Input sequence tensor of shape (batch_size, seq_len, input_dim)
        Returns:
            next_state: Predicted next state S_{t+1} of shape (batch_size, input_dim)
            infil_prob: Infiltration probability of shape (batch_size, 1)
            stage_logits: MITRE ATT&CK stage logits of shape (batch_size, num_stages)
        """
        # x shape: (B, T, D)
        lstm_out, (hn, cn) = self.lstm(x)
        # Take the last time-step representation
        last_hidden = lstm_out[:, -1, :] # (B, H)

        next_state = self.next_state_head(last_hidden) # (B, D)
        infil_prob = self.infiltration_head(last_hidden) # (B, 1)
        stage_logits = self.stage_head(last_hidden) # (B, num_stages)

        return next_state, infil_prob, stage_logits

    def predict_next_step(self, x: torch.Tensor) -> Tuple[torch.Tensor, float, int]:
        """Convenience method for single-sequence inference."""
        self.eval()
        with torch.no_grad():
            next_state, infil_prob, stage_logits = self.forward(x)
            prob = float(infil_prob.squeeze().item())
            stage = int(torch.argmax(stage_logits, dim=-1).squeeze().item())
            return next_state, prob, stage
