"""
CLI Explainability / Feature Attribution View.
Displays top driving features computed via PyTorch autograd / Gradient x Input attribution.
"""

from rich.panel import Panel
from rich.table import Table
from rich import box
from typing import List, Dict, Any


def render_explain_panel(top_features: List[Dict[str, Any]]) -> Panel:
    """Renders driving feature attribution bar table."""
    table = Table(
        expand=True,
        border_style="bright_cyan",
        box=box.HEAVY,
        header_style="bold cyan"
    )
    table.add_column("Rank", justify="center", style="bold white", width=6)
    table.add_column("Feature Telemetry Attribute", justify="left", style="bold white", width=25)
    table.add_column("Importance Weight", justify="left", width=22)
    table.add_column("Observed Value", justify="right", style="cyan", width=14)
    table.add_column("Risk Impact", justify="center", width=18)

    for i, feat in enumerate(top_features):
        imp = feat.get("importance", 0.0)
        filled = int(imp * 12)
        direction = feat.get("impact", "INCREASES_RISK")
        
        if direction == "INCREASES_RISK":
            impact_badge = "[bold red]+ INCREASES[/bold red]"
            bar_color = "red"
        else:
            impact_badge = "[bold green]- DECREASES[/bold green]"
            bar_color = "green"
            
        bar = f"[{bar_color}]{'#' * filled}{'.' * (12 - filled)}[/{bar_color}] {imp:.3f}"
        
        table.add_row(
            f"#{i+1}",
            f"[bold cyan]{feat.get('feature', 'unknown')}[/bold cyan]",
            bar,
            f"{feat.get('raw_value', 0.0):.2f}",
            impact_badge
        )

    return Panel(
        table,
        title="[bold green]🔍 REAL-TIME XAI DECISION SUPPORT (GRADIENT ATTRIBUTION)[/bold green]",
        border_style="bright_cyan",
        box=box.DOUBLE
    )
