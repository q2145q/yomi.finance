import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    currency_primary: Mapped[str] = mapped_column(String(10), default="RUB")
    currencies_allowed: Mapped[list] = mapped_column(JSON, default=list)
    exchange_rate_mode: Mapped[str] = mapped_column(
        String(20),
        default="CBR_ON_DATE",
    )
    exchange_rate_fixed: Mapped[float | None] = mapped_column(default=None)
    status: Mapped[str] = mapped_column(
        String(20),
        default="PREP",
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Связи
    project_users: Mapped[list["ProjectUser"]] = relationship("ProjectUser", back_populates="project", cascade="all, delete-orphan")
    budget_lines: Mapped[list["BudgetLine"]] = relationship("BudgetLine", back_populates="project", cascade="all, delete-orphan")
