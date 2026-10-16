import factory
from factory.alchemy import SQLAlchemyModelFactory

from models import Post, User


class UserFactory(SQLAlchemyModelFactory):
    class Meta:
        model = User
        sqlalchemy_session_persistence = "flush"

    name = factory.Sequence(lambda n: f"user-{n}")
    email = factory.Sequence(lambda n: f"user-{n}@example.com")


class PostFactory(SQLAlchemyModelFactory):
    class Meta:
        model = Post
        sqlalchemy_session_persistence = "flush"

    title = factory.Sequence(lambda n: f"post-{n}")
    author = factory.SubFactory(UserFactory)


class PendingFactory(SQLAlchemyModelFactory):
    class Meta:
        model = User
        sqlalchemy_session_persistence = None

    name = factory.Sequence(lambda n: f"pending-{n}")
    email = factory.Sequence(lambda n: f"pending-{n}@example.com")


def bind(session):
    # SQLAlchemyModelFactory reads sqlalchemy_session off its Meta at call time,
    # so binding once per test is enough; forgetting this raises RuntimeError.
    for cls in (UserFactory, PostFactory, PendingFactory):
        cls._meta.sqlalchemy_session = session
