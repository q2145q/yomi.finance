import enum
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Currency(str, enum.Enum):
    RUB = "RUB"
    USD = "USD"
    EUR = "EUR"


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    currency: Mapped[Currency] = mapped_column(Enum(Currency), default=Currency.RUB)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    params: Mapped[list["ProjectParam"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    categories: Mapped[list["BudgetCategory"]] = relationship(
        back_populates="project", cascade="all, delete-orphan", order_by="BudgetCategory.order_index"
    )
    user_links: Mapped[list["ProjectUser"]] = relationship(back_populates="project")
    limits: Mapped[list["BudgetLimit"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )


class ProjectParam(Base):
    """Ключ-значение параметров проекта."""
    __tablename__ = "project_params"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"))
    key: Mapped[str] = mapped_column(String(100), nullable=False)
    value: Mapped[str] = mapped_column(String(500), nullable=False)

    project: Mapped["Project"] = relationship(back_populates="params")
