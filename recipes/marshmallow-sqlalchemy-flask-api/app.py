from flask import Flask, request
from flask_sqlalchemy import SQLAlchemy
from marshmallow import ValidationError
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from sqlalchemy import String
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Mapped, mapped_column

db = SQLAlchemy()


class Book(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(120))
    isbn: Mapped[str] = mapped_column(String(13), unique=True)


class BookSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Book
        load_instance = True
        sqla_session = db.session
        dump_only = ("id",)


def create_app(uri: str = "sqlite:///:memory:") -> Flask:
    app = Flask(__name__)
    app.config.update(SQLALCHEMY_DATABASE_URI=uri)
    db.init_app(app)

    @app.post("/books")
    def create_book():
        try:
            book = BookSchema().load(request.get_json(silent=True) or {})
        except ValidationError as err:
            return {"errors": err.messages}, 422
        db.session.add(book)
        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            return {"errors": {"isbn": ["already exists"]}}, 409
        return BookSchema().dump(book), 201

    return app
