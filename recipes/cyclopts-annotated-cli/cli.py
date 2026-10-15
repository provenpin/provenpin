from __future__ import annotations

from enum import Enum
from typing import Annotated

from cyclopts import App, Parameter

app = App(name="tasks", help="Manage a small todo list.")


class Priority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


@app.command
def add(
    title: Annotated[str, Parameter(help="Short task description.")],
    *,
    priority: Annotated[Priority, Parameter(help="Task priority.")] = Priority.medium,
    copies: Annotated[int, Parameter(help="How many copies to create.")] = 1,
    tags: Annotated[list[str], Parameter(name="--tag", help="Attach a tag; repeat for many.")] = [],
    verbose: Annotated[bool, Parameter(help="Print extra detail.")] = False,
) -> dict:
    """Add a task to the list."""
    return {
        "title": title,
        "priority": priority.value,
        "copies": copies,
        "tags": tags,
        "verbose": verbose,
    }
