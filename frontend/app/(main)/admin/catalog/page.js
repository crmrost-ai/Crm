'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { clearProductTypesCache } from '@/lib/productTypes'
import { PRODUCT_TYPE as DEFAULTS } from '@/lib/constants'
import Link from 'next/link'

const DEFAULT_LIST = Object.entries(DEFAULTS).map(([key, v]) => ({
  key, label: v.label, icon: v.icon, active: true,
}))

export default function CatalogPage() {
  const [items, setItems] = useState(DEFAULT_LIST)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getSettings()
      .then(s => {
        if (s.catalog_product_types) {
          const arr = JSON.parse(s.catalog_product_types)
          // Мержим: если в настройках есть ключ — используем его, иначе дефолт
          const merged = DEFAULT_LIST.map(def => {
            const saved = arr.find(a => a.key === def.key)
            return saved ? { ...def, ...saved } : def
          })
          setItems(merged)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function update(key, field, value) {
    setItems(list => list.map(item =>
      item.key === key ? { ...item, [field]: value } : item
    ))
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      await api.updateSettings({ catalog_product_types: JSON.stringify(items) })
      clearProductTypesCache()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    if (!confirm('Сбросить на стандартные названия?')) return
    setItems(DEFAULT_LIST)
  }

  if (loading) return <div className="text-gray-400 text-sm p-4">Загрузка...</div>

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Типы продукции</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Настройте названия и иконки — они отображаются во всех заказах
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {saved && <span className="text-green-600 text-sm font-medium">Сохранено</span>}
          {error && <span className="text-red-600 text-sm">{error}</span>}
          <button className="btn-secondary text-sm" onClick={handleReset}>Сбросить</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>

      <div className="card overflow-hidden mb-4">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500 grid grid-cols-12 gap-3">
          <div className="col-span-2">Иконка</div>
          <div className="col-span-6">Название</div>
          <div className="col-span-2 text-center">Активен</div>
          <div className="col-span-2 text-xs text-gray-400">Код</div>
        </div>

        <div className="divide-y divide-gray-50">
          {items.map(item => (
            <div key={item.key} className={`grid grid-cols-12 gap-3 px-4 py-3 items-center ${!item.active ? 'opacity-50' : ''}`}>
              <div className="col-span-2">
                <input
                  type="text"
                  className="input text-center text-xl px-2 py-1.5"
                  value={item.icon}
                  onChange={e => update(item.key, 'icon', e.target.value)}
                  maxLength={4}
                  title="Введите emoji"
                />
              </div>
              <div className="col-span-6">
                <input
                  type="text"
                  className="input"
                  value={item.label}
                  onChange={e => update(item.key, 'label', e.target.value)}
                  placeholder="Название типа"
                />
              </div>
              <div className="col-span-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => update(item.key, 'active', !item.active)}
                  className={`relative w-10 h-6 rounded-full transition-colors ${
                    item.active ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    item.active ? 'translate-x-4.5 left-0.5' : 'left-0.5'
                  }`} />
                </button>
              </div>
              <div className="col-span-2 text-xs text-gray-300 font-mono truncate" title={item.key}>
                {item.key}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
        <strong>Подсказка:</strong> Неактивные типы скрыты при создании новых заказов,
        но существующие заказы с таким типом отображаются без изменений.
        Цены на каждый тип настраиваются на странице{' '}
        <Link href="/admin/prices" className="underline font-medium">Цены</Link>.
      </div>
    </div>
  )
}
