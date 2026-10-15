from contextlib import nullcontext

from peewee import CharField, IntegerField
from playhouse.migrate import SchemaMigrator, migrate


def add_profile_columns(database):
    migrator = SchemaMigrator.from_database(database)
    with migrator.migration_context():
        migrate(
            migrator.add_column("user", "email", CharField(default="")),
            migrator.add_column("user", "karma", IntegerField(default=0)),
        )


def run_broken_plan(database, *, transactional):
    migrator = SchemaMigrator.from_database(database)
    context = migrator.migration_context() if transactional else nullcontext()
    with context:
        migrate(
            migrator.add_column("user", "nickname", CharField(default="")),
            migrator.sql("SELECT * FROM no_such_table"),
        )
