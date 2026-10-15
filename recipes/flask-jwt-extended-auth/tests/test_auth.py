from app import create_app

def client():
    return create_app("a-long-enough-test-secret-key-123").test_client()

def test_login_and_access():
    c = client()
    tokens = c.post("/login", json={"username": "ada", "password": "lovelace"}).get_json()
    r = c.get("/admin", headers={"Authorization": f"Bearer {tokens['access']}"})
    assert r.status_code == 200 and r.get_json() == {"user": "ada"}

def test_refresh_flow():
    c = client()
    tokens = c.post("/login", json={"username": "ada", "password": "lovelace"}).get_json()
    new = c.post("/refresh", headers={"Authorization": f"Bearer {tokens['refresh']}"}).get_json()["access"]
    assert c.get("/admin", headers={"Authorization": f"Bearer {new}"}).status_code == 200
    # an access token cannot be used to refresh
    assert c.post("/refresh", headers={"Authorization": f"Bearer {new}"}).status_code == 422

def test_rejections():
    c = client()
    assert c.post("/login", json={"username": "ada", "password": "x"}).status_code == 401
    assert c.get("/admin").status_code == 401
