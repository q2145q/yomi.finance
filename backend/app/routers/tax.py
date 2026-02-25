import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.tax import TaxScheme, TaxComponent
from app.schemas.tax import TaxSchemeOut, TaxSchemeCreate
from app.routers.deps import CurrentUser

router = APIRouter(prefix="/tax-schemes", tags=["tax-schemes"])


@router.get("", response_model=list[TaxSchemeOut])
async def list_schemes(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(TaxScheme).options(selectinload(TaxScheme.components)).order_by(TaxScheme.name)
    )
    return result.scalars().all()


@router.post("", response_model=TaxSchemeOut, status_code=status.HTTP_201_CREATED)
async def create_scheme(data: TaxSchemeCreate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    scheme = TaxScheme(name=data.name, is_system=False)
    db.add(scheme)
    await db.flush()

    for i, comp in enumerate(data.components):
        c = TaxComponent(scheme_id=scheme.id, sort_order=i, **comp.model_dump())
        db.add(c)

    await db.commit()
    result = await db.execute(
        select(TaxScheme).options(selectinload(TaxScheme.components)).where(TaxScheme.id == scheme.id)
    )
    return result.scalar_one()


@router.get("/{scheme_id}", response_model=TaxSchemeOut)
async def get_scheme(scheme_id: uuid.UUID, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(TaxScheme).options(selectinload(TaxScheme.components)).where(TaxScheme.id == scheme_id)
    )
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="Схема не найдена")
    return s


@router.delete("/{scheme_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scheme(scheme_id: uuid.UUID, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TaxScheme).where(TaxScheme.id == scheme_id))
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="Схема не найдена")
    if s.is_system:
        raise HTTPException(status_code=400, detail="Системную схему нельзя удалить")
    await db.delete(s)
    await db.commit()
