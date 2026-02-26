import uuid
import math
from datetime import datetime, time
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.production import ProductionReport, ReportEntry
from app.models.tax import TaxScheme, TaxComponent
from app.core.tax_logic import calc_tax
from app.schemas.production import (
    ProductionReportCreate, ProductionReportUpdate, ProductionReportOut,
    ReportEntryCreate, ReportEntryUpdate, ReportEntryOut,
)
from app.routers.deps import CurrentUser

router = APIRouter(prefix="/production", tags=["production"])


# ─── Вычислить overtime_hours ──────────────────────────────────────────────────

def _calc_overtime(
    shift_start: time | None,
    shift_end: time | None,
    lunch_break_minutes: int,
    gap_minutes: int,
    base_shift_hours: float = 12.0,
) -> float:
    """Считает переработку. Базовая смена = 12 часов (по умолчанию)."""
    if not shift_start or not shift_end:
        return 0.0
    total_minutes = (
        shift_end.hour * 60 + shift_end.minute
        - shift_start.hour * 60 - shift_start.minute
    )
    if total_minutes < 0:
        total_minutes += 24 * 60  # через полночь
    worked_minutes = total_minutes - lunch_break_minutes - gap_minutes
    worked_hours = max(worked_minutes / 60, 0)
    overtime = max(worked_hours - base_shift_hours, 0.0)
    return round(overtime, 2)


# ─── Вычислить суммы с налогом ─────────────────────────────────────────────────

async def _calc_amounts(
    rate: float,
    quantity: float,
    tax_scheme_id: uuid.UUID | None,
    db: AsyncSession,
) -> tuple[float, float]:
    """Возвращает (amount_net, amount_gross)."""
    amount_net = round(rate * quantity, 2)
    if not tax_scheme_id:
        return amount_net, amount_net

    res = await db.execute(
        select(TaxScheme)
        .where(TaxScheme.id == tax_scheme_id)
        .options(selectinload(TaxScheme.components))
    )
    scheme = res.scalar_one_or_none()
    if not scheme or not scheme.components:
        return amount_net, amount_net

    components = [
        {"name": c.name, "rate": c.rate, "type": c.type, "recipient": c.recipient}
        for c in sorted(scheme.components, key=lambda x: x.sort_order)
    ]
    result = calc_tax(rate, quantity, components)
    return result["subtotal"], result["total"]


# ─── Сериализация ──────────────────────────────────────────────────────────────

def _entry_to_out(e: ReportEntry) -> ReportEntryOut:
    return ReportEntryOut(
        id=e.id,
        report_id=e.report_id,
        contractor_id=e.contractor_id,
        contractor_name=e.contractor.full_name if e.contractor else "",
        budget_line_id=e.budget_line_id,
        budget_line_name=e.budget_line.name if e.budget_line else None,
        contract_id=e.contract_id,
        contract_number=e.contract.number if e.contract else None,
        source=e.source,
        shift_start=e.shift_start,
        shift_end=e.shift_end,
        lunch_break_minutes=e.lunch_break_minutes,
        gap_minutes=e.gap_minutes,
        overtime_hours=e.overtime_hours,
        equipment=e.equipment,
        unit=e.unit,
        quantity=e.quantity,
        rate=e.rate,
        tax_scheme_id=e.tax_scheme_id,
        amount_net=e.amount_net,
        amount_gross=e.amount_gross,
        status=e.status,
        ai_parsed=e.ai_parsed,
        ai_confidence=e.ai_confidence,
        created_at=e.created_at,
    )


def _report_to_out(r: ProductionReport) -> ProductionReportOut:
    entries_out = [_entry_to_out(e) for e in r.entries]
    return ProductionReportOut(
        id=r.id,
        project_id=r.project_id,
        shoot_day_number=r.shoot_day_number,
        date=r.date,
        location=r.location,
        shooting_group=r.shooting_group,
        notes=r.notes,
        status=r.status,
        created_by=r.created_by,
        created_at=r.created_at,
        updated_at=r.updated_at,
        entries=entries_out,
        total_net=sum(e.amount_net for e in r.entries),
        total_gross=sum(e.amount_gross for e in r.entries),
        entry_count=len(r.entries),
    )


async def _load_report(report_id: uuid.UUID, db: AsyncSession) -> ProductionReport:
    res = await db.execute(
        select(ProductionReport)
        .where(ProductionReport.id == report_id)
        .options(
            selectinload(ProductionReport.entries).selectinload(ReportEntry.contractor),
            selectinload(ProductionReport.entries).selectinload(ReportEntry.budget_line),
            selectinload(ProductionReport.entries).selectinload(ReportEntry.contract),
        )
    )
    r = res.scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail="Отчёт не найден")
    return r


