import factory
from factory.django import DjangoModelFactory

from shop.models import Author, Book

class AuthorFactory(DjangoModelFactory):
    class Meta:
        model = Author
        django_get_or_create = ("name",)  # reuse existing row instead of hitting unique constraint

    name = factory.Sequence(lambda n: f"Author {n}")

class BookFactory(DjangoModelFactory):
    class Meta:
        model = Book

    author = factory.SubFactory(AuthorFactory)
    title = factory.Sequence(lambda n: f"Book {n}")
    price_cents = 1000

    class Params:
        cheap = factory.Trait(price_cents=99)
