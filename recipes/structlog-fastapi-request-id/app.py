import re
import uuid

import structlog
from fastapi import FastAPI
from structlog.contextvars import bind_contextvars, clear_contextvars, merge_contextvars

structlog.configure(processors=[merge_contextvars, structlog.processors.JSONRenderer()])
log = structlog.get_logger()

SAFE_ID = re.compile(r"[A-Za-z0-9-]{1,64}")


class RequestIdMiddleware:
    """Pure ASGI middleware: bindings happen in the same task as the endpoint,
    and the header is added on http.response.start."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        # Never trust the raw header: reject anything that could break logs or headers.
        incoming = dict(scope["headers"]).get(b"x-request-id", b"").decode("latin-1")
        rid = incoming if SAFE_ID.fullmatch(incoming) else uuid.uuid4().hex

        async def send_with_header(message):
            if message["type"] == "http.response.start":
                message.setdefault("headers", []).append((b"x-request-id", rid.encode()))
            await send(message)

        bind_contextvars(request_id=rid)
        try:
            await self.app(scope, receive, send_with_header)
        finally:
            # Without this, ids leak into whatever runs next on the same context.
            clear_contextvars()


app = FastAPI()
app.add_middleware(RequestIdMiddleware)


@app.get("/hello")
async def hello():
    log.info("hello_called")
    return {"ok": True}


@app.get("/boom")
async def boom():
    log.info("about_to_fail")
    raise RuntimeError("boom")
