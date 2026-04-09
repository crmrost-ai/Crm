'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

// ─── ВИЗИТКИ / ЛИСТОВКИ ──────────────────────────────────────────────────────

const BC_FORMAT = {
  '90×50 мм': 1.8, 'A6 (105×148)': 2.5, 'A5 (148×210)': 4.0, 'A4 (210×297)': 7.0,
}
const BC_PAPER = { 'Мелованная': 1.0, 'Офсет': 0.85 }
const BC_DENSITY = { '150 г/м²': 1.0, '300 г/м²': 1.3, '350 г/м²': 1.5 }
const BC_SIDES = { 'Односторонняя': 1.0, 'Двусторонняя': 1.5 }
const BC_LAM = { 'Без ламинации': 1.0, 'Матовая': 1.3, 'Глянцевая': 1.3 }

function calcBusinessCards({ format, qty, paper, density, sides, lamination }) {
  const q = Number(qty) || 0
  if (q <= 0) return 0
  const qDiscount = q < 100 ? 1.5 : q < 500 ? 1.2 : q < 1000 ? 1.0 : 0.85
  const price = q
    * (BC_FORMAT[format] || 1.8)
    * (BC_PAPER[paper] || 1)
    * (BC_DENSITY[density] || 1)
    * (BC_SIDES[sides] || 1)
    * (BC_LAM[lamination] || 1)
    * qDiscount
  return Math.max(Math.round(price), 500)
}

