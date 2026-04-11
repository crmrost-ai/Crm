'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { getUser } from '@/lib/auth'
import StatusBadge from '@/components/ui/StatusBadge'
import { ORDER_STATUS, ORDER_SOURCE } from '@/lib/constants'
import { useProductTypes } from '@/lib/productTypes'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

function StatCard({ label, value, color = 'blue', href }) {
  const colorMap = {
    blue:   'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green:  'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
  }
  const card = (
    <div className={`card p-5 ${href ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  )
  return href ? <Link href={href}>{card}</Link> : card
}

export default function DashboardPage() {
  const user = getUser()
  const PRODUCT_TYPE = useProductTypes()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getOrders({ limit: 100 })
      .then(d => setOrders(d.orders || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const byStatus = (status) => orders.filter(o => o.status === status).length

  const recent = orders.slice(0, 8)

  if (loading) return <div className="text-gray-400 text-sm">Загрузка...</div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {user?.role === 'CONTRACTOR' ? 'Мои задания' : 'Дашборд'}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Добро пожаловать, {user?.name}
        </p>
      </div>

      {/* Статистика */}
      {user?.role !== 'CONTRACTOR' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Новые заявки" value={byStatus('NEW')} color="blue"
            href="/orders?status=NEW" />
          <StatCard label="На расчёте" value={byStatus('CALCULATING') + byStatus('CALCULATED')} color="yellow"
            href="/orders?status=CALCULATING" />
          <StatCard label="В производстве" value={byStatus('IN_PRODUCTION')} color="orange"
            href="/orders?status=IN_PRODUCTION" />
          <StatCard label="Готово" value={byStatus('READY')} color="green"
            href="/orders?status=READY" />
        </div>
      )}

      {/* Последние заказы */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            {user?.role === 'CONTRACTOR' ? 'Мои задания' : 'Последние заказы'}
          </h2>
          <Link href="/orders" className="text-sm text-blue-600 hover:underline">
            Все заказы →
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400">
            <div className="text-4xl mb-2">📋</div>
            <div>Заказов пока нет</div>
            {user?.role !== 'CONTRACTOR' && (
              <Link href="/orders/new" className="btn-primary btn-sm mt-3 inline-flex">
                Создать первый заказ
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recent.map(order => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-mono">#{order.number}</span>
                    <span className="text-sm font-medium text-gray-900 truncate">{order.title}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {order.client?.name}
                    {order.client?.company && order.client.company !== order.client.name
                      ? ` · ${order.client.company}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-gray-400">
                    {PRODUCT_TYPE[order.productType]?.icon} {PRODUCT_TYPE[order.productType]?.label}
                  </span>
                  <StatusBadge status={order.status} />
                  <span className="text-xs text-gray-400 hidden lg:block">
                    {format(new Date(order.createdAt), 'd MMM', { locale: ru })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
