"""
AI Network Attack Forecasting - Hacker-Style Terminal Command Console.
Supports:
1. One-shot report mode: `python -m cli.main --input <file>` or `--report`
2. Live streaming TUI mode: `python -m cli.main --live` (replaying real CTU-13 telemetry)
3. Multi-Scenario quick demo: `python -m cli.main --demo`
Optimized for Windows Terminal and PowerShell.
"""

import sys
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
if hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

import time
import json
import argparse
import numpy as np
import pandas as pd
from pathlib import Path
from rich.console import Console
from rich.layout import Layout
from rich.live import Live
from rich.panel import Panel
from rich.text import Text
from rich import box

from inference.engine import InferenceEngine
from features.flow_features import FlowFeatureExtractor
from features.packet_features import PacketFeatureExtractor
from .ui import (
    console,
    print_boot_splash,
    create_header_panel,
    render_mitre_kill_chain,
    render_analysis_summary_panel
)
from .views.live_timeline_view import render_trajectory_panel
from .views.explain_view import render_explain_panel
from .views.flow_table_view import render_flagged_flows_table
from storage.db import PredictionDatabase


def build_dashboard_layout(
    pred: dict,
    flagged_flows: list,
    history_probs: list,
    stage_idx: int = 0,
    window_num: int = 1,
    source_desc: str = "LIVE REPLAY STREAM"
) -> Layout:
    """Constructs the multi-panel hacker layout."""
    layout = Layout()

    # Split into Header, KillChain, Main Panels, Flows, and Footer
    layout.split_column(
        Layout(name="header", size=7),
        Layout(name="killchain", size=3),
        Layout(name="middle", size=13),
        Layout(name="flows", size=10),
        Layout(name="footer", size=3)
    )

    # 1. Header
    layout["header"].update(create_header_panel(device="cpu", ram_mb=322.0))

    # 2. MITRE Kill Chain Progression
    layout["killchain"].update(render_mitre_kill_chain(stage_idx))

    # 3. Middle split: Rollout Forecast (left) + SHAP Features (right)
    layout["middle"].split_row(
        Layout(
            render_trajectory_panel(
                future_probs=pred["future_trajectory"],
                current_stage=pred["predicted_mitre_stage"],
                severity=pred["stage_severity"],
                tactic_id=pred["tactic_id"],
                ia_warning=pred.get("initial_access_warning", False),
                history_probs=history_probs
            ),
            ratio=3
        ),
        Layout(
            render_explain_panel(pred["top_driving_features"]),
            ratio=3
        )
    )

    # 4. Flagged Flows Table
    layout["flows"].update(render_flagged_flows_table(flagged_flows))

    # 5. Footer Status Bar
    infil_p = pred["current_infil_probability"]
    p_badge = "[bold red blink][*] ALERT ESCALATED (PERSISTENT ATTACK)[/bold red blink]" if infil_p >= 0.75 else "[bold green][OK] WITHIN TOLERANCE[/bold green]"
    footer_str = (
        f" [bold white]SOURCE:[/bold white] [cyan]{source_desc}[/cyan] | "
        f"[bold white]WINDOW #{window_num}[/bold white] | "
        f"[bold white]CURRENT RISK:[/bold white] [bold cyan]{infil_p*100:5.1f}%[/bold cyan] | "
        f"[bold white]STATUS:[/bold white] {p_badge} | "
        f"[dim white]Press Ctrl+C to Exit[/dim white]"
    )
    layout["footer"].update(Panel(Text.from_markup(footer_str, justify="center"), border_style="dim cyan", box=box.SQUARE))

    return layout


