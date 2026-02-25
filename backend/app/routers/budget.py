import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload  # используется в _get_scheme_map

from app.database import get_db
from app.models.budget import BudgetLine
from app.models.user import ProjectUser
from app.models.tax import TaxScheme
from app.models.contractor import Contractor
from app.schemas.budget import BudgetLineCreate, BudgetLineUpdate, BudgetLineOut, BudgetLineMoveRequest
from app.routers.deps import CurrentUser
from app.core.tax_logic import calc_tax

# Роутер для операций внутри проекта
router = APIRouter(prefix="/projects", tags=["budget"])

# Роутер для операций со статьями по ID (без привязки к проекту в пути)
lines_router = APIRouter(prefix="/budget/lines", tags=["budget"])


def _line_to_out(line: BudgetLine, contractor_map: dict | None = None) -> BudgetLineOut:
    """Создаёт BudgetLineOut из скалярных полей модели (без обращения к lazy-relations)."""
    contractor_name = None
    if contractor_map and line.contractor_id:
        contractor_name = contractor_map.get(line.contractor_id)
    return BudgetLineOut(
        id=line.id,
        project_id=line.project_id,
        parent_id=line.parent_id,
        sort_order=line.sort_order,
        level=line.level,
        code=line.code,
        name=line.name,
        type=line.type,
        unit=line.unit,
        quantity_units=line.quantity_units,
        rate=line.rate,
        quantity=line.quantity,
        tax_scheme_id=line.tax_scheme_id,
        contractor_id=line.contractor_id,
        contractor_name=contractor_name,
        tax_override=line.tax_override,
        currency=line.currency,
        limit_amount=line.limit_amount,
        updated_at=line.updated_at,
        children=[],
    )


def _compute_line(line: BudgetLine, tax_components: list[dict], contractor_map: dict | None = None) -> BudgetLineOut:
    """Вычисляет subtotal/tax_amount/total для статьи."""
    out = _line_to_out(line, contractor_map)
    if line.type == "GROUP":
        return out

    result = calc_tax(line.rate, line.quantity, tax_components)
    out.subtotal = result["subtotal"]
    out.tax_amount = result["tax_amount"]
    out.total = result["total"]
    return out


def _build_tree(
    lines: list[BudgetLine],
    scheme_map: dict,
    contractor_map: dict,
    parent_id=None,
) -> list[BudgetLineOut]:
    """Рекурсивно строит дерево статей бюджета."""
    result = []
    for line in sorted([l for l in lines if l.parent_id == parent_id], key=lambda x: x.sort_order):
        components = []
        if line.tax_scheme_id and line.tax_scheme_id in scheme_map:
            components = scheme_map[line.tax_scheme_id]

        out = _compute_line(line, components, contractor_map)
        out.children = _build_tree(lines, scheme_map, contractor_map, line.id)

        # Агрегируем итоги для групп
        if line.type == "GROUP" and out.children:
            out.subtotal = sum(c.subtotal for c in out.children)
            out.tax_amount = sum(c.tax_amount for c in out.children)
            out.total = sum(c.total for c in out.children)
            out.accrued = sum(c.accrued for c in out.children)
            out.paid = sum(c.paid for c in out.children)
            out.closed = sum(c.closed for c in out.children)

        result.append(out)
    return result


async def _get_scheme_map(db: AsyncSession, lines: list[BudgetLine]) -> dict:
    """Загружает налоговые схемы для статей."""
    scheme_ids = list({l.tax_scheme_id for l in lines if l.tax_scheme_id})
    scheme_map = {}
    if scheme_ids:
        schemes_result = await db.execute(
            select(TaxScheme).options(selectinload(TaxScheme.components))
            .where(TaxScheme.id.in_(scheme_ids))
        )
        for scheme in schemes_result.scalars().all():
            scheme_map[scheme.id] = [
                {"name": c.name, "rate": c.rate, "type": c.type, "recipient": c.recipient}
                for c in scheme.components
            ]
    return scheme_map


async def _get_contractor_map(db: AsyncSession, lines: list[BudgetLine]) -> dict:
    """Загружает имена контрагентов для статей."""
    contractor_ids = list({l.contractor_id for l in lines if l.contractor_id})
    contractor_map = {}
    if contractor_ids:
        result = await db.execute(
            select(Contractor).where(Contractor.id.in_(contractor_ids))
        )
        for c in result.scalars().all():
            contractor_map[c.id] = c.full_name
    return contractor_map


