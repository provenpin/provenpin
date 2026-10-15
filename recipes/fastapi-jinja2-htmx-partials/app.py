from pathlib import Path
from typing import Annotated

from fastapi import FastAPI, Query, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

templates = Jinja2Templates(directory=Path(__file__).parent / "templates")
app = FastAPI()
ITEMS = [{"id": 1, "name": "apples"}, {"id": 2, "name": "pears"}]


def is_htmx(request: Request) -> bool:
    # HTMX sends the literal string "true"; check the value, not just presence
    return request.headers.get("HX-Request") == "true"


def render(request: Request, page: str, partial: str, context: dict) -> HTMLResponse:
    name = partial if is_htmx(request) else page
    response = templates.TemplateResponse(request, name, context)
    # Without this, a shared cache can serve a partial to a full-page request
    response.headers["Vary"] = "HX-Request"
    return response


@app.get("/items", response_class=HTMLResponse)
def list_items(request: Request):
    return render(request, "items_page.html", "items_partial.html", {"items": ITEMS})


@app.post("/items", response_class=HTMLResponse)
def add_item(request: Request, name: Annotated[str, Query(min_length=1)]):
    item = {"id": len(ITEMS) + 1, "name": name}
    ITEMS.append(item)
    return templates.TemplateResponse(request, "item_row.html", {"item": item})
