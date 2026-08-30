"""
Feature Normalization Module.
Fits and saves a RobustScaler / StandardScaler on real network telemetry to prevent feature skew,
and saves the artifact to model/saved/scaler.pkl.
"""

import pickle
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.preprocessing import RobustScaler, StandardScaler


class FeatureNormalizer:
    """Scales feature matrices and persists scaler state."""

    def __init__(self, scaler_path: str = "model/saved/scaler.pkl"):
        self.scaler_path = Path(scaler_path)
        self.scaler = RobustScaler()
        self.is_fitted = False

    def fit_transform(self, X: np.ndarray) -> np.ndarray:
        """Fits scaler on real training vectors and transforms them."""
        if X is None or len(X) == 0:
            raise ValueError("[!] Cannot fit scaler on empty array. Real features required.")
        X_scaled = self.scaler.fit_transform(X)
        self.is_fitted = True
        self.save()
        return X_scaled

    def transform(self, X: np.ndarray) -> np.ndarray:
        """Transforms vectors using the fitted scaler."""
        if not self.is_fitted:
            self.load()
        X_arr = np.asarray(X, dtype=np.float32)
        if X_arr.ndim == 1:
            return self.scaler.transform(X_arr.reshape(1, -1)).flatten()
        return self.scaler.transform(X_arr)

    def save(self):
        """Saves fitted scaler to disk."""
        self.scaler_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.scaler_path, "wb") as f:
            pickle.dump(self.scaler, f)

    def load(self):
        """Loads fitted scaler from disk."""
        if not self.scaler_path.exists():
            raise FileNotFoundError(f"[!] Scaler artifact not found at {self.scaler_path}. Run training first.")
        with open(self.scaler_path, "rb") as f:
            self.scaler = pickle.load(f)
        self.is_fitted = True
