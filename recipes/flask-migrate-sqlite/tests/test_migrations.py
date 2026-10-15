import pytest
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from flask_migrate import downgrade, upgrade
from sqlalchemy import inspect
from sqlalchemy.exc import IntegrityError

from app import create_app
from models import User, db


@pytest.fixture
def app(tmp_path):
    # A real file, not sqlite:///:memory:. Each pooled connection to an
    # in-memory database gets its own empty DB, so upgrades would be lost.
    app = create_app(f"sqlite:///{tmp_path / 'test.db'}")
    app.config["TESTING"] = True
    with app.app_context():
        yield app
        db.session.remove()
        db.engine.dispose()


def test_upgrade_matches_models(app):
    upgrade()
    with db.engine.connect() as conn:
        mc = MigrationContext.configure(conn, opts={"compare_type": True})
        assert compare_metadata(mc, db.metadata) == []


def test_downgrade_drops_table(app):
    upgrade()
    assert "user" in inspect(db.engine).get_table_names()
    downgrade(revision="base")
    assert "user" not in inspect(db.engine).get_table_names()


def test_unique_email_enforced_after_upgrade(app):
    upgrade()
    db.session.add_all([User(email="a@x.io", name="a"), User(email="a@x.io", name="b")])
    with pytest.raises(IntegrityError):
        db.session.commit()
    db.session.rollback()


def test_data_persists_across_sessions(app):
    upgrade()
    db.session.add(User(email="p@x.io", name="p"))
    db.session.commit()
    db.session.remove()
    assert db.session.scalar(db.select(db.func.count(User.id))) == 1
