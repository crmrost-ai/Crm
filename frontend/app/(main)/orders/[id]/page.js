'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { getUser } from '@/lib/auth'
import StatusBadge from '@/components/ui/StatusBadge'
import {
  ORDER_STATUS, PRODUCT_TYPE, ORDER_SOURCE,
  MANAGER_STATUS_FLOW, CONTRACTOR_STATUS_FLOW,
} from '@/lib/constants'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export default function OrderDetailPage({ params }) {
  const router = useRouter()
  const user = getUser()
  const [order, setOrder] = useState(null)
  const [contractors, setContractors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Send to contractor modal state
  const [sendModal, setSendModal] = useState(false)
  const [selectedContractor, setSelectedContractor] = useState('')
  const [calcRequest, setCalcRequest] = useState('')
  const [sending, setSending] = useState(false)

  // Calc response modal (for contractor)
  const [responseModal, setResponseModal] = useState(false)
  const [calcResponse, setCalcResponse] = useState('')
  const [responsePrice, setResponsePrice] = useState('')
  const [responding, setResponding] = useState(false)

  // Status change
  const [statusChanging, setStatusChanging] = useState(false)
  const [statusComment, setStatusComment] = useState('')

  useEffect(() => {
    Promise.all([
      api.getOrder(params.id),
      api.getContractors(),
    ])
      .then(([o, c]) => { setOrder(o); setContractors(c) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [params.id])

  async function handleSendToContractor() {
    if (!selectedContractor) return
    setSending(true)
    try {
      const updated = await api.sendToContractor(order.id, selectedContractor, calcRequest)
      setOrder(updated)
      setSendModal(false)
      setCalcRequest('')
      setSelectedContractor('')
    } catch (e) {
      setError(e.message)
    } finally {
      setSending(false)
    }
  }

  async function handleCalcResponse() {
    if (!calcResponse) return
    setResponding(true)
    try {
      const updated = await api.submitCalcResponse(
        order.id, calcResponse,
        responsePrice ? Number(responsePrice) : undefined
      )
      setOrder(updated)
      setResponseModal(false)
    } catch (e) {
      setError(e.message)
    } finally {
      setResponding(false)
    }
  }

  async function handleStatusChange(newStatus) {
    setStatusChanging(true)
    try {
      const updated = await api.changeStatus(order.id, newStatus, statusComment)
      setOrder(updated)
      setStatusComment('')
    } catch (e) {
      setError(e.message)
    } finally {
      setStatusChanging(false)
    }
  }

  if (loading) return <div className="text-gray-400 text-sm p-4">Загрузка...</div>
  if (error && !order) return <div className="text-red-500 text-sm p-4">{error}</div>
  if (!order) return null

  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN'
  const isContractor = user?.role === 'CONTRACTOR'

  const availableStatuses = isManager
    ? (MANAGER_STATUS_FLOW[order.status] || [])
    : (CONTRACTOR_STATUS_FLOW[order.status] || [])

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-400 hover:text-gray-600 mb-2"
          >
            ← Назад
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-gray-400 font-mono">#{order.number}</span>
            <h1 className="text-xl font-bold text-gray-900">{order.title}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {PRODUCT_TYPE[order.productType]?.icon} {PRODUCT_TYPE[order.productType]?.label}
            {' · '}
            {ORDER_SOURCE[order.source]?.icon} {ORDER_SOURCE[order.source]?.label}
            {' · '}
            Создан {format(new Date(order.createdAt), 'd MMMM yyyy', { locale: ru })}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap shrink-0">
          {isManager && order.status === 'NEW' && (
            <button
              className="btn-primary"
              onClick={() => setSendModal(true)}
            >
              Отправить на расчёт
            </button>
          )}
          {isContractor && order.status === 'CALCULATING' && (
            <button
              className="btn-primary"
              onClick={() => setResponseModal(true)}
            >
              Ввести расчёт
            </button>
          )}
          {availableStatuses.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {availableStatuses.map(s => (
                <button
                  key={s}
                  className="btn-secondary btn-sm"
                  disabled={statusChanging}
                  onClick={() => handleStatusChange(s)}
                >
                  → {ORDER_STATUS[s]?.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">
        {/* Main info */}
        <div className="col-span-2 space-y-4">

          {/* Описание заказа */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Параметры заказа</h2>
            {order.description ? (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.description}</p>
            ) : (
              <p className="text-sm text-gray-400">Описание не указано</p>
            )}

            {/* Params JSON */}
            {order.params && Object.keys(order.params).length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(order.params).map(([k, v]) => (
                    <div key={k} className="text-sm">
                      <span className="text-gray-400">{k}: </span>
                      <span className="text-gray-700">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Запрос на расчёт / Ответ */}
          {(order.calcRequest || order.calcResponse) && (
            <div className="card p-5 space-y-4">
              <h2 className="font-semibold text-gray-800">Расчёт</h2>

              {order.calcRequest && (
                <div>
                  <div className="text-xs text-gray-400 mb-1">
                    Запрос подрядчику — {order.contractor?.name}
                    {order.calcRequestedAt && (
                      <> · {format(new Date(order.calcRequestedAt), 'd MMM в HH:mm', { locale: ru })}</>
                    )}
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-gray-800 whitespace-pre-wrap">
                    {order.calcRequest}
                  </div>
                </div>
              )}

              {order.calcResponse && (
                <div>
                  <div className="text-xs text-gray-400 mb-1">
                    Ответ подрядчика
                    {order.calcRespondedAt && (
                      <> · {format(new Date(order.calcRespondedAt), 'd MMM в HH:mm', { locale: ru })}</>
                    )}
                  </div>
                  <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-sm text-gray-800 whitespace-pre-wrap">
                    {order.calcResponse}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* История статусов */}
          {order.statusHistory?.length > 0 && (
            <div className="card p-5">
              <h2 className="font-semibold text-gray-800 mb-3">История</h2>
              <div className="space-y-3">
                {order.statusHistory.map(h => (
                  <div key={h.id} className="flex gap-3 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={h.status} />
                        <span className="text-gray-400 text-xs">
                          {format(new Date(h.createdAt), 'd MMM в HH:mm', { locale: ru })}
                        </span>
                        <span className="text-gray-400 text-xs">{h.user?.name}</span>
                      </div>
                      {h.comment && (
                        <p className="text-gray-500 text-xs mt-0.5">{h.comment}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">

          {/* Клиент */}
          <div className="card p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Клиент</h3>
            <div className="text-sm">
              <div className="font-medium text-gray-900">{order.client?.name}</div>
              {order.client?.company && order.client.company !== order.client.name && (
                <div className="text-gray-500">{order.client.company}</div>
              )}
              {order.client?.phone && (
                <a href={`tel:${order.client.phone}`} className="text-blue-600 hover:underline block mt-1">
                  {order.client.phone}
                </a>
              )}
              {order.client?.email && (
                <a href={`mailto:${order.client.email}`} className="text-blue-600 hover:underline block">
                  {order.client.email}
                </a>
              )}
            </div>
          </div>

          {/* Цены */}
          <div className="card p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Стоимость</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Предварительно</span>
                <span className="font-medium">
                  {order.estimatedPrice ? `${order.estimatedPrice.toLocaleString('ru')} ₽` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Итоговая</span>
                <span className="font-medium text-green-700">
                  {order.finalPrice ? `${order.finalPrice.toLocaleString('ru')} ₽` : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Подрядчик */}
          <div className="card p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Подрядчик</h3>
            {order.contractor ? (
              <div className="text-sm">
                <div className="font-medium text-gray-900">{order.contractor.name}</div>
                {order.contractor.phone && (
                  <div className="text-gray-500">{order.contractor.phone}</div>
                )}
                {order.contractor.telegram && (
                  <div className="text-blue-600">{order.contractor.telegram}</div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-400">Не назначен</div>
            )}
          </div>

          {/* Менеджер + Срок */}
          <div className="card p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Детали</h3>
            <div className="text-sm space-y-2">
              <div>
                <span className="text-gray-400">Менеджер: </span>
                <span className="text-gray-700">{order.manager?.name}</span>
              </div>
              {order.deadline && (
                <div>
                  <span className="text-gray-400">Срок: </span>
                  <span className="text-gray-700">
                    {format(new Date(order.deadline), 'd MMMM yyyy', { locale: ru })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Заметка менеджера */}
          {isManager && order.managerNote && (
            <div className="card p-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Заметка менеджера
              </h3>
              <p className="text-sm text-gray-700">{order.managerNote}</p>
            </div>
          )}
        </div>
      </div>

      {/* === Модалка: отправить на расчёт === */}
      {sendModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Отправить на расчёт</h2>

            <div className="space-y-4">
              <div>
                <label className="label">Выберите подрядчика (цех) *</label>
                <select
                  className="input"
                  value={selectedContractor}
                  onChange={e => setSelectedContractor(e.target.value)}
                >
                  <option value="">— выберите цех —</option>
                  {contractors.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Текст запроса (необязательно)</label>
                <textarea
                  className="input resize-none"
                  rows={4}
                  placeholder="Уточнения, вопросы для подрядчика..."
                  value={calcRequest}
                  onChange={e => setCalcRequest(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                className="btn-primary flex-1"
                disabled={!selectedContractor || sending}
                onClick={handleSendToContractor}
              >
                {sending ? 'Отправка...' : 'Отправить'}
              </button>
              <button
                className="btn-secondary"
                onClick={() => setSendModal(false)}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === Модалка: ввод расчёта (подрядчик) === */}
      {responseModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Ввести расчёт</h2>
            <p className="text-sm text-gray-500 mb-4">Заказ: {order.title}</p>

            <div className="space-y-4">
              <div>
                <label className="label">Ответ / расчёт *</label>
                <textarea
                  className="input resize-none"
                  rows={5}
                  placeholder="Опишите стоимость, сроки, условия..."
                  value={calcResponse}
                  onChange={e => setCalcResponse(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Сумма (₽)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="0"
                  value={responsePrice}
                  onChange={e => setResponsePrice(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                className="btn-primary flex-1"
                disabled={!calcResponse || responding}
                onClick={handleCalcResponse}
              >
                {responding ? 'Отправка...' : 'Отправить расчёт'}
              </button>
              <button
                className="btn-secondary"
                onClick={() => setResponseModal(false)}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
