/**
 * Клиентская налоговая логика (зеркало backend/app/core/tax_logic.py)
 *
 * Формулы:
 * - INTERNAL (СЗ/ИП): налог = floor(rate / (1 - r) * r)
 * - EXTERNAL (НДС): налог = floor(rate * r)
 * - ФЛ: НДФЛ internal (бюджет) + Страховые external (бюджет)
 * - Округление: Math.floor на каждую единицу
 */

import type { TaxComponent } from '../types'

export interface TaxResult {
  subtotal: number
  taxAmount: number
  total: number
  breakdown: Array<{
    name: string
    rate: number
    type: string
    recipient: string
    amountPerUnit: number
    amountTotal: number
  }>
}

export function calcTax(rate: number, quantity: number, components: TaxComponent[]): TaxResult {
  const subtotalPerUnit = rate
  const breakdown: TaxResult['breakdown'] = []
  let totalPerUnit = subtotalPerUnit

  for (const comp of components) {
    let taxPerUnit = 0
    if (comp.type === 'INTERNAL') {
      taxPerUnit = Math.floor((subtotalPerUnit / (1 - comp.rate)) * comp.rate)
    } else if (comp.type === 'EXTERNAL') {
      taxPerUnit = Math.floor(subtotalPerUnit * comp.rate)
    }

    breakdown.push({
      name: comp.name,
      rate: comp.rate,
      type: comp.type,
      recipient: comp.recipient,
      amountPerUnit: taxPerUnit,
      amountTotal: taxPerUnit * quantity,
    })
    totalPerUnit += taxPerUnit
  }

  const taxTotal = breakdown.reduce((s, b) => s + b.amountPerUnit, 0)

  return {
    subtotal: subtotalPerUnit * quantity,
    taxAmount: taxTotal * quantity,
    total: totalPerUnit * quantity,
    breakdown,
  }
}

export function formatMoney(amount: number, currency = 'RUB'): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
