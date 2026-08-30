"""
Baseline Static Model: Logistic Regression.
Trains non-temporal classifiers on single-window features:
1. Binary Infiltration Classifier (class_weight='balanced')
2. Multi-class MITRE Stage Classifier (class_weight='balanced')
Fulfills NTRO requirement to benchmark temporal World Model dynamics vs static baseline.
"""

import pickle
import numpy as np
from pathlib import Path
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, f1_score, precision_score, recall_score
from model.attack_stage_mapping import MITRE_TACTIC_INFO


class BaselineLogisticRegression:
    """Static classifier baseline operating on instantaneous state vectors."""

    def __init__(self, saved_path: str = "model/saved/baseline_lr.pkl"):
        self.saved_path = Path(saved_path)
        self.binary_model = LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42)
        self.stage_model = LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42)
        self.is_fitted = False

    def train(self, X_train: np.ndarray, y_infil_train: np.ndarray, y_stage_train: np.ndarray):
        """Fits both binary and multi-class logistic regression on real features."""
        if len(X_train) == 0:
            raise ValueError("[!] Cannot train baseline on empty dataset. Real features required.")

        print("[*] Fitting Baseline Logistic Regression (Binary Infiltration)...")
        self.binary_model.fit(X_train, y_infil_train)

        print("[*] Fitting Baseline Logistic Regression (Multi-Class MITRE Stages)...")
        self.stage_model.fit(X_train, y_stage_train)

        self.is_fitted = True
        self.save()

    def predict_infil(self, X: np.ndarray) -> np.ndarray:
        if not self.is_fitted:
            self.load()
        return self.binary_model.predict(X)

    def predict_infil_proba(self, X: np.ndarray) -> np.ndarray:
        if not self.is_fitted:
            self.load()
        return self.binary_model.predict_proba(X)[:, 1]

    def predict_stage(self, X: np.ndarray) -> np.ndarray:
        if not self.is_fitted:
            self.load()
        return self.stage_model.predict(X)

    def predict_stage_proba(self, X: np.ndarray) -> np.ndarray:
        if not self.is_fitted:
            self.load()
        return self.stage_model.predict_proba(X)

    def evaluate(self, X_test: np.ndarray, y_infil_test: np.ndarray, y_stage_test: np.ndarray) -> dict:
        """Computes benchmark metrics including per-stage precision, recall, and F1."""
        infil_preds = self.predict_infil(X_test)
        stage_preds = self.predict_stage(X_test)

        infil_metrics = {
            "f1": float(f1_score(y_infil_test, infil_preds, zero_division=0)),
            "precision": float(precision_score(y_infil_test, infil_preds, zero_division=0)),
            "recall": float(recall_score(y_infil_test, infil_preds, zero_division=0))
        }

        # Per-stage metrics
        unique_stages = np.unique(np.concatenate([y_stage_test, stage_preds]))
        per_stage = {}
        for s in range(5):
            mask_true = (y_stage_test == s)
            mask_pred = (stage_preds == s)
            stg_name = MITRE_TACTIC_INFO.get(s, {}).get("name", f"Stage {s}")
            p = float(precision_score(mask_true, mask_pred, zero_division=0))
            r = float(recall_score(mask_true, mask_pred, zero_division=0))
            f1 = float(f1_score(mask_true, mask_pred, zero_division=0))
            support = int(np.sum(mask_true))
            per_stage[s] = {
                "name": stg_name,
                "precision": p,
                "recall": r,
                "f1": f1,
                "support": support
            }

        macro_f1 = float(f1_score(y_stage_test, stage_preds, average="macro", zero_division=0))
        weighted_f1 = float(f1_score(y_stage_test, stage_preds, average="weighted", zero_division=0))

        return {
            "binary_infiltration": infil_metrics,
            "stage_macro_f1": macro_f1,
            "stage_weighted_f1": weighted_f1,
            "per_stage": per_stage,
            "stage_report": classification_report(y_stage_test, stage_preds, zero_division=0)
        }

    def save(self):
        """Persists trained baseline models."""
        self.saved_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.saved_path, "wb") as f:
            pickle.dump({"binary": self.binary_model, "stage": self.stage_model}, f)

    def load(self):
        """Loads baseline weights."""
        if not self.saved_path.exists():
            raise FileNotFoundError(f"[!] Baseline model artifact not found at {self.saved_path}.")
        with open(self.saved_path, "rb") as f:
            data = pickle.load(f)
            if isinstance(data, dict) and "binary" in data:
                self.binary_model = data["binary"]
                self.stage_model = data["stage"]
            else:
                self.binary_model = data
                self.stage_model = data
        self.is_fitted = True
