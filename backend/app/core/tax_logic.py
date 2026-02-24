"""
Налоговая логика YOMI Finance.

Типы налогов:
  СЗ  — самозанятый, изнутри
  ИП  — индивидуальный предприниматель, изнутри
  НДС — НДС сверху
  ИП+НДС — ИП изнутри, затем НДС сверху
  ФЛ  — физлицо: НДФЛ изнутри + страховые сверху на брутто
  Без налога — налог = 0
"""

from math import floor
from decimal import Decimal, ROUND_DOWN


def _round_floor(value: float) -> int:
    """Округление вниз до целых рублей (как в ТЗ)."""
    return int(Decimal(str(value)).quantize(Decimal("1"), rounding=ROUND_DOWN))


def calc_tax_per_unit(
    rate: float,
    tax_type: str,
    tax_rate_1: float = 0.0,
    tax_rate_2: float = 0.0,
) -> dict:
    """
    Рассчитывает налог на одну единицу.

    Возвращает dict:
        net       — сумма на руки (контрагент)
        tax_1     — основной налог (НДФЛ / ИП / СЗ / НДС)
        tax_2     — страховые (только для ФЛ)
        gross     — полные расходы компании на единицу
    """
    tax_type = tax_type.upper()

    if tax_type in ("СЗ", "ИП"):
        # Изнутри: rate = net
        net = rate
        tax = _round_floor(rate / (100 - tax_rate_1) * tax_rate_1)
        return {"net": net, "tax_1": tax, "tax_2": 0, "gross": net + tax}

    if tax_type == "НДС":
        # Сверху: rate = база без НДС
        net = rate
        tax = _round_floor(rate * tax_rate_1 / 100)
        return {"net": net, "tax_1": tax, "tax_2": 0, "gross": net + tax}

    if tax_type == "ИП+НДС":
        # ИП изнутри, затем НДС сверху
        net = rate
        ip_tax = _round_floor(rate / (100 - tax_rate_1) * tax_rate_1)
        base_for_nds = net + ip_tax
        nds_tax = _round_floor(base_for_nds * tax_rate_2 / 100)
        return {"net": net, "tax_1": ip_tax, "tax_2": nds_tax, "gross": base_for_nds + nds_tax}

    if tax_type == "ФЛ":
        # НДФЛ изнутри (rate = net), страховые сверху на brutto
        net = rate
        ndfl = _round_floor(rate / (100 - tax_rate_1) * tax_rate_1)
        brutto = net + ndfl
        insurance = _round_floor(brutto * tax_rate_2 / 100)
        return {"net": net, "tax_1": ndfl, "tax_2": insurance, "gross": brutto + insurance}

    # БЕЗ НАЛОГА
    return {"net": rate, "tax_1": 0, "tax_2": 0, "gross": rate}


def calc_line_totals(
    rate: float,
    qty_plan: float,
    qty_fact: float,
    unit_type: str,
    tax_type: str,
    tax_rate_1: float = 0.0,
    tax_rate_2: float = 0.0,
    ot_rate: float = 0.0,
    ot_hours_plan: float = 0.0,
    ot_shifts_plan: float = 0.0,
    ot_hours_fact: float = 0.0,
    ot_shifts_fact: float = 0.0,
) -> dict:
    """
    Полный расчёт строки бюджета.
    """
    per_unit = calc_tax_per_unit(rate, tax_type, tax_rate_1, tax_rate_2)

    # Базовые суммы план/факт
    plan_net = per_unit["net"] * qty_plan
    plan_tax1 = per_unit["tax_1"] * qty_plan
    plan_tax2 = per_unit["tax_2"] * qty_plan
    plan_gross = per_unit["gross"] * qty_plan

    fact_net = per_unit["net"] * qty_fact
    fact_tax1 = per_unit["tax_1"] * qty_fact
    fact_tax2 = per_unit["tax_2"] * qty_fact
    fact_gross = per_unit["gross"] * qty_fact

    # Переработка (только для Смена / День)
    ot_plan_gross = 0.0
    ot_fact_gross = 0.0

    if unit_type.lower() in ("смена", "день") and ot_rate > 0:
        ot_per_unit = calc_tax_per_unit(ot_rate, tax_type, tax_rate_1, tax_rate_2)
        ot_plan_gross = ot_per_unit["gross"] * ot_hours_plan * ot_shifts_plan
        ot_fact_gross = ot_per_unit["gross"] * ot_hours_fact * ot_shifts_fact

    return {
        "plan_net": round(plan_net, 2),
        "plan_tax_1": round(plan_tax1, 2),
        "plan_tax_2": round(plan_tax2, 2),
        "plan_gross": round(plan_gross, 2),
        "plan_ot_gross": round(ot_plan_gross, 2),
        "plan_total": round(plan_gross + ot_plan_gross, 2),
        "fact_net": round(fact_net, 2),
        "fact_tax_1": round(fact_tax1, 2),
        "fact_tax_2": round(fact_tax2, 2),
        "fact_gross": round(fact_gross, 2),
        "fact_ot_gross": round(ot_fact_gross, 2),
        "fact_total": round(fact_gross + ot_fact_gross, 2),
    }
