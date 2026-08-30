# Frontend Design System & Theme Specification

This document details the enterprise Security Operations Center (SOC) visual system implemented for the **AI Network Attack Forecasting** dashboard.

## 1. Color Palette

- **Background Base (`--bg-base`):** `#070a0f` — Deep tactical near-black canvas.
- **Card Surfaces (`--bg-card`):** `#0f172a` — Dark slate container cards with subtle elevation.
- **Card Hover (`--bg-card-hover`):** `#141e33` — Interactive card highlight.
- **Signature Accent (`--cyan-accent`):** `#00d9ff` — High-tech electric cyan for interactive states and telemetry highlights.
- **Muted Accent (`--cyan-muted`):** `#0284c7` — Darker blue/cyan for axis lines and secondary charts.

### Severity Scale
- **Normal / Benign (`--severity-normal`):** `#10b981` (Green) — Clean telemetry, zero active alerts.
- **Low (`--severity-low`):** `#06b6d4` (Cyan) — Background reconnaissance scanning.
- **Medium / Warning (`--severity-medium`):** `#f59e0b` (Amber) — Probing / early transition warnings (risk $\ge 40\%$).
- **High Alert (`--severity-high`):** `#f97316` (Orange) — Lateral movement or exploitation attempts.
- **Critical Breach (`--severity-critical`):** `#ff3860` (Threat Red/Rose) — Verified persistent attack ($\ge 75\%$ risk).

## 2. Typography

- **Headings & Labels (`--font-sans`):** `Outfit`, `-apple-system`, `sans-serif` — Modern geometric sans-serif for clean hierarchy.
- **Data & Numbers (`--font-mono`):** `JetBrains Mono`, `Fira Code`, `monospace` — Strict tabular figures (`tnum`) for IP addresses, ports, probabilities, and hashes.

## 3. Motion & Micro-Interactions

- **Live Status Pulsing:** `.pulse-dot-green` and `.pulse-dot-red` provide continuous visual heartbeat of WebSocket telemetry.
- **Zebra Striped Rows & Flash:** New flagged flows entering the table trigger `.row-new` cyan fade transitions.
- **Chart Area Gradients:** Dynamic color-shifting fills that reflect real-time risk severity.
