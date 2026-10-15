from sqlalchemy import event
from sqlalchemy.pool import StaticPool
from sqlmodel import Field, Relationship, SQLModel, create_engine


class HeroMissionLink(SQLModel, table=True):
    hero_id: int | None = Field(default=None, foreign_key="hero.id", primary_key=True)
    mission_id: int | None = Field(default=None, foreign_key="mission.id", primary_key=True)


class Team(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    heroes: list["Hero"] = Relationship(back_populates="team")


class Hero(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    team_id: int | None = Field(default=None, foreign_key="team.id")
    team: Team | None = Relationship(back_populates="heroes")
    missions: list["Mission"] = Relationship(back_populates="heroes", link_model=HeroMissionLink)


class Mission(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    title: str
    heroes: list[Hero] = Relationship(back_populates="missions", link_model=HeroMissionLink)


def make_engine():
    # One shared connection so every session sees the same in-memory database.
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # SQLite ignores foreign keys unless this pragma is set per connection.
    @event.listens_for(engine, "connect")
    def _enable_fks(dbapi_conn, _record):
        cur = dbapi_conn.cursor()
        cur.execute("PRAGMA foreign_keys=ON")
        cur.close()

    SQLModel.metadata.create_all(engine)
    return engine
