"""Добавить таблицы contracts и contract_budget_lines

Revision ID: 004_add_contracts
Revises: 003_add_dates_budget
Create Date: 2026-02-26
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "004_add_contracts"
down_revision: Union[str, None] = "003_add_dates_budget"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "contracts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("number", sa.String(100), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("contractor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("contractors.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("payment_type", sa.String(20), nullable=False),
        sa.Column("payment_period", sa.String(50), nullable=True),
        sa.Column("currency", sa.String(10), nullable=False, server_default="RUB"),
        sa.Column("status", sa.String(20), nullable=False, server_default="DRAFT"),
        sa.Column("signed_at", sa.Date, nullable=True),
        sa.Column("valid_from", sa.Date, nullable=True),
        sa.Column("valid_to", sa.Date, nullable=True),
        sa.Column("tax_scheme_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tax_schemes.id", ondelete="SET NULL"), nullable=True),
        sa.Column("tax_override", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_contracts_project_id", "contracts", ["project_id"])
    op.create_index("ix_contracts_contractor_id", "contracts", ["contractor_id"])

    op.create_table(
        "contract_budget_lines",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("contract_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("budget_line_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("budget_lines.id", ondelete="CASCADE"), nullable=False),
    )
    op.create_index("ix_contract_budget_lines_contract", "contract_budget_lines", ["contract_id"])


def downgrade() -> None:
    op.drop_table("contract_budget_lines")
    op.drop_table("contracts")
