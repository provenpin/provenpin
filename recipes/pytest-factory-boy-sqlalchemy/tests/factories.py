import factory
from models import Order, User

class UserFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = User
        sqlalchemy_session_persistence = "flush"  # get ids without committing
    email = factory.Sequence(lambda n: f"user{n}@example.com")
    is_admin = False

    class Params:
        admin = factory.Trait(is_admin=True, email=factory.Sequence(lambda n: f"admin{n}@example.com"))

class OrderFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Order
        sqlalchemy_session_persistence = "flush"
    user = factory.SubFactory(UserFactory)
    total_cents = factory.Faker("pyint", min_value=100, max_value=10000)
