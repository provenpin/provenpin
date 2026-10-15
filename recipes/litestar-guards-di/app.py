from litestar import Litestar, Request, delete, get
from litestar.connection import ASGIConnection
from litestar.di import Provide
from litestar.exceptions import NotAuthorizedException, PermissionDeniedException
from litestar.handlers import BaseRouteHandler
from litestar.response import Response


class ItemNotFound(Exception):
    pass


class ItemRepo:
    def __init__(self, items: dict[int, str] | None = None):
        self.items = items if items is not None else {1: "widget"}

    def get(self, item_id: int) -> str:
        if item_id not in self.items:
            raise ItemNotFound(item_id)
        return self.items[item_id]

    def delete(self, item_id: int) -> None:
        if self.items.pop(item_id, None) is None:
            raise ItemNotFound(item_id)


async def provide_repo() -> ItemRepo:
    # swap for a real database session in production
    return ItemRepo()


def role_guard(connection: ASGIConnection, handler: BaseRouteHandler) -> None:
    # demo only: trusts a header; use a verified token in production
    required = handler.opt.get("role")
    if required is None:
        return
    role = connection.headers.get("x-role")
    if role is None:
        raise NotAuthorizedException("missing credentials")
    if role != required:
        raise PermissionDeniedException(f"requires role {required}")


@get("/items/{item_id:int}")
async def get_item(item_id: int, repo: ItemRepo) -> dict:
    return {"id": item_id, "name": repo.get(item_id)}


@delete("/items/{item_id:int}", opt={"role": "admin"})
async def delete_item(item_id: int, repo: ItemRepo) -> None:
    repo.delete(item_id)


def item_not_found(request: Request, exc: ItemNotFound) -> Response:
    return Response({"error": "item not found", "id": exc.args[0]}, status_code=404)


ROUTES = [get_item, delete_item]
GUARDS = [role_guard]
HANDLERS = {ItemNotFound: item_not_found}

app = Litestar(
    route_handlers=ROUTES,
    dependencies={"repo": Provide(provide_repo)},
    guards=GUARDS,
    exception_handlers=HANDLERS,
)
