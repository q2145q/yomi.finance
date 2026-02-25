import uuid
from datetime import datetime
from pydantic import BaseModel
from typing import Optional, Any


class BudgetLineCreate(BaseModel):
    parent_id: Optional[uuid.UUID] = None
    name: str
    type: str = "ITEM"
    unit: Optional[str] = None
    quantity_units: float = 1.0
    rate: float = 0.0
    quantity: float = 1.0
    tax_scheme_id: Optional[uuid.UUID] = None
    currency: str = "RUB"
    sort_order: int = 0


class BudgetLineUpdate(BaseModel):
    name: Optional[str] = None
    unit: Optional[str] = None
    quantity_units: Optional[float] = None
    rate: Optional[float] = None
    quantity: Optional[float] = None
    tax_scheme_id: Optional[uuid.UUID] = None
    tax_override: Optional[bool] = None
    currency: Optional[str] = None
    limit_amount: Optional[float] = None
    sort_order: Optional[int] = None


class BudgetLineOut(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    parent_id: Optional[uuid.UUID]
    sort_order: int
    level: int
    code: str
    name: str
    type: str
    unit: Optional[str]
    quantity_units: float
    rate: float
    quantity: float
    tax_scheme_id: Optional[uuid.UUID]
    tax_override: bool
    currency: str
    limit_amount: float

    # Вычисляемые поля
    subtotal: float = 0.0
    tax_amount: float = 0.0
    total: float = 0.0

    # Агрегаты из производственных данных (Этап 2+)
    accrued: float = 0.0
    paid: float = 0.0
    closed: float = 0.0
    advance: float = 0.0

    children: list["BudgetLineOut"] = []
    updated_at: datetime

    model_config = {"from_attributes": True}


class BudgetLineMoveRequest(BaseModel):
    parent_id: Optional[uuid.UUID] = None
    sort_order: int
