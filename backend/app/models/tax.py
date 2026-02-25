import uuid

from sqlalchemy import String, Boolean, Float, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class TaxScheme(Base):
    __tablename__ = "tax_schemes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    is_system: Mapped[bool] = mapped_column(Boolean, default=False)  # системные нельзя удалить

    components: Mapped[list["TaxComponent"]] = relationship(
        "TaxComponent", back_populates="scheme", cascade="all, delete-orphan", order_by="TaxComponent.sort_order"
    )


class TaxComponent(Base):
    __tablename__ = "tax_components"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scheme_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tax_schemes.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(50), nullable=False)  # "НПД", "НДФЛ", "Страховые", "НДС"
    rate: Mapped[float] = mapped_column(Float, nullable=False)      # 0.06, 0.13, 0.30, 0.20
    type: Mapped[str] = mapped_column(
        SAEnum("INTERNAL", "EXTERNAL", name="tax_component_type"),
        nullable=False,
    )
    recipient: Mapped[str] = mapped_column(
        SAEnum("CONTRACTOR", "BUDGET", name="tax_recipient"),
        default="BUDGET",
    )
    sort_order: Mapped[int] = mapped_column(default=0)

    scheme: Mapped["TaxScheme"] = relationship("TaxScheme", back_populates="components")
