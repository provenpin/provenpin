from typing import Optional

from sqlmodel import Field, SQLModel, create_engine


class Hero(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    team: str = "avengers"
    power: int = 0


def create_db_engine():
    engine = create_engine("sqlite://")
    SQLModel.metadata.create_all(engine)
    return engine


def seed(engine) -> None:
    from sqlmodel import Session

    with Session(engine) as session:
        session.add_all(
            [
                Hero(name="iron", team="avengers", power=7),
                Hero(name="thor", team="avengers", power=9),
                Hero(name="loki", team="villains", power=6),
            ]
        )
        session.commit()
