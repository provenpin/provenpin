from __future__ import annotations

from dependency_injector import containers, providers


class TodoStore:
    def __init__(self) -> None:
        self._items: dict[int, str] = {}

    def add(self, title: str) -> int:
        todo_id = len(self._items) + 1
        self._items[todo_id] = title
        return todo_id

    def items(self) -> dict[int, str]:
        return dict(self._items)


class TodoService:
    def __init__(self, store: TodoStore, limit: int) -> None:
        self.store = store
        self.limit = limit

    def create(self, title: str) -> int:
        if len(self.store.items()) >= self.limit:
            raise ValueError("todo limit reached")
        return self.store.add(title)

    def listing(self) -> list[dict[str, int | str]]:
        return [{"id": i, "title": t} for i, t in sorted(self.store.items().items())]


class Container(containers.DeclarativeContainer):
    config = providers.Configuration()

    store = providers.Singleton(TodoStore)

    service = providers.Factory(
        TodoService,
        store=store,
        limit=config.limit.as_int(),
    )
