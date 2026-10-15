import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload
from sqlalchemy.orm.exc import DetachedInstanceError
from sqlmodel import Session, select

from models import Hero, HeroMissionLink, Mission, Team, make_engine


@pytest.fixture
def engine():
    eng = make_engine()
    yield eng
    eng.dispose()


def test_back_populates_syncs_both_sides(engine):
    with Session(engine) as s:
        team = Team(name="avengers")
        hero = Hero(name="Thor", team=team)
        s.add(hero)
        # No flush or query needed: back_populates keeps the in-memory lists in sync.
        assert hero.team is team
        assert team.heroes == [hero]
        s.commit()


def test_selectinload_keeps_children_after_close(engine):
    with Session(engine) as s:
        s.add(Team(name="x", heroes=[Hero(name="a"), Hero(name="b")]))
        s.commit()

    with Session(engine) as s:
        team = s.exec(select(Team).options(selectinload(Team.heroes))).one()

    # The session is closed, but the children were loaded up front.
    assert sorted(h.name for h in team.heroes) == ["a", "b"]


def test_lazy_access_after_close_raises(engine):
    with Session(engine) as s:
        s.add(Team(name="y", heroes=[Hero(name="c")]))
        s.commit()

    with Session(engine) as s:
        team = s.exec(select(Team)).one()

    with pytest.raises(DetachedInstanceError):
        team.heroes


def test_many_to_many_via_link_table(engine):
    with Session(engine) as s:
        m1, m2 = Mission(title="m1"), Mission(title="m2")
        s.add_all([Hero(name="Thor", missions=[m1, m2]), Hero(name="Hulk", missions=[m1])])
        s.commit()

    with Session(engine) as s:
        mission = s.exec(select(Mission).where(Mission.title == "m1")).one()
        assert sorted(h.name for h in mission.heroes) == ["Hulk", "Thor"]
        assert len(s.exec(select(HeroMissionLink)).all()) == 3


def test_foreign_keys_enforced(engine):
    with Session(engine) as s:
        s.add(Hero(name="ghost", team_id=999))
        with pytest.raises(IntegrityError):
            s.commit()
