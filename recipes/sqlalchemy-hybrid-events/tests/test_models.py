import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from models import Account, Base


@pytest.fixture
def session():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    with Session(engine) as s:
        yield s
    engine.dispose()


def test_hybrid_instance_and_expression(session):
    session.add(Account(first="Ada", last="Lovelace"))
    session.flush()
    acct = session.scalars(select(Account).where(Account.full_name == "Ada Lovelace")).one()
    assert acct.full_name == "Ada Lovelace"


def test_column_property_is_selectable(session):
    session.add(Account(first="Ada", last="Lovelace"))
    session.commit()
    assert session.execute(select(Account.name_len)).scalar_one() == 11


def test_before_flush_stamps_created_at(session):
    a = Account(first="A", last="B")
    session.add(a)
    session.commit()
    assert a.created_at is not None
    assert a.updated_at is None
    # SQLite drops tzinfo on storage, so the reloaded value is naive
    assert a.created_at.tzinfo is None


def test_updated_at_only_on_real_change(session):
    a = Account(first="Ada", last="Lovelace")
    session.add(a)
    session.commit()
    session.commit()  # nothing dirty, so no stamp
    assert a.updated_at is None
    a.last = "King"
    session.commit()
    assert a.updated_at is not None
