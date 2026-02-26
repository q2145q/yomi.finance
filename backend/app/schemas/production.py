import uuid
from datetime import datetime, date, time
from pydantic import BaseModel
from typing import Optional


# ─── ReportEntry ───────────────────────────────────────────────────────────────

class ReportEntryCreate(BaseModel):
    contractor_id: uuid.UUID
    budget_line_id: Optional[uuid.UUID] = None
    contract_id: Optional[uuid.UUID] = None
    source: str = "MANUAL"
    shift_start: Optional[time] = None
    shift_end: Optional[time] = None
    lunch_break_minutes: int = 60
    gap_minutes: int = 0
    equipment: Optional[str] = None
    unit: str = "смена"
    quantity: float = 1.0
    rate: float = 0.0
    tax_scheme_id: Optional[uuid.UUID] = None
    raw_text: Optional[str] = None


class ReportEntryUpdate(BaseModel):
    budget_line_id: Optional[uuid.UUID] = None
    contract_id: Optional[uuid.UUID] = None
    shift_start: Optional[time] = None
    shift_end: Optional[time] = None
    lunch_break_minutes: Optional[int] = None
    gap_minutes: Optional[int] = None
    equipment: Optional[str] = None
    unit: Optional[str] = None
    quantity: Optional[float] = None
    rate: Optional[float] = None
    tax_scheme_id: Optional[uuid.UUID] = None
    status: Optional[str] = None


class ReportEntryOut(BaseModel):
    id: uuid.UUID
    report_id: uuid.UUID
    contractor_id: uuid.UUID
    contractor_name: str
    budget_line_id: Optional[uuid.UUID]
    budget_line_name: Optional[str]
    contract_id: Optional[uuid.UUID]
    contract_number: Optional[str]
    source: str
    shift_start: Optional[time]
    shift_end: Optional[time]
    lunch_break_minutes: int
    gap_minutes: int
    overtime_hours: float
    equipment: Optional[str]
    unit: str
    quantity: float
    rate: float
    tax_scheme_id: Optional[uuid.UUID]
    amount_net: float
    amount_gross: float
    status: str
    ai_parsed: bool
    ai_confidence: Optional[float]
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── ProductionReport ──────────────────────────────────────────────────────────

class ProductionReportCreate(BaseModel):
    project_id: uuid.UUID
    shoot_day_number: int
    date: date
    location: Optional[str] = None
    shooting_group: Optional[str] = None
    notes: Optional[str] = None
    status: str = "DRAFT"


class ProductionReportUpdate(BaseModel):
    shoot_day_number: Optional[int] = None
    date: Optional[date] = None
    location: Optional[str] = None
    shooting_group: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class ProductionReportOut(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    shoot_day_number: int
    date: date
    location: Optional[str]
    shooting_group: Optional[str]
    notes: Optional[str]
    status: str
    created_by: Optional[uuid.UUID]
    created_at: datetime
    updated_at: datetime
    entries: list[ReportEntryOut] = []

    # Агрегаты
    total_net: float = 0.0
    total_gross: float = 0.0
    entry_count: int = 0

    model_config = {"from_attributes": True}
