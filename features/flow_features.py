"""
Flow-Level Feature Extraction Module.
Extracts NetFlow/IPFIX-style aggregated flow features from real flow logs or aggregated packets.
Features computed:
- flow_duration_ms
- total_fwd_packets, total_bwd_packets
- total_fwd_bytes, total_bwd_bytes
- packet_length_mean, packet_length_std
- iat_mean_ms, iat_std_ms (Inter-Arrival Time)
- fwd_bwd_byte_ratio
- active_flows_count
- unique_dst_ports
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List
from pathlib import Path


class FlowFeatureExtractor:
    """Extracts standard NetFlow/IPFIX features from flow records."""

    def __init__(self):
        self.expected_columns = [
            "flow_duration_ms", "total_fwd_packets", "total_bwd_packets",
            "total_fwd_bytes", "total_bwd_bytes", "packet_length_mean",
            "packet_length_std", "iat_mean_ms", "iat_std_ms",
            "fwd_bwd_byte_ratio", "active_flows_count", "unique_dst_ports"
        ]

    def extract_from_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Processes real flow records (e.g. CIC-IDS-2018 or CTU-13 binetflow).
        Fails loudly if input is empty or malformed.
        """
        if df is None or df.empty:
            raise ValueError("[!] FlowFeatureExtractor error: Input DataFrame is empty or None. Real data required.")

        # Normalize column names
        df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

        # Mapping for CIC-IDS-2018 / standard flow fields
        features = pd.DataFrame()

        # Duration
        if "flow_duration" in df.columns:
            features["flow_duration_ms"] = pd.to_numeric(df["flow_duration"], errors="coerce").fillna(0) / 1000.0
        elif "dur" in df.columns: # CTU-13 binetflow
            features["flow_duration_ms"] = pd.to_numeric(df["dur"], errors="coerce").fillna(0) * 1000.0
        else:
            raise KeyError("[!] Required duration column not found in real flow data.")

        # Forward & Backward packets
        if "tot_fwd_pkts" in df.columns:
            features["total_fwd_packets"] = pd.to_numeric(df["tot_fwd_pkts"], errors="coerce").fillna(0)
            if "tot_bwd_pkts" in df.columns:
                features["total_bwd_packets"] = pd.to_numeric(df["tot_bwd_pkts"], errors="coerce").fillna(0)
            else:
                features["total_bwd_packets"] = 0.0
        elif "totpkts" in df.columns: # CTU-13
            features["total_fwd_packets"] = pd.to_numeric(df["totpkts"], errors="coerce").fillna(0)
            features["total_bwd_packets"] = 0.0
        else:
            raise KeyError("[!] Required packet count columns not found in real flow data.")

        # Forward & Backward bytes
        if "totlen_fwd_pkts" in df.columns:
            features["total_fwd_bytes"] = pd.to_numeric(df["totlen_fwd_pkts"], errors="coerce").fillna(0)
            if "totlen_bwd_pkts" in df.columns:
                features["total_bwd_bytes"] = pd.to_numeric(df["totlen_bwd_pkts"], errors="coerce").fillna(0)
            else:
                features["total_bwd_bytes"] = 0.0
        elif "totbytes" in df.columns: # CTU-13
            features["total_fwd_bytes"] = pd.to_numeric(df["totbytes"], errors="coerce").fillna(0)
            features["total_bwd_bytes"] = 0.0
        else:
            raise KeyError("[!] Required byte count columns not found in real flow data.")

        # Packet length statistics
        if "pkt_len_mean" in df.columns:
            features["packet_length_mean"] = pd.to_numeric(df["pkt_len_mean"], errors="coerce").fillna(0)
            if "pkt_len_std" in df.columns:
                features["packet_length_std"] = pd.to_numeric(df["pkt_len_std"], errors="coerce").fillna(0)
            else:
                features["packet_length_std"] = 0.0
        else:
            # Derive from total bytes / total pkts
            total_pkts = (features["total_fwd_packets"] + features["total_bwd_packets"]).replace(0, 1)
            total_bytes = features["total_fwd_bytes"] + features["total_bwd_bytes"]
            features["packet_length_mean"] = total_bytes / total_pkts
            features["packet_length_std"] = 0.0

        # Inter-Arrival Time (IAT) statistics
        if "flow_iat_mean" in df.columns:
            features["iat_mean_ms"] = pd.to_numeric(df["flow_iat_mean"], errors="coerce").fillna(0) / 1000.0
            if "flow_iat_std" in df.columns:
                features["iat_std_ms"] = pd.to_numeric(df["flow_iat_std"], errors="coerce").fillna(0) / 1000.0
            else:
                features["iat_std_ms"] = 0.0
        else:
            features["iat_mean_ms"] = features["flow_duration_ms"] / (features["total_fwd_packets"] + 1)
            features["iat_std_ms"] = 0.0

        # Forward/Backward byte ratio
        bwd_safe = features["total_bwd_bytes"].replace(0, 1.0)
        features["fwd_bwd_byte_ratio"] = features["total_fwd_bytes"] / bwd_safe

        # Active flows and port stats
        features["active_flows_count"] = float(len(df))
        if "dst_port" in df.columns:
            features["unique_dst_ports"] = float(df["dst_port"].nunique())
        elif "dport" in df.columns:
            features["unique_dst_ports"] = float(df["dport"].nunique())
        else:
            features["unique_dst_ports"] = 1.0

        return features[self.expected_columns]
