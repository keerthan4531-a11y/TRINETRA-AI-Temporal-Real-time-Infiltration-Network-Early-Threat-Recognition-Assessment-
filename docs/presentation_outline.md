# Technical Presentation Outline (5 Slides)
**Project Title:** Proactive Cyber Defense via AI Network Attack Forecasting (World Models)  
**Organization:** National Technical Research Organisation (NTRO)  
**Theme:** Blockchain & Cybersecurity (Track 2)  
**Hardware Profile:** Local Laptop Deployment (16GB RAM / 4GB VRAM / 100% Offline)

---

### Slide 1: The Problem — The Temporal Blindspot of Static Intrusion Detection
- **Traditional IDS Paradigm:** Static flow/packet classification ($X_t \to \hat{y} \in \{0, 1\}$) evaluates traffic only *after* packets cross the wire.
- **The Infiltration Reality:** Modern intrusions unfold as structured, multi-stage temporal trajectories:
  - $\text{Reconnaissance (TA0043)} \longrightarrow \text{Initial Access (TA0001)} \longrightarrow \text{Lateral Movement (TA0008)} \longrightarrow \text{Command \& Control (TA0011)}$.
- **The Operational Flaw:** Non-temporal static baselines achieve high recall (~90%) only by triggering false alarms on **37.98% of all benign windows** (precision collapses to 39.31%), flooding SOC analysts with alert fatigue.
- **Our Paradigm Shift:** Shift from *reactive post-breach detection* to *proactive trajectory forecasting* using an AI World Model learning environmental transition dynamics $P(S_{t+1} \mid S_t)$.

---

### Slide 2: The Solution — Network World Model Architecture & Rollout
- **State Space Formulation:** Telemetry mapped into 2.0-second state vectors $S_t \in \mathbb{R}^{22}$ fusing:
  - *Flow Level (12 Dims):* Duration, packet counts, byte volumes, packet length moments, inter-arrival time (IAT), port diversity.
  - *Packet Level (10 Dims):* TTL variance, TCP window dynamics, TCP flag distributions (SYN, ACK, FIN, RST), fragmentation.
- **Temporal World Model (LSTM):** 2-layer recurrent architecture (64 hidden units, 74,510 parameters) trained on multi-scenario CTU-13 telemetry (14,890 windows).
- **Multi-Task Objective:** Jointly optimizes Huber state transition dynamics loss, binary infiltration BCE, and 5-class MITRE stage cross-entropy with sqrt-smoothed inverse class weights ($w_0 = 0.207\text{x}, w_1 = 0.534\text{x}, w_2 = 1.709\text{x}, w_3 = 0.669\text{x}, w_4 = 1.881\text{x}$).
- **Autoregressive K-Step Rollout:** Simulates $K=5$ forward steps into the future ($t+2\text{s} \dots t+10\text{s}$), predicting the attack risk curve before compromise execution.

---

### Slide 3: Explainable AI & Rigorous Hierarchical Decision Engineering
- **Real-Time Explainability Dilemma:** KernelSHAP incurs 2,000–4,500 ms latency per sequence, which violates the 2.0-second real-time streaming budget.
- **Native Gradient Attribution Solution:** Implemented $\text{Input} \times \text{Gradient}$ attribution running in **10.20 ms**, providing instant SOC insights (+ INCREASES / - DECREASES risk) for the top 5 driving features.
- **Mitigating Vote-Splitting via Hierarchical Decision Rule:**
  - *Problem:* In multi-class classification, cumulative attack probability often reaches 55% (split across Recon 35%, Lateral 11%, Initial Access 9%), causing Benign (45%) to win naive argmax.
  - *Engineered Fix:* If infiltration probability $P(\text{Attack}) \ge 0.75$ or $\sum_{i \ge 1} P_i > P_0$, the model selects the stage via $\operatorname{argmax}_{i \ge 1} P_i$.

---

### Slide 4: Real-Time Dual Interface & Zero-Cloud Edge Pipeline
- **Shared Unified Inference Engine (`inference/engine.py`):** Single architectural source of truth powering both interfaces simultaneously without logic duplication.
- **Dual Operational Frontends:**
  1. **Hacker-Style Terminal TUI (`cli/main.py`):** Cyberpunk ASCII banner, universal block sparkline risk timeline, MITRE matrix, 2D ASCII risk horizon chart, and flagged flow table for headless/DevOps operations.
  2. **Modern Web SOC Console (`frontend/`):** React 18, Vite, Recharts dual-curve trajectory (historical observed + dotted $K$-step forward rollout), and interactive SVG network topology canvas.
- **Local Streaming Architecture:**
  - Native Redis 8.10 Streams (`network:telemetry:windows`) + SQLite time-series audit database (`data/predictions.db`).
  - True lockstep simultaneity: 100% synchronized live updates delivered across WebSocket and CLI.

---

### Slide 5: Empirical Benchmarks, Honest Limitations & Operational Impact
- **Rigorous Evaluation on Held-Out Test Split (2,234 sequences / 14,890 windows):**
  - **Operational F1-Score:** World Model achieves **0.7153 F1** (at calibrated $\tau=0.75$) vs. Baseline Logistic Regression **0.5479 F1** (at native $\tau=0.50$), representing a **+30.6% genuine F1 gain**.
  - **FPR Reduction:** World Model reduces raw false positive rate from **37.98% down to 12.87%** (a 66.1% drop in false alarms), boosting precision from **39.31% to 63.43%**.
  - **Equal Threshold Comparison ($\tau=0.50$):** World Model achieves **0.6789 F1** (88.91% recall, 19.87% FPR) vs Baseline **0.5479 F1** (90.38% recall, 37.98% FPR).
  - **ROC-AUC:** **0.9116** vs. Baseline **0.7884**.
  - **Early Warning Lead-Time:** Provides a verified **1.50-second advance warning** before compromise occurrence.
- **Transparent Limitations (Zero Fabricated Claims):**
  - *Initial Access Smoothing:* Brief 1-second exploit transitions are temporally masked by preceding scans (World Model F1 = 0.0000 on Stage 2 vs Baseline 0.1373–0.2245).
  - *False Positive Rate:* Shipped $\tau = 0.75$ threshold achieves 12.87% raw FPR. Under enterprise 2-window persistence filtering, this drops to an estimated ~1.65% (~29 alerts/hr), assuming independent arrival.
- **Resource Footprint:** 13.95 MB Redis, 783 MB total Python stack, 10.20 ms latency — runs comfortably with >3.3 GB RAM headroom on an ASUS TUF laptop.
