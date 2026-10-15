import click
from rich.console import Console
from rich.progress import (
    BarColumn,
    Progress,
    SpinnerColumn,
    TextColumn,
    TimeElapsedColumn,
)
from rich.status import Status


def normalize(item: str) -> str:
    if not item.strip():
        raise ValueError("empty item")
    return item.strip().lower().replace(" ", "-")


def make_progress(console: Console, transient: bool) -> Progress:
    return Progress(
        SpinnerColumn(),
        TextColumn("[bold blue]{task.description}"),
        BarColumn(),
        TextColumn("{task.completed}/{task.total}"),
        TimeElapsedColumn(),
        console=console,
        transient=transient,
    )


def run_batch(items, console: Console, transient: bool = True):
    with Status("[bold]validating[/]", console=console):
        for item in items:
            normalize(item)
    results = []
    with make_progress(console, transient) as progress:
        task = progress.add_task("processing", total=len(items))
        for item in items:
            results.append(normalize(item))
            progress.advance(task)
    return results


@click.command()
@click.argument("items", nargs=-1, required=True)
@click.option("--transient/--no-transient", default=True, help="Erase bars when done.")
def main(items, transient):
    console = Console()
    results = run_batch(items, console, transient=transient)
    console.print(f"[green]done[/] {len(results)} items")
    for result in results:
        console.print(result)


if __name__ == "__main__":
    main()
