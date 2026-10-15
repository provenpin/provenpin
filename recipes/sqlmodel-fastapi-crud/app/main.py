from typing import Annotated
from fastapi import Depends, FastAPI, HTTPException
from sqlmodel import Field, Session, SQLModel, create_engine, select

class HeroBase(SQLModel):
    name: str = Field(index=True)
    age: int | None = None

class Hero(HeroBase, table=True):
    id: int | None = Field(default=None, primary_key=True)

class HeroCreate(HeroBase):
    pass

class HeroUpdate(SQLModel):
    name: str | None = None
    age: int | None = None

engine = create_engine("sqlite:///app.db", connect_args={"check_same_thread": False})

def get_session():
    with Session(engine) as session:
        yield session

SessionDep = Annotated[Session, Depends(get_session)]
app = FastAPI()

@app.post("/heroes", response_model=Hero, status_code=201)
def create_hero(hero: HeroCreate, session: SessionDep):
    db_hero = Hero.model_validate(hero)
    session.add(db_hero); session.commit(); session.refresh(db_hero)
    return db_hero

@app.get("/heroes", response_model=list[Hero])
def list_heroes(session: SessionDep, offset: int = 0, limit: int = 100):
    return session.exec(select(Hero).offset(offset).limit(limit)).all()

@app.patch("/heroes/{hero_id}", response_model=Hero)
def update_hero(hero_id: int, hero: HeroUpdate, session: SessionDep):
    db_hero = session.get(Hero, hero_id)
    if not db_hero:
        raise HTTPException(404, "Hero not found")
    db_hero.sqlmodel_update(hero.model_dump(exclude_unset=True))
    session.add(db_hero); session.commit(); session.refresh(db_hero)
    return db_hero

@app.delete("/heroes/{hero_id}", status_code=204)
def delete_hero(hero_id: int, session: SessionDep):
    db_hero = session.get(Hero, hero_id)
    if not db_hero:
        raise HTTPException(404, "Hero not found")
    session.delete(db_hero); session.commit()
