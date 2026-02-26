import uuid
from datetime import datetime, timezone, date

from sqlalchemy import String, Boolean, Text, ForeignKey, DateTime, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class Contract(Base):
    """Договор с контрагентом в рамках проекта."""
    __tablename__ = "contracts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    number: Mapped[str] = mapped_column(String(100), nullable=False)
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    contractor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("contractors.id", ondelete="RESTRICT"), nullable=False
    )
    payment_type: Mapped[str] = mapped_column(String(20), nullable=False)  # SALARY, PER_SHIFT, PERIODIC
    payment_period: Mapped[str | None] = mapped_column(String(50), default=None)  # weekly, monthly, custom

    currency: Mapped[str] = mapped_column(String(10), default="RUB")
    status: Mapped[str] = mapped_column(String(20), default="DRAFT")  # DRAFT, ACTIVE, CLOSED

    signed_at: Mapped[date | None] = mapped_column(Date, default=None)
    valid_from: Mapped[date | None] = mapped_column(Date, default=None)
    valid_to: Mapped[date | None] = mapped_column(Date, default=None)

    tax_scheme_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tax_schemes.id", ondelete="SET NULL"), default=None
    )
    tax_override: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[str | None] = mapped_column(Text, default=None)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Связи
    contractor: Mapped["Contractor"] = relationship("Contractor")
    tax_scheme: Mapped["TaxScheme | None"] = relationship("TaxScheme")
    budget_line_links: Mapped[list["ContractBudgetLine"]] = relationship(
        "ContractBudgetLine", back_populates="contract", cascade="all, delete-orphan"
    )


class ContractBudgetLine(Base):
    """Привязка договора к статье бюджета."""
    __tablename__ = "contract_budget_lines"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    contract_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False
    )
    budget_line_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("budget_lines.id", ondelete="CASCADE"), nullable=False
    )

    # Связи
    contract: Mapped["Contract"] = relationship("Contract", back_populates="budget_line_links")
    budget_line: Mapped["BudgetLine"] = relationship("BudgetLine")
