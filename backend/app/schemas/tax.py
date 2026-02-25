import uuid
from pydantic import BaseModel
from typing import Optional


class TaxComponentOut(BaseModel):
    id: uuid.UUID
    name: str
    rate: float
    type: str
    recipient: str
    sort_order: int

    model_config = {"from_attributes": True}


class TaxSchemeOut(BaseModel):
    id: uuid.UUID
    name: str
    is_system: bool
    components: list[TaxComponentOut]

    model_config = {"from_attributes": True}


class TaxComponentCreate(BaseModel):
    name: str
    rate: float
    type: str
    recipient: str = "BUDGET"
    sort_order: int = 0


class TaxSchemeCreate(BaseModel):
    name: str
    components: list[TaxComponentCreate]
