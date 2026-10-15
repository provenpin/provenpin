from sqlalchemy import func, select
from models import Order, User
from tests.factories import OrderFactory, UserFactory

def test_subfactory_creates_user(session):
    o = OrderFactory()
    assert o.id and o.user.id and 100 <= o.total_cents <= 10000

def test_trait_and_batch(session):
    UserFactory.create_batch(3)
    admin = UserFactory(admin=True)
    assert admin.is_admin and admin.email.startswith("admin")
    assert session.scalar(select(func.count()).select_from(User)) == 4

def test_isolation_between_tests(session):
    assert session.scalar(select(func.count()).select_from(Order)) == 0
