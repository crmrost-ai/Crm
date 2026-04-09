'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

const ROLE_LABEL = {
  MANAGER:    { label: 'Менеджер',   color: 'bg-blue-100 text-blue-700' },
  CONTRACTOR: { label: 'Подрядчик',  color: 'bg-purple-100 text-purple-700' },
  ADMIN:      { label: 'Админ',      color: 'bg-red-100 text-red-700' },
}

const EMPTY_FORM = { name: '', email: '', password: '', role: 'MANAGER', phone: '', telegram: '' }

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Edit modal
  const [editUser, setEditUser] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  useEffect(() => {
    load()
  }, [])

  function load() {
    setLoading(true)
    api.getUsers()
      .then(u => setUsers(u))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  function setF(field, val) {
    setForm(f => ({ ...f, [field]: val }))
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) {
      setError('Заполните имя, email и пароль')
      return
    }
    setSaving(true)
    setError('')
    try {
      const u = await api.createUser(form)
      setUsers(prev => [...prev, u])
      setShowForm(false)
      setForm(EMPTY_FORM)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function openEdit(u) {
    setEditUser(u)
    setEditForm({ name: u.name, phone: u.phone || '', telegram: u.telegram || '', isActive: u.isActive })
    setEditError('')
  }

  async function handleEdit(e) {
    e.preventDefault()
    setEditSaving(true)
    setEditError('')
    try {
      const updated = await api.updateUser(editUser.id, editForm)
      setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u))
      setEditUser(null)
    } catch (err) {
      setEditError(err.message)
    } finally {
      setEditSaving(false)
    }
  }

  async function toggleActive(u) {
    try {
      const updated = await api.updateUser(u.id, { isActive: !u.isActive })
      setUsers(prev => prev.map(x => x.id === updated.id ? { ...x, ...updated } : x))
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Пользователи</h1>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} пользователей</p>
        </div>
        <button className="btn-primary" onClick={() => { setShowForm(!showForm); setError('') }}>
          {showForm ? 'Отмена' : '+ Новый пользователь'}
        </button>
      </div>

      {/* Форма создания */}
      {showForm && (
        <div className="card p-5 mb-5">
          <h2 className="font-semibold text-gray-800 mb-4">Новый пользователь</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Имя *</label>
                <input className="input" placeholder="Иванова Анна"
                  value={form.name} onChange={e => setF('name', e.target.value)} />
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" className="input" placeholder="anna@rost.ru"
                  value={form.email} onChange={e => setF('email', e.target.value)} />
              </div>
              <div>
                <label className="label">Пароль *</label>
                <input type="password" className="input" placeholder="Минимум 6 символов"
                  value={form.password} onChange={e => setF('password', e.target.value)} />
              </div>
              <div>
                <label className="label">Роль *</label>
                <select className="input" value={form.role} onChange={e => setF('role', e.target.value)}>
                  <option value="MANAGER">Менеджер</option>
                  <option value="CONTRACTOR">Подрядчик</option>
                  <option value="ADMIN">Администратор</option>
                </select>
              </div>
              <div>
                <label className="label">Телефон</label>
                <input className="input" placeholder="+7 (999) 000-00-00"
                  value={form.phone} onChange={e => setF('phone', e.target.value)} />
              </div>
              <div>
                <label className="label">Telegram</label>
                <input className="input" placeholder="@username"
                  value={form.telegram} onChange={e => setF('telegram', e.target.value)} />
              </div>
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Создание...' : 'Создать пользователя'}
            </button>
          </form>
        </div>
      )}

      {/* Таблица */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Загрузка...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-left">
                <th className="px-4 py-3 font-medium text-gray-500">Пользователь</th>
                <th className="px-4 py-3 font-medium text-gray-500">Роль</th>
                <th className="px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Контакты</th>
                <th className="px-4 py-3 font-medium text-gray-500">Статус</th>
                <th className="px-4 py-3 font-medium text-gray-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => {
                const r = ROLE_LABEL[u.role] || ROLE_LABEL.MANAGER
                return (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{u.name}</div>
                      <div className="text-xs text-gray-400">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${r.color}`}>{r.label}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-500 text-xs">
                      {u.phone && <div>{u.phone}</div>}
                      {u.telegram && <div className="text-blue-500">{u.telegram}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(u)}
                        className={`badge cursor-pointer hover:opacity-80 transition-opacity ${
                          u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {u.isActive ? 'Активен' : 'Отключён'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openEdit(u)}
                        className="text-xs text-gray-400 hover:text-blue-600 underline"
                      >
                        Изменить
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Модалка редактирования */}
      {editUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">{editUser.name}</h2>
            <p className="text-sm text-gray-400 mb-4">{editUser.email}</p>
            <form onSubmit={handleEdit} className="space-y-3">
              <div>
                <label className="label">Имя</label>
                <input className="input" value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Телефон</label>
                <input className="input" placeholder="+7 (999) 000-00-00"
                  value={editForm.phone}
                  onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="label">Telegram</label>
                <input className="input" placeholder="@username"
                  value={editForm.telegram}
                  onChange={e => setEditForm(f => ({ ...f, telegram: e.target.value }))} />
              </div>
              <div className="flex items-center gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={e => setEditForm(f => ({ ...f, isActive: e.target.checked }))}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm text-gray-700">Пользователь активен</span>
                </label>
              </div>
              {editError && <div className="text-red-600 text-sm">{editError}</div>}
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1" disabled={editSaving}>
                  {editSaving ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setEditUser(null)}>
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
