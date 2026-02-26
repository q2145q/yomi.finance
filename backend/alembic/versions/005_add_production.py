"""Добавить production_reports и report_entries

Revision ID: 005_add_production
Revises: 004_add_contracts
Create Date: 2026-02-26
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "005_add_production"
down_revision: Union[str, None] = "004_add_contracts"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "production_reports",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("shoot_day_number", sa.Integer, nullable=False),
        sa.Column("date", sa.Date, nullable=False),
        sa.Column("location", sa.String(500), nullable=True),
        sa.Column("shooting_group", sa.String(200), nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="DRAFT"),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_prod_reports_project_date", "production_reports", ["project_id", "date"])

    op.create_table(
        "report_entries",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("report_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("production_reports.id", ondelete="CASCADE"), nullable=False),
        sa.Column("contractor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("contractors.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("budget_line_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("budget_lines.id", ondelete="SET NULL"), nullable=True),
        sa.Column("contract_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("contracts.id", ondelete="SET NULL"), nullable=True),
        sa.Column("source", sa.String(20), nullable=False, server_default="MANUAL"),
        sa.Column("shift_start", sa.Time, nullable=True),
        sa.Column("shift_end", sa.Time, nullable=True),
        sa.Column("lunch_break_minutes", sa.Integer, nullable=False, server_default="60"),
        sa.Column("gap_minutes", sa.Integer, nullable=False, server_default="0"),
        sa.Column("overtime_hours", sa.Float, nullable=False, server_default="0"),
        sa.Column("equipment", sa.Text, nullable=True),
        sa.Column("unit", sa.String(50), nullable=False, server_default="смена"),
        sa.Column("quantity", sa.Float, nullable=False, server_default="1"),
        sa.Column("rate", sa.Float, nullable=False, server_default="0"),
        sa.Column("tax_scheme_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tax_schemes.id", ondelete="SET NULL"), nullable=True),
        sa.Column("amount_net", sa.Float, nullable=False, server_default="0"),
        sa.Column("amount_gross", sa.Float, nullable=False, server_default="0"),
        sa.Column("status", sa.String(20), nullable=False, server_default="PENDING"),
        sa.Column("raw_text", sa.Text, nullable=True),
        sa.Column("ai_parsed", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("ai_confidence", sa.Float, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_report_entries_report", "report_entries", ["report_id"])
    op.create_index("ix_report_entries_contractor", "report_entries", ["contractor_id"])


def downgrade() -> None:
    op.drop_table("report_entries")
    op.drop_table("production_reports")
