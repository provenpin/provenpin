import os

from flask import Flask
from flask_migrate import Migrate

from models import db

MIGRATIONS = os.path.join(os.path.dirname(__file__), "migrations")


def create_app(uri: str = "sqlite:///app.db") -> Flask:
    app = Flask(__name__)
    # Config must be set before init_app, or the engine binds to the default URI.
    app.config["SQLALCHEMY_DATABASE_URI"] = uri
    db.init_app(app)
    Migrate(app, db, directory=MIGRATIONS)
    return app
