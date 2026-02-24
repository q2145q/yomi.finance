/**
 * Клиентская налоговая логика (зеркало backend/app/core/tax_logic.py).
 * Используется для мгновенного пересчёта в таблице без обращения к серверу.
 */

import type { TaxType, UnitType } from '@/types'

function floorRound(value: number): number {
  return Math.floor(value)
}

export interface TaxPerUnit {
  net: number
  tax1: number
  tax2: number
  gross: number
}

export function calcTaxPerUnit(rate: number, taxType: TaxType, taxRate1 = 0, taxRate2 = 0): TaxPerUnit {
  switch (taxType) {
    case 'СЗ':
    case 'ИП': {
      const tax = floorRound((rate / (100 - taxRate1)) * taxRate1)
      return { net: rate, tax1: tax, tax2: 0, gross: rate + tax }
    }
    case 'НДС': {
      const tax = floorRound((rate * taxRate1) / 100)
      return { net: rate, tax1: tax, tax2: 0, gross: rate + tax }
    }
    case 'ИП+НДС': {
      const ipTax = floorRound((rate / (100 - taxRate1)) * taxRate1)
      const baseForNds = rate + ipTax
      const ndsTax = floorRound((baseForNds * taxRate2) / 100)
      return { net: rate, tax1: ipTax, tax2: ndsTax, gross: baseForNds + ndsTax }
    }
    case 'ФЛ': {
      const ndfl = floorRound((rate / (100 - taxRate1)) * taxRate1)
      const brutto = rate + ndfl
      const insurance = floorRound((brutto * taxRate2) / 100)
      return { net: rate, tax1: ndfl, tax2: insurance, gross: brutto + insurance }
    }
    default:
      return { net: rate, tax1: 0, tax2: 0, gross: rate }
  }
}

export interface LineTotals {
  planNet: number
  planTax1: number
  planTax2: number
  planGross: number
  planOtGross: number
  planTotal: number
  factNet: number
  factTax1: number
  factTax2: number
  factGross: number
  factOtGross: number
  factTotal: number
}

export function calcLineTotals(params: {
  rate: number
  qtyPlan: number
  qtyFact: number
  unitType: UnitType
  taxType: TaxType
  taxRate1?: number
  taxRate2?: number
  otRate?: number
  otHoursPlan?: number
  otShiftsPlan?: number
  otHoursFact?: number
  otShiftsFact?: number
}): LineTotals {
  const {
    rate, qtyPlan, qtyFact, unitType, taxType,
    taxRate1 = 0, taxRate2 = 0,
    otRate = 0, otHoursPlan = 0, otShiftsPlan = 0,
    otHoursFact = 0, otShiftsFact = 0,
  } = params

  const pu = calcTaxPerUnit(rate, taxType, taxRate1, taxRate2)

  let planOtGross = 0
  let factOtGross = 0

  if ((unitType === 'Смена' || unitType === 'День') && otRate > 0) {
    const otPu = calcTaxPerUnit(otRate, taxType, taxRate1, taxRate2)
    planOtGross = otPu.gross * otHoursPlan * otShiftsPlan
    factOtGross = otPu.gross * otHoursFact * otShiftsFact
  }

  const planGross = pu.gross * qtyPlan
  const factGross = pu.gross * qtyFact

  return {
    planNet: pu.net * qtyPlan,
    planTax1: pu.tax1 * qtyPlan,
    planTax2: pu.tax2 * qtyPlan,
    planGross,
    planOtGross,
    planTotal: planGross + planOtGross,
    factNet: pu.net * qtyFact,
    factTax1: pu.tax1 * qtyFact,
    factTax2: pu.tax2 * qtyFact,
    factGross,
    factOtGross,
    factTotal: factGross + factOtGross,
  }
}

export function formatRub(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}
