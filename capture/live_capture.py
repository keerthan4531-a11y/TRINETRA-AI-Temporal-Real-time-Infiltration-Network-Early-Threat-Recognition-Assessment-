"""
Live Interface Capture Module.
Sniffs live packets on a physical / virtual network interface (for lab testing)
and streams window aggregations.
"""

import time
import argparse
from scapy.all import sniff
from features.packet_features import PacketFeatureExtractor
from streaming.redis_producer import RedisTelemetryProducer


class LiveInterfaceSniffer:
    """Captures live traffic from network interface in lab setups."""

    def __init__(self, interface: str = "eth0"):
        self.interface = interface
        self.extractor = PacketFeatureExtractor()

    def start_sniffing(self, window_sec: float = 1.0, callback=None):
        """Sniffs packets in continuous time-slices."""
        print(f"[*] Starting live interface capture on {self.interface}...")
        while True:
            # Sniff for window_sec duration
            pkts = sniff(iface=self.interface, timeout=window_sec)
            if pkts:
                feats = self.extractor.extract_from_packet_list(pkts)
                if callback:
                    callback(feats)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Live packet sniffer for lab interface.")
    parser.add_argument("--interface", default="eth0", help="Network interface name")
    args = parser.parse_args()
    sniffer = LiveInterfaceSniffer(args.interface)
    sniffer.start_sniffing()
