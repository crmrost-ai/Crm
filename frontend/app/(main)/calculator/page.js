'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { CALC_DEFAULTS, getQtyDiscount } from '@/lib/calcDefaults'

// ─── РАСЧЁТНЫЕ ФУНКЦИИ ────────────────────────────────────────────────────────

function calcBusinessCards({ format, qty, paper, density, sides, lamination }, p) {
  const q = Number(qty) || 0
  if (q <= 0) return 0
  const price = q
    * (p.format[format] || 1.8)
    * (p.paper[paper] || 1)
    * (p.density[density] || 1)
    * (p.sides[sides] || 1)
    * (p.lamination[lamination] || 1)
    * getQtyDiscount(q, p.qtyDiscounts)
  return Math.max(Math.round(price), p.minPrice)
}

function calcBanner({ width, height, material, finish, urgency }, p) {
  const area = (parseFloat(width) || 0) * (parseFloat(height) || 0)
  if (area <= 0) return 0
  const price = (area * (p.material[material] || 450) + (p.finish[finish] || 0)) * (p.urgency[urgency] || 1)
  return Math.max(Math.round(price), p.minPrice)
}

function calcPackaging({ type, qty, material, print }, p) {
  const q = Number(qty) || 0
  if (q <= 0) return 0
  const price = q * (p.type[type] || 55) * (p.material[material] || 1) * (p.print[print] || 1) * getQtyDiscount(q, p.qtyDiscounts)
  return Math.max(Math.round(price), p.minPrice)
}

function calcSouvenirs({ item, qty, method, colors }, p) {
  const q = Number(qty) || 0
  if (q <= 0) return 0
  const price = q * (p.item[item] || 350) * (p.method[method] || 1) * (p.colors[colors] || 1) * getQtyDiscount(q, p.qtyDiscounts)
  return Math.max(Math.round(price), p.minPrice)
}

// ─── UI-ХЕЛПЕР ────────────────────────────────────────────────────────────────

