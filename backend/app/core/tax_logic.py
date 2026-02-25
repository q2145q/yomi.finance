"""
Налоговая логика yomi.finance

Формулы:
- INTERNAL (СЗ/ИП): налог = ставка / (100 - %) * %
  Пример СЗ 6%: на 100р → налог = 100 / 94 * 6 = 6.38р → gross = 106.38р
- EXTERNAL (НДС): налог = ставка * % / 100
  Пример НДС 20%: на 100р → налог = 20р → gross = 120р
- ФЛ (НДФЛ internal в бюджет + Страховые external в бюджет):
  Контрагент получает нетто. Бюджет несёт НДФЛ и страховые.
- ИП+НДС: ИП inside, потом НДС on top
- Округление: floor (вниз) до рублей на каждую единицу
"""
import math
from typing import TypedDict


class TaxComponentInput(TypedDict):
    rate: float        # ставка (например, 0.06 для 6%)
    type: str          # "INTERNAL" или "EXTERNAL"
    recipient: str     # "CONTRACTOR" или "BUDGET"


class TaxResult(TypedDict):
    subtotal: float    # rate * quantity (нетто)
    tax_amount: float  # сумма налога
    total: float       # итого с налогом (gross)
    breakdown: list[dict]  # детализация по компонентам


def calc_tax(rate: float, quantity: float, components: list[TaxComponentInput]) -> TaxResult:
    """
    Рассчитывает налог для одной единицы, затем умножает на quantity.
    Округление floor на каждую единицу.
    """
    subtotal_per_unit = rate
    breakdown = []
    total_per_unit = subtotal_per_unit

    for comp in components:
        tax_rate = comp["rate"]
        comp_type = comp["type"]

        if comp_type == "INTERNAL":
            # Налог включён внутрь: tax = rate / (1 - r) * r
            tax_per_unit = math.floor(subtotal_per_unit / (1 - tax_rate) * tax_rate)
        elif comp_type == "EXTERNAL":
            # Налог сверху: tax = rate * r
            tax_per_unit = math.floor(subtotal_per_unit * tax_rate)
        else:
            tax_per_unit = 0

        breakdown.append({
            "name": comp.get("name", ""),
            "rate": tax_rate,
            "type": comp_type,
            "recipient": comp.get("recipient", "BUDGET"),
            "amount_per_unit": tax_per_unit,
            "amount_total": tax_per_unit * quantity,
        })
        total_per_unit += tax_per_unit

    tax_total = sum(b["amount_per_unit"] for b in breakdown)
    subtotal = subtotal_per_unit * quantity
    tax_amount = tax_total * quantity
    total = total_per_unit * quantity

    return TaxResult(
        subtotal=subtotal,
        tax_amount=tax_amount,
        total=total,
        breakdown=breakdown,
    )


# --- Предустановленные налоговые схемы ---

SZ_6 = [{"name": "НПД", "rate": 0.06, "type": "INTERNAL", "recipient": "CONTRACTOR"}]
SZ_4 = [{"name": "НПД", "rate": 0.04, "type": "INTERNAL", "recipient": "CONTRACTOR"}]
IP_6 = [{"name": "УСН", "rate": 0.06, "type": "INTERNAL", "recipient": "CONTRACTOR"}]
NDS_20 = [{"name": "НДС", "rate": 0.20, "type": "EXTERNAL", "recipient": "BUDGET"}]
IP_NDS = [
    {"name": "УСН", "rate": 0.06, "type": "INTERNAL", "recipient": "CONTRACTOR"},
    {"name": "НДС", "rate": 0.20, "type": "EXTERNAL", "recipient": "BUDGET"},
]
FL = [
    {"name": "НДФЛ", "rate": 0.13, "type": "INTERNAL", "recipient": "BUDGET"},
    {"name": "Страховые", "rate": 0.30, "type": "EXTERNAL", "recipient": "BUDGET"},
]


SYSTEM_TAX_SCHEMES = {
    "СЗ 6%": SZ_6,
    "СЗ 4%": SZ_4,
    "ИП УСН 6%": IP_6,
    "ИП УСН 6% + НДС 20%": IP_NDS,
    "НДС 20%": NDS_20,
    "ФЛ (НДФЛ + Страховые)": FL,
}
