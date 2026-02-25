import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Boolean, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class UserRole(str):
    PRODUCER = "PRODUCER"
    LINE_PRODUCER = "LINE_PRODUCER"
    DIRECTOR = "DIRECTOR"
    ASSISTANT = "ASSISTANT"
    CLERK = "CLERK"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_superadmin: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Связи
    project_users: Mapped[list["ProjectUser"]] = relationship("ProjectUser", back_populates="user", cascade="all, delete-orphan")


class ProjectUser(Base):
    """Связь пользователей с проектами и ролями."""
    __tablename__ = "project_users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[str] = mapped_column(
        SAEnum("PRODUCER", "LINE_PRODUCER", "DIRECTOR", "ASSISTANT", "CLERK", name="user_role"),
        nullable=False,
    )

    # Связи
    user: Mapped["User"] = relationship("User", back_populates="project_users")
    project: Mapped["Project"] = relationship("Project", back_populates="project_users")
