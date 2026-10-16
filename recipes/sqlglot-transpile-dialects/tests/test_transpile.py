import pytest
from sqlglot import exp
from transpile import columns, parse, rename_table, tables, transpile


def test_mysql_limit_swaps_to_offset():
    # MySQL "LIMIT offset, count" becomes Postgres "LIMIT count OFFSET offset".
    sql = transpile("SELECT id FROM users LIMIT 2, 5", read="mysql", write="postgres")
    assert sql == "SELECT id FROM users LIMIT 5 OFFSET 2"


def test_sqlite_concat_becomes_mysql_concat():
    # SQLite / Postgres use ||, MySQL has no || operator and needs CONCAT().
    sql = transpile("SELECT first || last FROM people", read="sqlite", write="mysql")
    assert sql == "SELECT CONCAT(first, last) FROM people"


def test_group_concat_gains_default_separator():
    # sqlglot maps GROUP_CONCAT to STRING_AGG and supplies the trailing
    # separator Postgres requires, even when the input omitted one.
    sql = transpile("SELECT GROUP_CONCAT(tag) FROM posts", read="sqlite", write="postgres")
    assert sql == "SELECT STRING_AGG(tag, ',') FROM posts"


def test_sqlite_strftime_becomes_to_char():
    # A date function with no direct equivalent is rewritten to a cast plus
    # the target dialect's formatting function.
    sql = transpile("SELECT strftime('%Y', created) FROM posts", read="sqlite", write="postgres")
    assert sql == "SELECT TO_CHAR(CAST(created AS TIMESTAMP), 'YYYY') FROM posts"


def test_ast_lists_tables_and_columns():
    sql = "SELECT u.id, o.total FROM users AS u JOIN orders o ON o.uid = u.id"
    assert isinstance(parse(sql, read="sqlite"), exp.Select)
    assert tables(sql) == ["users", "orders"]
    assert columns(sql) == ["u.id", "o.total", "o.uid", "u.id"]


def test_rename_table_rewrites_qualified_columns():
    renamed = rename_table("SELECT id, users.email FROM users WHERE users.active = 1", "users", "people")
    assert renamed == "SELECT id, people.email FROM people WHERE people.active = 1"


@pytest.mark.parametrize("dialect", ["sqlite", "postgres", "mysql"])
def test_unknown_select_still_parses(dialect):
    assert isinstance(parse("SELECT 1 AS one", read=dialect), exp.Select)
