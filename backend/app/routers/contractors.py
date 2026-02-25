import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.contractor import Contractor
from app.core.security import encrypt_field, decrypt_field
from app.schemas.contractor import ContractorCreate, ContractorUpdate, ContractorOut
from app.routers.deps import CurrentUser

router = APIRouter(prefix="/contractors", tags=["contractors"])


def _to_out(c: Contractor) -> ContractorOut:
    return ContractorOut(
        id=c.id,
        full_name=c.full_name,
        type=c.type,
        inn=c.inn,
        phone=c.phone,
        email=c.email,
        currency=c.currency,
        tax_scheme_id=c.tax_scheme_id,
        telegram_id=c.telegram_id,
        created_at=c.created_at,
        has_passport=bool(c.passport_data_enc),
        has_bank_details=bool(c.bank_details_enc),
    )


@router.get("", response_model=list[ContractorOut])
async def list_contractors(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Contractor).order_by(Contractor.full_name))
    return [_to_out(c) for c in result.scalars().all()]


@router.post("", response_model=ContractorOut, status_code=status.HTTP_201_CREATED)
async def create_contractor(data: ContractorCreate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    c = Contractor(
        full_name=data.full_name,
        type=data.type,
        inn=data.inn,
        phone=data.phone,
        email=data.email,
        currency=data.currency,
        tax_scheme_id=data.tax_scheme_id,
        telegram_id=data.telegram_id,
        passport_data_enc=encrypt_field(data.passport_data) if data.passport_data else None,
        bank_details_enc=encrypt_field(data.bank_details) if data.bank_details else None,
    )
    db.add(c)
    await db.commit()
    await db.refresh(c)
    return _to_out(c)


@router.get("/{contractor_id}", response_model=ContractorOut)
async def get_contractor(contractor_id: uuid.UUID, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Contractor).where(Contractor.id == contractor_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Контрагент не найден")
    return _to_out(c)


@router.get("/{contractor_id}/sensitive")
async def get_sensitive(contractor_id: uuid.UUID, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    """Расшифрованные паспортные и банковские данные — только для продюсеров."""
    result = await db.execute(select(Contractor).where(Contractor.id == contractor_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Контрагент не найден")
    return {
        "passport_data": decrypt_field(c.passport_data_enc) if c.passport_data_enc else None,
        "bank_details": decrypt_field(c.bank_details_enc) if c.bank_details_enc else None,
    }


@router.patch("/{contractor_id}", response_model=ContractorOut)
async def update_contractor(
    contractor_id: uuid.UUID, data: ContractorUpdate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Contractor).where(Contractor.id == contractor_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Контрагент не найден")

    update_data = data.model_dump(exclude_none=True)

    # Обрабатываем шифруемые поля отдельно
    if "passport_data" in update_data:
        c.passport_data_enc = encrypt_field(update_data.pop("passport_data"))
    if "bank_details" in update_data:
        c.bank_details_enc = encrypt_field(update_data.pop("bank_details"))

    for field, value in update_data.items():
        setattr(c, field, value)

    await db.commit()
    await db.refresh(c)
    return _to_out(c)
