from __future__ import annotations

from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.routing import Route


async def inspect_upload(request: Request) -> JSONResponse:
    # request.form() is an async context manager, so the UploadFile handles are closed on exit.
    async with request.form() as form:
        files = form.getlist("files")
        contents = [await item.read() for item in files]
        return JSONResponse(
            {
                "first": files[0].filename if files else None,
                "names": [item.filename for item in files],
                "types": [item.content_type for item in files],
                "sizes": [item.size for item in files],
                "texts": [data.decode() for data in contents],
                "tags": form.getlist("tags"),
                "note": form.get("note"),
            }
        )


async def digest(request: Request) -> JSONResponse:
    form = await request.form()
    item = form["files"]
    # read() advances the underlying SpooledTemporaryFile, so read again only after seek(0).
    head = await item.read(4)
    rest = await item.read()
    await item.seek(0)
    whole = await item.read()
    return JSONResponse({"head": head.decode(), "rest": rest.decode(), "whole": whole.decode()})


async def capped(request: Request) -> JSONResponse:
    # A MultiPartException raised inside a routed request turns into an HTTP 400.
    form = await request.form(max_files=1)
    return JSONResponse({"count": len(form.getlist("files"))})


app = Starlette(
    routes=[
        Route("/inspect", inspect_upload, methods=["POST"]),
        Route("/digest", digest, methods=["POST"]),
        Route("/capped", capped, methods=["POST"]),
    ]
)
