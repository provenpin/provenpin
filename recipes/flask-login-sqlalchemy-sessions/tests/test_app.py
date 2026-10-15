import pytest

from app import User, create_app, db


@pytest.fixture
def app():
    app = create_app({"TESTING": True})
    with app.app_context():
        db.create_all()
        user = User(username="ada")
        user.set_password("pw")
        db.session.add(user)
        db.session.commit()
    yield app
    with app.app_context():
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


def post_login(client, password="pw", next_url="/secret"):
    return client.post(
        "/login",
        query_string={"next": next_url},
        data={"username": "ada", "password": password},
    )


def test_login_then_secret(client):
    r = post_login(client)
    assert r.status_code == 302
    assert r.headers["Location"] == "/secret"
    assert client.get("/secret").data == b"secret for ada"


def test_anonymous_redirects_to_login(client):
    r = client.get("/secret")
    assert r.status_code == 302
    assert "/login" in r.headers["Location"]


def test_open_redirect_is_blocked(client):
    r = post_login(client, next_url="https://evil.example")
    assert r.headers["Location"] == "/secret"


def test_bad_password_is_rejected(client):
    assert post_login(client, password="wrong").status_code == 401
    assert client.get("/secret").status_code == 302


def test_logout_is_post_only(client):
    post_login(client)
    assert client.get("/logout").status_code == 405
    client.post("/logout")
    assert client.get("/secret").status_code == 302


def test_deleted_user_session_becomes_anonymous(client, app):
    post_login(client)
    with app.app_context():
        user = db.session.scalar(db.select(User).filter_by(username="ada"))
        db.session.delete(user)
        db.session.commit()
    r = client.get("/secret")
    assert r.status_code == 302
    assert "/login" in r.headers["Location"]
