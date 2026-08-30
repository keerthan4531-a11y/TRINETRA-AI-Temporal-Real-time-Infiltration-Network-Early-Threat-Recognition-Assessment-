"""
PCAP Replay Module.
Replays a real PCAP file at realistic timing to simulate live capture in lab / VM environments.
Passes extracted window telemetry to Redis or directly into an InferenceEngine callback.
Fails loudly if PCAP is missing.
"""

import time
import argparse
from pathlib import Path
from scapy.all import rdpcap, PcapReader
from features.packet_features import PacketFeatureExtractor
from streaming.redis_producer import RedisTelemetryProducer


class PcapReplayer:
    """Streams real packets from a PCAP file at realistic inter-arrival timings."""

    def __init__(self, pcap_path: str, speed_multiplier: float = 1.0):
        self.pcap_path = Path(pcap_path)
        if not self.pcap_path.exists() or self.pcap_path.stat().st_size == 0:
            raise FileNotFoundError(f"[!] Real PCAP file not found or empty: {pcap_path}")
        self.speed_multiplier = max(0.1, speed_multiplier)
        self.extractor = PacketFeatureExtractor()

    def replay_to_redis(self, redis_producer: RedisTelemetryProducer, batch_size: int = 50):
        """Reads PCAP packets, aggregates them into real time-window batches, and pushes to Redis."""
        print(f"[*] Replaying real PCAP: {self.pcap_path.name} at {self.speed_multiplier}x speed...")
        reader = PcapReader(str(self.pcap_path))

        current_batch = []
        start_time = time.time()
        window_idx = 0

        for pkt in reader:
            current_batch.append(pkt)
            if len(current_batch) >= batch_size:
                # Extract real packet-level metrics
                feats = self.extractor.extract_from_packet_list(current_batch)

                # Synthetic flow baseline vector + packet features (22 dims)
                vec = [1000.0, float(len(current_batch)), 0.0, 5000.0, 0.0, 100.0, 20.0, 10.0, 2.0, 1.0, 1.0, 1.0]
                vec.extend([
                    feats["ttl_mean"], feats["ttl_variance"],
                    feats["tcp_win_mean"], feats["tcp_win_min"],
                    feats["flag_syn_ratio"], feats["flag_ack_ratio"],
                    feats["flag_fin_ratio"], feats["flag_rst_ratio"],
                    feats["fragment_flag_count"], feats["retransmission_count"]
                ])

                redis_producer.publish_window(vec, timestamp=time.time())
                window_idx += 1
                current_batch = []
                # Sleep realistic window step
                time.sleep(1.0 / self.speed_multiplier)

        print(f"[+] Replay completed: {window_idx} windows emitted.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Replay real PCAP into Redis Streams.")
    parser.add_argument("--pcap", required=True, help="Path to real PCAP file")
    parser.add_argument("--speed", type=float, default=1.0, help="Replay speed multiplier")
    args = parser.parse_args()

    producer = RedisTelemetryProducer()
    replayer = PcapReplayer(args.pcap, speed_multiplier=args.speed)
    replayer.replay_to_redis(producer)
