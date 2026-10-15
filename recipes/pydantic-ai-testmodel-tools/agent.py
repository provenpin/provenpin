import sqlite3
from dataclasses import dataclass

from pydantic import BaseModel
from pydantic_ai import Agent, RunContext


@dataclass
class Deps:
    db: sqlite3.Connection


class Quote(BaseModel):
    item: str
    qty: int
    total_cents: int


# No model here on purpose: production code passes one at run time,
# and tests must override it. An unoverridden run fails loudly.
agent = Agent(
    deps_type=Deps,
    output_type=Quote,
    system_prompt="You quote prices. Always call lookup_price first.",
)


@agent.tool
def lookup_price(ctx: RunContext[Deps], item: str) -> int:
    """Return the unit price in cents for an item."""
    row = ctx.deps.db.execute("SELECT cents FROM prices WHERE item = ?", (item,)).fetchone()
    if row is None:
        raise ValueError(f"unknown item: {item}")
    return row[0]
