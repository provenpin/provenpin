import glom as glom_mod
import pytest
from glom import PathAccessError

from transform import REPO_SPEC, explode_tags, flatten_repos

REPOS = [
    {
        "id": 101,
        "name": "etl-kit",
        "owner": {"login": "ada", "contact": {"email": "ada@example.com"}},
        "metrics": {"stars": 120, "forks": 8},
        "tags": ["etl", "python"],
    },
    {
        "id": 102,
        "name": "mini-orm",
        "owner": {"login": "grace"},
        "metrics": {"stars": 5},
        "tags": ["db"],
    },
]


def test_flatten_nested_records():
    assert flatten_repos(REPOS)[0] == {
        "repo_id": 101,
        "name": "etl-kit",
        "owner": "ada",
        "email": "ada@example.com",
        "stars": 120,
        "forks": 8,
    }


def test_missing_nested_path_falls_back_to_default():
    row = flatten_repos(REPOS)[1]
    assert row["email"] == "" and row["forks"] == 0
    assert row["owner"] == "grace"


def test_coalesce_keeps_explicit_none():
    payload = [{"id": 1, "name": "n", "owner": {"contact": {"email": None}}}]
    # Coalesce only catches path errors, not a present-but-None value.
    assert flatten_repos(payload)[0]["email"] is None


def test_missing_path_raises_a_keyerror_subclass():
    with pytest.raises(PathAccessError) as exc:
        glom_mod.glom(REPOS[1], "owner.contact.email")
    # PathAccessError subclasses KeyError, so a bare `except KeyError` hides it.
    assert isinstance(exc.value, KeyError)
    assert isinstance(exc.value, glom_mod.GlomError)
    assert glom_mod.glom(REPOS[1], "owner.contact.email", default=None) is None


def test_iter_is_a_lazy_generator():
    lazy = glom_mod.glom(REPOS, glom_mod.Iter(REPO_SPEC))
    assert not isinstance(lazy, list)
    assert len(list(lazy)) == 2


def test_explode_tags_repeats_the_parent_id():
    assert explode_tags(REPOS) == [
        {"repo_id": 101, "tag": "etl"},
        {"repo_id": 101, "tag": "python"},
        {"repo_id": 102, "tag": "db"},
    ]
