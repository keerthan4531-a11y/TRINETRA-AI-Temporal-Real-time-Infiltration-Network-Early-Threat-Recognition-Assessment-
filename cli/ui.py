"""
Terminal UI Styling, Layout Utilities, and ASCII Sparklines using Rich.
High-contrast hacker cyber aesthetic with neon green, cyan, amber, and crimson accents.
Optimized for Windows Terminal, PowerShell, and standard Linux shells.
"""

from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from rich import box
from typing import List, Dict, Any, Optional

console = Console()


def print_boot_splash(device: str = "CPU", console_instance: Optional[Console] = None):
    """Renders a brief, professional cyber startup splash banner."""
    c = console_instance or console
    banner_text = (
        "[bold green]   _  ____________________     ___    ____  [/bold green]\n"
        "[bold cyan]  / |/ /_  __/ _ \\/ __/ _ |   /   |  /  _/  [/bold cyan]\n"
        "[bold cyan] /    / / / / , _/ _// __ |  / /| |  / /    [/bold cyan]\n"
        "[bold green]/_/|_/ /_/ /_/|_/___/_/ |_| /_/ |_|_/___/   [/bold green]\n"
        "[bold white]AI NETWORK ATTACK FORECASTING ENGINE • SOC DEFENSE TERMINAL[/bold white]\n"
        "[dim cyan]NTRO Track 2 • 100% Local & Offline Edge Architecture • Device: " + device.upper() + "[/dim cyan]"
    )
    p = Panel(
        Text.from_markup(banner_text, justify="center"),
        border_style="bright_cyan",
        box=box.HEAVY,
        padding=(1, 2)
    )
    c.print(p)
    c.print("[dim cyan][*] Initializing PyTorch World Model Engine (LSTM W=10, K=5)... [bold green][OK][/bold green][/dim cyan]")
    c.print("[dim cyan][*] Subscribing to Redis Stream: network:telemetry:windows...   [bold green][OK][/bold green][/dim cyan]")
    c.print("[dim cyan][*] Calibrated Threat Decision Gate: tau=0.75 (N=2 persist)...  [bold green][OK][/bold green][/dim cyan]\n")


def create_header_panel(device: str = "cpu", ram_mb: float = 322.0) -> Panel:
    """Generates the high-impact cyber command terminal banner for live views."""
    title_art = (
        "[bold green]   _  ____________________     ___    ____  [/bold green]\n"
        "[bold cyan]  / |/ /_  __/ _ \\/ __/ _ |   /   |  /  _/  [/bold cyan]\n"
        "[bold cyan] /    / / / / , _/ _// __ |  / /| |  / /    [/bold cyan]\n"
        "[bold green]/_/|_/ /_/ /_/|_/___/_/ |_| /_/ |_|_/___/   [/bold green]\n"
        "[bold white]AI NETWORK ATTACK FORECASTING ENGINE • LIVE COMMAND TERMINAL[/bold white]"
    )

    status_bar = (
        f"[dim cyan]P(S_{{t+1}}|S_t) WORLD MODEL • W=10 LOOKBACK • K=5 ROLLOUT • HARDWARE: {device.upper()} ({ram_mb:.1f} MB RAM)[/dim cyan]\n"
        f"[bold green][*] STATUS: ACTIVE FORECASTING[/bold green] | [bold cyan]REDIS STREAM: CONNECTED[/bold cyan] | [bold yellow]GATE: &tau;=0.75[/bold yellow]"
    )

    content = Text.from_markup(f"{title_art}\n\n{status_bar}", justify="center")
    return Panel(
        content,
        border_style="bright_cyan",
        box=box.HEAVY,
        padding=(1, 2)
    )


def build_sparkline(values: List[float], width: int = 15) -> str:
    """Generates an ASCII sparkline from a series of floats [0.0 - 1.0]."""
    if not values:
        return "[dim]--------------[/dim]"

    ticks = ["_", ".", "-", "=", "+", "*", "%", "#"]
    line = []

    seq = values[-width:]
    for v in seq:
        clamped = max(0.0, min(1.0, float(v)))
        idx = min(7, int(clamped * 8))
        tick = ticks[idx]
        if clamped >= 0.75:
            line.append(f"[bold red]{tick}[/bold red]")
        elif clamped >= 0.40:
            line.append(f"[bold yellow]{tick}[/bold yellow]")
        else:
            line.append(f"[bold green]{tick}[/bold green]")

    return "".join(line)


def format_probability_bar(prob: float, width: int = 18) -> str:
    """Renders a stylized text progress bar with risk color coding."""
    p = max(0.0, min(1.0, float(prob)))
    filled = int(p * width)
    empty = width - filled

    if p >= 0.75:
        color = "bold red"
    elif p >= 0.40:
        color = "bold yellow"
    else:
        color = "bold green"

    bar = f"[{color}]{'#' * filled}{'.' * empty}[/{color}] [bold white]{p * 100:5.1f}%[/bold white]"
    return bar


