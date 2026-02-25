"""Добавить contractor_id в budget_lines

Revision ID: 002_contractor_budget
Revises: 001_initial
Create Date: 2026-02-25
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "002_contractor_budget"
down_revision: Union[str, None] = "001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "budget_lines",
        sa.Column(
            "contractor_id",
            UUID(as_uuid=True),
            sa.ForeignKey("contractors.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.create_index("ix_budget_lines_contractor", "budget_lines", ["contractor_id"])


def downgrade() -> None:
    op.drop_index("ix_budget_lines_contractor", table_name="budget_lines")
    op.drop_column("budget_lines", "contractor_id")