function BusinessCardsCalc({ onCreateOrder }) {
  const [f, setF] = useState({
    format: '90×50 мм', qty: '100', paper: 'Мелованная',
    density: '300 г/м²', sides: 'Двусторонняя', lamination: 'Без ламинации',
  })
  const price = calcBusinessCards(f)

  function sel(field) {
    return (options) => (
      <div className="flex flex-wrap gap-2">
        {options.map(v => (
          <button
            key={v}
            type="button"
            onClick={() => setF(p => ({ ...p, [field]: v }))}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              f[field] === v
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

  return (
    <div className="space-y-5">
      <div>
        <label className="label">Формат</label>
        {sel('format')(Object.keys(BC_FORMAT))}
      </div>
      <div>
        <label className="label">Тираж (штук)</label>
        <input type="number" className="input w-40" min="1"
          value={f.qty} onChange={e => setF(p => ({ ...p, qty: e.target.value }))} />
      </div>
      <div>
        <label className="label">Бумага</label>
        {sel('paper')(Object.keys(BC_PAPER))}
      </div>
      <div>
        <label className="label">Плотность</label>
        {sel('density')(Object.keys(BC_DENSITY))}
      </div>
      <div>
        <label className="label">Печать</label>
        {sel('sides')(Object.keys(BC_SIDES))}
      </div>
      <div>
        <label className="label">Ламинация</label>
        {sel('lamination')(Object.keys(BC_LAM))}
      </div>

      <PriceResult price={price} />
      <button
        type="button"
        className="btn-primary w-full"
        onClick={() => onCreateOrder('BUSINESS_CARDS', f, price,
          `Визитки/листовки: ${f.qty} шт., формат ${f.format}, ${f.paper.toLowerCase()}, ` +
          `${f.density}, ${f.sides.toLowerCase()}, ${f.lamination.toLowerCase()}`
        )}
      >
        Создать заявку на {price.toLocaleString('ru')} ₽
      </button>
    </div>
  )
}

// ─── БАННЕРЫ ─────────────────────────────────────────────────────────────────

const BAN_MAT = {
  'Баннерная ткань': 450, 'ПВХ 3 мм': 650, 'ПВХ 5 мм': 850,
  'Оргстекло': 1200, 'Алюкобонд': 950,
}
const BAN_FINISH = { 'Без отделки': 0, 'Люверсы': 200, 'Карман': 300, 'Лайтбокс': 1500 }
const BAN_URGENT = { 'Стандарт': 1.0, 'Срочно (×1.5)': 1.5 }

function calcBanner({ width, height, material, finish, urgency }) {
  const w = parseFloat(width) || 0
  const h = parseFloat(height) || 0
  const area = w * h
  if (area <= 0) return 0
  const base = area * (BAN_MAT[material] || 450)
  const finishCost = BAN_FINISH[finish] || 0
  const price = (base + finishCost) * (BAN_URGENT[urgency] || 1)
  return Math.max(Math.round(price), 500)
}

function BannersCalc({ onCreateOrder }) {
  const [f, setF] = useState({
    width: '1', height: '2', material: 'Баннерная ткань',
    finish: 'Без отделки', urgency: 'Стандарт',
  })
  const price = calcBanner(f)
  const area = ((parseFloat(f.width) || 0) * (parseFloat(f.height) || 0)).toFixed(2)

  function sel(field) {
    return (options) => (
      <div className="flex flex-wrap gap-2">
        {options.map(v => (
          <button key={v} type="button"
            onClick={() => setF(p => ({ ...p, [field]: v }))}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              f[field] === v ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            }`}
          >{v}</button>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="label">Размер (метры)</label>
        <div className="flex items-center gap-3">
          <div>
            <div className="text-xs text-gray-400 mb-1">Ширина</div>
            <input type="number" className="input w-24" step="0.1" min="0.1"
              value={f.width} onChange={e => setF(p => ({ ...p, width: e.target.value }))} />
          </div>
          <span className="text-gray-400 mt-4">×</span>
          <div>
            <div className="text-xs text-gray-400 mb-1">Высота</div>
            <input type="number" className="input w-24" step="0.1" min="0.1"
              value={f.height} onChange={e => setF(p => ({ ...p, height: e.target.value }))} />
          </div>
          <div className="mt-4 text-sm text-gray-500">= {area} м²</div>
        </div>
      </div>
      <div>
        <label className="label">Материал</label>
        {sel('material')(Object.keys(BAN_MAT))}
      </div>
      <div>
        <label className="label">Отделка</label>
        {sel('finish')(Object.keys(BAN_FINISH))}
      </div>
      <div>
        <label className="label">Срочность</label>
        {sel('urgency')(Object.keys(BAN_URGENT))}
      </div>

      <PriceResult price={price} note={area > 0 ? `${area} м² × ${BAN_MAT[f.material]} ₽/м²` : ''} />
      <button
        type="button" className="btn-primary w-full"
        onClick={() => onCreateOrder('BANNERS', f, price,
          `Баннер ${f.width}×${f.height} м (${area} м²), ${f.material}, ${f.finish.toLowerCase()}, ${f.urgency.toLowerCase()}`
        )}
      >
        Создать заявку на {price.toLocaleString('ru')} ₽
      </button>
    </div>
  )
}

// ─── УПАКОВКА ─────────────────────────────────────────────────────────────────

const PKG_TYPE = { 'Коробка': 55, 'Пакет бумажный': 35, 'Пакет полиэтиленовый': 18 }
const PKG_MAT = { 'Картон стандарт': 1.0, 'Крафт': 1.2, 'Дизайнерская бумага': 1.6 }
const PKG_PRINT = { 'Без печати': 1.0, '1 цвет': 1.35, 'Полноцвет (CMYK)': 1.9 }

function calcPackaging({ type, qty, material, print }) {
  const q = Number(qty) || 0
  if (q <= 0) return 0
  const qDiscount = q < 100 ? 1.4 : q < 500 ? 1.1 : q < 2000 ? 1.0 : 0.85
  const price = q * (PKG_TYPE[type] || 55) * (PKG_MAT[material] || 1) * (PKG_PRINT[print] || 1) * qDiscount
  return Math.max(Math.round(price), 1000)
}

function PackagingCalc({ onCreateOrder }) {
  const [f, setF] = useState({
    type: 'Коробка', qty: '100', material: 'Картон стандарт', print: 'Без печати',
  })
  const price = calcPackaging(f)

  function sel(field) {
    return (options) => (
      <div className="flex flex-wrap gap-2">
        {options.map(v => (
          <button key={v} type="button"
            onClick={() => setF(p => ({ ...p, [field]: v }))}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              f[field] === v ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            }`}
          >{v}</button>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="label">Тип упаковки</label>
        {sel('type')(Object.keys(PKG_TYPE))}
      </div>
      <div>
        <label className="label">Тираж (штук)</label>
        <input type="number" className="input w-40" min="1"
          value={f.qty} onChange={e => setF(p => ({ ...p, qty: e.target.value }))} />
      </div>
      <div>
        <label className="label">Материал</label>
        {sel('material')(Object.keys(PKG_MAT))}
      </div>
      <div>
        <label className="label">Печать</label>
        {sel('print')(Object.keys(PKG_PRINT))}
      </div>

      <PriceResult price={price} />
      <button
        type="button" className="btn-primary w-full"
        onClick={() => onCreateOrder('PACKAGING', f, price,
          `Упаковка: ${f.qty} шт., ${f.type.toLowerCase()}, ${f.material.toLowerCase()}, ${f.print.toLowerCase()}`
        )}
      >
        Создать заявку на {price.toLocaleString('ru')} ₽
      </button>
    </div>
  )
}

// ─── СУВЕНИРЫ ─────────────────────────────────────────────────────────────────

const SOU_ITEM = {
  'Кружка 330 мл': 350, 'Кружка 420 мл': 420, 'Футболка': 550,
  'Поло': 700, 'Ручка': 90, 'Кепка': 480,
  'Блокнот A5': 260, 'Флешка 16 ГБ': 650, 'Брелок': 160,
  'Значок 56 мм': 80, 'Магнит': 70,
}
const SOU_METHOD = { 'Печать': 1.0, 'Вышивка': 1.7, 'Гравировка': 1.4, 'Тиснение': 1.3 }
const SOU_COLORS = { '1 цвет': 1.0, '2 цвета': 1.2, 'Полноцвет': 1.6 }

function calcSouvenirs({ item, qty, method, colors }) {
  const q = Number(qty) || 0
  if (q <= 0) return 0
  const qDiscount = q < 20 ? 1.3 : q < 50 ? 1.1 : q < 200 ? 1.0 : 0.88
  const price = q * (SOU_ITEM[item] || 350) * (SOU_METHOD[method] || 1) * (SOU_COLORS[colors] || 1) * qDiscount
  return Math.max(Math.round(price), 500)
}

function SouvenirsCalc({ onCreateOrder }) {
  const [f, setF] = useState({
    item: 'Кружка 330 мл', qty: '50', method: 'Печать', colors: '1 цвет',
  })
  const price = calcSouvenirs(f)

  function sel(field) {
    return (options) => (
      <div className="flex flex-wrap gap-2">
        {options.map(v => (
          <button key={v} type="button"
            onClick={() => setF(p => ({ ...p, [field]: v }))}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              f[field] === v ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            }`}
          >{v}</button>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="label">Изделие</label>
        {sel('item')(Object.keys(SOU_ITEM))}
      </div>
      <div>
        <label className="label">Количество (штук)</label>
        <input type="number" className="input w-40" min="1"
          value={f.qty} onChange={e => setF(p => ({ ...p, qty: e.target.value }))} />
      </div>
      <div>
        <label className="label">Способ нанесения</label>
        {sel('method')(Object.keys(SOU_METHOD))}
      </div>
      <div>
        <label className="label">Количество цветов</label>
        {sel('colors')(Object.keys(SOU_COLORS))}
      </div>

      <PriceResult price={price} />
      <button
        type="button" className="btn-primary w-full"
        onClick={() => onCreateOrder('SOUVENIRS', f, price,
          `Сувениры: ${f.qty} шт. × ${f.item}, ${f.method.toLowerCase()}, ${f.colors.toLowerCase()}`
        )}
      >
        Создать заявку на {price.toLocaleString('ru')} ₽
      </button>
    </div>
  )
}

// ─── ОБЩИЕ КОМПОНЕНТЫ ─────────────────────────────────────────────────────────

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
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  async function handleCreateOrder(productType, params, price, description) {
    setCreating(true)
    setError('')
    try {
      // Переходим на страницу нового заказа с предзаполненными параметрами
      // Сохраняем в sessionStorage чтобы подхватить на странице
      const calcData = { productType, params, estimatedPrice: price, description }
      sessionStorage.setItem('calc_prefill', JSON.stringify(calcData))
      router.push(`/orders/new?productType=${productType}&fromCalc=1`)
    } catch (e) {
      setError(e.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Калькулятор</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Рассчитайте стоимость и сразу создайте заявку
        </p>
      </div>

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
        {tab === 'BUSINESS_CARDS' && <BusinessCardsCalc onCreateOrder={handleCreateOrder} />}
        {tab === 'BANNERS'        && <BannersCalc        onCreateOrder={handleCreateOrder} />}
        {tab === 'PACKAGING'      && <PackagingCalc      onCreateOrder={handleCreateOrder} />}
        {tab === 'SOUVENIRS'      && <SouvenirsCalc      onCreateOrder={handleCreateOrder} />}
        {error && <div className="text-red-600 text-sm mt-3">{error}</div>}
      </div>

      <div className="mt-4 text-xs text-gray-400 text-center">
        Цены ориентировочные и могут меняться в зависимости от сложности заказа.
        После создания заявки менеджер уточнит финальную стоимость.
      </div>
    </div>
  )
}
