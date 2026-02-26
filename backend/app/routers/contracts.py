import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.contract import Contract, ContractBudgetLine
from app.models.contractor import Contractor
from app.schemas.contract import ContractCreate, ContractUpdate, ContractOut
from app.routers.deps import CurrentUser

router = APIRouter(prefix="/contracts", tags=["contracts"])


def _to_out(c: Contract) -> ContractOut:
    return ContractOut(
        id=c.id,
        number=c.number,
        project_id=c.project_id,
        contractor_id=c.contractor_id,
        contractor_name=c.contractor.full_name if c.contractor else "",
        payment_type=c.payment_type,
        payment_period=c.payment_period,
        currency=c.currency,
        status=c.status,
        signed_at=c.signed_at,
        valid_from=c.valid_from,
        valid_to=c.valid_to,
        tax_scheme_id=c.tax_scheme_id,
        tax_override=c.tax_override,
        notes=c.notes,
        budget_line_ids=[link.budget_line_id for link in c.budget_line_links],
        created_at=c.created_at,
        updated_at=c.updated_at,
    )


async def _load_contract(contract_id: uuid.UUID, db: AsyncSession) -> Contract:
    result = await db.execute(
        select(Contract)
        .where(Contract.id == contract_id)
        .options(selectinload(Contract.contractor), selectinload(Contract.budget_line_links))
    )
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Договор не найден")
    return c


@router.get("", response_model=list[ContractOut])
async def list_contracts(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    project_id: uuid.UUID | None = None,
    contractor_id: uuid.UUID | None = None,
):
    q = select(Contract).options(
        selectinload(Contract.contractor),
        selectinload(Contract.budget_line_links),
    )
    if project_id:
        q = q.where(Contract.project_id == project_id)
    if contractor_id:
        q = q.where(Contract.contractor_id == contractor_id)
    q = q.order_by(Contract.created_at.desc())
    result = await db.execute(q)
    return [_to_out(c) for c in result.scalars().all()]


@router.post("", response_model=ContractOut, status_code=status.HTTP_201_CREATED)
async def create_contract(
    data: ContractCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    # Подтянуть налог из контрагента если не передан и нет tax_override
    tax_scheme_id = data.tax_scheme_id
    if not tax_scheme_id and not data.tax_override:
        res = await db.execute(select(Contractor).where(Contractor.id == data.contractor_id))
        ctr = res.scalar_one_or_none()
        if ctr and ctr.tax_scheme_id:
            tax_scheme_id = ctr.tax_scheme_id

    c = Contract(
        number=data.number,
        project_id=data.project_id,
        contractor_id=data.contractor_id,
        payment_type=data.payment_type,
        payment_period=data.payment_period,
        currency=data.currency,
        status=data.status,
        signed_at=data.signed_at,
        valid_from=data.valid_from,
        valid_to=data.valid_to,
        tax_scheme_id=tax_scheme_id,
        tax_override=data.tax_override,
        notes=data.notes,
    )
    db.add(c)
    await db.flush()  # получаем c.id

    for bl_id in data.budget_line_ids:
        db.add(ContractBudgetLine(contract_id=c.id, budget_line_id=bl_id))

    await db.commit()
    return _to_out(await _load_contract(c.id, db))


@router.get("/{contract_id}", response_model=ContractOut)
async def get_contract(
    contract_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    return _to_out(await _load_contract(contract_id, db))


@router.patch("/{contract_id}", response_model=ContractOut)
async def update_contract(
    contract_id: uuid.UUID,
    data: ContractUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    c = await _load_contract(contract_id, db)
    update_data = data.model_dump(exclude_none=True)

    # Обновляем связи budget_lines отдельно
    if "budget_line_ids" in update_data:
        new_ids = set(update_data.pop("budget_line_ids"))
        existing_ids = {link.budget_line_id for link in c.budget_line_links}
        # Добавить новые
        for bl_id in new_ids - existing_ids:
            db.add(ContractBudgetLine(contract_id=c.id, budget_line_id=bl_id))
        # Удалить убранные
        for link in c.budget_line_links:
            if link.budget_line_id not in new_ids:
                await db.delete(link)

    for field, value in update_data.items():
        setattr(c, field, value)

    await db.commit()
    return _to_out(await _load_contract(contract_id, db))


@router.delete("/{contract_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contract(
    contract_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    c = await _load_contract(contract_id, db)
    await db.delete(c)
    await db.commit()
