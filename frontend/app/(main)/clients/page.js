'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import ClientForm from '@/components/orders/ClientForm'

const TYPE_LABEL = {
  INDIVIDUAL:   { label: 'Физлицо',  icon: '👤', color: 'bg-gray-100 text-gray-600' },
  ENTREPRENEUR: { label: 'ИП',       icon: '🧑‍💼', color: 'bg-blue-100 text-blue-700' },
  COMPANY:      { label: 'Юрлицо',  icon: '🏢', color: 'bg-purple-100 text-purple-700' },
}

const EMPTY_CLIENT = {
  type: 'INDIVIDUAL', name: '', phone: '', email: '',
  inn: '', kpp: '', ogrn: '', ogrnip: '', legalAddress: '',
  director: '', contactPerson: '', comment: '',
}

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [loading, setLoading] = useState(true)

  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState(EMPTY_CLIENT)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    api.getClients({ search, type: filterType, limit: 50 })
      .then(d => { setClients(d.clients || []); setTotal(d.total || 0) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [search, filterType])

  async function handleCreate(e) {
    e.preventDefault()
    if (!formData.name) { setError('Укажите имя / название'); return }
    setSaving(true)
    setError('')
    try {
      const c = await api.createClient(formData)
      setClients(cs => [c, ...cs])
      setTotal(t => t + 1)
      setShowForm(false)
      setFormData(EMPTY_CLIENT)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Клиенты</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} клиентов</p>
        </div>
        <button className="btn-primary" onClick={() => { setShowForm(!showForm); setError('') }}>
          {showForm ? 'Отмена' : '+ Новый клиент'}
        </button>
      </div>

      {/* Форма создания */}
      {showForm && (
        <div className="card p-5 mb-5">
          <h2 className="font-semibold text-gray-800 mb-4">Новый клиент</h2>
          <form onSubmit={handleCreate}>
            <ClientForm value={formData} onChange={setFormData} />
            {error && <div className="text-red-600 text-sm mt-3">{error}</div>}
            <div className="mt-4">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Сохранение...' : 'Создать клиента'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Фильтры */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          className="input w-64"
          placeholder="Поиск по имени, телефону, ИНН..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="input w-40" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">Все типы</option>
          <option value="INDIVIDUAL">👤 Физлицо</option>
          <option value="ENTREPRENEUR">🧑‍💼 ИП</option>
          <option value="COMPANY">🏢 Юрлицо</option>
        </select>
      </div>

      {/* Список */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Загрузка...</div>
        ) : clients.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Клиентов не найдено</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-left">
                <th className="px-4 py-3 font-medium text-gray-500">Клиент</th>
                <th className="px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Контакты</th>
                <th className="px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">ИНН</th>
                <th className="px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Заказов</th>
                <th className="px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Добавлен</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {clients.map(c => {
                const t = TYPE_LABEL[c.type] || TYPE_LABEL.INDIVIDUAL
                return (
                  <tr key={c.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/clients/${c.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`badge ${t.color}`}>{t.icon} {t.label}</span>
                        <span className="font-medium text-gray-900">{c.name}</span>
                      </div>
                      {c.contactPerson && (
                        <div className="text-xs text-gray-400 mt-0.5">Контакт: {c.contactPerson}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-600">
                      {c.phone && <div>{c.phone}</div>}
                      {c.email && <div className="text-xs text-gray-400">{c.email}</div>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-gray-500 font-mono text-xs">
                      {c.inn || '—'}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-500">
                      {c._count?.orders ?? 0}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-400">
                      {format(new Date(c.createdAt), 'd MMM yyyy', { locale: ru })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
