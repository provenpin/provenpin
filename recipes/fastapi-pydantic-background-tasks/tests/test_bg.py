from fastapi.testclient import TestClient
from app.main import Mailer, app, get_mailer

class FakeMailer(Mailer):
    def __init__(self):
        self.sent = []
    def send(self, to, subject):
        self.sent.append((to, subject))

def test_background_task_runs_after_response():
    fake = FakeMailer()
    app.dependency_overrides[get_mailer] = lambda: fake
    try:
        r = TestClient(app).post("/signup", json={"email": "a@example.com"})
        assert r.status_code == 202
        assert fake.sent == [("a@example.com", "Welcome!")]
    finally:
        app.dependency_overrides.clear()
