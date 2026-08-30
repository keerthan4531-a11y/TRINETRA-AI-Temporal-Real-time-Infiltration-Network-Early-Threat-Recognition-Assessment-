"""
CLI Flagged Flows Table View.
Displays flagged suspicious network flows with colored severity badges and telemetry stats.
"""

from rich.panel import Panel
from rich.table import Table
from rich import box
from typing import List, Dict, Any


def render_flagged_flows_table(flows: List[Dict[str, Any]]) -> Panel:
    """Renders table of suspicious network flows."""
    table = Table(
        expand=True,
        border_style="bright_red",
        box=box.HEAVY,
        header_style="bold red"
    )
    table.add_column("Time", justify="center", style="dim", width=8)
    table.add_column("Source Endpoint", justify="left", style="bold white", width=22)
    table.add_column("Destination Endpoint", justify="left", style="bold white", width=22)
    table.add_column("Proto", justify="center", style="cyan", width=6)
    table.add_column("Bytes", justify="right", style="magenta", width=10)
    table.add_column("Packets", justify="right", style="magenta", width=8)
    table.add_column("Flags", justify="center", style="yellow", width=10)
    table.add_column("Threat Severity", justify="center", width=16)

    if not flows:
        table.add_row("-", "-", "-", "-", "-", "-", "-", "[bold green][OK] ALL CLEAR • NORMAL TRAFFIC[/bold green]")
    else:
        for f in flows[-6:]: # show last 6
            sev = f.get("severity", "LOW")
            if sev == "NORMAL":
                sev_styled = "[bold green]NORMAL[/bold green]"
            elif sev == "LOW":
                sev_styled = "[bold blue]LOW PROBE[/bold blue]"
            elif sev == "MEDIUM":
                sev_styled = "[bold yellow]SUSPICIOUS[/bold yellow]"
            elif sev == "HIGH":
                sev_styled = "[bold magenta]LATERAL[/bold magenta]"
            else:
                sev_styled = "[bold red blink]CRITICAL C2[/bold red blink]"

            ts = f.get("timestamp", 0.0)
            table.add_row(
                f"{ts:5.1f}s",
                f"{f.get('src_ip', '147.32.84.165')}:{f.get('src_port', 4444)}",
                f"{f.get('dst_ip', '147.32.80.9')}:{f.get('dst_port', 80)}",
                str(f.get("protocol", "TCP")),
                f"{int(f.get('bytes_transferred', 0)):,}",
                f"{int(f.get('packets_transferred', 0)):,}",
                str(f.get("flags", "SYN")),
                sev_styled
            )

    return Panel(
        table,
        title="[bold red]🚨 FLAGGED MALICIOUS / SUSPICIOUS TELEMETRY FLOWS[/bold red]",
        border_style="bright_red",
        box=box.DOUBLE
    )
