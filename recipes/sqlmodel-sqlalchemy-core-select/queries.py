from sqlalchemy import func, insert
from sqlalchemy import select as core_select

from models import Hero


def names_on_team(session, team: str) -> list[str]:
    # Core select of one column still yields Row tuples, so unwrap with scalars().
    stmt = core_select(Hero.name).where(Hero.team == team).order_by(Hero.name)
    return list(session.exec(stmt).scalars())


def team_sizes(session) -> list[tuple[str, int]]:
    # A multi-column Core select returns Rows accessible by attribute or index.
    stmt = (
        core_select(Hero.team, func.count(Hero.id).label("n"))
        .group_by(Hero.team)
        .order_by(Hero.team)
    )
    return [(row.team, row.n) for row in session.exec(stmt)]


def strongest(session) -> Hero | None:
    # A Core select of the entity wraps each model in a Row tuple; unpack it.
    stmt = core_select(Hero).order_by(Hero.power.desc())
    row = session.exec(stmt).first()
    return row[0] if row else None


def total_heroes(session) -> int:
    # Core count() comes back as a one-column Row; SQLModel's select() does not.
    return session.exec(core_select(func.count()).select_from(Hero)).one()[0]


def recruit(session, name: str, team: str, power: int) -> int:
    # Core insert with RETURNING: read the value before committing on sqlite.
    result = session.execute(
        insert(Hero).values(name=name, team=team, power=power).returning(Hero.id)
    )
    new_id = result.scalar_one()
    session.commit()
    return new_id