async def _load_entry(entry_id: uuid.UUID, db: AsyncSession) -> ReportEntry:
    res = await db.execute(
        select(ReportEntry)
        .where(ReportEntry.id == entry_id)
        .options(
            selectinload(ReportEntry.contractor),
            selectinload(ReportEntry.budget_line),
            selectinload(ReportEntry.contract),
        )
    )
    e = res.scalar_one_or_none()
    if not e:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    return e


# ─── Роуты: ProductionReport ───────────────────────────────────────────────────

@router.get("/projects/{project_id}/reports", response_model=list[ProductionReportOut])
async def list_reports(
    project_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(ProductionReport)
        .where(ProductionReport.project_id == project_id)
        .options(
            selectinload(ProductionReport.entries).selectinload(ReportEntry.contractor),
            selectinload(ProductionReport.entries).selectinload(ReportEntry.budget_line),
            selectinload(ProductionReport.entries).selectinload(ReportEntry.contract),
        )
        .order_by(ProductionReport.date, ProductionReport.shoot_day_number)
    )
    return [_report_to_out(r) for r in res.scalars().all()]


@router.post("/projects/{project_id}/reports", response_model=ProductionReportOut, status_code=status.HTTP_201_CREATED)
async def create_report(
    project_id: uuid.UUID,
    data: ProductionReportCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    r = ProductionReport(
        project_id=project_id,
        shoot_day_number=data.shoot_day_number,
        date=data.date,
        location=data.location,
        shooting_group=data.shooting_group,
        notes=data.notes,
        status=data.status,
        created_by=current_user.id,
    )
    db.add(r)
    await db.commit()
    return _report_to_out(await _load_report(r.id, db))


@router.get("/reports/{report_id}", response_model=ProductionReportOut)
async def get_report(
    report_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    return _report_to_out(await _load_report(report_id, db))


@router.patch("/reports/{report_id}", response_model=ProductionReportOut)
async def update_report(
    report_id: uuid.UUID,
    data: ProductionReportUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    r = await _load_report(report_id, db)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(r, field, value)
    await db.commit()
    return _report_to_out(await _load_report(report_id, db))


@router.delete("/reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_report(
    report_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    r = await _load_report(report_id, db)
    await db.delete(r)
    await db.commit()


# ─── Роуты: ReportEntry ────────────────────────────────────────────────────────

@router.post("/reports/{report_id}/entries", response_model=ReportEntryOut, status_code=status.HTTP_201_CREATED)
async def create_entry(
    report_id: uuid.UUID,
    data: ReportEntryCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    # Убеждаемся что отчёт существует
    await _load_report(report_id, db)

    overtime = _calc_overtime(data.shift_start, data.shift_end, data.lunch_break_minutes, data.gap_minutes)
    amount_net, amount_gross = await _calc_amounts(data.rate, data.quantity, data.tax_scheme_id, db)

    e = ReportEntry(
        report_id=report_id,
        contractor_id=data.contractor_id,
        budget_line_id=data.budget_line_id,
        contract_id=data.contract_id,
        source=data.source,
        shift_start=data.shift_start,
        shift_end=data.shift_end,
        lunch_break_minutes=data.lunch_break_minutes,
        gap_minutes=data.gap_minutes,
        overtime_hours=overtime,
        equipment=data.equipment,
        unit=data.unit,
        quantity=data.quantity,
        rate=data.rate,
        tax_scheme_id=data.tax_scheme_id,
        amount_net=amount_net,
        amount_gross=amount_gross,
        raw_text=data.raw_text,
    )
    db.add(e)
    await db.commit()
    return _entry_to_out(await _load_entry(e.id, db))


@router.patch("/entries/{entry_id}", response_model=ReportEntryOut)
async def update_entry(
    entry_id: uuid.UUID,
    data: ReportEntryUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    e = await _load_entry(entry_id, db)
    update_data = data.model_dump(exclude_none=True)

    for field, value in update_data.items():
        setattr(e, field, value)

    # Пересчитываем overtime и суммы если изменились ключевые поля
    if any(k in update_data for k in ("shift_start", "shift_end", "lunch_break_minutes", "gap_minutes")):
        e.overtime_hours = _calc_overtime(e.shift_start, e.shift_end, e.lunch_break_minutes, e.gap_minutes)

    if any(k in update_data for k in ("rate", "quantity", "tax_scheme_id")):
        e.amount_net, e.amount_gross = await _calc_amounts(e.rate, e.quantity, e.tax_scheme_id, db)

    await db.commit()
    return _entry_to_out(await _load_entry(entry_id, db))


@router.delete("/entries/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_entry(
    entry_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    e = await _load_entry(entry_id, db)
    await db.delete(e)
    await db.commit()
