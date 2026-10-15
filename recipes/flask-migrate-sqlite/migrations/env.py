from alembic import context
from flask import current_app

# Flask-Migrate runs this inside an app context, so current_app is available.
db = current_app.extensions["migrate"].db

# render_as_batch: sqlite cannot ALTER most constraints, so Alembic
# recreates the table instead. compare_type catches column type drift.
with db.engine.connect() as connection:
    context.configure(
        connection=connection,
        target_metadata=db.metadata,
        render_as_batch=True,
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()
