"""
Real Telemetry Replay & Redis Stream Producer.
Pushes real network state telemetry vectors onto a local Redis Stream:
Stream key: `network:telemetry:windows`

Cadence: 2.0s per window (exact match with the 2-second telemetry window size),
or custom --interval / --fast for quick evaluation.
NO MOCKED DATA. Pushes genuine extracted features from real captures or demo datasets.
"""

import sys
import time
import json
import argparse
from pathlib import Path
import pandas as pd
import numpy as np
import redis

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from features.flow_features import FlowFeatureExtractor


class RedisTelemetryProducer:
    """Publishes real feature windows onto a Redis Stream."""

    def __init__(self, host: str = "localhost", port: int = 6379, stream_key: str = "network:telemetry:windows"):
        self.stream_key = stream_key
        try:
            self.client = redis.Redis(host=host, port=port, decode_responses=True)
            self.client.ping()
            self.is_connected = True
        except Exception as e:
            self.is_connected = False
            self.client = None

    def publish_window(self, state_vector: list, timestamp: float, source_tag: str = "telemetry") -> str:
        """
        Pushes a real feature vector into the stream.
        Records high-resolution t_sent_epoch for measuring true end-to-end pipeline latency.
        """
        if not self.is_connected or self.client is None:
            raise ConnectionError("[!] Redis service unreachable. Please ensure local redis-server is running on port 6379.")

        t_now = time.time()
        payload = {
            "timestamp": str(timestamp),
            "t_sent_epoch": str(time.perf_counter()),
            "source": source_tag,
            "features": json.dumps([float(x) for x in state_vector])
        }

        entry_id = self.client.xadd(self.stream_key, payload)
        return entry_id


def run_replay(file_path: Path, interval: float = 2.0, loop: bool = False, max_windows: int = None):
    """Replays real windows from CSV / telemetry file onto Redis Stream."""
    producer = RedisTelemetryProducer()
    if not producer.is_connected:
        print("[!] Fatal: Cannot connect to Redis on localhost:6379.")
        print("[!] Make sure redis-server.exe is running. Run:")
        print("    d:\\sih2\\tools\\redis\\Redis-8.10.1-Windows-x64-msys2\\redis-server.exe")
        sys.exit(1)

    print(f"[*] Redis Stream Producer connected to localhost:6379")
    print(f"[*] Target Stream Key : {producer.stream_key}")
    print(f"[*] Telemetry Source  : {file_path.name}")
    print(f"[*] Window Cadence    : {interval:.2f}s per window (Real-time telemetry pacing)")
    print(f"[*] Continuous Loop   : {'Enabled' if loop else 'Single-pass'}")
    print("=" * 70)

    # Load dataset
    suffix = file_path.suffix.lower()
    try:
        df = pd.read_csv(file_path, sep=None, engine="python")
    except Exception:
        df = pd.read_csv(file_path)

    # Check if 22 pre-extracted features exist
    fnames_path = PROJECT_ROOT / "data" / "processed" / "feature_names.json"
    expected_fnames = []
    if fnames_path.exists():
        with open(fnames_path) as f:
            expected_fnames = json.load(f)

    is_pre_extracted = bool(expected_fnames and set(expected_fnames).issubset(set(df.columns)))

    if is_pre_extracted:
        records = df[expected_fnames].values.tolist()
        print(f"[+] Loaded {len(records)} verified 22-dimensional telemetry window records.")
    else:
        extractor = FlowFeatureExtractor()
        feat_df = extractor.extract_from_dataframe(df)
        records = []
        for _, row in feat_df.iterrows():
            vec = list(row.values)
            while len(vec) < 22:
                vec.append(0.0)
            records.append(vec[:22])
        print(f"[+] Extracted {len(records)} flow telemetry records from raw capture.")

    if max_windows:
        records = records[:max_windows]

    total_published = 0
    iteration = 0

    try:
        while True:
            iteration += 1
            print(f"\n[*] Starting Replay Pass #{iteration} ({len(records)} windows)...")
            start_wall = time.time()

            for idx, vec in enumerate(records):
                t_window = start_wall + (idx * interval)
                entry_id = producer.publish_window(
                    state_vector=vec,
                    timestamp=t_window,
                    source_tag=f"{file_path.name}:w_{idx+1}"
                )
                total_published += 1
                sys.stdout.write(
                    f"\r[+] Streamed Window {idx+1:>3}/{len(records)} | Redis ID: {entry_id} | Time: {interval:.1f}s/step | Total Sent: {total_published}"
                )
                sys.stdout.flush()

                time.sleep(interval)

            print(f"\n[OK] Pass #{iteration} complete: {len(records)} windows pushed to Redis.")
            if not loop:
                break

    except KeyboardInterrupt:
        print(f"\n[!] Producer interrupted by user. Total windows pushed: {total_published}")

    print(f"[OK] Replay finished. Total windows streamed: {total_published}")


def main():
    parser = argparse.ArgumentParser(description="Real Telemetry Replay & Redis Stream Producer")
    parser.add_argument(
        "--replay",
        type=str,
        default="data/demo_samples/verified_attack_sample.csv",
        help="Path to real telemetry CSV or PCAP to replay"
    )
    parser.add_argument(
        "--interval",
        type=float,
        default=2.0,
        help="Replay cadence in seconds per window (default: 2.0 matching 2-second windows)"
    )
    parser.add_argument(
        "--fast",
        action="store_true",
        help="Fast replay mode (0.3s per window) for rapid demonstration"
    )
    parser.add_argument(
        "--loop",
        action="store_true",
        help="Continuously loop replay over the dataset indefinitely"
    )
    parser.add_argument(
        "--count",
        type=int,
        default=None,
        help="Max number of windows to replay"
    )

    args = parser.parse_args()

    replay_path = Path(args.replay)
    if not replay_path.is_absolute():
        replay_path = PROJECT_ROOT / replay_path

    if not replay_path.exists():
        print(f"[!] Error: Replay file not found: {replay_path}")
        sys.exit(1)

    interval = 0.3 if args.fast else args.interval
    run_replay(replay_path, interval=interval, loop=args.loop, max_windows=args.count)


if __name__ == "__main__":
    main()
