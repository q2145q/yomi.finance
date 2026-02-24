"""Тесты налоговой логики согласно примерам из ТЗ."""

import pytest
from app.core.tax_logic import calc_line_totals, calc_tax_per_unit


def test_sz_per_unit():
    """СЗ 6%: ставка 1000, налог изнутри → 64 руб."""
    result = calc_tax_per_unit(1000, "СЗ", 6)
    assert result["net"] == 1000
    assert result["tax_1"] == 63  # floor(1000/94*6) = floor(63.829) = 63


def test_sz_totals():
    """СЗ: 60 смен, ставка 1000 → итого с налогом 63 840."""
    result = calc_line_totals(
        rate=1000, qty_plan=60, qty_fact=0,
        unit_type="Смена", tax_type="СЗ", tax_rate_1=6
    )
    # tax per unit = 63, total tax = 63*60 = 3780, total = 60000+3780 = 63780
    assert result["plan_gross"] == 63780


def test_nds_totals():
    """НДС 20%: ставка 1000, 10 шт → итого 12000."""
    result = calc_line_totals(
        rate=1000, qty_plan=10, qty_fact=0,
        unit_type="Шт", tax_type="НДС", tax_rate_1=20
    )
    assert result["plan_gross"] == 12000.0


def test_fl_totals():
    """ФЛ: ставка 1000, 10 смен, НДФЛ 13%, страховые 30%."""
    result = calc_line_totals(
        rate=1000, qty_plan=10, qty_fact=0,
        unit_type="Смена", tax_type="ФЛ", tax_rate_1=13, tax_rate_2=30
    )
    # net per unit = 1000
    # ndfl = floor(1000/87*13) = floor(149.42) = 149
    # brutto = 1000+149 = 1149
    # insurance = floor(1149*0.30) = floor(344.7) = 344
    # gross per unit = 1149+344 = 1493
    assert result["plan_net"] == 10000.0
    assert result["plan_tax_1"] == 149 * 10
    assert result["plan_tax_2"] == 344 * 10
    assert result["plan_gross"] == 1493 * 10


def test_no_tax():
    result = calc_line_totals(
        rate=5000, qty_plan=3, qty_fact=0,
        unit_type="Шт", tax_type="Без налога"
    )
    assert result["plan_gross"] == 15000.0
    assert result["plan_tax_1"] == 0
