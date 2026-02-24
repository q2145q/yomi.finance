from datetime import date
from typing import Optional

from pydantic import BaseModel

from app.models.budget import TaxType, UnitType


class BudgetLineCalcResult(BaseModel):
    plan_net: float
    plan_tax_1: float
    plan_tax_2: float
    plan_gross: float
    plan_ot_gross: float
    plan_total: float
    fact_net: float
    fact_tax_1: float
    fact_tax_2: float
    fact_gross: float
    fact_ot_gross: float
    fact_total: float


class BudgetLineBase(BaseModel):
    name: str
    contractor: Optional[str] = None
    unit_type: UnitType
    rate: float = 0.0
    qty_plan: float = 0.0
    qty_fact: float = 0.0
    date_start: Optional[date] = None
    date_end: Optional[date] = None
    tax_type: TaxType
    tax_rate_1: float = 0.0
    tax_rate_2: float = 0.0
    ot_rate: float = 0.0
    ot_hours_plan: float = 0.0
    ot_shifts_plan: float = 0.0
    ot_hours_fact: float = 0.0
    ot_shifts_fact: float = 0.0
    note: Optional[str] = None
    order_index: int = 0
    paid: float = 0.0


class BudgetLineCreate(BudgetLineBase):
    subcategory_id: int


class BudgetLineUpdate(BaseModel):
    name: Optional[str] = None
    contractor: Optional[str] = None
    unit_type: Optional[UnitType] = None
    rate: Optional[float] = None
    qty_plan: Optional[float] = None
    qty_fact: Optional[float] = None
    date_start: Optional[date] = None
    date_end: Optional[date] = None
    tax_type: Optional[TaxType] = None
    tax_rate_1: Optional[float] = None
    tax_rate_2: Optional[float] = None
    ot_rate: Optional[float] = None
    ot_hours_plan: Optional[float] = None
    ot_shifts_plan: Optional[float] = None
    ot_hours_fact: Optional[float] = None
    ot_shifts_fact: Optional[float] = None
    note: Optional[str] = None
    order_index: Optional[int] = None
    paid: Optional[float] = None


class BudgetLineRead(BudgetLineBase):
    id: int
    subcategory_id: int
    calc: BudgetLineCalcResult
    limit_amount: Optional[float] = None

    model_config = {"from_attributes": True}


class BudgetSubcategoryRead(BaseModel):
    id: int
    name: str
    order_index: int
    lines: list[BudgetLineRead] = []

    model_config = {"from_attributes": True}


class BudgetCategoryCreate(BaseModel):
    name: str
    order_index: int = 0


class BudgetSubcategoryCreate(BaseModel):
    category_id: int
    name: str
    order_index: int = 0


class BudgetCategoryRead(BaseModel):
    id: int
    name: str
    order_index: int
    subcategories: list[BudgetSubcategoryRead] = []

    model_config = {"from_attributes": True}