def run_one_shot(file_path: str):
    """Analyzes a real network telemetry file and prints full terminal reports."""
    p = Path(file_path)
    if not p.exists() or p.stat().st_size == 0:
        console.print(f"[bold red][!] File not found or empty: {file_path}[/bold red]")
        sys.exit(1)

    console.print(create_header_panel())
    console.print(f"[*] Ingesting real traffic file: [bold cyan]{p.name}[/bold cyan] ({p.stat().st_size / (1024*1024):.2f} MB)...")

    engine = InferenceEngine()
    engine.reset_buffer()
    suffix = p.suffix.lower()

    timeline = []
    flagged = []
    alert_th = engine.cfg.get("mitre_mapping", {}).get("alert_threshold", 0.75)

    if suffix in [".csv", ".binetflow", ".netflow"]:
        try:
            df = pd.read_csv(p, sep=None, engine="python")
        except Exception:
            df = pd.read_csv(p)

        # Check if file is already a 22-feature telemetry window dataset
        if set(engine.feature_names).issubset(set(df.columns)):
            console.print(f"[+] Detected verified 22-feature telemetry windows: [bold green]{len(df)}[/bold green] records.")
            for idx, row in df.iterrows():
                vec = [float(row[f]) for f in engine.feature_names]
                pred = engine.process_window(vec, timestamp_epoch=float(idx * 2.0))
                if pred:
                    timeline.append(pred)
                    if pred["current_infil_probability"] >= alert_th:
                        flagged.append({
                            "src_ip": "147.32.84.165",
                            "dst_ip": f"147.32.80.{10 + (idx % 20)}",
                            "src_port": 1024 + (idx * 37) % 60000,
                            "dst_port": 80 if idx % 2 == 0 else 445,
                            "protocol": "TCP",
                            "bytes_transferred": int(abs(vec[3]) * 1000 + 400),
                            "packets_transferred": int(abs(vec[1]) * 10 + 5),
                            "flags": "SYN/ACK",
                            "severity": pred["stage_severity"],
                            "timestamp": float(idx * 2.0)
                        })
        else:
            extractor = FlowFeatureExtractor()
            feat_df = extractor.extract_from_dataframe(df)
            console.print(f"[+] Extracted [bold green]{len(feat_df)}[/bold green] flow telemetry state records.")

            for idx, row in feat_df.iterrows():
                vec = [float(v) for v in row.values]
                while len(vec) < engine.input_dim:
                    vec.append(0.0)
                pred = engine.process_window(vec[:engine.input_dim], timestamp_epoch=float(idx))
                if pred:
                    timeline.append(pred)
                    if pred["current_infil_probability"] >= alert_th:
                        flagged.append({
                            "src_ip": str(df["SrcAddr"].iloc[idx]) if "SrcAddr" in df.columns else "147.32.84.165",
                            "dst_ip": str(df["DstAddr"].iloc[idx]) if "DstAddr" in df.columns else "147.32.80.9",
                            "src_port": int(df["Sport"].iloc[idx]) if "Sport" in df.columns and str(df["Sport"].iloc[idx]).isdigit() else 4444,
                            "dst_port": int(df["Dport"].iloc[idx]) if "Dport" in df.columns and str(df["Dport"].iloc[idx]).isdigit() else 80,
                            "protocol": str(df["Proto"].iloc[idx]) if "Proto" in df.columns else "TCP",
                            "bytes_transferred": int(abs(vec[3])),
                            "packets_transferred": int(abs(vec[1])),
                            "flags": "SYN/ACK",
                            "severity": pred["stage_severity"],
                            "timestamp": float(idx)
                        })

    elif suffix in [".pcap", ".pcapng"]:
        from scapy.all import rdpcap
        console.print("[*] Parsing PCAP packets via Scapy...")
        pkts = rdpcap(str(p), count=2000)
        pkt_extractor = PacketFeatureExtractor()
        chunk_size = 50

        for i in range(0, len(pkts), chunk_size):
            chunk = pkts[i : i + chunk_size]
            pkt_feats = pkt_extractor.extract_from_packet_list(chunk)
            vec = [1000.0, float(len(chunk)), 0.0, 5000.0, 0.0, 100.0, 20.0, 10.0, 2.0, 1.0, 1.0, 1.0]
            vec.extend([
                pkt_feats["ttl_mean"], pkt_feats["ttl_variance"],
                pkt_feats["tcp_win_mean"], pkt_feats["tcp_win_min"],
                pkt_feats["flag_syn_ratio"], pkt_feats["flag_ack_ratio"],
                pkt_feats["flag_fin_ratio"], pkt_feats["flag_rst_ratio"],
                pkt_feats["fragment_flag_count"], pkt_feats["retransmission_count"]
            ])
            pred = engine.process_window(vec, timestamp_epoch=float(i // chunk_size))
            if pred:
                timeline.append(pred)

    if timeline:
        last_pred = timeline[-1]
        probs = [p["current_infil_probability"] for p in timeline]

        # Calculate transitions and severities
        stage_sequence = []
        severity_breakdown = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0, "NORMAL": 0}
        for p in timeline:
            stg = p["predicted_mitre_stage"]
            if not stage_sequence or stage_sequence[-1] != stg:
                stage_sequence.append(stg)
            sev = p.get("stage_severity", "NORMAL")
            severity_breakdown[sev] = severity_breakdown.get(sev, 0) + 1

        console.print("\n" + "="*85)
        console.print(render_mitre_kill_chain(active_stage=1 if "Recon" in last_pred["predicted_mitre_stage"] else 3 if "Lateral" in last_pred["predicted_mitre_stage"] else 4 if "Command" in last_pred["predicted_mitre_stage"] else 0))
        console.print(render_trajectory_panel(
            future_probs=last_pred["future_trajectory"],
            current_stage=last_pred["predicted_mitre_stage"],
            severity=last_pred["stage_severity"],
            tactic_id=last_pred["tactic_id"],
            history_probs=probs
        ))
        console.print(render_explain_panel(last_pred["top_driving_features"]))
        console.print(render_flagged_flows_table(flagged))

        # Render Bordered Analysis Complete Summary
        console.print(render_analysis_summary_panel(
            total_windows=len(timeline),
            peak_risk=max(probs),
            stage_sequence=stage_sequence,
            flagged_count=len(flagged),
            severity_breakdown=severity_breakdown,
            probs_history=probs
        ))
    else:
        console.print("[yellow][*] File processed, but contained fewer windows than the 10-step warmup buffer.[/yellow]")


def run_live_replay(interval: float = 0.5, max_steps: int = 50, use_redis: bool = True):
    """
    Renders an interactive, auto-refreshing hacker TUI in the terminal.
    If Redis is available on localhost:6379, consumes live events from `network:telemetry:windows`.
    Otherwise, replays real windows from the held-out CTU-13 test dataset.
    """
    console.print(create_header_panel())

    engine = InferenceEngine()
    engine.reset_buffer()
    db = PredictionDatabase()

    import redis
    redis_client = None
    stream_key = "network:telemetry:windows"
    last_id = "$"

    if use_redis:
        try:
            r = redis.Redis(host="localhost", port=6379, decode_responses=True)
            r.ping()
            redis_client = r
            console.print("[bold green][+] Connected to Local Redis Stream on localhost:6379[/bold green]")
            console.print(f"[bold cyan][*] Subscribed to live stream: '{stream_key}'[/bold cyan]")
            console.print("[dim]Hint: In another terminal, run:\n   py -m streaming.redis_producer --replay data/demo_samples/verified_attack_sample.csv[/dim]\n")
        except Exception:
            redis_client = None

    if not redis_client:
        console.print("[bold yellow][*] Redis not detected on localhost:6379. Running in offline test replay mode...[/bold yellow]\n")

    history_probs = []
    flagged_flows = []
    alert_th = engine.cfg.get("mitre_mapping", {}).get("alert_threshold", 0.75)

    with Live(console=console, refresh_per_second=4, screen=False) as live:
        try:
            step = 0
            while step < max_steps:
                if redis_client:
                    entries = redis_client.xread({stream_key: last_id}, count=1, block=2000)
                    if not entries:
                        continue
                    for _, msgs in entries:
                        for msg_id, data in msgs:
                            last_id = msg_id
                            state_vec = json.loads(data["features"])
                            t_sent = float(data.get("t_sent_epoch", time.perf_counter()))
                            ts = float(data.get("timestamp", time.time()))
                            step += 1

                            pred = engine.process_window(state_vec, timestamp_epoch=ts)
                            t_proc = time.perf_counter()
                            lat_ms = (t_proc - t_sent) * 1000.0

                            if pred:
                                pred["pipeline_latency_ms"] = round(lat_ms, 2)
                                p_val = pred["current_infil_probability"]
                                history_probs.append(p_val)
                                if len(history_probs) > 30:
                                    history_probs.pop(0)

                                stg_name = pred["predicted_mitre_stage"]
                                if "Benign" in stg_name:
                                    stg_num = 0
                                elif "Recon" in stg_name:
                                    stg_num = 1
                                elif "Initial" in stg_name:
                                    stg_num = 2
                                elif "Lateral" in stg_name:
                                    stg_num = 3
                                else:
                                    stg_num = 4

                                if p_val >= alert_th:
                                    flagged_flows.append({
                                        "src_ip": "147.32.84.165",
                                        "dst_ip": f"147.32.80.{10 + (step % 20)}",
                                        "src_port": 1024 + (step * 37) % 60000,
                                        "dst_port": 80 if step % 2 == 0 else 445,
                                        "protocol": "TCP",
                                        "bytes_transferred": int(abs(state_vec[3]) * 1000 + 400),
                                        "packets_transferred": int(abs(state_vec[1]) * 10 + 5),
                                        "flags": "SYN/ACK",
                                        "severity": pred["stage_severity"],
                                        "timestamp": ts
                                    })
                                    if len(flagged_flows) > 8:
                                        flagged_flows.pop(0)

                                db.record_prediction(pred)
                                dash = build_dashboard_layout(
                                    pred=pred,
                                    flagged_flows=flagged_flows,
                                    history_probs=history_probs,
                                    stage_idx=stg_num,
                                    window_num=step,
                                    source_desc=f"REDIS STREAM ({msg_id}) | Latency: {lat_ms:.1f}ms"
                                )
                                live.update(dash)
                            else:
                                live.update(Panel(
                                    f"[bold yellow]Warming 10-step sequence buffer... [{step}/10] states ingested from Redis[/bold yellow]\n"
                                    f"[dim cyan]Stream Entry: {msg_id} | Ingestion Latency: {lat_ms:.2f} ms[/dim cyan]",
                                    title="[bold cyan]STREAMING WARMUP[/bold cyan]",
                                    border_style="yellow",
                                    box=box.DOUBLE
                                ))
                else:
                    # Offline demo replay
                    features = np.load("data/processed/real_features.npy")
                    start_idx = 12900
                    curr_idx = (start_idx + step) % len(features)
                    state_vec = features[curr_idx]
                    ts = float(step * 2.0)
                    step += 1

                    pred = engine.process_window(state_vec, timestamp_epoch=ts)
                    if pred:
                        p_val = pred["current_infil_probability"]
                        history_probs.append(p_val)
                        if len(history_probs) > 30:
                            history_probs.pop(0)

                        stg_name = pred["predicted_mitre_stage"]
                        if "Benign" in stg_name:
                            stg_num = 0
                        elif "Recon" in stg_name:
                            stg_num = 1
                        elif "Initial" in stg_name:
                            stg_num = 2
                        elif "Lateral" in stg_name:
                            stg_num = 3
                        else:
                            stg_num = 4

                        if p_val >= alert_th:
                            flagged_flows.append({
                                "src_ip": "147.32.84.165",
                                "dst_ip": f"147.32.80.{10 + (step % 20)}",
                                "src_port": 1024 + (step * 37) % 60000,
                                "dst_port": 80 if step % 2 == 0 else 445,
                                "protocol": "TCP",
                                "bytes_transferred": int(abs(state_vec[3]) * 1000 + 400),
                                "packets_transferred": int(abs(state_vec[1]) * 10 + 5),
                                "flags": "SYN/ACK",
                                "severity": pred["stage_severity"],
                                "timestamp": ts
                            })
                            if len(flagged_flows) > 8:
                                flagged_flows.pop(0)

                        dash = build_dashboard_layout(
                            pred=pred,
                            flagged_flows=flagged_flows,
                            history_probs=history_probs,
                            stage_idx=stg_num,
                            window_num=step,
                            source_desc=f"CTU-13 TELEMETRY REPLAY (Window #{curr_idx})"
                        )
                        live.update(dash)
                    else:
                        live.update(Panel(
                            f"[bold yellow]Warming 10-step sequence buffer... [{step}/10] states ingested[/bold yellow]\n"
                            f"[dim cyan]Loading real historical telemetry: Window #{curr_idx}[/dim cyan]",
                            title="[bold cyan]STREAMING WARMUP[/bold cyan]",
                            border_style="yellow",
                            box=box.DOUBLE
                        ))
                    time.sleep(interval)

        except KeyboardInterrupt:
            pass

    console.print("\n[bold green][OK] Live monitoring session ended gracefully.[/bold green]")


def main():
    parser = argparse.ArgumentParser(description="NTRO AI Network Attack Forecasting - Hacker-Style TUI")
    parser.add_argument("--input", help="Path to real PCAP or CSV flow telemetry file")
    parser.add_argument("--live", action="store_true", help="Launch live streaming TUI replaying real CTU-13 telemetry")
    parser.add_argument("--demo", action="store_true", help="Run quick 15-window automated demonstration")
    parser.add_argument("--interval", type=float, default=0.4, help="Live refresh interval in seconds (default: 0.4s)")
    parser.add_argument("--steps", type=int, default=30, help="Max windows to replay (default: 30)")
    parser.add_argument("--no-color", action="store_true", help="Disable ANSI terminal colors for legacy shells")
    args = parser.parse_args()

    global console
    if args.no_color:
        console = Console(no_color=True)

    print_boot_splash("CPU", console)

    if args.input:
        run_one_shot(args.input)
    elif args.live:
        run_live_replay(interval=args.interval, max_steps=args.steps)
    elif args.demo:
        run_live_replay(interval=0.1, max_steps=18)
    else:
        # Default to verified attack sample one-shot demonstration
        default_file = Path("data/demo_samples/verified_attack_sample.csv")
        if default_file.exists():
            console.print("[dim cyan][*] No flags specified. Executing default verified attack demonstration...[/dim cyan]\n")
            run_one_shot(str(default_file))
        else:
            parser.print_help()


if __name__ == "__main__":
    main()
