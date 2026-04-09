'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export default function SettingsPage() {
  const [s, setS] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getSettings()
      .then(data => { setS(data); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  function set(key, val) {
    setS(prev => ({ ...prev, [key]: val }))
    setSaved(false)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.updateSettings(s)
      setSaved(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-gray-400 text-sm p-4">Загрузка...</div>

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Настройки компании</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Реквизиты типографии — используются при выставлении счетов
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">

        {/* Основные реквизиты */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Компания</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Краткое название</label>
              <input className="input" placeholder="Типография Рост"
                value={s.companyName || ''} onChange={e => set('companyName', e.target.value)} />
            </div>
            <div>
              <label className="label">Полное название</label>
              <input className="input" placeholder="ООО «Рост»"
                value={s.companyFullName || ''} onChange={e => set('companyFullName', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">ИНН</label>
              <input className="input font-mono" placeholder="7700000000" maxLength={12}
                value={s.inn || ''} onChange={e => set('inn', e.target.value)} />
            </div>
            <div>
              <label className="label">КПП</label>
              <input className="input font-mono" placeholder="770000000" maxLength={9}
                value={s.kpp || ''} onChange={e => set('kpp', e.target.value)} />
            </div>
            <div>
              <label className="label">ОГРН</label>
              <input className="input font-mono" placeholder="1027700000000" maxLength={15}
                value={s.ogrn || ''} onChange={e => set('ogrn', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Руководитель (ФИО)</label>
              <input className="input" placeholder="Иванов Иван Иванович"
                value={s.director || ''} onChange={e => set('director', e.target.value)} />
            </div>
            <div>
              <label className="label">Должность</label>
              <input className="input" placeholder="Генеральный директор"
                value={s.directorTitle || ''} onChange={e => set('directorTitle', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">Юридический адрес</label>
            <input className="input" placeholder="г. Москва, ул. Примерная, д. 1"
              value={s.legalAddress || ''} onChange={e => set('legalAddress', e.target.value)} />
          </div>

          <div>
            <label className="label">Фактический / почтовый адрес</label>
            <input className="input" placeholder="г. Москва, ул. Другая, д. 2"
              value={s.actualAddress || ''} onChange={e => set('actualAddress', e.target.value)} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Телефон</label>
              <input className="input" placeholder="+7 (495) 000-00-00"
                value={s.phone || ''} onChange={e => set('phone', e.target.value)} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" placeholder="info@rost-print.ru"
                value={s.email || ''} onChange={e => set('email', e.target.value)} />
            </div>
            <div>
              <label className="label">Сайт</label>
              <input className="input" placeholder="rost-print.ru"
                value={s.website || ''} onChange={e => set('website', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Банковские реквизиты */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Банковские реквизиты</h2>

          <div>
            <label className="label">Название банка</label>
            <input className="input" placeholder="ПАО Сбербанк"
              value={s.bankName || ''} onChange={e => set('bankName', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">БИК</label>
              <input className="input font-mono" placeholder="044525225" maxLength={9}
                value={s.bik || ''} onChange={e => set('bik', e.target.value)} />
            </div>
            <div>
              <label className="label">Корреспондентский счёт</label>
              <input className="input font-mono" placeholder="30101810400000000225" maxLength={20}
                value={s.corrAccount || ''} onChange={e => set('corrAccount', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">Расчётный счёт</label>
            <input className="input font-mono" placeholder="40702810938000000000" maxLength={20}
              value={s.bankAccount || ''} onChange={e => set('bankAccount', e.target.value)} />
          </div>
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <div className="flex items-center gap-4">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить реквизиты'}
          </button>
          {saved && (
            <span className="text-green-600 text-sm font-medium">Сохранено</span>
          )}
        </div>
      </form>
    </div>
  )
}
