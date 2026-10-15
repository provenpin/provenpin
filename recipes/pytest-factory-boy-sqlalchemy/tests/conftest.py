import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from models import Base
from tests.factories import OrderFactory, UserFactory

@pytest.fixture(scope="session")
def engine():
    eng = create_engine("sqlite://")
    Base.metadata.create_all(eng)
    return eng

@pytest.fixture
def session(engine):
    # each test runs inside a transaction that is rolled back afterwards
    conn = engine.connect()
    tx = conn.begin()
    s = Session(bind=conn, join_transaction_mode="create_savepoint")
    for f in (UserFactory, OrderFactory):
        f._meta.sqlalchemy_session = s
    yield s
    s.close()
    tx.rollback()
    conn.close()
