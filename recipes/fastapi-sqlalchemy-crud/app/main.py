from collections.abc import Iterator
from fastapi import Depends, FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy import String, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker
from sqlalchemy.pool import StaticPool

engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
SessionLocal = sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

class Item(Base):
    __tablename__ = "items"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))

Base.metadata.create_all(engine)

class ItemIn(BaseModel):
    name: str

class ItemOut(ItemIn):
    model_config = ConfigDict(from_attributes=True)
    id: int

def get_session() -> Iterator[Session]:
    with SessionLocal() as session:
        yield session

app = FastAPI()

@app.post("/items", response_model=ItemOut, status_code=201)
def create_item(data: ItemIn, db: Session = Depends(get_session)):
    item = Item(name=data.name)
    db.add(item)
    db.commit()
    return item

@app.get("/items/{item_id}", response_model=ItemOut)
def read_item(item_id: int, db: Session = Depends(get_session)):
    item = db.get(Item, item_id)
    if item is None:
        raise HTTPException(404, "not found")
    return item
