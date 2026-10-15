import csv
from pathlib import Path
from typing import Annotated

import typer
from rich import box
from rich.console import Console
from rich.markup import escape
from rich.table import Table

app = typer.Typer(add_completion=False)


def read_report(path: Path) -> list[tuple[str, int, float]]:
    # csv.DictReader, not str.split(","), so quoted fields like "North, East"
    # stay one field instead of being torn apart.
    with path.open(newline="", encoding="utf-8") as fh:
        return [
            (row["region"], int(row["units"]), float(row["revenue"]))
            for row in csv.DictReader(fh)
        ]


def aggregate(rows: list[tuple[str, int, float]]) -> dict[str, list[float]]:
    totals: dict[str, list[float]] = {}
    for region, units, revenue in rows:
        acc = totals.setdefault(region, [0, 0.0])
        acc[0] += units
        acc[1] += revenue
    return totals


def build_table(totals: dict[str, list[float]]) -> Table:
    table = Table(title="Batch report", box=box.SIMPLE)
    table.add_column("Region")
    table.add_column("Units", justify="right")
    table.add_column("Revenue", justify="right")
    for region, (units, revenue) in sorted(totals.items()):
        # escape() so a region such as "[red]x[/]" renders literally.
        table.add_row(escape(region), str(int(units)), f"{revenue:,.2f}")
    table.add_row(
        "TOTAL",
        str(int(sum(u for u, _ in totals.values()))),
        f"{sum(r for _, r in totals.values()):,.2f}",
        style="bold",
    )
    return table


def export_csv(totals: dict[str, list[float]], out: Path) -> None:
    # newline="" per the csv docs; without it Windows inserts blank rows.
    with out.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        writer.writerow(["region", "units", "revenue"])
        for region, (units, revenue) in sorted(totals.items()):
            # Raw numbers only: the human table's "1,234.50" would break parsing.
            writer.writerow([region, int(units), f"{revenue:.2f}"])


@app.command()
def report(
    sources: Annotated[
        list[Path], typer.Argument(exists=True, dir_okay=False, readable=True)
    ],
    out: Annotated[
        Path | None, typer.Option("--out", "-o", help="Write aggregated CSV here.")
    ] = None,
    plain: Annotated[bool, typer.Option("--plain", help="Disable color.")] = False,
) -> None:
    rows = [row for path in sources for row in read_report(path)]
    totals = aggregate(rows)
    # Console built per call: a module-level one binds to the real stdout at
    # import time and bypasses CliRunner's captured streams.
    console = Console(color_system=None if plain else "auto", width=100)
    console.print(build_table(totals))
    if out is not None:
        export_csv(totals, out)
        console.print(f"wrote {out}")


if __name__ == "__main__":
    app()
