import enum
from datetime import date, datetime

from sqlalchemy import (
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UnitType(str, enum.Enum):
    shift = "Смена"
    month = "Месяц"
    week = "Неделя"
    day = "День"
    hour = "Час"
    piece = "Шт"
    km = "Км"
    accord = "Аккорд"
    series = "Серия"
    reel = "Ролик"
    room_night = "Номер/ночь"


class TaxType(str, enum.Enum):
    sz = "СЗ"
    ip = "ИП"
    nds = "НДС"
    ip_nds = "ИП+НДС"
    fl = "ФЛ"
    none = "Без налога"


class BudgetCategory(Base):
    __tablename__ = "budget_categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0)

    project: Mapped["Project"] = relationship(back_populates="categories")
    subcategories: Mapped[list["BudgetSubcategory"]] = relationship(
        back_populates="category",
        cascade="all, delete-orphan",
        order_by="BudgetSubcategory.order_index",
    )


class BudgetSubcategory(Base):
    __tablename__ = "budget_subcategories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("budget_categories.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0)

    category: Mapped["BudgetCategory"] = relationship(back_populates="subcategories")
    lines: Mapped[list["BudgetLine"]] = relationship(
        back_populates="subcategory",
        cascade="all, delete-orphan",
        order_by="BudgetLine.order_index",
    )


class BudgetLine(Base):
    __tablename__ = "budget_lines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    subcategory_id: Mapped[int] = mapped_column(
        ForeignKey("budget_subcategories.id", ondelete="CASCADE")
    )
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    contractor: Mapped[str | None] = mapped_column(String(500), nullable=True)

    unit_type: Mapped[UnitType] = mapped_column(Enum(UnitType), nullable=False)
    rate: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    qty_plan: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    qty_fact: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    date_start: Mapped[date | None] = mapped_column(Date, nullable=True)
    date_end: Mapped[date | None] = mapped_column(Date, nullable=True)

    tax_type: Mapped[TaxType] = mapped_column(Enum(TaxType), nullable=False)
    tax_rate_1: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    tax_rate_2: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    ot_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    ot_hours_plan: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    ot_shifts_plan: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    ot_hours_fact: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    ot_shifts_fact: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, default=0)

    paid: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    subcategory: Mapped["BudgetSubcategory"] = relationship(back_populates="lines")
    limit: Mapped["BudgetLimit | None"] = relationship(
        back_populates="line", uselist=False, cascade="all, delete-orphan"
    )


class BudgetLimit(Base):
    """Снэпшот лимита по строке бюджета."""
    __tablename__ = "budget_limits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"))
    line_id: Mapped[int] = mapped_column(ForeignKey("budget_lines.id", ondelete="CASCADE"), unique=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    project: Mapped["Project"] = relationship(back_populates="limits")
    line: Mapped["BudgetLine"] = relationship(back_populates="limit")