@router.get("/{project_id}/budget", response_model=list[BudgetLineOut])
async def get_budget(project_id: uuid.UUID, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    """Дерево статей бюджета проекта."""
    if not current_user.is_superadmin:
        pu_result = await db.execute(
            select(ProjectUser).where(ProjectUser.project_id == project_id, ProjectUser.user_id == current_user.id)
        )
        if not pu_result.scalar_one_or_none():
            raise HTTPException(status_code=403, detail="Нет доступа к проекту")

    lines_result = await db.execute(
        select(BudgetLine).where(BudgetLine.project_id == project_id)
    )
    lines = list(lines_result.scalars().all())
    scheme_map = await _get_scheme_map(db, lines)
    contractor_map = await _get_contractor_map(db, lines)
    return _build_tree(lines, scheme_map, contractor_map)


@router.post("/{project_id}/budget/lines", response_model=BudgetLineOut, status_code=status.HTTP_201_CREATED)
async def create_line(
    project_id: uuid.UUID, data: BudgetLineCreate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)
):
    if not current_user.is_superadmin:
        pu_result = await db.execute(
            select(ProjectUser).where(ProjectUser.project_id == project_id, ProjectUser.user_id == current_user.id)
        )
        pu = pu_result.scalar_one_or_none()
        if not pu or pu.role not in ("PRODUCER", "LINE_PRODUCER"):
            raise HTTPException(status_code=403, detail="Только продюсер или линейный продюсер может редактировать бюджет")

    level = 0
    if data.parent_id:
        parent_result = await db.execute(select(BudgetLine).where(BudgetLine.id == data.parent_id))
        parent = parent_result.scalar_one_or_none()
        if parent:
            level = parent.level + 1

    # Автоподстановка: если явно не указана схема, берём схему контрагента
    effective_tax_scheme_id = data.tax_scheme_id
    if not effective_tax_scheme_id and data.contractor_id:
        cr = await db.execute(select(Contractor).where(Contractor.id == data.contractor_id))
        c = cr.scalar_one_or_none()
        if c and c.tax_scheme_id:
            effective_tax_scheme_id = c.tax_scheme_id

    line = BudgetLine(
        project_id=project_id,
        parent_id=data.parent_id,
        name=data.name,
        type=data.type,
        unit=data.unit,
        quantity_units=data.quantity_units,
        rate=data.rate,
        quantity=data.quantity,
        tax_scheme_id=effective_tax_scheme_id,
        contractor_id=data.contractor_id,
        currency=data.currency,
        sort_order=data.sort_order,
        level=level,
    )
    db.add(line)
    await db.commit()
    await db.refresh(line)

    components = []
    if line.tax_scheme_id:
        scheme_map = await _get_scheme_map(db, [line])
        components = scheme_map.get(line.tax_scheme_id, [])

    contractor_map = await _get_contractor_map(db, [line])
    return _compute_line(line, components, contractor_map)


# --- Операции со статьями по ID ---

@lines_router.patch("/{line_id}", response_model=BudgetLineOut)
async def update_line(
    line_id: uuid.UUID, data: BudgetLineUpdate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(BudgetLine).where(BudgetLine.id == line_id))
    line = result.scalar_one_or_none()
    if not line:
        raise HTTPException(status_code=404, detail="Статья не найдена")

    update_data = data.model_dump(exclude_unset=True)

    # Если пользователь явно поставил схему вручную — фиксируем override
    # Если очистил схему — снимаем override (контрагент снова сможет автоподставить)
    if "tax_scheme_id" in update_data:
        if update_data["tax_scheme_id"] is not None:
            update_data.setdefault("tax_override", True)
        else:
            update_data.setdefault("tax_override", False)

    # Если назначается контрагент и нет ручного override и схема не меняется вручную —
    # автоматически подтягиваем схему контрагента
    if (
        "contractor_id" in update_data
        and "tax_scheme_id" not in update_data
        and not line.tax_override
    ):
        new_cid = update_data["contractor_id"]
        if new_cid:
            cr = await db.execute(select(Contractor).where(Contractor.id == new_cid))
            c = cr.scalar_one_or_none()
            if c and c.tax_scheme_id:
                update_data["tax_scheme_id"] = c.tax_scheme_id

    for field, value in update_data.items():
        setattr(line, field, value)

    await db.commit()
    await db.refresh(line)

    components = []
    if line.tax_scheme_id:
        scheme_map = await _get_scheme_map(db, [line])
        components = scheme_map.get(line.tax_scheme_id, [])

    contractor_map = await _get_contractor_map(db, [line])
    return _compute_line(line, components, contractor_map)


@lines_router.delete("/{line_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_line(line_id: uuid.UUID, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BudgetLine).where(BudgetLine.id == line_id))
    line = result.scalar_one_or_none()
    if not line:
        raise HTTPException(status_code=404, detail="Статья не найдена")
    await db.delete(line)
    await db.commit()


@lines_router.post("/{line_id}/move", response_model=BudgetLineOut)
async def move_line(
    line_id: uuid.UUID, data: BudgetLineMoveRequest, current_user: CurrentUser, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(BudgetLine).where(BudgetLine.id == line_id))
    line = result.scalar_one_or_none()
    if not line:
        raise HTTPException(status_code=404, detail="Статья не найдена")

    line.parent_id = data.parent_id
    line.sort_order = data.sort_order

    if data.parent_id:
        parent_result = await db.execute(select(BudgetLine).where(BudgetLine.id == data.parent_id))
        parent = parent_result.scalar_one_or_none()
        if parent:
            line.level = parent.level + 1
    else:
        line.level = 0

    await db.commit()
    await db.refresh(line)
    return _line_to_out(line)
