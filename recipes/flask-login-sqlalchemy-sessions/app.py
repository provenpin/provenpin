from flask import Blueprint, Flask, redirect, request, url_for
from flask_login import LoginManager, UserMixin, current_user, login_required, login_user, logout_user
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash, generate_password_hash

db = SQLAlchemy()
login_manager = LoginManager()
login_manager.login_view = "auth.login"
auth = Blueprint("auth", __name__)


class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)


@login_manager.user_loader
def load_user(user_id: str) -> User | None:
    # Flask-Login passes the id as a string. A deleted user returns None (anonymous), not an error.
    return db.session.get(User, int(user_id))


@auth.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "GET":
        return "login form"
    username = request.form.get("username", "")
    user = db.session.scalar(db.select(User).filter_by(username=username))
    if user is None or not user.check_password(request.form.get("password", "")):
        return "bad credentials", 401
    login_user(user)
    nxt = request.args.get("next", "")
    # Only local paths. Reject absolute URLs and "//host" to block open redirects.
    if not nxt.startswith("/") or nxt.startswith("//"):
        nxt = url_for("auth.secret")
    return redirect(nxt)


@auth.get("/secret")
@login_required
def secret():
    return f"secret for {current_user.username}"


@auth.post("/logout")
def logout():
    # POST only, so a GET link or image tag cannot log the user out.
    logout_user()
    return "bye"


def create_app(config: dict | None = None) -> Flask:
    app = Flask(__name__)
    app.config.update(SECRET_KEY="dev-only", SQLALCHEMY_DATABASE_URI="sqlite:///:memory:")
    app.config.update(config or {})
    db.init_app(app)
    login_manager.init_app(app)
    app.register_blueprint(auth)
    return app
