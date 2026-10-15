import json
from pathlib import Path
from typing import Annotated

import typer
from rich import box
from rich.console import Console
from rich.markup import escape
from rich.progress import track
from rich.table import Table

app = typer.Typer(add_completion=False)


def make_console(*, stderr: bool = False, color: bool = True) -> Console:
    # Build the Console per invocation. A module-level Console binds to the
    # real sys.stdout at import time and misses CliRunner's captured streams.
    return Console(stderr=stderr, color_system="auto" if color else None, width=80)


@app.command()
def report(
    path: Annotated[Path, typer.Argument(exists=True, dir_okay=False, readable=True)],
    json_out: Annotated[bool, typer.Option("--json", help="Emit JSON instead of a table.")] = False,
    plain: Annotated[bool, typer.Option("--plain", help="Disable color.")] = False,
) -> None:
    rows = json.loads(path.read_text())
    if json_out:
        # Keep stdout pure JSON so it can be piped into other tools.
        typer.echo(json.dumps(rows, indent=2))
        return

    # Progress goes to stderr so it never corrupts the table on stdout.
    err = make_console(stderr=True, color=not plain)
    table = Table(box=box.SIMPLE, show_edge=False)
    table.add_column("name")
    table.add_column("count", justify="right")
    for row in track(rows, description="Building table", console=err, disable=not err.is_terminal):
        # Escape user data so values like "[bold]" are printed literally.
        table.add_row(escape(str(row["name"])), str(row["count"]))
    make_console(color=not plain).print(table)


if __name__ == "__main__":
    app()
