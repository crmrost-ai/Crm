'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', company: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getClients({ search, limit: 50 })
      .then(d => { setClients(d.clients || []); setTotal(d.total || 0) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [search])

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const c = await api.createClient(form)
      setClients(cs => [c, ...cs])
      setShowForm(false)
      setForm({ name: '', phone: '', email: '', company: '' })
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
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Отмена' : '+ Новый клиент'}
        </button>
      </div>

      {/* Форма создания */}
      {showForm && (
        <div className="card p-5 mb-5">
          <h2 className="font-semibold text-gray-800 mb-4">Новый клиент</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Имя *</label>
              <input className="input" placeholder="Иванов Иван" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Телефон</label>
              <input className="input" placeholder="+7 (999) 000-00-00" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="ivan@example.ru" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="label">Компания</label>
              <input className="input" placeholder="ООО «Пример»" value={form.company}
                onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
            </div>
            {error && (
              <div className="col-span-2 text-red-600 text-sm">{error}</div>
            )}
            <div className="col-span-2 flex gap-3">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Сохранение...' : 'Создать'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Поиск */}
      <div className="mb-4">
        <input
          className="input w-72"
          placeholder="Поиск по имени, телефону, компании..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
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
                <th className="px-4 py-3 font-medium text-gray-500">Имя / Компания</th>
                <th className="px-4 py-3 font-medium text-gray-500">Контакты</th>
                <th className="px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Заказов</th>
                <th className="px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Добавлен</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {clients.map(c => (
                <tr key={c.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/orders?search=${encodeURIComponent(c.name)}`)}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{c.name}</div>
                    {c.company && c.company !== c.name && (
                      <div className="text-xs text-gray-400">{c.company}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {c.phone && <div>{c.phone}</div>}
                    {c.email && <div className="text-xs text-gray-400">{c.email}</div>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-500">
                    {c._count?.orders ?? 0}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-400">
                    {format(new Date(c.createdAt), 'd MMM yyyy', { locale: ru })}
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
