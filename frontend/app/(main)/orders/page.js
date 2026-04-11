'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import StatusBadge from '@/components/ui/StatusBadge'
import { ORDER_STATUS, ORDER_SOURCE } from '@/lib/constants'
import { useProductTypes } from '@/lib/productTypes'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export default function OrdersPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const PRODUCT_TYPE = useProductTypes()

  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const status = searchParams.get('status') || ''
  const productType = searchParams.get('productType') || ''

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (status) params.status = status
      if (productType) params.productType = productType
      if (search) params.search = search
      const data = await api.getOrders(params)
      setOrders(data.orders || [])
      setTotal(data.total || 0)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [status, productType, search])

  useEffect(() => { load() }, [load])

  function setFilter(key, value) {
    const params = new URLSearchParams(searchParams)
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/orders?${params.toString()}`)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Заказы</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} заказов</p>
        </div>
        <Link href="/orders/new" className="btn-primary">
          + Новый заказ
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          className="input w-56"
          placeholder="Поиск по заказу, клиенту..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <select
          className="input w-44"
          value={status}
          onChange={e => setFilter('status', e.target.value)}
        >
          <option value="">Все статусы</option>
          {Object.entries(ORDER_STATUS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        <select
          className="input w-44"
          value={productType}
          onChange={e => setFilter('productType', e.target.value)}
        >
          <option value="">Все типы</option>
          {Object.entries(PRODUCT_TYPE).map(([k, v]) => (
            <option key={k} value={k}>{v.icon} {v.label}</option>
          ))}
        </select>

        {(status || productType || search) && (
          <button
            className="btn-secondary btn-sm"
            onClick={() => { setSearch(''); router.push('/orders') }}
          >
            Сбросить
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400 text-sm">Загрузка...</div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-4xl mb-2">📋</div>
            <div className="text-gray-500">Заказов не найдено</div>
            <Link href="/orders/new" className="btn-primary btn-sm mt-3 inline-flex">
              Создать заказ
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-500 w-16">№</th>
                <th className="px-4 py-3 font-medium text-gray-500">Заказ / Клиент</th>
                <th className="px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Тип</th>
                <th className="px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Источник</th>
                <th className="px-4 py-3 font-medium text-gray-500">Статус</th>
                <th className="px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Сумма</th>
                <th className="px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Дата</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map(order => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/orders/${order.id}`)}
                >
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                    #{order.number}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 truncate max-w-xs">{order.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {order.client?.name}
                      {order.client?.phone ? ` · ${order.client.phone}` : ''}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-500">
                    <span>{PRODUCT_TYPE[order.productType]?.icon}</span>{' '}
                    <span className="hidden xl:inline">{PRODUCT_TYPE[order.productType]?.label}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-gray-500">
                    {ORDER_SOURCE[order.source]?.icon} {ORDER_SOURCE[order.source]?.label}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-gray-700">
                    {order.finalPrice
                      ? `${order.finalPrice.toLocaleString('ru')} ₽`
                      : order.estimatedPrice
                      ? <span className="text-gray-400">~{order.estimatedPrice.toLocaleString('ru')} ₽</span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-gray-400 text-xs">
                    {format(new Date(order.createdAt), 'd MMM yyyy', { locale: ru })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
