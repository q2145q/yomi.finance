import uuid
from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class ProjectCreate(BaseModel):
    name: str
    currency_primary: str = "RUB"
    currencies_allowed: list[str] = []
    exchange_rate_mode: str = "CBR_ON_DATE"
    exchange_rate_fixed: Optional[float] = None
    status: str = "PREP"


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    currency_primary: Optional[str] = None
    currencies_allowed: Optional[list[str]] = None
    exchange_rate_mode: Optional[str] = None
    exchange_rate_fixed: Optional[float] = None
    status: Optional[str] = None


class ProjectOut(BaseModel):
    id: uuid.UUID
    name: str
    currency_primary: str
    currencies_allowed: list[str]
    exchange_rate_mode: str
    exchange_rate_fixed: Optional[float]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
