# Architecture Document: AI Network Attack Forecasting World Model
**Challenge Track:** NTRO Blockchain & Cybersecurity — AI Based Network Attack Forecasting  
**Classification:** Open-Source Prototype (100% Offline, Edge-Deployable, Zero Cloud Dependency)  
**Target Hardware:** Consumer / Tactical Laptop (ASUS TUF Gaming F17, 16GB RAM, 4GB VRAM)

---

## 1. Problem Framing & The World Model Paradigm
Traditional Network Intrusion Detection Systems (NIDS) analyze isolated flows or individual packets to perform static classification ($X_t \to \hat{y} \in \{0, 1\}$). In modern targeted cyber intrusions, attackers do not trigger instantaneous single-packet exploits; instead, they execute structured multi-stage trajectories:
$$\text{Reconnaissance (TA0043)} \longrightarrow \text{Initial Access (TA0001)} \longrightarrow \text{Lateral Movement (TA0008)} \longrightarrow \text{Command \& Control (TA0011)}$$

Our system builds a **Temporal Network World Model** that learns environment transition dynamics:
$$P(S_{t+1} \mid S_t)$$
Given an aggregated state vector $S_t \in \mathbb{R}^{22}$ representing a 2.0-second telemetry window, the model autoregressively simulates $K$-steps into the future:
$$S_{t+1}, S_{t+2}, \dots, S_{t+K} \quad (K=5, \text{ spanning } +2\text{s to } +10\text{s})$$
This forward simulation predicts rising infiltration probability and projected MITRE stages **before** lateral movement or data exfiltration is completed.

---

## 2. End-to-End System Pipeline

```
[ Real Network Traffic / PCAP Capture / NetFlow Telemetry ]
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Dual-Level Feature Extraction (features/flow_features.py)  │
│  - Flow Metrics (12 Dims): Duration, IAT, Bytes, Port Div.  │
│  - Packet Metrics (10 Dims): TTL Var, Win Sizes, Flags, Frag │
└──────────────────────────────┬──────────────────────────────┘
                               │ State Vector S_t (2.0s windows)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  Local Redis Streams Pipeline (network:telemetry:windows)   │
│  - Native Redis 8.10.1 Engine (13.9 MB RAM footprint)      │
└──────────────────────────────┬──────────────────────────────┘
                               │ XREAD / Consumer Group
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  Unified Inference Engine (inference/engine.py)             │
│  - 2-Layer LSTM World Model (64 hidden, 74,510 parameters) │
│  - Autoregressive K-Step Forward Rollout (model/rollout.py) │
│  - Hierarchical Decision Rule (Prevents Vote-Splitting)     │
│  - Real-Time Gradient Attribution (10.20 ms XAI latency)    │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│ SQLite Audit DB (storage/db) │ │ FastAPI Server (serving/)  │
│ - Time-Series Predictions    │ │ - REST API & WebSockets    │
│ - MITRE Stage Breakdown      │ │ - Synchronized Live Stream │
└──────────────┬───────────────┘ └────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│ Hacker-Style Terminal CLI    │ │ Modern Web SOC Dashboard   │
│ (cli/main.py --live)         │ │ (frontend/ React + Vite)   │
│ - ASCII Sparkline Horizon    │ │ - Recharts Dual-Curve Plot │
│ - Real-Time Flagged Flows    │ │ - 1-Click Ground Truth Demo│
└──────────────────────────────┘ └────────────────────────────┘
```

---

## 3. Dual-Level Telemetry Feature Schema ($S_t \in \mathbb{R}^{22}$)
1. **Flow-Level Telemetry (12 Dimensions):** `flow_duration_ms`, `total_fwd_packets`, `total_bwd_packets`, `total_fwd_bytes`, `total_bwd_bytes`, `packet_length_mean`, `packet_length_std`, `iat_mean_ms`, `iat_std_ms`, `fwd_bwd_byte_ratio`, `active_flows_count`, `unique_dst_ports`.
2. **Packet-Level Micro-Behaviors (10 Dimensions):** `ttl_mean`, `ttl_variance`, `tcp_win_mean`, `tcp_win_min`, `flag_syn_ratio`, `flag_ack_ratio`, `flag_fin_ratio`, `flag_rst_ratio`, `fragment_flag_count`, `retransmission_count`.

---

## 4. Key Engineering Innovations & Decision Rules
- **"2-in-1" Shared Architecture:** `inference/engine.py` operates as a single source of truth for both the Terminal TUI and Web SOC dashboard, preventing logic fragmentation.
- **Native Gradient Attribution for XAI:** Replaced KernelSHAP (2,000–4,500 ms latency) with native $\text{Input} \times \text{Gradient}$ attribution, dropping latency to **10.20 ms** to fit within the 2.0-second streaming budget.
- **Hierarchical Decision Rule:** Resolves multi-class probability fragmentation where attack probabilities split across stages (e.g. 35% Recon + 11% Lateral + 9% Initial Access = 55% attack) were erroneously defaulted to Benign (45%) under naive argmax.
- **Calibrated Alert Threshold & Persistence Filtering:** Calibrated at $\tau = 0.75$ with $N=2$ consecutive-window confirmation, reducing false alarms by nearly 3x compared to the static baseline.

---

## 5. Consolidated Empirical Evaluation (2,234 Held-Out Test Sequences)

| Metric | World Model (Calibrated $\tau=0.75$) | Baseline (Native $\tau=0.50$) | Normalized Same-Threshold ($\tau=0.50$) | Operational Impact |
| :--- | :--- | :--- | :--- | :--- |
| **Binary F1 Score** | **0.7153** | 0.5479 | **0.6789** vs 0.5479 | +30.6% Genuine F1 Gain |
| **Attack Precision**| **63.43%** | 39.31% | **54.91%** vs 39.31% | +61.4% Fewer False Alarms |
| **Attack Recall**   | **82.01%** | 90.38% | **88.91%** vs 90.38% | Both sustain high attack coverage |
| **False Positive Rate**| **12.87%** | 37.98% | **19.87%** vs 37.98% | Baseline flags 38% of benign windows! |
| **ROC-AUC Score**   | **0.9116** | 0.7884 | 0.9116 vs 0.7884 | +15.6% Separation Quality |
| **Threat Lead Time**| **1.50s ahead** | 0.00s (Static) | 1.50s vs 0.00s | Proactive warning prior to compromise |
| **Pipeline Latency**| **10.20 ms** | 1.10 ms | 10.20 ms | 99.49% idle headroom in 2.0s window |
| **Peak RAM Stack**  | **783.5 MB** (Python) + **13.9 MB** (Redis) | Minimal | Fits comfortably in 16GB laptop RAM |

---

## 6. Documented Limitations
1. **Initial Access Temporal Smoothing:** Brief 1-second exploit spikes are masked in the 10-second hidden state by preceding active scans (World Model F1 = 0.0000 vs. Baseline 0.1373–0.2245 on Stage 2).
2. **Persistence Filtering Independence Assumption:** The estimated 1.65% alert rate under 2-window filtering assumes independent noise; real correlated network bursts may produce higher alert volumes.