function SelButtons({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Object.keys(options).map(v => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
            value === v
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
          }`}
        >
          {v}
        </button>
      ))}
    </div>
  )
}

function PriceResult({ price, note }) {
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
      <div className="text-xs text-blue-500 mb-1">Предварительная стоимость</div>
      <div className="text-3xl font-bold text-blue-700">{price.toLocaleString('ru')} ₽</div>
      {note && <div className="text-xs text-blue-400 mt-1">{note}</div>}
      <div className="text-xs text-gray-400 mt-2">
        Ориентировочная цена · точная определяется при согласовании
      </div>
    </div>
  )
}

// ─── ВИЗИТКИ / ЛИСТОВКИ ──────────────────────────────────────────────────────

function BusinessCardsCalc({ p, onCreateOrder }) {
  const [f, setF] = useState({
    format: Object.keys(p.format)[0],
    qty: '100',
    paper: Object.keys(p.paper)[0],
    density: Object.keys(p.density)[1] || Object.keys(p.density)[0],
    sides: Object.keys(p.sides)[1] || Object.keys(p.sides)[0],
    lamination: Object.keys(p.lamination)[0],
  })
  const price = calcBusinessCards(f, p)

  return (
    <div className="space-y-5">
      <div>
        <label className="label">Формат</label>
        <SelButtons options={p.format} value={f.format} onChange={v => setF(x => ({ ...x, format: v }))} />
      </div>
      <div>
        <label className="label">Тираж (штук)</label>
        <input type="number" className="input w-40" min="1"
          value={f.qty} onChange={e => setF(x => ({ ...x, qty: e.target.value }))} />
      </div>
      <div>
        <label className="label">Бумага</label>
        <SelButtons options={p.paper} value={f.paper} onChange={v => setF(x => ({ ...x, paper: v }))} />
      </div>
      <div>
        <label className="label">Плотность</label>
        <SelButtons options={p.density} value={f.density} onChange={v => setF(x => ({ ...x, density: v }))} />
      </div>
      <div>
        <label className="label">Печать</label>
        <SelButtons options={p.sides} value={f.sides} onChange={v => setF(x => ({ ...x, sides: v }))} />
      </div>
      <div>
        <label className="label">Ламинация</label>
        <SelButtons options={p.lamination} value={f.lamination} onChange={v => setF(x => ({ ...x, lamination: v }))} />
      </div>
      <PriceResult price={price} />
      <button type="button" className="btn-primary w-full"
        onClick={() => onCreateOrder('BUSINESS_CARDS', f, price,
          `Визитки/листовки: ${f.qty} шт., формат ${f.format}, ${f.paper.toLowerCase()}, ${f.density}, ${f.sides.toLowerCase()}, ${f.lamination.toLowerCase()}`
        )}>
        Создать заявку на {price.toLocaleString('ru')} ₽
      </button>
    </div>
  )
}

// ─── БАННЕРЫ ─────────────────────────────────────────────────────────────────

function BannersCalc({ p, onCreateOrder }) {
  const [f, setF] = useState({
    width: '1', height: '2',
    material: Object.keys(p.material)[0],
    finish: Object.keys(p.finish)[0],
    urgency: Object.keys(p.urgency)[0],
  })
  const price = calcBanner(f, p)
  const area = ((parseFloat(f.width) || 0) * (parseFloat(f.height) || 0)).toFixed(2)

  return (
    <div className="space-y-5">
      <div>
        <label className="label">Размер (метры)</label>
        <div className="flex items-center gap-3">
          <div>
            <div className="text-xs text-gray-400 mb-1">Ширина</div>
            <input type="number" className="input w-24" step="0.1" min="0.1"
              value={f.width} onChange={e => setF(x => ({ ...x, width: e.target.value }))} />
          </div>
          <span className="text-gray-400 mt-4">×</span>
          <div>
            <div className="text-xs text-gray-400 mb-1">Высота</div>
            <input type="number" className="input w-24" step="0.1" min="0.1"
              value={f.height} onChange={e => setF(x => ({ ...x, height: e.target.value }))} />
          </div>
          <div className="mt-4 text-sm text-gray-500">= {area} м²</div>
        </div>
      </div>
      <div>
        <label className="label">Материал</label>
        <SelButtons options={p.material} value={f.material} onChange={v => setF(x => ({ ...x, material: v }))} />
      </div>
      <div>
        <label className="label">Отделка</label>
        <SelButtons options={p.finish} value={f.finish} onChange={v => setF(x => ({ ...x, finish: v }))} />
      </div>
      <div>
        <label className="label">Срочность</label>
        <SelButtons options={p.urgency} value={f.urgency} onChange={v => setF(x => ({ ...x, urgency: v }))} />
      </div>
      <PriceResult price={price} note={area > 0 ? `${area} м² × ${p.material[f.material]} ₽/м²` : ''} />
      <button type="button" className="btn-primary w-full"
        onClick={() => onCreateOrder('BANNERS', f, price,
          `Баннер ${f.width}×${f.height} м (${area} м²), ${f.material}, ${f.finish.toLowerCase()}, ${f.urgency.toLowerCase()}`
        )}>
        Создать заявку на {price.toLocaleString('ru')} ₽
      </button>
    </div>
  )
}

// ─── УПАКОВКА ─────────────────────────────────────────────────────────────────

function PackagingCalc({ p, onCreateOrder }) {
  const [f, setF] = useState({
    type: Object.keys(p.type)[0],
    qty: '100',
    material: Object.keys(p.material)[0],
    print: Object.keys(p.print)[0],
  })
  const price = calcPackaging(f, p)

  return (
    <div className="space-y-5">
      <div>
        <label className="label">Тип упаковки</label>
        <SelButtons options={p.type} value={f.type} onChange={v => setF(x => ({ ...x, type: v }))} />
      </div>
      <div>
        <label className="label">Тираж (штук)</label>
        <input type="number" className="input w-40" min="1"
          value={f.qty} onChange={e => setF(x => ({ ...x, qty: e.target.value }))} />
      </div>
      <div>
        <label className="label">Материал</label>
        <SelButtons options={p.material} value={f.material} onChange={v => setF(x => ({ ...x, material: v }))} />
      </div>
      <div>
        <label className="label">Печать</label>
        <SelButtons options={p.print} value={f.print} onChange={v => setF(x => ({ ...x, print: v }))} />
      </div>
      <PriceResult price={price} />
      <button type="button" className="btn-primary w-full"
        onClick={() => onCreateOrder('PACKAGING', f, price,
          `Упаковка: ${f.qty} шт., ${f.type.toLowerCase()}, ${f.material.toLowerCase()}, ${f.print.toLowerCase()}`
        )}>
        Создать заявку на {price.toLocaleString('ru')} ₽
      </button>
    </div>
  )
}

// ─── СУВЕНИРЫ ─────────────────────────────────────────────────────────────────

function SouvenirsCalc({ p, onCreateOrder }) {
  const [f, setF] = useState({
    item: Object.keys(p.item)[0],
    qty: '50',
    method: Object.keys(p.method)[0],
    colors: Object.keys(p.colors)[0],
  })
  const price = calcSouvenirs(f, p)

  return (
    <div className="space-y-5">
      <div>
        <label className="label">Изделие</label>
        <SelButtons options={p.item} value={f.item} onChange={v => setF(x => ({ ...x, item: v }))} />
      </div>
      <div>
        <label className="label">Количество (штук)</label>
        <input type="number" className="input w-40" min="1"
          value={f.qty} onChange={e => setF(x => ({ ...x, qty: e.target.value }))} />
      </div>
      <div>
        <label className="label">Способ нанесения</label>
        <SelButtons options={p.method} value={f.method} onChange={v => setF(x => ({ ...x, method: v }))} />
      </div>
      <div>
        <label className="label">Количество цветов</label>
        <SelButtons options={p.colors} value={f.colors} onChange={v => setF(x => ({ ...x, colors: v }))} />
      </div>
      <PriceResult price={price} />
      <button type="button" className="btn-primary w-full"
        onClick={() => onCreateOrder('SOUVENIRS', f, price,
          `Сувениры: ${f.qty} шт. × ${f.item}, ${f.method.toLowerCase()}, ${f.colors.toLowerCase()}`
        )}>
        Создать заявку на {price.toLocaleString('ru')} ₽
      </button>
    </div>
  )
}

// ─── ГЛАВНАЯ СТРАНИЦА КАЛЬКУЛЯТОРА ────────────────────────────────────────────

const TABS = [
  { id: 'BUSINESS_CARDS', label: 'Визитки / Листовки', icon: '🖨️' },
  { id: 'BANNERS',        label: 'Баннеры',            icon: '🖼️' },
  { id: 'PACKAGING',      label: 'Упаковка',           icon: '📦' },
  { id: 'SOUVENIRS',      label: 'Сувениры',           icon: '🎁' },
]

export default function CalculatorPage() {
  const router = useRouter()
  const [tab, setTab] = useState('BUSINESS_CARDS')
  const [prices, setPrices] = useState(CALC_DEFAULTS)
  const [loadingPrices, setLoadingPrices] = useState(true)
  const [usingDefaults, setUsingDefaults] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getCalcPrices()
      .then(p => setPrices(p))
      .catch(() => setUsingDefaults(true))
      .finally(() => setLoadingPrices(false))
  }, [])

  function handleCreateOrder(productType, params, price, description) {
    const calcData = { productType, params, estimatedPrice: price, description }
    sessionStorage.setItem('calc_prefill', JSON.stringify(calcData))
    router.push(`/orders/new?productType=${productType}&fromCalc=1`)
  }

  if (loadingPrices) return <div className="text-gray-400 text-sm p-4">Загрузка...</div>

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Калькулятор</h1>
        <p className="text-sm text-gray-500 mt-0.5">Рассчитайте стоимость и сразу создайте заявку</p>
      </div>

      {usingDefaults && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-4 py-3 rounded-xl mb-4">
          Используются стандартные цены — не удалось загрузить настроенные
        </div>
      )}

      {/* Вкладки */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
              tab === t.id
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="card p-6">
        {tab === 'BUSINESS_CARDS' && <BusinessCardsCalc p={prices.business_cards} onCreateOrder={handleCreateOrder} />}
        {tab === 'BANNERS'        && <BannersCalc        p={prices.banners}        onCreateOrder={handleCreateOrder} />}
        {tab === 'PACKAGING'      && <PackagingCalc      p={prices.packaging}      onCreateOrder={handleCreateOrder} />}
        {tab === 'SOUVENIRS'      && <SouvenirsCalc      p={prices.souvenirs}      onCreateOrder={handleCreateOrder} />}
        {error && <div className="text-red-600 text-sm mt-3">{error}</div>}
      </div>

      <div className="mt-4 text-xs text-gray-400 text-center">
        Цены ориентировочные и могут меняться в зависимости от сложности заказа.
        После создания заявки менеджер уточнит финальную стоимость.
      </div>
    </div>
  )
}
