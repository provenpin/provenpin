from pydantic import BaseModel, ConfigDict, computed_field


class OrmModel(BaseModel):
    # Without this, model_validate(orm_row) raises ValidationError.
    model_config = ConfigDict(from_attributes=True)


class BookOut(OrmModel):
    id: int
    title: str


class AuthorOut(OrmModel):
    id: int
    name: str
    books: list[BookOut]

    @computed_field
    @property
    def book_count(self) -> int:
        return len(self.books)
