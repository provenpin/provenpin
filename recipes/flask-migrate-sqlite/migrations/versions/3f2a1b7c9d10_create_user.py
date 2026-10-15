"""create user"""

import sqlalchemy as sa
from alembic import op

revision = "3f2a1b7c9d10"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "user",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("name", sa.String(80), nullable=False),
    )


def downgrade():
    op.drop_table("user")