def render_mitre_kill_chain(active_stage: int) -> Panel:
    """Renders the 5-stage MITRE ATT&CK progression matrix."""
    stages = [
        ("0: BENIGN", "NORMAL", "green"),
        ("1: RECONNAISSANCE", "TA0043", "blue"),
        ("2: INITIAL ACCESS", "TA0001", "yellow"),
        ("3: LATERAL MOVEMENT", "TA0008", "magenta"),
        ("4: COMMAND & CONTROL", "TA0011", "red")
    ]

    parts = []
    for idx, (name, tid, color) in enumerate(stages):
        if idx == active_stage:
            parts.append(f"[bold black on {color}] > {name} ({tid}) < [/bold black on {color}]")
        else:
            parts.append(f"[dim {color}] {name} [/dim {color}]")

    chain_text = Text.from_markup(" --> ".join(parts), justify="center")
    return Panel(chain_text, title="[bold cyan]MITRE ATT&CK KILL-CHAIN MATRIX[/bold cyan]", border_style="bright_blue", box=box.HEAVY)


def render_ascii_risk_chart(probs: List[float], width: int = 50, height: int = 5) -> str:
    """Renders a 2D ASCII line chart of the historical probability horizon."""
    if not probs:
        return "[dim]No telemetry data available for chart.[/dim]"

    # Subsample or interpolate to target width
    if len(probs) > width:
        indices = [int(i * (len(probs) - 1) / (width - 1)) for i in range(width)]
        sampled = [probs[i] for i in indices]
    else:
        sampled = probs

    lines = []
    threshold_lvl = int(0.75 * height)

    for h in range(height - 1, -1, -1):
        row_chars = []
        val_lvl = (h + 0.5) / height
        is_threshold_row = (h == threshold_lvl)

        # Y-axis label
        label = f"{val_lvl*100:3.0f}% | "
        if is_threshold_row:
            row_chars.append(f"[bold red]{label}[/bold red]")
        else:
            row_chars.append(f"[dim cyan]{label}[/dim cyan]")

        for p in sampled:
            cell_p = max(0.0, min(1.0, float(p)))
            cell_h = int(cell_p * height)

            if cell_h > h:
                # Filled bar
                if cell_p >= 0.75:
                    row_chars.append("[bold red]#[/bold red]")
                elif cell_p >= 0.40:
                    row_chars.append("[bold yellow]=[/bold yellow]")
                else:
                    row_chars.append("[bold green]-[/bold green]")
            elif cell_h == h:
                # Peak marker
                if cell_p >= 0.75:
                    row_chars.append("[bold red]o[/bold red]")
                elif cell_p >= 0.40:
                    row_chars.append("[bold yellow]o[/bold yellow]")
                else:
                    row_chars.append("[bold green].[/bold green]")
            elif is_threshold_row:
                # Dotted threshold line
                row_chars.append("[dim red]~[/dim red]")
            else:
                row_chars.append(" ")

        lines.append("".join(row_chars))

    # X-axis line
    axis_line = "     +" + "-" * len(sampled)
    lines.append(f"[dim cyan]{axis_line}[/dim cyan]")
    time_label = f"     [dim]t-0{' ' * (len(sampled) - 12)}t-{len(probs)*2}s[/dim]"
    lines.append(time_label)

    return "\n".join(lines)


def render_analysis_summary_panel(
    total_windows: int,
    peak_risk: float,
    stage_sequence: List[str],
    flagged_count: int,
    severity_breakdown: Dict[str, int],
    probs_history: List[float]
) -> Panel:
    """Renders the comprehensive 'ANALYSIS COMPLETE' summary report panel."""
    # Transitions text
    transitions_str = " -> ".join(stage_sequence[:6])
    if len(stage_sequence) > 6:
        transitions_str += f" -> ... ({len(stage_sequence)} transitions)"

    chart_str = render_ascii_risk_chart(probs_history, width=54, height=5)

    peak_col = "bold red" if peak_risk >= 0.75 else "bold yellow" if peak_risk >= 0.40 else "bold green"

    summary_text = (
        f"[bold white]══════════════════════ STATISTICAL AUDIT SUMMARY ══════════════════════[/bold white]\n"
        f"  Total Windows Processed : [bold cyan]{total_windows:,}[/bold cyan] (2.0s cadence | {total_windows*2.0:.1f}s total duration)\n"
        f"  Peak Infiltration Risk  : [{peak_col}]{peak_risk*100:.1f}%[/{peak_col}] {'[HIGH ALERT]' if peak_risk >= 0.75 else '[ELEVATED]' if peak_risk >= 0.40 else '[NOMINAL]'}\n"
        f"  Total Flagged Flows     : [bold red]{flagged_count}[/bold red] malicious telemetry events\n"
        f"  Stage Progression Path  : [bold white]{transitions_str}[/bold white]\n\n"
        f"[bold white]══════════════════════ THREAT RISK HORIZON OVER TIME ══════════════════[/bold white]\n"
        f"{chart_str}\n\n"
        f"[bold white]══════════════════════ SEVERITY DISTRIBUTION ══════════════════════════[/bold white]\n"
        f"  [CRITICAL]: {severity_breakdown.get('CRITICAL', 0):>4}  |  "
        f"[HIGH]: {severity_breakdown.get('HIGH', 0):>4}  |  "
        f"[MEDIUM]: {severity_breakdown.get('MEDIUM', 0):>4}  |  "
        f"[NORMAL/LOW]: {severity_breakdown.get('NORMAL', 0) + severity_breakdown.get('LOW', 0):>4}"
    )

    return Panel(
        Text.from_markup(summary_text),
        title="[bold green]╔══ ANALYSIS COMPLETE ══╗[/bold green]",
        subtitle="[dim cyan]World Model Verification Finished[/dim cyan]",
        border_style="bright_green" if peak_risk < 0.75 else "bright_red",
        box=box.HEAVY,
        padding=(1, 2)
    )
