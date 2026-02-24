import { useState } from 'react'
import type { BudgetCategory, TaxType, UnitType } from '@/types'
import { budgetApi } from '@/api/budget'
import { UNIT_TYPES, TAX_TYPES, DEFAULT_TAX_RATES } from './columns'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'

interface Props {
  projectId: number
  categories: BudgetCategory[]
  onClose: () => void
  onSaved: () => void
}

export default function AddLineModal({ projectId, categories, onClose, onSaved }: Props) {
  const [categoryId, setCategoryId] = useState<number | ''>(categories[0]?.id ?? '')
  const [subcategoryId, setSubcategoryId] = useState<number | ''>('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newSubcategoryName, setNewSubcategoryName] = useState('')
  const [name, setName] = useState('')
  const [contractor, setContractor] = useState('')
  const [unitType, setUnitType] = useState<UnitType>('Смена')
  const [rate, setRate] = useState(0)
  const [qtyPlan, setQtyPlan] = useState(1)
  const [taxType, setTaxType] = useState<TaxType>('СЗ')
  const [taxRate1, setTaxRate1] = useState(DEFAULT_TAX_RATES['СЗ'][0])
  const [taxRate2, setTaxRate2] = useState(DEFAULT_TAX_RATES['СЗ'][1])
  const [saving, setSaving] = useState(false)

  const selectedCategory = categories.find((c) => c.id === categoryId)
  const subcategories = selectedCategory?.subcategories ?? []

  const handleTaxTypeChange = (t: TaxType) => {
    setTaxType(t)
    const [r1, r2] = DEFAULT_TAX_RATES[t]
    setTaxRate1(r1)
    setTaxRate2(r2)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      let finalCatId = categoryId
      let finalSubId = subcategoryId

      // Create new category if needed
      if (!finalCatId && newCategoryName) {
        const cat = await budgetApi.createCategory(projectId, {
          name: newCategoryName,
          order_index: categories.length,
        })
        finalCatId = cat.id
      }

      // Create new subcategory if needed
      if (!finalSubId && finalCatId) {
        const sub = await budgetApi.createSubcategory(projectId, {
          category_id: finalCatId as number,
          name: newSubcategoryName || 'Основное',
          order_index: 0,
        })
        finalSubId = sub.id
      }

      if (!finalSubId) {
        toast.error('Выберите или создайте подкатегорию')
        return
      }

      await budgetApi.createLine(projectId, {
        subcategory_id: finalSubId as number,
        name,
        contractor: contractor || null,
        unit_type: unitType,
        rate,
        qty_plan: qtyPlan,
        qty_fact: 0,
        date_start: null,
        date_end: null,
        tax_type: taxType,
        tax_rate_1: taxRate1,
        tax_rate_2: taxRate2,
        ot_rate: 0,
        ot_hours_plan: 0,
        ot_shifts_plan: 0,
        ot_hours_fact: 0,
        ot_shifts_fact: 0,
        note: null,
        order_index: 0,
        paid: 0,
      } as never)

      toast.success('Строка добавлена')
      onSaved()
    } catch {
      toast.error('Ошибка добавления строки')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Добавить строку бюджета</h2>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSave} className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label>Категория</label>
              <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value) || '')}>
                <option value="">— Новая категория —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {!categoryId && (
                <input
                  className="mt-2"
                  placeholder="Название новой категории"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
              )}
            </div>
            <div className="form-group">
              <label>Подкатегория</label>
              <select value={subcategoryId} onChange={(e) => setSubcategoryId(Number(e.target.value) || '')}>
                <option value="">— Новая подкатегория —</option>
                {subcategories.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {!subcategoryId && (
                <input
                  className="mt-2"
                  placeholder="Название подкатегории"
                  value={newSubcategoryName}
                  onChange={(e) => setNewSubcategoryName(e.target.value)}
                />
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Наименование статьи *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Контрагент</label>
              <input value={contractor} onChange={(e) => setContractor(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Ед. измерения</label>
              <select value={unitType} onChange={(e) => setUnitType(e.target.value as UnitType)}>
                {UNIT_TYPES.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Ставка (руб)</label>
              <input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} min={0} />
            </div>
            <div className="form-group">
              <label>Кол-во план</label>
              <input type="number" value={qtyPlan} onChange={(e) => setQtyPlan(Number(e.target.value))} min={0} step={0.5} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Тип налога</label>
              <select value={taxType} onChange={(e) => handleTaxTypeChange(e.target.value as TaxType)}>
                {TAX_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Ставка налога 1, %</label>
              <input type="number" value={taxRate1} onChange={(e) => setTaxRate1(Number(e.target.value))} min={0} step={0.1} />
            </div>
            {taxRate2 > 0 && (
              <div className="form-group">
                <label>Ставка налога 2, %</label>
                <input type="number" value={taxRate2} onChange={(e) => setTaxRate2(Number(e.target.value))} min={0} step={0.1} />
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>Отмена</button>
            <button type="submit" className="btn-primary" disabled={saving || !name}>
              {saving ? 'Сохранение...' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
