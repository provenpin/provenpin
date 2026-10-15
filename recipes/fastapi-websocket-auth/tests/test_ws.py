import pytest
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect
from app.main import app

client = TestClient(app)

def test_echo_broadcast_to_all():
    with client.websocket_connect("/ws?token=t-ada") as a, client.websocket_connect("/ws?token=t-bob") as b:
        a.send_json({"text": "hi"})
        assert a.receive_json() == {"from": "ada", "text": "hi"}
        assert b.receive_json() == {"from": "ada", "text": "hi"}

def test_bad_token_closed_with_1008():
    with pytest.raises(WebSocketDisconnect) as e:
        with client.websocket_connect("/ws?token=nope") as ws:
            ws.receive_json()
    assert e.value.code == 1008
