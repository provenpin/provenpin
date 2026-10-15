from fastapi import FastAPI, HTTPException
from cashews import cache
from cashews.contrib.fastapi import CacheRequestControlMiddleware
from pydantic import BaseModel

cache.setup("mem://")


class Item(BaseModel):
    id: int
    name: str
    stock: int


class ItemNotFound(Exception):
    pass


class _Store:
    def __init__(self) -> None:
        self.items: dict[int, Item] = {}
        self.loads = 0

    def reset(self) -> None:
        self.items = {
            1: Item(id=1, name="widget", stock=3),
            2: Item(id=2, name="gadget", stock=9),
        }
        self.loads = 0


store = _Store()
store.reset()

app = FastAPI()
app.add_middleware(CacheRequestControlMiddleware)


@cache(ttl="5m", key="item:{item_id}")
async def load_item(item_id: int) -> Item:
    store.loads += 1
    try:
        return store.items[item_id].model_copy(deep=True)
    except KeyError:
        raise ItemNotFound(item_id) from None


@app.get("/items/{item_id}", response_model=Item)
async def get_item(item_id: int) -> Item:
    try:
        return await load_item(item_id)
    except ItemNotFound:
        raise HTTPException(status_code=404, detail="item not found")


async def set_stock(item_id: int, stock: int) -> Item:
    item = store.items.get(item_id)
    if item is None:
        raise ItemNotFound(item_id)
    item.stock = stock
    await cache.delete(f"item:{item_id}")
    return item.model_copy(deep=True)


@app.put("/items/{item_id}", response_model=Item)
async def put_item(item_id: int, stock: int) -> Item:
    try:
        return await set_stock(item_id, stock)
    except ItemNotFound:
        raise HTTPException(status_code=404, detail="item not found")
