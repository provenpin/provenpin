from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

class Note(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    text: Mapped[str]

def create_app(config: dict | None = None) -> Flask:
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///app.db"
    app.config.update(config or {})
    db.init_app(app)
    with app.app_context():
        db.create_all()

    @app.post("/notes")
    def add_note():
        text = (request.get_json(silent=True) or {}).get("text")
        if not text:
            return jsonify(error="text required"), 400
        note = Note(text=text)
        db.session.add(note)
        db.session.commit()
        return jsonify(id=note.id, text=note.text), 201

    @app.get("/notes")
    def list_notes():
        notes = db.session.execute(db.select(Note).order_by(Note.id)).scalars()
        return jsonify([{"id": n.id, "text": n.text} for n in notes])

    return app
