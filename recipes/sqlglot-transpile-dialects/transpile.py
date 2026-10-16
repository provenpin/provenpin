import sqlglot
from sqlglot import exp

DIALECTS = {"sqlite", "postgres", "mysql"}


def transpile(sql: str, read: str, write: str) -> str:
    """Translate one statement from one dialect to another."""
    (out,) = sqlglot.transpile(sql, read=read, write=write)
    return out


def parse(sql: str, read: str = "sqlite") -> exp.Expression:
    return sqlglot.parse_one(sql, read=read)


def tables(sql: str, read: str = "sqlite") -> list[str]:
    return [t.name for t in parse(sql, read).find_all(exp.Table)]


def columns(sql: str, read: str = "sqlite") -> list[str]:
    return [c.sql() for c in parse(sql, read).find_all(exp.Column)]


def rename_table(
    sql: str, old: str, new: str, read: str = "sqlite", write: str | None = None
) -> str:
    """Rename a table and every qualified reference to it.

    A plain Table-node rename leaves `users.id` style qualifiers pointing at the
    old name, so rewrite Column qualifiers as well.
    """
    tree = parse(sql, read)
    for table in tree.find_all(exp.Table):
        if table.name == old:
            table.set("this", exp.to_identifier(new))
    for column in tree.find_all(exp.Column):
        if column.table == old:
            column.set("table", exp.to_identifier(new))
    return tree.sql(dialect=write or read)
