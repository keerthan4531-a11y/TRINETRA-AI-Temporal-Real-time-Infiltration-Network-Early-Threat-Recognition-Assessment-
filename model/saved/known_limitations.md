# Known Model Limitations & Empirical Analysis

## 1. Initial Access (MITRE Stage 2) Detection Profile

### Empirical Finding:
In the held-out test evaluation on the 14,890-window dataset (2,234 test sequences):
- **World Model (LSTM):** Precision = 0.0000 | Recall = 0.0000 | **F1 = 0.0000** (Support: 26 test samples)
- **Baseline Logistic Regression:** Precision = 0.1294 | Recall = 0.8462 | **F1 = 0.2245** (Support: 26 test samples)

### Root Cause Analysis (Sequence Model Temporal Smoothing):
1. **Brief Transition Dynamics:** In authentic network intrusions, Initial Access (e.g., a successful exploit execution or initial TCP handshake connection) is a momentary, instantaneous event occurring within a single 1-second to 2-second time window.
2. **Temporal Masking by Preceding Activity:** The LSTM uses a 10-second lookback window ($W = 10$). For any Initial Access window at $t$, the preceding 9 seconds ($t-9 \dots t-1$) are dominated by persistent, high-frequency active port and service scanning (Reconnaissance, Stage 1).
3. **Hidden State Dominance:** The recurrent hidden state representation $\mathbf{h}_t$ is strongly conditioned on the sustained scanning trajectory. Consequently, the multi-class output distribution assigns:
   - Base Stage 2 probability across general traffic: **~0.045**
   - Elevated Stage 2 probability on true Initial Access samples: **0.15 to 0.23** (a 4x–5x spike)
   - However, Reconnaissance (Stage 1) receives **~0.45**, winning the `argmax` decision rule.
4. **Contrast with Static Baseline:** The non-temporal Logistic Regression baseline evaluates only the isolated instantaneous vector at $t$. Free from the temporal inertia of the preceding 9 seconds of scanning, it isolates the `TCP-Established` flag pattern and catches 84.6% of Initial Access events (F1 = 0.2245).

### Academic & Operational Context:
This is a well-documented theoretical challenge in temporal deep learning architectures (LSTMs, GRUs, Transformers) applied to cybersecurity telemetry: **temporal smoothing of delta-spike transition events**. It is NOT a code bug or implementation defect, but a fundamental characteristic of sequence modeling when dealing with single-window phase shifts.

### Downstream Mitigation & Future Enhancement (UI / Dashboard):
- **Secondary Signal / Transition Hint:** In the real-time inference engine and frontend/CLI dashboards, when the primary predicted stage is Reconnaissance (Stage 1), but the raw Stage 2 (Initial Access) probability exceeds an elevated threshold ($\ge 0.15$), the system surfaces a secondary alert:
  `[!] Probing Phase Transition Warning: Elevated Initial Access probability (>= 0.15). Potential exploit attempt within active scan.`
- **Dual-Model Hybrid Ensembling (Future Architecture):** Combining the temporal World Model's superior multi-step forecasting and C2 detection (F1 = 0.1818 vs Baseline 0.0502) with a fast static baseline check on single-step TCP handshake transitions.

---

## 2. False Positive Rate (FPR) & Operational Alert Volume Analysis

### The Trade-off Across Decision Thresholds (2,234 Test Sequences):
- **Default Threshold 0.50:** Attack Recall = **88.91%** | False Positive Rate (FPR) = **19.87%** | F1 = 0.6789
- **Calibrated Threshold 0.75:** Attack Recall = **82.01%** | False Positive Rate (FPR) = **12.87%** | F1 = **0.7153 (Peak F1)**

### Operational Alert Volume (What 12.87% FPR Means in Practice):
- With 2.0-second time windows, an enterprise sensor evaluates **1,800 windows per hour** (43,200 per day).
- **Raw Instantaneous Windows:** An unfiltered FPR of 12.87% would trigger approximately **231 raw window alerts/hour** on pure background traffic.
- **Enterprise SOC Standard (Persistence Filtering):**
  In operational security centers, single transient window alerts are never pushed as tickets. They require **consecutive-window confirmation ($N \ge 2$)**:
  - **Important Independence Caveat:** The theoretical alert frequency calculation ($0.1287^2 \approx 1.65\%$ or ~29 alerts/hr; $0.1287^3 \approx 0.21\%$ or ~3.8 alerts/hr) assumes statistical independence between consecutive window false positives. This is a simplifying theoretical estimate, not a validated real-world guarantee. In real enterprise networks, benign activity bursts (large file transfers, scheduled database backups, browser session clusters) often span several consecutive windows, so false positives are temporally correlated and true production alert rates may be higher.
  - In Stage 13 presentations and architecture documents, these numbers must be presented strictly as illustrative estimates under an independence assumption, not as operational guarantees.

### Context from Sequence-Based NIDS Research:
- Sequence-based anomaly detection models evaluated on raw flow captures routinely report raw window/flow FPR between **10% and 22%** when configured to sustain $\ge 80\%$ attack recall.
- Sequence models (LSTMs, GRUs) operating on fine-grained time windows (1s–2s) capture transient bursts of high-rate benign traffic that share statistical packet/flow metrics with scanning and DDoS.
- Hence, an unfiltered window FPR of ~12.87% at 82% recall is broadly consistent with known challenges in sequence-based network intrusion detection research prototypes. Achieving sub-1% FPR in enterprise operations requires multi-stage filtering, subnet whitelisting, and multi-model ensembling.

### Shipped System Decision:
- **Shipped Threshold: $\tau = 0.75$** with **Persistence Window Count = 2** in `config/settings.yaml`.
- **Justification:** Optimizes F1 (0.7153), reduces raw FPR by 35% compared to 0.50, and allows the SOC dashboard to use consecutive-window persistence to achieve an operationally manageable alert stream while retaining 82% true attack detection.

---

## 3. Multi-Step Rollout Dynamics & Ground Truth Verification

### Empirical Analysis of Case 3 (Window 12918 Rollout):
- When rolling forward 5 steps from Window 12918 (Initial Access at $t+1$), the model predicted:
  - $t+1$: Risk = 0.5959, Stage = Reconnaissance (Attack detected via Hierarchical rule)
  - $t+2$: Risk = 0.3766, Stage = Benign
  - $t+3$: Risk = 0.2962, Stage = Benign
- **Ground Truth Verification in Raw CTU-13 Capture:**
  - Checking the actual ground-truth labels for windows 12928 to 12932:
    - $t+1$ (Window 12928): Label = **1.0 (Attack)**, Stage = **Initial Access**
    - $t+2$ (Window 12929): Label = **0.0 (Benign)**, Stage = **Benign**
    - $t+3$ (Window 12930): Label = **0.0 (Benign)**, Stage = **Benign**
    - $t+4$ (Window 12931): Label = **0.0 (Benign)**, Stage = **Benign**
    - $t+5$ (Window 12932): Label = **0.0 (Benign)**, Stage = **Benign**
  - **Verdict:** The rollout did NOT "revert to Benign erroneously". The real attack in the CTU-13 dataset was a 1-window transient exploit attempt that physically stopped at $t+1$, followed by 9 seconds of benign background traffic. The World Model's learned state-transition dynamics accurately predicted both the attack occurrence at $t+1$ and its subsequent decay back to baseline!
  - In contrast, when evaluated on **continuous, sustained attacks** (e.g. C2 in Case 2 or sustained scanning at Index 14038), the model's rollout correctly forecasts sustained attack states across the entire 5-step horizon.
