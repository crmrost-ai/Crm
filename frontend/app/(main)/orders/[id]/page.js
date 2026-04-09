'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { getUser } from '@/lib/auth'
import StatusBadge from '@/components/ui/StatusBadge'
import DateQuickPick from '@/components/ui/DateQuickPick'
import AddressInput from '@/components/ui/AddressInput'
import {
  ORDER_STATUS, PRODUCT_TYPE, ORDER_SOURCE,
  MANAGER_STATUS_FLOW, CONTRACTOR_STATUS_FLOW,
} from '@/lib/constants'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

// Размер файла читаемо
function fmtSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`
}

export default function OrderDetailPage({ params }) {
  const router = useRouter()
  const user = getUser()
  const [order, setOrder] = useState(null)
  const [contractors, setContractors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Редактирование
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [editSaving, setEditSaving] = useState(false)

  // Назначить цех
  const [assignModal, setAssignModal] = useState(false)
  const [assignContractor, setAssignContractor] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [showCreateContractor, setShowCreateContractor] = useState(false)
  const [newContractor, setNewContractor] = useState({ name: '', email: '', password: '', phone: '', telegram: '' })
  const [creatingContractor, setCreatingContractor] = useState(false)
  const [createContractorError, setCreateContractorError] = useState('')

  // Передать в цех
  const [sendModal, setSendModal] = useState(false)
  const [selectedContractor, setSelectedContractor] = useState('')
  const [calcRequest, setCalcRequest] = useState('')
  const [sending, setSending] = useState(false)

  // Ответ подрядчика
  const [responseModal, setResponseModal] = useState(false)
  const [calcResponse, setCalcResponse] = useState('')
  const [responsePrice, setResponsePrice] = useState('')
  const [responding, setResponding] = useState(false)

  // Смена статуса
  const [statusChanging, setStatusChanging] = useState(false)

  // Файлы
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    Promise.all([api.getOrder(params.id), api.getContractors()])
      .then(([o, c]) => {
        setOrder(o)
        setContractors(c)
        initEdit(o)
        if (o.contractorId) {
          setAssignContractor(o.contractorId)
          setSelectedContractor(o.contractorId)
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [params.id])

  function initEdit(o) {
    setEditForm({
      title: o.title || '',
      description: o.description || '',
      estimatedPrice: o.estimatedPrice || '',
      finalPrice: o.finalPrice || '',
      managerNote: o.managerNote || '',
      deliveryAddress: o.deliveryAddress || '',
      deadline: o.deadline ? o.deadline.split('T')[0] : '',
      source: o.source || '',
      productType: o.productType || '',
    })
  }

  async function handleSaveEdit() {
    setEditSaving(true)
    try {
      const full = await api.getOrder(params.id)
      setOrder(full)
      await api.updateOrder(order.id, {
        ...editForm,
        estimatedPrice: editForm.estimatedPrice ? Number(editForm.estimatedPrice) : undefined,
        finalPrice: editForm.finalPrice ? Number(editForm.finalPrice) : undefined,
        deadline: editForm.deadline || undefined,
      })
      const updated = await api.getOrder(params.id)
      setOrder(updated)
      setEditMode(false)
    } catch (e) {
      setError(e.message)
    } finally {
      setEditSaving(false)
    }
  }

  async function handleAssignContractor() {
    if (!assignContractor) return
    setAssigning(true)
    try {
      await api.updateOrder(order.id, { contractorId: assignContractor })
      const full = await api.getOrder(order.id)
      setOrder(full)
      setAssignModal(false)
      setShowCreateContractor(false)
    } catch (e) { setError(e.message) }
    finally { setAssigning(false) }
  }

  async function handleCreateContractor(e) {
    e.preventDefault()
    if (!newContractor.name || !newContractor.email || !newContractor.password) {
      setCreateContractorError('Заполните название, email и пароль')
      return
    }
    setCreatingContractor(true)
    setCreateContractorError('')
    try {
      const created = await api.createUser({ ...newContractor, role: 'CONTRACTOR' })
      setContractors(prev => [...prev, created])
      setAssignContractor(created.id)
      setShowCreateContractor(false)
      setNewContractor({ name: '', email: '', password: '', phone: '', telegram: '' })
    } catch (err) {
      setCreateContractorError(err.message)
    } finally {
      setCreatingContractor(false)
    }
  }

  async function handleSendToContractor() {
    if (!selectedContractor) return
    setSending(true)
    try {
      const updated = await api.sendToContractor(order.id, selectedContractor, calcRequest)
      setOrder(updated)
      setSendModal(false)
      setCalcRequest('')
    } catch (e) { setError(e.message) }
    finally { setSending(false) }
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
    } catch (e) { setError(e.message) }
    finally { setResponding(false) }
  }

  async function handleStatusChange(newStatus) {
    setStatusChanging(true)
    try {
      const updated = await api.changeStatus(order.id, newStatus)
      setOrder(updated)
    } catch (e) { setError(e.message) }
    finally { setStatusChanging(false) }
  }

  // ── Файлы ────────────────────────────────────────────────────────────────────
  async function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await api.uploadFile(order.id, file)
      const updated = await api.getOrder(order.id)
      setOrder(updated)
    } catch (e) { setError(e.message) }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  async function handleDeleteFile(filename) {
    if (!confirm('Удалить файл?')) return
    try {
      await api.deleteFile(order.id, filename)
      const updated = await api.getOrder(order.id)
      setOrder(updated)
    } catch (e) { setError(e.message) }
  }

  // ─────────────────────────────────────────────────────────────────────────────

  if (loading) return <div className="text-gray-400 text-sm p-4">Загрузка...</div>
  if (error && !order) return <div className="text-red-500 text-sm p-4">{error}</div>
  if (!order) return null

  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN'
  const isContractor = user?.role === 'CONTRACTOR'

  const availableStatuses = isManager
    ? (MANAGER_STATUS_FLOW[order.status] || [])
    : (CONTRACTOR_STATUS_FLOW[order.status] || [])

  const files = Array.isArray(order.files) ? order.files : []

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600 mb-2">
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
            {format(new Date(order.createdAt), 'd MMMM yyyy', { locale: ru })}
          </p>
        </div>

        <div className="flex gap-2 flex-wrap shrink-0">
          {isManager && (
            <Link href={`/orders/${order.id}/invoice`} target="_blank" rel="noopener noreferrer"
              className="btn-secondary text-sm">
              🧾 Счёт
            </Link>
          )}
          {isManager && (
            <button
              className={`btn-secondary ${editMode ? 'bg-gray-100' : ''}`}
              onClick={() => { setEditMode(!editMode); initEdit(order); setError('') }}
            >
              {editMode ? 'Отмена' : '✏️ Редактировать'}
            </button>
          )}
          {isManager && (
            <button className="btn-secondary" onClick={() => setAssignModal(true)}>
              {order.contractor ? `🏭 ${order.contractor.name}` : '+ Назначить цех'}
            </button>
          )}
          {isManager && ['NEW', 'AGREED'].includes(order.status) && (
            <button className="btn-primary" onClick={() => setSendModal(true)}>
              Передать в цех
            </button>
          )}
          {isContractor && order.status === 'CALCULATING' && (
            <button className="btn-primary" onClick={() => setResponseModal(true)}>
              Ввести расчёт
            </button>
          )}
          {availableStatuses.map(s => (
            <button key={s} className="btn-secondary btn-sm"
              disabled={statusChanging} onClick={() => handleStatusChange(s)}>
              → {ORDER_STATUS[s]?.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
          {error}
          <button className="ml-3 underline" onClick={() => setError('')}>скрыть</button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-4">

          {/* ── Форма редактирования ── */}
          {editMode ? (
            <div className="card p-5 space-y-4">
              <h2 className="font-semibold text-gray-800">Редактирование заказа</h2>

              <div>
                <label className="label">Название *</label>
                <input className="input" value={editForm.title}
                  onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Источник</label>
                  <select className="input" value={editForm.source}
                    onChange={e => setEditForm(f => ({ ...f, source: e.target.value }))}>
                    {Object.entries(ORDER_SOURCE).map(([k, v]) => (
                      <option key={k} value={k}>{v.icon} {v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Тип продукции</label>
                  <select className="input" value={editForm.productType}
                    onChange={e => setEditForm(f => ({ ...f, productType: e.target.value }))}>
                    {Object.entries(PRODUCT_TYPE).map(([k, v]) => (
                      <option key={k} value={k}>{v.icon} {v.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Описание / параметры</label>
                <textarea className="input resize-none" rows={4}
                  value={editForm.description}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Предв. цена (₽)</label>
                  <input type="number" className="input" value={editForm.estimatedPrice}
                    onChange={e => setEditForm(f => ({ ...f, estimatedPrice: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Итоговая цена (₽)</label>
                  <input type="number" className="input" value={editForm.finalPrice}
                    onChange={e => setEditForm(f => ({ ...f, finalPrice: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Срок сдачи</label>
                  <input type="date" className="input" value={editForm.deadline}
                    onChange={e => setEditForm(f => ({ ...f, deadline: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="label">Адрес доставки</label>
                <AddressInput value={editForm.deliveryAddress}
                  onChange={v => setEditForm(f => ({ ...f, deliveryAddress: v }))} />
              </div>

              <div>
                <label className="label">Заметка менеджера</label>
                <textarea className="input resize-none" rows={2}
                  value={editForm.managerNote}
                  onChange={e => setEditForm(f => ({ ...f, managerNote: e.target.value }))} />
              </div>

              <div className="flex gap-3">
                <button className="btn-primary" disabled={editSaving} onClick={handleSaveEdit}>
                  {editSaving ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
                <button className="btn-secondary" onClick={() => setEditMode(false)}>
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            /* ── Параметры заказа ── */
            <div className="card p-5">
              <h2 className="font-semibold text-gray-800 mb-3">Параметры заказа</h2>
              {order.description ? (
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.description}</p>
              ) : (
                <p className="text-sm text-gray-400">Описание не указано</p>
              )}
              {order.params && Object.keys(order.params).length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
                  {Object.entries(order.params).map(([k, v]) => (
                    <div key={k} className="text-sm">
                      <span className="text-gray-400">{k}: </span>
                      <span className="text-gray-700">{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Файлы ── */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800">
                Файлы
                {files.length > 0 && (
                  <span className="text-gray-400 font-normal ml-2 text-sm">{files.length}</span>
                )}
              </h2>
              <div>
                <input ref={fileRef} type="file" className="hidden" onChange={handleFileUpload}
                  accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.ai,.cdr,.psd,.eps,.zip,.rar,.doc,.docx,.xls,.xlsx,.tiff,.tif,.svg"
                />
                <button
                  className="btn-secondary btn-sm"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploading ? 'Загрузка...' : '+ Добавить файл'}
                </button>
              </div>
            </div>

            {files.length === 0 ? (
              <div
                className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center text-sm text-gray-400 cursor-pointer hover:border-blue-300 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                Перетащите файлы или нажмите для выбора<br />
                <span className="text-xs">PDF, AI, CDR, PSD, изображения, ZIP — до 50 МБ</span>
              </div>
            ) : (
              <div className="space-y-2">
                {files.map((f, i) => (
                  <div key={i}
                    className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg text-sm group">
                    <span className="text-lg">
                      {/\.(pdf)$/i.test(f.name) ? '📄' :
                       /\.(ai|cdr|eps|psd)$/i.test(f.name) ? '🎨' :
                       /\.(zip|rar)$/i.test(f.name) ? '🗜️' :
                       /\.(jpg|jpeg|png|gif|webp|tiff?)$/i.test(f.name) ? '🖼️' : '📎'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <a
                        href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${f.url}`}
                        target="_blank" rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:underline truncate block"
                      >
                        {f.name}
                      </a>
                      <div className="text-xs text-gray-400">
                        {fmtSize(f.size)}
                        {f.uploadedAt && ` · ${format(new Date(f.uploadedAt), 'd MMM, HH:mm', { locale: ru })}`}
                      </div>
                    </div>
                    {isManager && (
                      <button
                        onClick={() => handleDeleteFile(f.filename)}
                        className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 text-lg leading-none"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Переписка с цехом ── */}
          {(order.calcRequest || order.calcResponse) && (
            <div className="card p-5 space-y-4">
              <h2 className="font-semibold text-gray-800">Переписка с цехом</h2>
              {order.calcRequest && (
                <div>
                  <div className="text-xs text-gray-400 mb-1.5">
                    ← Запрос в цех «{order.contractor?.name}»
                    {order.calcRequestedAt && <> · {format(new Date(order.calcRequestedAt), 'd MMM, HH:mm', { locale: ru })}</>}
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-gray-800 whitespace-pre-wrap">
                    {order.calcRequest}
                  </div>
                </div>
              )}
              {order.calcResponse && (
                <div>
                  <div className="text-xs text-gray-400 mb-1.5">
                    → Ответ цеха
                    {order.calcRespondedAt && <> · {format(new Date(order.calcRespondedAt), 'd MMM, HH:mm', { locale: ru })}</>}
                  </div>
                  <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-sm text-gray-800 whitespace-pre-wrap">
                    {order.calcResponse}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── История ── */}
          {order.statusHistory?.length > 0 && (
            <div className="card p-5">
              <h2 className="font-semibold text-gray-800 mb-3">История</h2>
              <div className="space-y-3">
                {order.statusHistory.map(h => (
                  <div key={h.id} className="flex gap-3 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={h.status} />
                        <span className="text-gray-400 text-xs">
                          {format(new Date(h.createdAt), 'd MMM, HH:mm', { locale: ru })}
                        </span>
                        <span className="text-gray-400 text-xs">{h.user?.name}</span>
                      </div>
                      {h.comment && <p className="text-gray-500 text-xs mt-0.5">{h.comment}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Сайдбар ── */}
        <div className="space-y-4">

          <div className="card p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Клиент</h3>
            <div className="text-sm">
              <div className="font-medium text-gray-900">{order.client?.name}</div>
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
              <a href={`/clients/${order.client?.id}`}
                className="text-xs text-gray-400 hover:text-blue-500 mt-1 block">
                Карточка клиента →
              </a>
            </div>
          </div>

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

          <div className="card p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Цех / Подрядчик</h3>
            {order.contractor ? (
              <div className="text-sm">
                <div className="font-medium text-gray-900">🏭 {order.contractor.name}</div>
                {order.contractor.phone && <div className="text-gray-500 mt-1">{order.contractor.phone}</div>}
                {order.contractor.telegram && <div className="text-blue-600">{order.contractor.telegram}</div>}
                {isManager && (
                  <button onClick={() => setAssignModal(true)}
                    className="text-xs text-gray-400 hover:text-blue-600 mt-2 underline">
                    Изменить
                  </button>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-400">
                Не назначен
                {isManager && (
                  <button onClick={() => setAssignModal(true)}
                    className="block text-blue-600 hover:underline mt-1 text-xs">
                    + Назначить
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="card p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Детали</h3>
            <div className="text-sm space-y-2">
              <div>
                <span className="text-gray-400">Менеджер: </span>
                <span className="text-gray-700">{order.manager?.name}</span>
              </div>
              {order.deadline && (
                <div>
                  <span className="text-gray-400">Срок сдачи клиенту: </span>
                  <span className="text-gray-700">
                    {format(new Date(order.deadline), 'd MMMM yyyy', { locale: ru })}
                  </span>
                </div>
              )}
              {order.deliveryAddress && (
                <div>
                  <span className="text-gray-400 block mb-0.5">Доставка:</span>
                  <span className="text-gray-700">{order.deliveryAddress}</span>
                </div>
              )}
            </div>
          </div>

          {isManager && order.managerNote && (
            <div className="card p-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Заметка</h3>
              <p className="text-sm text-gray-700">{order.managerNote}</p>
            </div>
          )}
        </div>
      </div>

      {/* Модалка: назначить цех */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Назначить цех</h2>

            {!showCreateContractor ? (
              <>
                {contractors.length === 0 ? (
                  <p className="text-sm text-gray-400 mb-3">Цехов пока нет. Создайте первый.</p>
                ) : (
                  <select className="input mb-3" value={assignContractor}
                    onChange={e => setAssignContractor(e.target.value)}>
                    <option value="">— выберите цех —</option>
                    {contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:underline mb-4 block"
                  onClick={() => setShowCreateContractor(true)}
                >
                  + Создать новый цех
                </button>
                <div className="flex gap-3">
                  <button className="btn-primary flex-1" disabled={!assignContractor || assigning}
                    onClick={handleAssignContractor}>
                    {assigning ? 'Сохранение...' : 'Назначить'}
                  </button>
                  <button className="btn-secondary" onClick={() => { setAssignModal(false); setShowCreateContractor(false) }}>Отмена</button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-3">Новый цех будет добавлен в систему</p>
                <form onSubmit={handleCreateContractor} className="space-y-3">
                  <div>
                    <label className="label">Название цеха *</label>
                    <input className="input" placeholder="Цех офсетной печати"
                      value={newContractor.name}
                      onChange={e => setNewContractor(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Email *</label>
                    <input type="email" className="input" placeholder="ceh@rost.ru"
                      value={newContractor.email}
                      onChange={e => setNewContractor(f => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Пароль *</label>
                    <input type="password" className="input" placeholder="Минимум 6 символов"
                      value={newContractor.password}
                      onChange={e => setNewContractor(f => ({ ...f, password: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Telegram (для уведомлений)</label>
                    <input className="input" placeholder="@username или chat_id"
                      value={newContractor.telegram}
                      onChange={e => setNewContractor(f => ({ ...f, telegram: e.target.value }))} />
                  </div>
                  {createContractorError && <div className="text-red-600 text-sm">{createContractorError}</div>}
                  <div className="flex gap-3 pt-1">
                    <button type="submit" className="btn-primary flex-1" disabled={creatingContractor}>
                      {creatingContractor ? 'Создание...' : 'Создать цех'}
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => setShowCreateContractor(false)}>
                      Назад
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Модалка: передать в цех */}
      {sendModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Передать в цех</h2>
            <p className="text-sm text-gray-500 mb-4">Статус изменится на «На расчёте».</p>
            <div className="space-y-4">
              <div>
                <label className="label">Цех *</label>
                <select className="input" value={selectedContractor}
                  onChange={e => setSelectedContractor(e.target.value)}>
                  <option value="">— выберите цех —</option>
                  {contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Сопроводительное сообщение</label>
                <textarea className="input resize-none" rows={4}
                  placeholder="Уточнения, особые пожелания..."
                  value={calcRequest} onChange={e => setCalcRequest(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button className="btn-primary flex-1" disabled={!selectedContractor || sending}
                onClick={handleSendToContractor}>
                {sending ? 'Передаём...' : 'Передать'}
              </button>
              <button className="btn-secondary" onClick={() => setSendModal(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка: ввод расчёта */}
      {responseModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Ввести расчёт</h2>
            <p className="text-sm text-gray-500 mb-4">{order.title}</p>
            <div className="space-y-4">
              <div>
                <label className="label">Стоимость и условия *</label>
                <textarea className="input resize-none" rows={5}
                  placeholder="Стоимость, сроки производства, условия..."
                  value={calcResponse} onChange={e => setCalcResponse(e.target.value)} />
              </div>
              <div>
                <label className="label">Итоговая сумма (₽)</label>
                <input type="number" className="input" placeholder="0"
                  value={responsePrice} onChange={e => setResponsePrice(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button className="btn-primary flex-1" disabled={!calcResponse || responding}
                onClick={handleCalcResponse}>
                {responding ? 'Отправка...' : 'Отправить менеджеру'}
              </button>
              <button className="btn-secondary" onClick={() => setResponseModal(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
