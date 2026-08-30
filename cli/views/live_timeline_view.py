"""
CLI Live Timeline & ATT&CK Progression View.
Renders K-step forward simulation trajectory with ASCII sparkline.
"""

from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from rich import box
from typing import List, Optional
from ..ui import format_probability_bar, build_sparkline


def render_trajectory_panel(
    future_probs: List[float],
    current_stage: str,
    severity: str,
    tactic_id: str,
    future_stages: Optional[List[str]] = None,
    ia_warning: bool = False,
    history_probs: Optional[List[float]] = None
) -> Panel:
    """Renders the forward rollout trajectory and current attack stage."""
    table = Table(
        expand=True,
        border_style="bright_cyan",
        box=box.HEAVY,
        header_style="bold cyan"
    )
    table.add_column("Step", justify="center", style="bold white", width=6)
    table.add_column("Horizon", justify="center", style="dim cyan", width=8)
    table.add_column("Predicted Infiltration Risk", justify="left", width=30)
    table.add_column("Projected ATT&CK Stage", justify="left")

    for i, p in enumerate(future_probs):
        step_label = f"t + {i + 1}"
        horizon = f"+{(i + 1) * 2.0:.1f}s"
        bar = format_probability_bar(p, width=14)
        stg_name = future_stages[i] if future_stages and i < len(future_stages) else current_stage
        
        # Color projected stage
        if "Benign" in stg_name:
            stg_styled = f"[bold green]{stg_name}[/bold green]"
        elif "Recon" in stg_name:
            stg_styled = f"[bold blue]{stg_name}[/bold blue]"
        elif "Initial" in stg_name:
            stg_styled = f"[bold yellow]{stg_name}[/bold yellow] [!]"
        elif "Lateral" in stg_name:
            stg_styled = f"[bold magenta]{stg_name}[/bold magenta]"
        else:
            stg_styled = f"[bold red]{stg_name}[/bold red] [*]"

        table.add_row(step_label, horizon, bar, stg_styled)

    # Sparkline of historical progression
    spark = build_sparkline(history_probs or future_probs, width=16)
    
    stage_color = "bold green" if severity == "NORMAL" else "bold yellow" if severity in ["LOW", "MEDIUM"] else "bold red"
    warning_badge = " [bold red blink][!] INITIAL ACCESS BURST WARNING[/bold red blink]" if ia_warning else ""
    
    footer_text = Text.from_markup(
        f"[bold white]Current Predicted Stage:[/bold white] [{stage_color}]{current_stage}[/{stage_color}] "
        f"([cyan]{tactic_id}[/cyan]) | [bold]Severity:[/bold] [{stage_color}]{severity}[/{stage_color}]{warning_badge}\n"
        f"[dim cyan]Historical Risk Sparkline:[/dim cyan] {spark}"
    )

    return Panel(
        table,
        title="[bold green]⚡ K-STEP FORWARD WORLD MODEL ROLLOUT FORECAST[/bold green]",
        subtitle=footer_text,
        border_style="bright_green",
        box=box.DOUBLE
    )
