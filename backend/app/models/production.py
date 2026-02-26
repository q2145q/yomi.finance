import uuid
from datetime import datetime, timezone, date, time

from sqlalchemy import String, Float, Boolean, Integer, Text, ForeignKey, DateTime, Date, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class ProductionReport(Base):
    """Производственный отчёт — один съёмочный день."""
    __tablename__ = "production_reports"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    shoot_day_number: Mapped[int] = mapped_column(Integer, nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    location: Mapped[str | None] = mapped_column(String(500), default=None)
    shooting_group: Mapped[str | None] = mapped_column(String(200), default=None)
    notes: Mapped[str | None] = mapped_column(Text, default=None)
    status: Mapped[str] = mapped_column(String(20), default="DRAFT")  # DRAFT, SUBMITTED, APPROVED
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), default=None
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Связи
    entries: Mapped[list["ReportEntry"]] = relationship(
        "ReportEntry", back_populates="report", cascade="all, delete-orphan",
        order_by="ReportEntry.created_at"
    )


class ReportEntry(Base):
    """Запись о работе — одна строка смены в производственном отчёте."""
    __tablename__ = "report_entries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("production_reports.id", ondelete="CASCADE"), nullable=False
    )
    contractor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("contractors.id", ondelete="RESTRICT"), nullable=False
    )
    budget_line_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("budget_lines.id", ondelete="SET NULL"), default=None
    )
    contract_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("contracts.id", ondelete="SET NULL"), default=None
    )
    source: Mapped[str] = mapped_column(String(20), default="MANUAL")  # TG_BOT, MANUAL, ASSISTANT

    # Данные смены
    shift_start: Mapped[time | None] = mapped_column(Time, default=None)
    shift_end: Mapped[time | None] = mapped_column(Time, default=None)
    lunch_break_minutes: Mapped[int] = mapped_column(Integer, default=60)
    gap_minutes: Mapped[int] = mapped_column(Integer, default=0)
    overtime_hours: Mapped[float] = mapped_column(Float, default=0.0)
    equipment: Mapped[str | None] = mapped_column(Text, default=None)  # JSON-список через запятую

    # Финансы
    unit: Mapped[str] = mapped_column(String(50), default="смена")
    quantity: Mapped[float] = mapped_column(Float, default=1.0)
    rate: Mapped[float] = mapped_column(Float, default=0.0)
    tax_scheme_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tax_schemes.id", ondelete="SET NULL"), default=None
    )
    amount_net: Mapped[float] = mapped_column(Float, default=0.0)   # quantity * rate
    amount_gross: Mapped[float] = mapped_column(Float, default=0.0) # amount_net + tax

    # Статус
    status: Mapped[str] = mapped_column(String(20), default="PENDING")  # PENDING, APPROVED, IN_PAYMENT, PAID

    # AI-поля
    raw_text: Mapped[str | None] = mapped_column(Text, default=None)
    ai_parsed: Mapped[bool] = mapped_column(Boolean, default=False)
    ai_confidence: Mapped[float | None] = mapped_column(Float, default=None)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Связи
    report: Mapped["ProductionReport"] = relationship("ProductionReport", back_populates="entries")
    contractor: Mapped["Contractor"] = relationship("Contractor")
    budget_line: Mapped["BudgetLine | None"] = relationship("BudgetLine")
    contract: Mapped["Contract | None"] = relationship("Contract")
    tax_scheme: Mapped["TaxScheme | None"] = relationship("TaxScheme")
