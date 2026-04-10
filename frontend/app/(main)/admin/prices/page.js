'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { CALC_DEFAULTS } from '@/lib/calcDefaults'

const TABS = [
  { id: 'business_cards', label: 'Визитки / Листовки' },
  { id: 'banners',        label: 'Баннеры' },
  { id: 'packaging',      label: 'Упаковка' },
  { id: 'souvenirs',      label: 'Сувениры' },
]

const GROUPS = {
  business_cards: [
    { key: 'format',     label: 'Форматы',   unit: '₽/шт (базовая)' },
    { key: 'paper',      label: 'Бумага',    unit: 'Коэффициент' },
    { key: 'density',    label: 'Плотность', unit: 'Коэффициент' },
    { key: 'sides',      label: 'Печать',    unit: 'Коэффициент' },
    { key: 'lamination', label: 'Ламинация', unit: 'Коэффициент' },
  ],
  banners: [
    { key: 'material', label: 'Материалы',  unit: '₽/м²' },
    { key: 'finish',   label: 'Отделка',    unit: '₽ (доп.)' },
    { key: 'urgency',  label: 'Срочность',  unit: 'Коэффициент' },
  ],
  packaging: [
    { key: 'type',     label: 'Тип упаковки', unit: '₽/шт (базовая)' },
    { key: 'material', label: 'Материал',     unit: 'Коэффициент' },
    { key: 'print',    label: 'Печать',       unit: 'Коэффициент' },
  ],
  souvenirs: [
    { key: 'item',   label: 'Изделия',           unit: '₽/шт (базовая)' },
    { key: 'method', label: 'Способ нанесения',  unit: 'Коэффициент' },
    { key: 'colors', label: 'Количество цветов', unit: 'Коэффициент' },
  ],
}

export default function PricesPage() {
  const [tab, setTab] = useState('business_cards')
  const [prices, setPrices] = useState(CALC_DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getCalcPrices()
      .then(p => setPrices(p))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function updateOption(category, group, name, raw) {
    const value = parseFloat(raw)
    if (isNaN(value)) return
    setPrices(p => ({
      ...p,
      [category]: {
        ...p[category],
        [group]: { ...p[category][group], [name]: value },
      },
    }))
  }

  function updateMinPrice(category, raw) {
    const value = parseFloat(raw)
    if (isNaN(value)) return
    setPrices(p => ({ ...p, [category]: { ...p[category], minPrice: value } }))
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      await api.updateCalcPrices(prices)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    if (!confirm('Сбросить цены на дефолтные значения?')) return
    setPrices(CALC_DEFAULTS)
  }

  if (loading) return <div className="text-gray-400 text-sm p-4">Загрузка...</div>

  const groups = GROUPS[tab] || []

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Цены калькулятора</h1>
          <p className="text-sm text-gray-500 mt-0.5">Редактируйте цены и коэффициенты для каждого типа продукции</p>
        </div>
        <div className="flex gap-2 items-center">
          {saved && <span className="text-green-600 text-sm">Сохранено</span>}
          {error && <span className="text-red-600 text-sm">{error}</span>}
          <button className="btn-secondary text-sm" onClick={handleReset}>Сбросить</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </div>
      </div>

      {/* Вкладки */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
              tab === t.id
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {groups.map(({ key, label, unit }) => {
          const options = prices[tab]?.[key] || {}
          return (
            <div key={key} className="card overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <span className="font-medium text-gray-700 text-sm">{label}</span>
                <span className="text-xs text-gray-400">{unit}</span>
              </div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-50">
                  {Object.entries(options).map(([name, val]) => (
                    <tr key={name}>
                      <td className="px-4 py-2.5 text-gray-800">{name}</td>
                      <td className="px-4 py-2.5 w-40">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="input text-right"
                          value={val}
                          onChange={e => updateOption(tab, key, name, e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })}

        {/* Минимальная цена */}
        <div className="card p-4 flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-700 text-sm">Минимальная цена заказа</div>
            <div className="text-xs text-gray-400 mt-0.5">Итоговая цена не опустится ниже этого значения</div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              className="input w-32 text-right"
              value={prices[tab]?.minPrice ?? 0}
              onChange={e => updateMinPrice(tab, e.target.value)}
            />
            <span className="text-sm text-gray-500">₽</span>
          </div>
        </div>

        {/* Скидки за тираж (только инфо) */}
        {prices[tab]?.qtyDiscounts && (
          <div className="card overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <span className="font-medium text-gray-700 text-sm">Скидки за тираж</span>
              <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded">только просмотр</span>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-50">
                {prices[tab].qtyDiscounts.map(([threshold, mult], i) => {
                  const prev = i > 0 ? prices[tab].qtyDiscounts[i - 1][0] : 0
                  const label = threshold >= 999999
                    ? `${prev}+ штук`
                    : i === 0
                      ? `До ${threshold} штук`
                      : `${prev}–${threshold - 1} штук`
                  return (
                    <tr key={i}>
                      <td className="px-4 py-2.5 text-gray-600">{label}</td>
                      <td className="px-4 py-2.5 text-gray-500 text-right font-mono">×{mult.toFixed(2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
