import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, Enum as SAEnum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class Contractor(Base):
    __tablename__ = "contractors"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    # Зашифрованные поля (AES-256-GCM, base64)
    passport_data_enc: Mapped[str | None] = mapped_column(Text, default=None)
    bank_details_enc: Mapped[str | None] = mapped_column(Text, default=None)

    type: Mapped[str] = mapped_column(
        SAEnum("FL", "SZ", "IP", "OOO", name="contractor_type"),
        nullable=False,
    )
    inn: Mapped[str | None] = mapped_column(String(12), default=None)
    telegram_id: Mapped[str | None] = mapped_column(String(50), default=None)
    phone: Mapped[str | None] = mapped_column(String(20), default=None)
    email: Mapped[str | None] = mapped_column(String(255), default=None)
    currency: Mapped[str] = mapped_column(String(10), default="RUB")

    tax_scheme_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tax_schemes.id", ondelete="SET NULL"), default=None
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Связи
    tax_scheme: Mapped["TaxScheme | None"] = relationship("TaxScheme")
