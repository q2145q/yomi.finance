"""Начальная схема БД — Этап 1

Revision ID: 001_initial
Revises:
Create Date: 2026-02-25
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Пользователи
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean, server_default="true"),
        sa.Column("is_superadmin", sa.Boolean, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # Проекты
    op.create_table(
        "projects",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("currency_primary", sa.String(10), server_default="RUB"),
        sa.Column("currencies_allowed", sa.JSON, server_default="[]"),
        sa.Column("exchange_rate_mode", sa.String(20), server_default="CBR_ON_DATE"),
        sa.Column("exchange_rate_fixed", sa.Float, nullable=True),
        sa.Column("status", sa.String(20), server_default="PREP"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # Связь пользователей с проектами
    op.create_table(
        "project_users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", sa.String(30), nullable=False),
    )
    op.create_index("ix_project_users_project", "project_users", ["project_id"])
    op.create_index("ix_project_users_user", "project_users", ["user_id"])

    # Налоговые схемы
    op.create_table(
        "tax_schemes",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("is_system", sa.Boolean, server_default="false"),
    )
    op.create_index("ix_tax_schemes_name", "tax_schemes", ["name"], unique=True)

    # Компоненты налоговой схемы
    op.create_table(
        "tax_components",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("scheme_id", UUID(as_uuid=True), sa.ForeignKey("tax_schemes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(50), nullable=False),
        sa.Column("rate", sa.Float, nullable=False),
        sa.Column("type", sa.String(20), nullable=False),
        sa.Column("recipient", sa.String(20), server_default="BUDGET"),
        sa.Column("sort_order", sa.Integer, server_default="0"),
    )

    # Контрагенты
    op.create_table(
        "contractors",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("passport_data_enc", sa.Text, nullable=True),
        sa.Column("bank_details_enc", sa.Text, nullable=True),
        sa.Column("type", sa.String(10), nullable=False),
        sa.Column("inn", sa.String(12), nullable=True),
        sa.Column("telegram_id", sa.String(50), nullable=True),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("currency", sa.String(10), server_default="RUB"),
        sa.Column("tax_scheme_id", UUID(as_uuid=True), sa.ForeignKey("tax_schemes.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # Статьи бюджета
    op.create_table(
        "budget_lines",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("parent_id", UUID(as_uuid=True), sa.ForeignKey("budget_lines.id", ondelete="CASCADE"), nullable=True),
        sa.Column("sort_order", sa.Integer, server_default="0"),
        sa.Column("level", sa.Integer, server_default="0"),
        sa.Column("code", sa.String(50), server_default=""),
        sa.Column("name", sa.String(500), nullable=False),
        sa.Column("type", sa.String(20), server_default="ITEM"),
        sa.Column("unit", sa.String(50), nullable=True),
        sa.Column("quantity_units", sa.Float, server_default="1"),
        sa.Column("rate", sa.Float, server_default="0"),
        sa.Column("quantity", sa.Float, server_default="1"),
        sa.Column("tax_scheme_id", UUID(as_uuid=True), sa.ForeignKey("tax_schemes.id", ondelete="SET NULL"), nullable=True),
        sa.Column("tax_override", sa.Boolean, server_default="false"),
        sa.Column("currency", sa.String(10), server_default="RUB"),
        sa.Column("limit_amount", sa.Float, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_budget_lines_project", "budget_lines", ["project_id"])
    op.create_index("ix_budget_lines_parent", "budget_lines", ["parent_id"])


def downgrade() -> None:
    op.drop_table("budget_lines")
    op.drop_table("contractors")
    op.drop_table("tax_components")
    op.drop_table("tax_schemes")
    op.drop_table("project_users")
    op.drop_table("projects")
    op.drop_table("users")
