'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { getUser } from '@/lib/auth'
import ClientForm from '@/components/orders/ClientForm'
import StatusBadge from '@/components/ui/StatusBadge'
import { PRODUCT_TYPE } from '@/lib/constants'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

const TYPE_LABEL = {
  INDIVIDUAL:   { label: 'Физлицо',  icon: '👤', color: 'bg-gray-100 text-gray-600' },
  ENTREPRENEUR: { label: 'ИП',       icon: '🧑‍💼', color: 'bg-blue-100 text-blue-700' },
  COMPANY:      { label: 'Юрлицо',  icon: '🏢', color: 'bg-purple-100 text-purple-700' },
}

export default function ClientDetailPage({ params }) {
  const router = useRouter()
  const user = getUser()
  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN'

  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    api.getClient(params.id)
      .then(c => { setClient(c); setEditData(c) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [params.id])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setSaveError('')
    try {
      const updated = await api.updateClient(client.id, editData)
      setClient({ ...client, ...updated })
      setEditing(false)
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-gray-400 text-sm p-4">Загрузка...</div>
  if (error) return <div className="text-red-500 text-sm p-4">{error}</div>
  if (!client) return null

  const t = TYPE_LABEL[client.type] || TYPE_LABEL.INDIVIDUAL
  const isBusiness = client.type !== 'INDIVIDUAL'

  return (
    <div className="max-w-4xl">
      {/* Заголовок */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <button onClick={() => router.back()}
            className="text-sm text-gray-400 hover:text-gray-600 mb-2">
            ← Назад
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`badge ${t.color}`}>{t.icon} {t.label}</span>
            <h1 className="text-xl font-bold text-gray-900">{client.name}</h1>
          </div>
          {client.inn && (
            <p className="text-sm text-gray-400 font-mono mt-0.5">ИНН {client.inn}</p>
          )}
        </div>
        <div className="flex gap-2">
          {isManager && (
            <button
              className="btn-secondary"
              onClick={() => { setEditing(!editing); setSaveError('') }}
            >
              {editing ? 'Отмена' : 'Редактировать'}
            </button>
          )}
          {isManager && (
            <button
              className="btn-primary"
              onClick={() => router.push(`/orders/new?clientId=${client.id}`)}
            >
              + Новый заказ
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Основной контент */}
        <div className="col-span-2 space-y-4">

          {/* Форма редактирования */}
          {editing ? (
            <div className="card p-5">
              <h2 className="font-semibold text-gray-800 mb-4">Редактирование</h2>
              <form onSubmit={handleSave}>
                <ClientForm value={editData} onChange={setEditData} />
                {saveError && <div className="text-red-600 text-sm mt-3">{saveError}</div>}
                <div className="mt-4 flex gap-3">
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving ? 'Сохранение...' : 'Сохранить'}
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Карточка клиента */
            <div className="card p-5 space-y-4">
              <h2 className="font-semibold text-gray-800">Данные клиента</h2>

              {/* Основные контакты */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {client.phone && (
                  <div>
                    <div className="text-gray-400 text-xs mb-0.5">Телефон</div>
                    <a href={`tel:${client.phone}`} className="text-blue-600 hover:underline">
                      {client.phone}
                    </a>
                  </div>
                )}
                {client.email && (
                  <div>
                    <div className="text-gray-400 text-xs mb-0.5">Email</div>
                    <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline">
                      {client.email}
                    </a>
                  </div>
                )}
                {client.contactPerson && (
                  <div>
                    <div className="text-gray-400 text-xs mb-0.5">Контактное лицо</div>
                    <div className="text-gray-800">{client.contactPerson}</div>
                  </div>
                )}
                {client.director && (
                  <div>
                    <div className="text-gray-400 text-xs mb-0.5">Руководитель</div>
                    <div className="text-gray-800">{client.director}</div>
                  </div>
                )}
              </div>

              {/* Реквизиты */}
              {isBusiness && (
                <div className="border-t border-gray-100 pt-4">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    Реквизиты
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {client.inn && (
                      <div>
                        <div className="text-gray-400 text-xs mb-0.5">ИНН</div>
                        <div className="font-mono text-gray-800">{client.inn}</div>
                      </div>
                    )}
                    {client.kpp && (
                      <div>
                        <div className="text-gray-400 text-xs mb-0.5">КПП</div>
                        <div className="font-mono text-gray-800">{client.kpp}</div>
                      </div>
                    )}
                    {client.ogrn && (
                      <div>
                        <div className="text-gray-400 text-xs mb-0.5">ОГРН</div>
                        <div className="font-mono text-gray-800">{client.ogrn}</div>
                      </div>
                    )}
                    {client.ogrnip && (
                      <div>
                        <div className="text-gray-400 text-xs mb-0.5">ОГРНИП</div>
                        <div className="font-mono text-gray-800">{client.ogrnip}</div>
                      </div>
                    )}
                    {client.legalAddress && (
                      <div className="col-span-2">
                        <div className="text-gray-400 text-xs mb-0.5">Юридический адрес</div>
                        <div className="text-gray-800">{client.legalAddress}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Банк */}
              {isBusiness && (client.bik || client.bankName) && (
                <div className="border-t border-gray-100 pt-4">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    Банковские реквизиты
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {client.bankName && (
                      <div className="col-span-2">
                        <div className="text-gray-400 text-xs mb-0.5">Банк</div>
                        <div className="text-gray-800">{client.bankName}</div>
                      </div>
                    )}
                    {client.bik && (
                      <div>
                        <div className="text-gray-400 text-xs mb-0.5">БИК</div>
                        <div className="font-mono text-gray-800">{client.bik}</div>
                      </div>
                    )}
                    {client.corrAccount && (
                      <div>
                        <div className="text-gray-400 text-xs mb-0.5">К/с</div>
                        <div className="font-mono text-gray-800">{client.corrAccount}</div>
                      </div>
                    )}
                    {client.bankAccount && (
                      <div className="col-span-2">
                        <div className="text-gray-400 text-xs mb-0.5">Расчётный счёт</div>
                        <div className="font-mono text-gray-800">{client.bankAccount}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {client.comment && (
                <div className="border-t border-gray-100 pt-4 text-sm">
                  <div className="text-gray-400 text-xs mb-0.5">Комментарий</div>
                  <div className="text-gray-700">{client.comment}</div>
                </div>
              )}
            </div>
          )}

          {/* История заказов */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">
                Заказы
                <span className="text-gray-400 font-normal ml-2 text-sm">
                  {client.orders?.length || 0}
                </span>
              </h2>
            </div>
            {!client.orders?.length ? (
              <div className="p-8 text-center text-gray-400 text-sm">Заказов нет</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-2.5 font-medium text-gray-500">№</th>
                    <th className="px-4 py-2.5 font-medium text-gray-500">Название</th>
                    <th className="px-4 py-2.5 font-medium text-gray-500 hidden md:table-cell">Тип</th>
                    <th className="px-4 py-2.5 font-medium text-gray-500">Статус</th>
                    <th className="px-4 py-2.5 font-medium text-gray-500 hidden lg:table-cell">Сумма</th>
                    <th className="px-4 py-2.5 font-medium text-gray-500 hidden lg:table-cell">Дата</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {client.orders.map(o => (
                    <tr
                      key={o.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/orders/${o.id}`)}
                    >
                      <td className="px-4 py-2.5 font-mono text-gray-400 text-xs">#{o.number}</td>
                      <td className="px-4 py-2.5 font-medium text-gray-900">{o.title}</td>
                      <td className="px-4 py-2.5 hidden md:table-cell text-gray-500 text-xs">
                        {PRODUCT_TYPE[o.productType]?.icon} {PRODUCT_TYPE[o.productType]?.label}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="px-4 py-2.5 hidden lg:table-cell text-gray-500">
                        {o.finalPrice
                          ? `${o.finalPrice.toLocaleString('ru')} ₽`
                          : o.estimatedPrice
                            ? `~${o.estimatedPrice.toLocaleString('ru')} ₽`
                            : '—'}
                      </td>
                      <td className="px-4 py-2.5 hidden lg:table-cell text-xs text-gray-400">
                        {format(new Date(o.createdAt), 'd MMM yyyy', { locale: ru })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Сайдбар */}
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Статистика</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Всего заказов</span>
                <span className="font-medium">{client.orders?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Завершено</span>
                <span className="font-medium text-green-700">
                  {client.orders?.filter(o => ['DELIVERED','CLOSED'].includes(o.status)).length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">В работе</span>
                <span className="font-medium text-blue-700">
                  {client.orders?.filter(o => !['DELIVERED','CLOSED','CANCELLED'].includes(o.status)).length || 0}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-gray-100">
                <span className="text-gray-500">Сумма</span>
                <span className="font-medium">
                  {client.orders
                    ?.reduce((sum, o) => sum + (o.finalPrice || o.estimatedPrice || 0), 0)
                    .toLocaleString('ru')
                  } ₽
                </span>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Добавлен</h3>
            <div className="text-sm text-gray-700">
              {format(new Date(client.createdAt), 'd MMMM yyyy', { locale: ru })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
