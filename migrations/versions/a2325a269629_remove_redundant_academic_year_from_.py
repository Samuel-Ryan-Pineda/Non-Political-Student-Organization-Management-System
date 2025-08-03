"""Remove redundant academic_year from plans table

Revision ID: a2325a269629
Revises: add_academic_year_tracking
Create Date: 2025-08-03 21:20:17.301527

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a2325a269629'
down_revision = 'add_academic_year_tracking'
branch_labels = None
depends_on = None


def upgrade():
    # Remove academic_year column from plans table since it's redundant
    # Plans can get academic_year through their relationship with applications
    with op.batch_alter_table('plans', schema=None) as batch_op:
        batch_op.drop_column('academic_year')


def downgrade():
    # Add back academic_year column to plans table
    with op.batch_alter_table('plans', schema=None) as batch_op:
        batch_op.add_column(sa.Column('academic_year', sa.String(20), nullable=True))
