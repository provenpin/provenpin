import pytest

from factories import AuthorFactory, BookFactory
from shop.models import Author

@pytest.mark.django_db
def test_subfactory_creates_author():
    book = BookFactory()
    assert Author.objects.count() == 1
    assert book.author.pk is not None

def test_build_strategy_skips_database():
    # no django_db mark needed: build() never writes, SubFactory follows the strategy
    book = BookFactory.build()
    assert book.pk is None and book.author.pk is None

def test_db_access_blocked_without_mark():
    # pytest-django blocks ORM access unless the test opts in with django_db
    with pytest.raises(RuntimeError):
        Author.objects.count()

@pytest.mark.django_db
def test_get_or_create_reuses_row():
    a = AuthorFactory(name="Ann")
    b = AuthorFactory(name="Ann")
    assert a.pk == b.pk and Author.objects.count() == 1

@pytest.mark.django_db
def test_trait_overrides_field():
    assert BookFactory(cheap=True).price_cents == 99

@pytest.mark.django_db
def test_publish_runs_on_commit(django_capture_on_commit_callbacks):
    # on_commit never fires inside the test's rolled-back transaction, so capture it
    book = BookFactory()
    calls = []
    with django_capture_on_commit_callbacks(execute=True):
        book.publish(calls.append)
    assert calls == [book.pk]
