"""create account"""
revision = "0001"
down_revision = None
from alembic import op
import sqlalchemy as sa

def upgrade():
    op.create_table("account", sa.Column("id", sa.Integer, primary_key=True), sa.Column("email", sa.String(255), nullable=False, unique=True))

def downgrade():
    op.drop_table("account")
