import copy

from catalog import CATALOG, drop_where, paths, query, set_default, transform


def test_truthy_filter_matches_all():
    got = [u["name"] for u in query(CATALOG, "$.users[?(@.active)]")]
    assert got == ["ada", "bob"]
    got = [u["name"] for u in query(CATALOG, "$.users[?(@.active == true)]")]
    assert got == ["ada"]


def test_filter_and_child_selection():
    assert query(CATALOG, "$.store.book[?(@.price < 40)].title") == ["Refactoring", "Novel"]


def test_recursive_descent_full_paths():
    assert paths(CATALOG, "$..price") == [
        "store.book.[0].price",
        "store.book.[1].price",
        "store.book.[2].price",
        "store.bicycle.price",
    ]


def test_update_callback_receives_parent_and_field():
    data = copy.deepcopy(CATALOG)
    transform(data, "$.store.book[*].price", lambda value, parent, field: value + 1)
    assert query(data, "$.store.book[*].price") == [31, 46, 11]
    assert CATALOG["store"]["book"][0]["price"] == 30


def test_update_missing_path_is_noop_but_update_or_create_builds():
    data = {}
    transform(data, "$.meta.owner", lambda value, parent, field: value)
    assert data == {}
    set_default(data, "$.meta.owner", "ops")
    assert data == {"meta": {"owner": "ops"}}


def test_filter_removes_entries_in_place():
    data = copy.deepcopy(CATALOG)
    drop_where(data, "$.store.book[*]", lambda book: book["price"] < 20)
    assert [b["title"] for b in data["store"]["book"]] == ["Refactoring", "DDIA"]
