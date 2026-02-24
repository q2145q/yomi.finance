from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.tax_logic import calc_line_totals
from app.database import get_db
from app.models.budget import (
    BudgetCategory,
    BudgetLimit,
    BudgetLine,
    BudgetSubcategory,
)
from app.schemas.budget import (
    BudgetCategoryCreate,
    BudgetCategoryRead,
    BudgetLineCalcResult,
    BudgetLineCreate,
    BudgetLineRead,
    BudgetLineUpdate,
    BudgetSubcategoryCreate,
    BudgetSubcategoryRead,
)

router = APIRouter(prefix="/projects/{project_id}/budget", tags=["budget"])


def _enrich_line(line: BudgetLine) -> dict:
    """Добавляет расчётные поля к строке."""
    calc = calc_line_totals(
        rate=line.rate,
        qty_plan=line.qty_plan,
        qty_fact=line.qty_fact,
        unit_type=line.unit_type.value,
        tax_type=line.tax_type.value,
        tax_rate_1=line.tax_rate_1,
        tax_rate_2=line.tax_rate_2,
        ot_rate=line.ot_rate,
        ot_hours_plan=line.ot_hours_plan,
        ot_shifts_plan=line.ot_shifts_plan,
        ot_hours_fact=line.ot_hours_fact,
        ot_shifts_fact=line.ot_shifts_fact,
    )
    data = {c.name: getattr(line, c.name) for c in line.__table__.columns}
    data["calc"] = calc
    data["limit_amount"] = line.limit.amount if line.limit else None
    return data


# ─── Categories ──────────────────────────────────────────────────────────────

@router.get("/", response_model=list[BudgetCategoryRead])
async def get_budget(project_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(BudgetCategory)
        .options(
            selectinload(BudgetCategory.subcategories).selectinload(
                BudgetSubcategory.lines
            ).selectinload(BudgetLine.limit)
        )
        .where(BudgetCategory.project_id == project_id)
        .order_by(BudgetCategory.order_index)
    )
    categories = result.scalars().all()
    out = []
    for cat in categories:
        cat_dict = {"id": cat.id, "name": cat.name, "order_index": cat.order_index, "subcategories": []}
        for sub in sorted(cat.subcategories, key=lambda s: s.order_index):
            sub_dict = {"id": sub.id, "name": sub.name, "order_index": sub.order_index, "lines": []}
            for line in sorted(sub.lines, key=lambda l: l.order_index):
                sub_dict["lines"].append(_enrich_line(line))
            cat_dict["subcategories"].append(sub_dict)
        out.append(cat_dict)
    return out


@router.post("/categories", response_model=BudgetCategoryRead, status_code=201)
async def create_category(
    project_id: int, data: BudgetCategoryCreate, db: AsyncSession = Depends(get_db)
):
    cat = BudgetCategory(project_id=project_id, name=data.name, order_index=data.order_index)
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return {"id": cat.id, "name": cat.name, "order_index": cat.order_index, "subcategories": []}


@router.patch("/categories/{cat_id}", response_model=BudgetCategoryRead)
async def update_category(
    project_id: int, cat_id: int, data: BudgetCategoryCreate, db: AsyncSession = Depends(get_db)
):
    cat = await db.get(BudgetCategory, cat_id)
    if not cat or cat.project_id != project_id:
        raise HTTPException(404)
    cat.name = data.name
    cat.order_index = data.order_index
    await db.commit()
    await db.refresh(cat)
    return {"id": cat.id, "name": cat.name, "order_index": cat.order_index, "subcategories": []}


@router.delete("/categories/{cat_id}", status_code=204)
async def delete_category(project_id: int, cat_id: int, db: AsyncSession = Depends(get_db)):
    cat = await db.get(BudgetCategory, cat_id)
    if not cat or cat.project_id != project_id:
        raise HTTPException(404)
    await db.delete(cat)
    await db.commit()


# ─── Subcategories ────────────────────────────────────────────────────────────

@router.post("/subcategories", response_model=BudgetSubcategoryRead, status_code=201)
async def create_subcategory(
    project_id: int, data: BudgetSubcategoryCreate, db: AsyncSession = Depends(get_db)
):
    sub = BudgetSubcategory(
        category_id=data.category_id, name=data.name, order_index=data.order_index
    )
    db.add(sub)
    await db.commit()
    await db.refresh(sub)
    return {"id": sub.id, "name": sub.name, "order_index": sub.order_index, "lines": []}


@router.delete("/subcategories/{sub_id}", status_code=204)
async def delete_subcategory(project_id: int, sub_id: int, db: AsyncSession = Depends(get_db)):
    sub = await db.get(BudgetSubcategory, sub_id)
    if not sub:
        raise HTTPException(404)
    await db.delete(sub)
    await db.commit()


# ─── Lines ────────────────────────────────────────────────────────────────────

@router.post("/lines", response_model=BudgetLineRead, status_code=201)
async def create_line(
    project_id: int, data: BudgetLineCreate, db: AsyncSession = Depends(get_db)
):
    line = BudgetLine(**data.model_dump())
    db.add(line)
    await db.commit()
    result = await db.execute(
        select(BudgetLine).options(selectinload(BudgetLine.limit)).where(BudgetLine.id == line.id)
    )
    line = result.scalar_one()
    return _enrich_line(line)


@router.patch("/lines/{line_id}", response_model=BudgetLineRead)
async def update_line(
    project_id: int, line_id: int, data: BudgetLineUpdate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(BudgetLine).options(selectinload(BudgetLine.limit)).where(BudgetLine.id == line_id)
    )
    line = result.scalar_one_or_none()
    if not line:
        raise HTTPException(404)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(line, field, value)
    await db.commit()
    await db.refresh(line)
    result = await db.execute(
        select(BudgetLine).options(selectinload(BudgetLine.limit)).where(BudgetLine.id == line_id)
    )
    line = result.scalar_one()
    return _enrich_line(line)


@router.delete("/lines/{line_id}", status_code=204)
async def delete_line(project_id: int, line_id: int, db: AsyncSession = Depends(get_db)):
    line = await db.get(BudgetLine, line_id)
    if not line:
        raise HTTPException(404)
    await db.delete(line)
    await db.commit()


# ─── Limit ────────────────────────────────────────────────────────────────────

@router.post("/save-limit", status_code=200)
async def save_limit(project_id: int, db: AsyncSession = Depends(get_db)):
    """Зафиксировать текущий план как лимит для всех строк проекта."""
    result = await db.execute(
        select(BudgetLine)
        .join(BudgetSubcategory)
        .join(BudgetCategory)
        .options(selectinload(BudgetLine.limit))
        .where(BudgetCategory.project_id == project_id)
    )
    lines = result.scalars().all()
    for line in lines:
        calc = calc_line_totals(
            rate=line.rate,
            qty_plan=line.qty_plan,
            qty_fact=line.qty_fact,
            unit_type=line.unit_type.value,
            tax_type=line.tax_type.value,
            tax_rate_1=line.tax_rate_1,
            tax_rate_2=line.tax_rate_2,
            ot_rate=line.ot_rate,
            ot_hours_plan=line.ot_hours_plan,
            ot_shifts_plan=line.ot_shifts_plan,
            ot_hours_fact=line.ot_hours_fact,
            ot_shifts_fact=line.ot_shifts_fact,
        )
        plan_total = calc["plan_total"]
        if line.limit:
            line.limit.amount = plan_total
        else:
            db.add(BudgetLimit(project_id=project_id, line_id=line.id, amount=plan_total))
    await db.commit()
    return {"status": "ok", "lines_updated": len(lines)}
