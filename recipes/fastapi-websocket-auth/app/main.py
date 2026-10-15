from fastapi import FastAPI, WebSocket, WebSocketDisconnect, status

app = FastAPI()
TOKENS = {"t-ada": "ada", "t-bob": "bob"}

class Hub:
    def __init__(self):
        self.clients: dict[WebSocket, str] = {}

    async def broadcast(self, data: dict):
        for ws in list(self.clients):
            await ws.send_json(data)

hub = Hub()

@app.websocket("/ws")
async def ws_endpoint(websocket: WebSocket, token: str = ""):
    user = TOKENS.get(token)
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    await websocket.accept()
    hub.clients[websocket] = user
    try:
        while True:
            msg = await websocket.receive_json()
            await hub.broadcast({"from": user, "text": msg.get("text", "")})
    except WebSocketDisconnect:
        hub.clients.pop(websocket, None)
