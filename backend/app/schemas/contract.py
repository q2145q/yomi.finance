import uuid
from datetime import datetime, date
from pydantic import BaseModel
from typing import Optional


class ContractCreate(BaseModel):
    number: str
    project_id: uuid.UUID
    contractor_id: uuid.UUID
    payment_type: str  # SALARY, PER_SHIFT, PERIODIC
    payment_period: Optional[str] = None
    currency: str = "RUB"
    status: str = "DRAFT"
    signed_at: Optional[date] = None
    valid_from: Optional[date] = None
    valid_to: Optional[date] = None
    tax_scheme_id: Optional[uuid.UUID] = None
    tax_override: bool = False
    notes: Optional[str] = None
    budget_line_ids: list[uuid.UUID] = []


class ContractUpdate(BaseModel):
    number: Optional[str] = None
    payment_type: Optional[str] = None
    payment_period: Optional[str] = None
    currency: Optional[str] = None
    status: Optional[str] = None
    signed_at: Optional[date] = None
    valid_from: Optional[date] = None
    valid_to: Optional[date] = None
    tax_scheme_id: Optional[uuid.UUID] = None
    tax_override: Optional[bool] = None
    notes: Optional[str] = None
    budget_line_ids: Optional[list[uuid.UUID]] = None


class ContractOut(BaseModel):
    id: uuid.UUID
    number: str
    project_id: uuid.UUID
    contractor_id: uuid.UUID
    contractor_name: str
    payment_type: str
    payment_period: Optional[str]
    currency: str
    status: str
    signed_at: Optional[date]
    valid_from: Optional[date]
    valid_to: Optional[date]
    tax_scheme_id: Optional[uuid.UUID]
    tax_override: bool
    notes: Optional[str]
    budget_line_ids: list[uuid.UUID]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
