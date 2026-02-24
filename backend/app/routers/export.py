import io
from datetime import datetime

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.tax_logic import calc_line_totals
from app.database import get_db
from app.models.budget import BudgetCategory, BudgetLine, BudgetSubcategory

router = APIRouter(prefix="/projects/{project_id}/export", tags=["export"])

HEADER_FILL = PatternFill("solid", fgColor="1F3864")
CATEGORY_FILL = PatternFill("solid", fgColor="2F5496")
SUBCATEGORY_FILL = PatternFill("solid", fgColor="B4C6E7")
WHITE_FONT = Font(bold=True, color="FFFFFF")
DARK_FONT = Font(bold=True)

COLUMNS = [
    "Категория", "Подкатегория", "Наименование", "Контрагент",
    "Ед.изм", "Ставка", "Кол-во план", "Кол-во факт",
    "Итого план (база)", "Налог план", "Итого план (с налогом)",
    "Итого факт (база)", "Налог факт", "Итого факт (с налогом)",
    "Лимит", "Бюджет/Лимит %", "Лимит/Факт %",
    "Оплачено", "Остаток к оплате", "Примечание",
]


@router.get("/xlsx")
async def export_xlsx(project_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(BudgetCategory)
        .options(
            selectinload(BudgetCategory.subcategories)
            .selectinload(BudgetSubcategory.lines)
            .selectinload(BudgetLine.limit)
        )
        .where(BudgetCategory.project_id == project_id)
        .order_by(BudgetCategory.order_index)
    )
    categories = result.scalars().all()

    wb = Workbook()
    ws = wb.active
    ws.title = "Бюджет"

    # Header row
    ws.append(COLUMNS)
    for cell in ws[1]:
        cell.fill = HEADER_FILL
        cell.font = WHITE_FONT
        cell.alignment = Alignment(horizontal="center", wrap_text=True)

    for cat in sorted(categories, key=lambda c: c.order_index):
        cat_row = [cat.name] + [""] * (len(COLUMNS) - 1)
        ws.append(cat_row)
        for cell in ws[ws.max_row]:
            cell.fill = CATEGORY_FILL
            cell.font = WHITE_FONT

        for sub in sorted(cat.subcategories, key=lambda s: s.order_index):
            sub_row = ["", sub.name] + [""] * (len(COLUMNS) - 2)
            ws.append(sub_row)
            for cell in ws[ws.max_row]:
                cell.fill = SUBCATEGORY_FILL
                cell.font = DARK_FONT

            for line in sorted(sub.lines, key=lambda l: l.order_index):
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
                limit_amt = line.limit.amount if line.limit else None
                budget_limit_pct = (
                    (calc["plan_total"] / limit_amt - 1) * 100 if limit_amt else None
                )
                limit_fact_pct = (
                    (calc["fact_total"] / limit_amt - 1) * 100 if limit_amt else None
                )
                ws.append([
                    cat.name,
                    sub.name,
                    line.name,
                    line.contractor or "",
                    line.unit_type.value,
                    line.rate,
                    line.qty_plan,
                    line.qty_fact,
                    calc["plan_net"],
                    calc["plan_tax_1"] + calc["plan_tax_2"],
                    calc["plan_total"],
                    calc["fact_net"],
                    calc["fact_tax_1"] + calc["fact_tax_2"],
                    calc["fact_total"],
                    limit_amt or "",
                    f"{budget_limit_pct:.1f}%" if budget_limit_pct is not None else "",
                    f"{limit_fact_pct:.1f}%" if limit_fact_pct is not None else "",
                    line.paid,
                    calc["fact_total"] - line.paid,
                    line.note or "",
                ])

    # Auto-width columns
    for col in ws.columns:
        max_len = max((len(str(c.value or "")) for c in col), default=0)
        ws.column_dimensions[col[0].column_letter].width = min(max_len + 4, 40)

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    filename = f"budget_{project_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
