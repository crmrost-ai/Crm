'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { getUser } from '@/lib/auth'

export default function ContractorsPage() {
  const user = getUser()
  const isAdmin = user?.role === 'ADMIN'

  const [contractors, setContractors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', telegram: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    api.getContractors()
      .then(setContractors)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const created = await api.createUser({ ...form, role: 'CONTRACTOR' })
      setContractors(cs => [...cs, created])
      setShowForm(false)
      setForm({ name: '', email: '', password: '', phone: '', telegram: '' })
      setSuccess(`Цех «${created.name}» добавлен`)
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
          <h1 className="text-2xl font-bold text-gray-900">Цеха / Подрядчики</h1>
          <p className="text-sm text-gray-500 mt-0.5">{contractors.length} цехов в системе</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => { setShowForm(!showForm); setError('') }}>
            {showForm ? 'Отмена' : '+ Добавить цех'}
          </button>
        )}
      </div>

      {/* Форма добавления */}
      {showForm && isAdmin && (
        <div className="card p-5 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">Новый цех</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Название цеха *</label>
              <input className="input" placeholder="Цех полиграфии" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Email (для входа) *</label>
              <input type="email" className="input" placeholder="poligraf@rost.ru" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Пароль *</label>
              <input type="password" className="input" placeholder="••••••••" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Телефон</label>
              <input className="input" placeholder="+7 (999) 000-00-00" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label className="label">Telegram</label>
              <input className="input" placeholder="@username" value={form.telegram}
                onChange={e => setForm(f => ({ ...f, telegram: e.target.value }))} />
            </div>
            {error && <div className="col-span-2 text-red-600 text-sm">{error}</div>}
            <div className="col-span-2">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Сохранение...' : 'Добавить цех'}
              </button>
            </div>
          </form>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">
          ✓ {success}
        </div>
      )}

      {/* Список цехов */}
      {loading ? (
        <div className="text-gray-400 text-sm">Загрузка...</div>
      ) : contractors.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-4xl mb-2">🏭</div>
          <div className="text-gray-500">Цехов пока нет</div>
          {isAdmin && (
            <button className="btn-primary btn-sm mt-3" onClick={() => setShowForm(true)}>
              Добавить первый цех
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contractors.map(c => (
            <div key={c.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl">
                  🏭
                </div>
                <span className="badge bg-green-100 text-green-700">Активен</span>
              </div>
              <h3 className="font-semibold text-gray-900">{c.name}</h3>
              <div className="mt-3 space-y-1.5 text-sm text-gray-500">
                {c.phone && (
                  <div className="flex items-center gap-2">
                    <span>📞</span>
                    <a href={`tel:${c.phone}`} className="text-blue-600 hover:underline">{c.phone}</a>
                  </div>
                )}
                {c.telegram && (
                  <div className="flex items-center gap-2">
                    <span>✈️</span>
                    <span>{c.telegram}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span>✉️</span>
                  <span className="text-gray-400 text-xs">{c.email}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
