"""
Packet-Level Feature Extraction Module.
Parses real raw PCAP files or packet streams using Scapy.
Extracts:
- ttl_mean, ttl_variance
- tcp_win_mean, tcp_win_min
- flag_syn_ratio, flag_ack_ratio, flag_fin_ratio, flag_rst_ratio
- fragment_flag_count
- retransmission_count
"""

import numpy as np
import pandas as pd
from pathlib import Path
from typing import List, Dict, Any

try:
    from scapy.all import rdpcap, IP, TCP
    SCAPY_AVAILABLE = True
except ImportError:
    SCAPY_AVAILABLE = False


class PacketFeatureExtractor:
    """Extracts granular packet-level features from real PCAP files."""

    def __init__(self):
        if not SCAPY_AVAILABLE:
            raise ImportError("[!] Scapy is required for PacketFeatureExtractor. Please install scapy.")
        self.expected_columns = [
            "ttl_mean", "ttl_variance", "tcp_win_mean", "tcp_win_min",
            "flag_syn_ratio", "flag_ack_ratio", "flag_fin_ratio",
            "flag_rst_ratio", "fragment_flag_count", "retransmission_count"
        ]

    def extract_from_pcap(self, pcap_path: str, max_packets: int = 50000) -> Dict[str, float]:
        """
        Extracts aggregated packet features across packets in a time window or PCAP slice.
        Fails loudly if PCAP is missing or corrupted.
        """
        p = Path(pcap_path)
        if not p.exists() or p.stat().st_size == 0:
            raise FileNotFoundError(f"[!] Real PCAP file not found or empty: {pcap_path}")

        packets = rdpcap(str(p), count=max_packets)
        if len(packets) == 0:
            raise ValueError(f"[!] PCAP file contained 0 readable packets: {pcap_path}")

        return self.extract_from_packet_list(packets)

    def extract_from_packet_list(self, packets) -> Dict[str, float]:
        """Processes an in-memory list of Scapy packet objects."""
        if not packets or len(packets) == 0:
            raise ValueError("[!] Packet list is empty. Real packets required.")

        ttls = []
        win_sizes = []
        syn_count = 0
        ack_count = 0
        fin_count = 0
        rst_count = 0
        frag_count = 0
        seen_seq = set()
        retransmission_count = 0

        for pkt in packets:
            if IP in pkt:
                ip_layer = pkt[IP]
                ttls.append(ip_layer.ttl)
                # Check fragment flag: MF (More Fragments) or Offset > 0
                if ip_layer.flags.MF or ip_layer.frag > 0:
                    frag_count += 1

            if TCP in pkt:
                tcp_layer = pkt[TCP]
                win_sizes.append(tcp_layer.window)
                flags = tcp_layer.flags
                if "S" in flags:
                    syn_count += 1
                if "A" in flags:
                    ack_count += 1
                if "F" in flags:
                    fin_count += 1
                if "R" in flags:
                    rst_count += 1

                seq_key = (tcp_layer.sport, tcp_layer.dport, tcp_layer.seq)
                if seq_key in seen_seq:
                    retransmission_count += 1
                else:
                    seen_seq.add(seq_key)

        total_pkts = float(len(packets))
        ttl_arr = np.array(ttls) if ttls else np.array([64.0])
        win_arr = np.array(win_sizes) if win_sizes else np.array([65535.0])

        return {
            "ttl_mean": float(np.mean(ttl_arr)),
            "ttl_variance": float(np.var(ttl_arr)),
            "tcp_win_mean": float(np.mean(win_arr)),
            "tcp_win_min": float(np.min(win_arr)),
            "flag_syn_ratio": float(syn_count / total_pkts),
            "flag_ack_ratio": float(ack_count / total_pkts),
            "flag_fin_ratio": float(fin_count / total_pkts),
            "flag_rst_ratio": float(rst_count / total_pkts),
            "fragment_flag_count": float(frag_count),
            "retransmission_count": float(retransmission_count)
        }
