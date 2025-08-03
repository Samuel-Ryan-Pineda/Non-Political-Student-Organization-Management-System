"""Add academic year tracking for organization data

Revision ID: add_academic_year_tracking
Revises: 4a19cc9f79a6
Create Date: 2024-12-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers, used by Alembic.
revision = 'add_academic_year_tracking'
down_revision = '4a19cc9f79a6'
branch_labels = None
depends_on = None

def upgrade():
    # Add current_academic_year to organizations table
    with op.batch_alter_table('organizations', schema=None) as batch_op:
        batch_op.add_column(sa.Column('current_academic_year', sa.String(20), nullable=True))
    
    # Update existing organizations to have current academic year
    current_year = datetime.now().year
    academic_year = f"{current_year}-{current_year + 1}"
    
    # Update all existing organizations
    op.execute(f"UPDATE organizations SET current_academic_year = '{academic_year}' WHERE current_academic_year IS NULL")
    
    # Update existing affiliations to have current academic year if they don't have one
    op.execute(f"UPDATE affiliations SET academic_year = '{academic_year}' WHERE academic_year IS NULL OR academic_year = ''")
    
    # Add academic_year to plans table if it doesn't exist
    with op.batch_alter_table('plans', schema=None) as batch_op:
        batch_op.add_column(sa.Column('academic_year', sa.String(20), nullable=True))
    
    # Update existing plans to have current academic year
    op.execute(f"UPDATE plans SET academic_year = '{academic_year}' WHERE academic_year IS NULL")

def downgrade():
    # Remove current_academic_year from organizations table
    with op.batch_alter_table('organizations', schema=None) as batch_op:
        batch_op.drop_column('current_academic_year')
    
    # Remove academic_year from plans table
    with op.batch_alter_table('plans', schema=None) as batch_op:
        batch_op.drop_column('academic_year')