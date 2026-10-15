import json
from base64 import b64decode, b64encode

from itsdangerous import TimestampSigner
from starlette.applications import Starlette
from starlette.middleware.sessions import SessionMiddleware
from starlette.responses import JSONResponse
from starlette.routing import Route


async def login(request):
    request.session["user"] = request.path_params["user"]
    return JSONResponse({"ok": True})


async def me(request):
    return JSONResponse({"user": request.session.get("user")})


async def logout(request):
    request.session.clear()
    return JSONResponse({"ok": True})


async def stash_non_json(request):
    request.session["tags"] = {"a", "b"}
    return JSONResponse({"ok": True})


def create_app(secret_key="dev-secret", max_age=14 * 24 * 3600):
    app = Starlette(
        routes=[
            Route("/login/{user}", login),
            Route("/me", me),
            Route("/logout", logout),
            Route("/stash-non-json", stash_non_json),
        ]
    )
    app.add_middleware(SessionMiddleware, secret_key=secret_key, max_age=max_age)
    return app


def encode_session(session, secret_key, timestamp=None):
    # same wire format SessionMiddleware produces: base64(json) + sig
    data = b64encode(json.dumps(session).encode("utf-8"))
    signer = TimestampSigner(str(secret_key))
    if timestamp is not None:
        signer.get_timestamp = lambda: timestamp
    return signer.sign(data).decode("utf-8")
