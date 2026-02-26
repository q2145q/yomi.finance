"""Добавить date_start и date_end в budget_lines

Revision ID: 003_add_dates_budget
Revises: 002_contractor_budget
Create Date: 2026-02-25
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "003_add_dates_budget"
down_revision: Union[str, None] = "002_contractor_budget"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("budget_lines", sa.Column("date_start", sa.Date, nullable=True))
    op.add_column("budget_lines", sa.Column("date_end", sa.Date, nullable=True))


def downgrade() -> None:
    op.drop_column("budget_lines", "date_end")
    op.drop_column("budget_lines", "date_start")
