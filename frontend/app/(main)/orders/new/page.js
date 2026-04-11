'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import { PRODUCT_TYPE, ORDER_SOURCE } from '@/lib/constants'
import DateQuickPick from '@/components/ui/DateQuickPick'
import AddressInput from '@/components/ui/AddressInput'
import ClientForm from '@/components/orders/ClientForm'

export default function NewOrderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [clients, setClients] = useState([])
  const [clientSearch, setClientSearch] = useState('')
  const [showNewClient, setShowNewClient] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState(() => {
    const productType = searchParams.get('productType') || 'BUSINESS_CARDS'
    const fromCalc = searchParams.get('fromCalc') === '1'
    let description = '', estimatedPrice = ''
    if (fromCalc && typeof window !== 'undefined') {
      try {
        const prefill = JSON.parse(sessionStorage.getItem('calc_prefill') || '{}')
        if (prefill.productType === productType) {
          description = prefill.description || ''
          estimatedPrice = prefill.estimatedPrice || ''
          sessionStorage.removeItem('calc_prefill')
        }
      } catch {}
    }
    return {
      source: 'PHONE', productType,
      title: '', description, estimatedPrice: estimatedPrice ? String(estimatedPrice) : '',
      deadline: '', managerNote: '', deliveryAddress: '', clientId: '',
    }
  })

  const [newClient, setNewClient] = useState({
    type: 'INDIVIDUAL', name: '', phone: '', email: '',
    inn: '', kpp: '', ogrn: '', ogrnip: '', legalAddress: '', director: '',
    contactPerson: '', comment: '',
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      api.getClients({ search: clientSearch, limit: 20 })
        .then(d => setClients(d.clients || []))
        .catch(console.error)
    }, 300)
    return () => clearTimeout(timer)
  }, [clientSearch])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.clientId && !showNewClient) {
      setError('Выберите клиента или создайте нового')
      return
    }
    if (showNewClient && !newClient.name) {
      setError('Введите имя клиента')
      return
    }

    setLoading(true)
    try {
      let clientId = form.clientId

      if (showNewClient) {
        const created = await api.createClient(newClient)
        clientId = created.id
      }

      const order = await api.createOrder({
        ...form,
        clientId,
        estimatedPrice: form.estimatedPrice ? Number(form.estimatedPrice) : undefined,
        deadline: form.deadline || undefined,
      })

      router.push(`/orders/${order.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Новый заказ</h1>
        <p className="text-sm text-gray-500 mt-0.5">Заполните данные заявки</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Источник + Тип */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Заявка</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Источник заявки</label>
              <select className="input" value={form.source} onChange={e => set('source', e.target.value)}>
                {Object.entries(ORDER_SOURCE).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Тип продукции</label>
              <select className="input" value={form.productType} onChange={e => set('productType', e.target.value)}>
                {Object.entries(PRODUCT_TYPE).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Название заказа *</label>
            <input
              className="input"
              placeholder="Например: Визитки для ИП Иванов, 1000 шт."
              value={form.title}
              onChange={e => set('title', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Описание / параметры заказа</label>
            <textarea
              className="input resize-none"
              rows={4}
              placeholder="Формат, тираж, материал, особые требования..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Предв. стоимость (₽)</label>
              <input
                type="number"
                className="input"
                placeholder="0"
                value={form.estimatedPrice}
                onChange={e => set('estimatedPrice', e.target.value)}
              />
            </div>
            <DateQuickPick
              value={form.deadline}
              onChange={v => set('deadline', v)}
            />
          </div>

          <div>
            <label className="label">Адрес доставки</label>
            <AddressInput
              value={form.deliveryAddress}
              onChange={v => set('deliveryAddress', v)}
              placeholder="Начните вводить адрес доставки..."
            />
          </div>

          <div>
            <label className="label">Заметка менеджера</label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="Внутренние комментарии, не видны подрядчику"
              value={form.managerNote}
              onChange={e => set('managerNote', e.target.value)}
            />
          </div>
        </div>

        {/* Клиент */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Клиент</h2>
            <button
              type="button"
              className="text-sm text-blue-600 hover:underline"
              onClick={() => { setShowNewClient(!showNewClient); set('clientId', '') }}
            >
              {showNewClient ? '← Выбрать существующего' : '+ Новый клиент'}
            </button>
          </div>

          {!showNewClient ? (
            <div>
              <label className="label">Поиск клиента</label>
              <input
                className="input mb-2"
                placeholder="Имя, телефон, ИНН..."
                value={clientSearch}
                onChange={e => setClientSearch(e.target.value)}
              />
              <div className="border border-gray-200 rounded-lg overflow-hidden max-h-52 overflow-y-auto">
                {clients.length === 0 ? (
                  <div className="p-3 text-sm text-gray-400 text-center">Клиентов не найдено</div>
                ) : (
                  clients.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => set('clientId', c.id)}
                      className={`w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                        form.clientId === c.id ? 'bg-blue-50 text-blue-700' : ''
                      }`}
                    >
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-gray-400">
                        {[c.phone, c.inn ? `ИНН ${c.inn}` : null].filter(Boolean).join(' · ')}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <ClientForm value={newClient} onChange={setNewClient} />
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Создание...' : 'Создать заказ'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => router.back()}
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  )
}
