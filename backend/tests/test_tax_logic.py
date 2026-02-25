"""Тесты налоговой логики."""
import math
import pytest

from app.core.tax_logic import calc_tax, SZ_6, IP_6, NDS_20, IP_NDS, FL


def test_sz_6_percent():
    """СЗ 6%: на 100р → налог = floor(100 / 94 * 6) = 6р → итого 106р."""
    result = calc_tax(100.0, 1, SZ_6)
    assert result["subtotal"] == 100.0
    assert result["tax_amount"] == math.floor(100 / 0.94 * 0.06)
    assert result["total"] == result["subtotal"] + result["tax_amount"]


def test_nds_20_percent():
    """НДС 20%: на 100р → налог = 20р → итого 120р."""
    result = calc_tax(100.0, 1, NDS_20)
    assert result["subtotal"] == 100.0
    assert result["tax_amount"] == 20
    assert result["total"] == 120.0


def test_fl_ndfl_insurance():
    """ФЛ: НДФЛ 13% внутри + Страховые 30% сверху."""
    result = calc_tax(100.0, 1, FL)
    # НДФЛ internal: floor(100 / 0.87 * 0.13) = 14
    # Страховые external: floor(100 * 0.30) = 30
    assert result["tax_amount"] == 14 + 30
    assert result["total"] == 100 + 14 + 30


def test_quantity_multiplier():
    """Налог на единицу умножается на количество."""
    r1 = calc_tax(100.0, 1, SZ_6)
    r5 = calc_tax(100.0, 5, SZ_6)
    assert r5["total"] == r1["total"] * 5


def test_ip_nds_combo():
    """ИП+НДС: сначала ИП inside, потом НДС on top."""
    result = calc_tax(100.0, 1, IP_NDS)
    # ИП 6%: tax1 = floor(100 / 0.94 * 0.06) = 6
    # НДС 20%: tax2 = floor(100 * 0.20) = 20
    assert len(result["breakdown"]) == 2
    assert result["tax_amount"] == result["breakdown"][0]["amount_per_unit"] + result["breakdown"][1]["amount_per_unit"]


def test_floor_rounding():
    """Проверяем округление вниз (floor)."""
    # 1000р, СЗ 6%: 1000 / 0.94 * 0.06 = 63.829... → floor = 63
    result = calc_tax(1000.0, 1, SZ_6)
    assert result["tax_amount"] == math.floor(1000 / 0.94 * 0.06)
