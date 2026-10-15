from __future__ import annotations

import io

import typer
from rich import box
from rich.console import Console
from rich.progress import (
    BarColumn,
    Progress,
    SpinnerColumn,
    TextColumn,
    TimeElapsedColumn,
)
from rich.table import Table

app = typer.Typer(add_completion=False)


def square(n: int) -> int:
    return n * n


def build_table(rows: list[tuple[int, int]], *, ascii_only: bool = False) -> Table:
    table = Table(
        title="Batch summary",
        box=box.ASCII if ascii_only else box.HEAVY_HEAD,
        header_style="bold",
    )
    table.add_column("input", justify="right")
    table.add_column("square", justify="right")
    for value, result in rows:
        table.add_row(str(value), str(result))
    return table


def render_table(rows: list[tuple[int, int]], *, ascii_only: bool = False) -> str:
    console = Console(file=io.StringIO(), width=40, record=True)
    console.print(build_table(rows, ascii_only=ascii_only))
    return console.export_text()


@app.command()
def run(
    values: list[int] = typer.Argument(..., help="Numbers to square."),
    quiet: bool = typer.Option(False, "--quiet", "-q", help="Hide the progress bar."),
) -> None:
    rows: list[tuple[int, int]] = []
    console = Console()
    progress = Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TimeElapsedColumn(),
        console=console,
        transient=True,
        disable=quiet,
    )
    with progress:
        task = progress.add_task("squaring", total=len(values))
        for value in values:
            rows.append((value, square(value)))
            progress.advance(task)
    console.print(build_table(rows))


if __name__ == "__main__":
    app()
