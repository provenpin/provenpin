import pytest
from factory.alchemy import SQLAlchemyModelFactory
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from factories import PendingFactory, PostFactory, UserFactory, bind
from models import Post, User, make_engine


@pytest.fixture
def session():
    engine = make_engine()
    with Session(engine) as session:
        bind(session)
        yield session


def test_create_flushes_and_assigns_pk(session):
    user = UserFactory()
    assert user.id is not None
    assert session.get(User, user.id) is user


def test_build_is_detached_and_needs_no_session(session):
    user = UserFactory.build()
    assert user.id is None
    assert list(session.new) == []
    assert session.scalar(select(func.count()).select_from(User)) == 0


def test_sequences_keep_unique_emails(session):
    first, second = UserFactory(), UserFactory()
    assert first.email != second.email
    assert session.scalar(select(func.count()).select_from(User)) == 2


def test_subfactory_flushes_parent_then_child(session):
    post = PostFactory()
    assert post.author_id == post.author.id
    assert session.get(Post, post.id).author.name == post.author.name


def test_persistence_none_leaves_object_pending(session):
    user = PendingFactory()
    assert user.id is None
    assert list(session.new) == [user]
    session.flush()
    assert user.id is not None


def test_missing_session_raises():
    class OrphanFactory(SQLAlchemyModelFactory):
        class Meta:
            model = User
            abstract = False
            sqlalchemy_session = None

    with pytest.raises(RuntimeError, match="No session provided"):
        OrphanFactory()
