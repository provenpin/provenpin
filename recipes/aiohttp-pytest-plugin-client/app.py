from aiohttp import web


def make_app():
    app = web.Application()
    app["users"] = {1: {"id": 1, "name": "Ada"}, 2: {"id": 2, "name": "Linus"}}
    app.router.add_get("/health", health)
    app.router.add_get("/users/{id}", get_user)
    app.router.add_post("/users", create_user)
    return app


async def health(request):
    return web.json_response({"status": "ok"})


async def get_user(request):
    user = request.app["users"].get(int(request.match_info["id"]))
    if user is None:
        raise web.HTTPNotFound(text="user not found")
    return web.json_response(user)


async def create_user(request):
    payload = await request.json()
    name = payload.get("name")
    if not name:
        raise web.HTTPBadRequest(text="name is required")
    users = request.app["users"]
    user = {"id": max(users) + 1, "name": name}
    users[user["id"]] = user
    return web.json_response(user, status=201)
