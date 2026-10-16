import pytest
from sqlalchemy import Row, func
from sqlalchemy import select as core_select
from sqlmodel import Session, select

from models import Hero, create_db_engine, seed
from queries import names_on_team, recruit, strongest, team_sizes, total_heroes


@pytest.fixture()
def session():
    engine = create_db_engine()
    seed(engine)
    with Session(engine) as s:
        yield s


def test_core_select_does_not_scalarize_one_column(session):
    stmt = core_select(Hero.name).order_by(Hero.name)
    rows = session.exec(stmt).all()
    assert all(isinstance(row, Row) for row in rows)
    assert rows[0][0] == "iron"
    assert list(session.exec(stmt).scalars()) == ["iron", "loki", "thor"]


def test_sqlmodel_select_scalarizes_one_column(session):
    stmt = select(Hero.name).order_by(Hero.name)
    assert list(session.exec(stmt)) == ["iron", "loki", "thor"]


def test_entity_core_select_yields_row_tuples(session):
    core_rows = session.exec(core_select(Hero)).all()
    assert all(isinstance(row, Row) for row in core_rows)
    assert core_rows[0][0].name == "iron"

    models = session.exec(select(Hero)).all()
    assert all(isinstance(row, Hero) for row in models)


def test_group_by_rows_read_by_attribute_or_index(session):
    assert team_sizes(session) == [("avengers", 2), ("villains", 1)]


def test_count_shape_differs_between_select_helpers(session):
    assert total_heroes(session) == 3
    assert session.exec(select(func.count()).select_from(Hero)).one() == 3


def test_core_insert_returning(session):
    new_id = recruit(session, "odin", "avengers", 10)
    best = strongest(session)
    assert best.name == "odin"
    assert best.id == new_id
