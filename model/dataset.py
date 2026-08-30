"""
PyTorch Dataset for Network State Transition & Attack Progression Sequences.
Constructs sliding windows: (S_{t-W} ... S_t) -> (S_{t+1}, attack_label, mitre_stage).
Supports stratified sequence indexing and weighted sampling.
Fails loudly if input array is empty or lacks required temporal depth.
"""

import torch
from torch.utils.data import Dataset
import numpy as np
from typing import Tuple, Optional


class NetworkSequenceDataset(Dataset):
    """Dataset of consecutive time-window feature vectors from real network captures."""

    def __init__(
        self,
        features: np.ndarray,
        labels: np.ndarray,
        stages: np.ndarray,
        seq_len: int = 10,
        indices: Optional[np.ndarray] = None
    ):
        """
        Args:
            features: Real normalized feature matrix of shape (N, input_dim)
            labels: Infiltration binary labels of shape (N,)
            stages: MITRE ATT&CK stage indices of shape (N,)
            seq_len: Historical sequence window length W
            indices: Optional subset of start indices for train/val/test split
        """
        if features is None or len(features) <= seq_len:
            raise ValueError(f"[!] Insufficient time steps ({len(features) if features is not None else 0}) for sequence length {seq_len}. Real data required.")

        self.features = torch.tensor(features, dtype=torch.float32)
        self.labels = torch.tensor(labels, dtype=torch.float32)
        self.stages = torch.tensor(stages, dtype=torch.long)
        self.seq_len = seq_len

        total_sequences = len(features) - seq_len
        if indices is not None:
            self.indices = np.array(indices, dtype=np.int64)
            # Validation check
            if np.max(self.indices) >= total_sequences or np.min(self.indices) < 0:
                raise IndexError(f"[!] Indices out of sequence range [0, {total_sequences-1}].")
        else:
            self.indices = np.arange(total_sequences, dtype=np.int64)

        self.num_samples = len(self.indices)

    def __len__(self) -> int:
        return self.num_samples

    def __getitem__(self, i: int) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor, torch.Tensor]:
        """
        Returns:
            x_seq: Window of historical states [S_t-W ... S_t] (seq_len, D)
            next_state_target: Ground truth next state S_{t+1} (D,)
            infil_target: Ground truth infiltration label at t+1 (1,)
            stage_target: Ground truth MITRE stage at t+1 ()
        """
        idx = int(self.indices[i])
        x_seq = self.features[idx : idx + self.seq_len]
        next_state_target = self.features[idx + self.seq_len]
        infil_target = self.labels[idx + self.seq_len].unsqueeze(-1)
        stage_target = self.stages[idx + self.seq_len]

        return x_seq, next_state_target, infil_target, stage_target

    def get_stage_targets(self) -> np.ndarray:
        """Returns the target MITRE stage for each sequence in this subset."""
        target_indices = self.indices + self.seq_len
        return self.stages[target_indices].numpy()
