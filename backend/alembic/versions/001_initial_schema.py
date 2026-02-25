"""Начальная схема БД — Этап 1

Revision ID: 001_initial
Revises:
Create Date: 2026-02-25
"""
from typing import Sequence, Union
import uuid

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Энумы
    op.execute("CREATE TYPE user_role AS ENUM ('PRODUCER', 'LINE_PRODUCER', 'DIRECTOR', 'ASSISTANT', 'CLERK')")
    op.execute("CREATE TYPE project_status AS ENUM ('PREP', 'PRODUCTION', 'POST', 'CLOSED')")
    op.execute("CREATE TYPE exchange_rate_mode AS ENUM ('CBR_ON_DATE', 'FIXED')")
    op.execute("CREATE TYPE contractor_type AS ENUM ('FL', 'SZ', 'IP', 'OOO')")
    op.execute("CREATE TYPE tax_component_type AS ENUM ('INTERNAL', 'EXTERNAL')")
    op.execute("CREATE TYPE tax_recipient AS ENUM ('CONTRACTOR', 'BUDGET')")
    op.execute("CREATE TYPE budget_line_type AS ENUM ('GROUP', 'ITEM', 'SPREAD_ITEM')")

    # Пользователи
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean, default=True),
        sa.Column("is_superadmin", sa.Boolean, default=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_users_email", "users", ["email"])

    # Проекты
    op.create_table(
        "projects",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("currency_primary", sa.String(10), server_default="RUB"),
        sa.Column("currencies_allowed", sa.JSON, server_default="[]"),
        sa.Column("exchange_rate_mode", sa.Enum("CBR_ON_DATE", "FIXED", name="exchange_rate_mode", create_type=False), server_default="CBR_ON_DATE"),
        sa.Column("exchange_rate_fixed", sa.Float, nullable=True),
        sa.Column("status", sa.Enum("PREP", "PRODUCTION", "POST", "CLOSED", name="project_status", create_type=False), server_default="PREP"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # Связь пользователей с проектами
    op.create_table(
        "project_users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("project_id", UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", sa.Enum("PRODUCER", "LINE_PRODUCER", "DIRECTOR", "ASSISTANT", "CLERK", name="user_role", create_type=False), nullable=False),
    )
    op.create_index("ix_project_users_project", "project_users", ["project_id"])
    op.create_index("ix_project_users_user", "project_users", ["user_id"])

    # Налоговые схемы
    op.create_table(
        "tax_schemes",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("name", sa.String(100), nullable=False, unique=True),
        sa.Column("is_system", sa.Boolean, server_default="false"),
    )

    # Компоненты налоговой схемы
    op.create_table(
        "tax_components",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("scheme_id", UUID(as_uuid=True), sa.ForeignKey("tax_schemes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(50), nullable=False),
        sa.Column("rate", sa.Float, nullable=False),
        sa.Column("type", sa.Enum("INTERNAL", "EXTERNAL", name="tax_component_type", create_type=False), nullable=False),
        sa.Column("recipient", sa.Enum("CONTRACTOR", "BUDGET", name="tax_recipient", create_type=False), server_default="BUDGET"),
        sa.Column("sort_order", sa.Integer, server_default="0"),
    )

    # Контрагенты
    op.create_table(
        "contractors",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("passport_data_enc", sa.Text, nullable=True),
        sa.Column("bank_details_enc", sa.Text, nullable=True),
        sa.Column("type", sa.Enum("FL", "SZ", "IP", "OOO", name="contractor_type", create_type=False), nullable=False),
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
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("project_id", UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("parent_id", UUID(as_uuid=True), sa.ForeignKey("budget_lines.id", ondelete="CASCADE"), nullable=True),
        sa.Column("sort_order", sa.Integer, server_default="0"),
        sa.Column("level", sa.Integer, server_default="0"),
        sa.Column("code", sa.String(50), server_default=""),
        sa.Column("name", sa.String(500), nullable=False),
        sa.Column("type", sa.Enum("GROUP", "ITEM", "SPREAD_ITEM", name="budget_line_type", create_type=False), server_default="ITEM"),
        sa.Column("unit", sa.String(50), nullable=True),
        sa.Column("quantity_units", sa.Float, server_default="1"),
        sa.Column("rate", sa.Float, server_default="0"),
        sa.Column("quantity", sa.Float, server_default="1"),
        sa.Column("tax_scheme_id", UUID(as_uuid=True), sa.ForeignKey("tax_schemes.id", ondelete="SET NULL"), nullable=True),
        sa.Column("tax_override", sa.Boolean, server_default="false"),
        sa.Column("currency", sa.String(10), server_default="RUB"),
        sa.Column("limit_amount", sa.Float, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), onupdate=sa.text("now()")),
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

    op.execute("DROP TYPE IF EXISTS budget_line_type")
    op.execute("DROP TYPE IF EXISTS tax_recipient")
    op.execute("DROP TYPE IF EXISTS tax_component_type")
    op.execute("DROP TYPE IF EXISTS contractor_type")
    op.execute("DROP TYPE IF EXISTS exchange_rate_mode")
    op.execute("DROP TYPE IF EXISTS project_status")
    op.execute("DROP TYPE IF EXISTS user_role")
