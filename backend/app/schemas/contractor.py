import uuid
from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class ContractorCreate(BaseModel):
    full_name: str
    type: str  # FL / SZ / IP / OOO
    inn: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    currency: str = "RUB"
    tax_scheme_id: Optional[uuid.UUID] = None
    # Чувствительные поля — передаются открыто, шифруются на сервере
    passport_data: Optional[str] = None
    bank_details: Optional[str] = None
    telegram_id: Optional[str] = None


class ContractorUpdate(BaseModel):
    full_name: Optional[str] = None
    type: Optional[str] = None
    inn: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    currency: Optional[str] = None
    tax_scheme_id: Optional[uuid.UUID] = None
    passport_data: Optional[str] = None
    bank_details: Optional[str] = None
    telegram_id: Optional[str] = None


class ContractorOut(BaseModel):
    id: uuid.UUID
    full_name: str
    type: str
    inn: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    currency: str
    tax_scheme_id: Optional[uuid.UUID]
    telegram_id: Optional[str]
    created_at: datetime
    # Чувствительные поля НЕ возвращаются в списке, только в детальном просмотре
    has_passport: bool = False
    has_bank_details: bool = False

    model_config = {"from_attributes": True}
