from datetime import date
from typing import Optional

from pydantic import BaseModel

from app.models.project import Currency


class ProjectParamRead(BaseModel):
    key: str
    value: str

    model_config = {"from_attributes": True}


class ProjectCreate(BaseModel):
    name: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    currency: Currency = Currency.RUB
    # Параметры (ключ → значение)
    params: dict[str, str] = {}


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    currency: Optional[Currency] = None
    params: Optional[dict[str, str]] = None


class ProjectRead(BaseModel):
    id: int
    name: str
    start_date: Optional[date]
    end_date: Optional[date]
    currency: Currency
    params: list[ProjectParamRead] = []

    model_config = {"from_attributes": True}
