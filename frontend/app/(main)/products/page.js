'use client'

import Link from 'next/link'
import { useProductTypes } from '@/lib/productTypes'

// Описание каждого типа продукции с параметрами
const PRODUCT_INFO = {
  BUSINESS_CARDS: {
    description: 'Визитки, листовки, флаеры, буклеты',
    params: [
      { label: 'Формат', values: ['90×50 мм', 'A6', 'A5', 'A4'] },
      { label: 'Бумага', values: ['Мелованная', 'Офсет'] },
      { label: 'Плотность', values: ['150 г/м²', '300 г/м²', '350 г/м²'] },
      { label: 'Печать', values: ['Односторонняя', 'Двусторонняя'] },
      { label: 'Ламинация', values: ['Без', 'Матовая', 'Глянцевая'] },
    ],
  },
  BANNERS: {
    description: 'Баннеры, таблички, вывески, стенды',
    params: [
      { label: 'Размер', values: ['Любой (ширина × высота в метрах)'] },
      { label: 'Материал', values: ['Банерная ткань', 'ПВХ 3 мм', 'ПВХ 5 мм', 'Оргстекло', 'Алюкобонд'] },
      { label: 'Отделка', values: ['Без', 'Люверсы', 'Карман', 'Лайтбокс'] },
      { label: 'Срочность', values: ['Стандарт', 'Срочно'] },
    ],
  },
  PACKAGING: {
    description: 'Коробки, пакеты, брендированная упаковка',
    params: [
      { label: 'Тип', values: ['Коробка', 'Пакет бумажный', 'Пакет полиэтиленовый'] },
      { label: 'Размер', values: ['По ТЗ (Ш × Г × В в мм)'] },
      { label: 'Материал', values: ['Картон', 'Крафт', 'Дизайнерская бумага'] },
      { label: 'Печать', values: ['Без печати', '1 цвет', 'Полноцвет (CMYK)'] },
    ],
  },
  SOUVENIRS: {
    description: 'Сувениры с логотипом, корпоративные подарки',
    params: [
      { label: 'Тип изделия', values: ['Кружка', 'Футболка', 'Ручка', 'Кепка', 'Блокнот', 'Флешка', 'Брелок'] },
      { label: 'Нанесение', values: ['Печать', 'Вышивка', 'Гравировка', 'Тиснение'] },
      { label: 'Цвета', values: ['1 цвет', '2 цвета', 'Полноцвет'] },
    ],
  },
  OTHER: {
    description: 'Другие виды продукции',
    params: [
      { label: 'Описание', values: ['Указывается в свободной форме'] },
    ],
  },
}

export default function ProductsPage() {
  const PRODUCT_TYPE = useProductTypes()
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Каталог продукции</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Типы продукции и параметры для оформления заказов
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {Object.entries(PRODUCT_TYPE).map(([key, type]) => {
          const info = PRODUCT_INFO[key]
          return (
            <div key={key} className="card p-5">
              {/* Заголовок */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl">
                  {type.icon}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">{type.label}</h2>
                  <p className="text-xs text-gray-400">{info?.description}</p>
                </div>
              </div>

              {/* Параметры */}
              {info?.params && (
                <div className="space-y-2.5">
                  {info.params.map(param => (
                    <div key={param.label}>
                      <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                        {param.label}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {param.values.map(v => (
                          <span
                            key={v}
                            className="badge bg-gray-100 text-gray-600"
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Кнопка создать заказ */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link
                  href={`/orders/new?productType=${key}`}
                  className="btn-secondary btn-sm w-full justify-center"
                >
                  + Создать заказ
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
