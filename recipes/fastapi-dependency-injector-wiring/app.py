from __future__ import annotations

from dependency_injector.wiring import Provide, inject
from fastapi import Depends, FastAPI, HTTPException
from pydantic import BaseModel

from container import Container, TodoService

container = Container()
container.config.from_dict({"limit": 2})

app = FastAPI()


class TodoIn(BaseModel):
    title: str


class TodoOut(BaseModel):
    id: int


@app.post("/todos", response_model=TodoOut)
@inject
def create_todo(
    payload: TodoIn,
    service: TodoService = Depends(Provide[Container.service]),
) -> TodoOut:
    try:
        return TodoOut(id=service.create(payload.title))
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@app.get("/todos")
@inject
def list_todos(
    service: TodoService = Depends(Provide[Container.service]),
) -> list[dict[str, int | str]]:
    return service.listing()


container.wire(modules=[__name__])
