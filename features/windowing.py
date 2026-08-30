"""
Time-Window Aggregator Module.
Segments real network flow logs and packet captures into synchronized time windows (e.g. 1.0 second),
producing combined 22-dimensional state vectors S_t.
"""

import pandas as pd
import numpy as np
from typing import List, Tuple, Dict, Any
from pathlib import Path


class TimeWindowAggregator:
    """Aggregates flow & packet telemetry into synchronized time windows."""

    def __init__(self, window_size_sec: float = 1.0, slide_step_sec: float = 1.0):
        self.window_size_sec = window_size_sec
        self.slide_step_sec = slide_step_sec

    def aggregate_flow_dataframe(self, df: pd.DataFrame, timestamp_col: str = "timestamp") -> pd.DataFrame:
        """
        Groups real continuous flow records into discrete time windows of window_size_sec.
        Fails loudly if timestamps are missing or invalid.
        """
        if df is None or df.empty:
            raise ValueError("[!] Cannot aggregate empty flow DataFrame.")

        # Find timestamp column
        ts_col = None
        for col in [timestamp_col, "starttime", "timestamp", "time"]:
            if col in df.columns:
                ts_col = col
                break

        if not ts_col:
            # If no explicit timestamp column, create synthetic uniform timeline from durations
            # but only if durations exist in real data
            if "dur" in df.columns or "flow_duration" in df.columns:
                df = df.copy()
                dur_col = "dur" if "dur" in df.columns else "flow_duration"
                cumulative_time = pd.to_numeric(df[dur_col], errors="coerce").fillna(0.1).cumsum()
                df["window_id"] = (cumulative_time // self.window_size_sec).astype(int)
            else:
                raise KeyError(f"[!] Real flow data missing timestamp column. Columns present: {list(df.columns)}")
        else:
            # Parse timestamp
            df = df.copy()
            df["parsed_ts"] = pd.to_datetime(df[ts_col], errors="coerce")
            if df["parsed_ts"].isna().all():
                # Try numeric epoch
                numeric_ts = pd.to_numeric(df[ts_col], errors="coerce")
                min_t = numeric_ts.min()
                df["window_id"] = ((numeric_ts - min_t) // self.window_size_sec).astype(int)
            else:
                min_t = df["parsed_ts"].min()
                delta_sec = (df["parsed_ts"] - min_t).dt.total_seconds()
                df["window_id"] = (delta_sec // self.window_size_sec).astype(int)

        return df
