from ninja import NinjaAPI, Schema
from ninja.errors import HttpError
from ninja.pagination import PageNumberPagination, paginate

from .models import Book

api = NinjaAPI()


class BookIn(Schema):
    title: str
    author: str
    year: int | None = None


class BookPatch(Schema):
    title: str | None = None
    author: str | None = None
    year: int | None = None


class BookOut(Schema):
    id: int
    title: str
    author: str
    year: int | None


def _get_book(book_id: int) -> Book:
    try:
        return Book.objects.get(pk=book_id)
    except Book.DoesNotExist:
        raise HttpError(404, "Book not found")


@api.post("/books", response={201: BookOut})
def create_book(request, payload: BookIn):
    return 201, Book.objects.create(**payload.model_dump())


@api.get("/books", response=list[BookOut])
@paginate(PageNumberPagination, page_size=2)
def list_books(request):
    return Book.objects.all()


@api.get("/books/{book_id}", response=BookOut)
def get_book(request, book_id: int):
    return _get_book(book_id)


@api.patch("/books/{book_id}", response=BookOut)
def update_book(request, book_id: int, payload: BookPatch):
    book = _get_book(book_id)
    # exclude_unset keeps fields the client did not send, instead of overwriting them with None.
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(book, field, value)
    book.save()
    return book
