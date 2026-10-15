from contextlib import asynccontextmanager

from starlette.applications import Starlette
from starlette.middleware import Middleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from starlette.routing import Route


class TraceMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, name):
        super().__init__(app)
        self.name = name

    async def dispatch(self, request, call_next):
        request.app.state.trace.append(f"{self.name}:in")
        response = await call_next(request)
        request.app.state.trace.append(f"{self.name}:out")
        return response


@asynccontextmanager
async def lifespan(app):
    app.state.trace = []
    app.state.items = {1: "one", 2: "two"}
    try:
        yield
    finally:
        app.state.trace.clear()
        del app.state.items


async def get_item(request):
    item_id = request.path_params["item_id"]
    if item_id not in request.app.state.items:
        return JSONResponse({"detail": "not found"}, status_code=404)
    return JSONResponse({"id": item_id, "name": request.app.state.items[item_id]})


async def crash(request):
    raise ValueError("boom")


def create_app():
    return Starlette(
        routes=[Route("/items/{item_id:int}", get_item), Route("/crash", crash)],
        middleware=[
            Middleware(TraceMiddleware, "outer"),
            Middleware(TraceMiddleware, "inner"),
        ],
        lifespan=lifespan,
    )
