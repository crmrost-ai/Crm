'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export default function InvoicePage({ params }) {
  const [order, setOrder] = useState(null)
  const [company, setCompany] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.getOrder(params.id), api.getSettings()])
      .then(([o, s]) => { setOrder(o); setCompany(s) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [params.id])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen text-gray-400">Загрузка...</div>
  )
  if (error) return (
    <div className="flex items-center justify-center min-h-screen text-red-500">{error}</div>
  )
  if (!order) return null

  const client = order.client || {}
  const invoiceDate = format(new Date(), 'd MMMM yyyy', { locale: ru })
  const invoiceNum = `${order.number}`
  const amount = order.finalPrice || order.estimatedPrice || 0

  // НДС не применяется — упрощённая система
  const isNDS = false

  return (
    <>
      {/* Кнопка печати — скрыта при печати */}
      <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg hover:bg-blue-700"
        >
          Распечатать / Сохранить PDF
        </button>
        <button
          onClick={() => window.close()}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium shadow-lg hover:bg-gray-200"
        >
          Закрыть
        </button>
      </div>

      <div className="invoice-page">

        {/* Банк продавца */}
        {(company.bankName || company.bik) && (
          <table className="bank-table">
            <tbody>
              <tr>
                <td className="bank-label">Банк получателя</td>
                <td className="bank-value">{company.bankName || '—'}</td>
                <td className="bank-label">БИК</td>
                <td className="bank-value mono">{company.bik || '—'}</td>
              </tr>
              <tr>
                <td className="bank-label">ИНН</td>
                <td className="bank-value mono">{company.inn || '—'}</td>
                <td className="bank-label">Сч. №</td>
                <td className="bank-value mono">{company.corrAccount || '—'}</td>
              </tr>
              <tr>
                <td className="bank-label">КПП</td>
                <td className="bank-value mono">{company.kpp || '—'}</td>
                <td className="bank-label">Сч. №</td>
                <td className="bank-value mono">{company.bankAccount || '—'}</td>
              </tr>
            </tbody>
          </table>
        )}

        {/* Заголовок счёта */}
        <div className="invoice-title">
          Счёт на оплату № {invoiceNum} от {invoiceDate} г.
        </div>

        {/* Поставщик и покупатель */}
        <table className="parties-table">
          <tbody>
            <tr>
              <td className="party-label">Поставщик:</td>
              <td className="party-value">
                <strong>{company.companyFullName || company.companyName || '—'}</strong>
                {company.inn && <>, ИНН {company.inn}</>}
                {company.kpp && <>, КПП {company.kpp}</>}
                {company.legalAddress && <>, {company.legalAddress}</>}
                {company.phone && <>, тел. {company.phone}</>}
              </td>
            </tr>
            <tr>
              <td className="party-label">Покупатель:</td>
              <td className="party-value">
                <strong>
                  {client.type === 'INDIVIDUAL'
                    ? client.name
                    : (client.fullName || client.name || '—')}
                </strong>
                {client.inn && <>, ИНН {client.inn}</>}
                {client.kpp && <>, КПП {client.kpp}</>}
                {client.legalAddress && <>, {client.legalAddress}</>}
                {client.phone && <>, тел. {client.phone}</>}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Таблица товаров/услуг */}
        <table className="items-table">
          <thead>
            <tr>
              <th className="col-num">№</th>
              <th className="col-name">Наименование товара (работ, услуг)</th>
              <th className="col-qty">Кол-во</th>
              <th className="col-unit">Ед.</th>
              <th className="col-price">Цена</th>
              <th className="col-sum">Сумма</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="col-num center">1</td>
              <td className="col-name">
                {order.title}
                {order.description && (
                  <div className="item-desc">{order.description}</div>
                )}
              </td>
              <td className="col-qty center">1</td>
              <td className="col-unit center">шт.</td>
              <td className="col-price right">{amount ? amount.toLocaleString('ru') : '—'}</td>
              <td className="col-sum right">{amount ? amount.toLocaleString('ru') : '—'}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} />
              <td className="total-label">Итого:</td>
              <td className="total-value right">{amount ? amount.toLocaleString('ru') : '—'}</td>
            </tr>
            <tr>
              <td colSpan={4} />
              <td className="total-label">НДС:</td>
              <td className="total-value right">Без НДС</td>
            </tr>
            <tr>
              <td colSpan={4} />
              <td className="total-label grand">Всего к оплате:</td>
              <td className="total-value right grand">{amount ? amount.toLocaleString('ru') : '—'}</td>
            </tr>
          </tfoot>
        </table>

        {/* Сумма прописью */}
        <div className="amount-words">
          Всего наименований 1, на сумму{' '}
          <strong>{amount ? amount.toLocaleString('ru') : '0'} руб.</strong>
        </div>

        {/* Подписи */}
        <div className="signatures">
          <div className="sig-block">
            <span className="sig-label">Руководитель:</span>
            <span className="sig-line" />
            <span className="sig-name">
              {company.director ? `/ ${company.director} /` : '/ _________________ /'}
            </span>
          </div>
          <div className="sig-block">
            <span className="sig-label">Гл. бухгалтер:</span>
            <span className="sig-line" />
            <span className="sig-name">/ _________________ /</span>
          </div>
        </div>

        <div className="invoice-footer">
          Счёт действителен в течение 5 банковских дней.
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }

        .invoice-page {
          max-width: 800px;
          margin: 40px auto;
          padding: 24px 32px;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 13px;
          color: #000;
          background: #fff;
        }

        .bank-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
          border: 1px solid #000;
        }
        .bank-table td {
          padding: 4px 8px;
          border: 1px solid #aaa;
        }
        .bank-label {
          background: #f5f5f5;
          font-size: 11px;
          color: #555;
          white-space: nowrap;
          width: 120px;
        }
        .bank-value {
          font-size: 12px;
        }
        .mono { font-family: 'Courier New', monospace; }

        .invoice-title {
          font-size: 17px;
          font-weight: bold;
          text-align: center;
          margin: 20px 0 16px;
          border-top: 2px solid #000;
          border-bottom: 2px solid #000;
          padding: 8px 0;
        }

        .parties-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
          border: 1px solid #aaa;
        }
        .party-label {
          background: #f5f5f5;
          font-size: 11px;
          color: #555;
          white-space: nowrap;
          padding: 6px 8px;
          width: 90px;
          vertical-align: top;
          border: 1px solid #aaa;
        }
        .party-value {
          padding: 6px 8px;
          font-size: 12px;
          border: 1px solid #aaa;
          line-height: 1.5;
        }

        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
        }
        .items-table th, .items-table td {
          border: 1px solid #000;
          padding: 5px 7px;
          font-size: 12px;
        }
        .items-table th {
          background: #f0f0f0;
          font-weight: bold;
          text-align: center;
        }
        .col-num  { width: 30px; }
        .col-qty  { width: 50px; }
        .col-unit { width: 40px; }
        .col-price{ width: 90px; }
        .col-sum  { width: 90px; }
        .center { text-align: center; }
        .right  { text-align: right; }
        .item-desc { font-size: 11px; color: #555; margin-top: 3px; }

        .total-label {
          text-align: right;
          padding: 4px 7px;
          font-size: 12px;
          border: 1px solid #aaa;
          background: #f9f9f9;
        }
        .total-value {
          border: 1px solid #aaa;
          padding: 4px 7px;
          font-size: 12px;
        }
        .grand {
          font-weight: bold;
          font-size: 13px !important;
        }

        .amount-words {
          font-size: 12px;
          margin: 8px 0 20px;
          padding: 6px;
          background: #f9f9f9;
          border: 1px solid #ddd;
        }

        .signatures {
          display: flex;
          gap: 40px;
          margin-top: 24px;
          margin-bottom: 16px;
        }
        .sig-block {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }
        .sig-label { font-size: 12px; white-space: nowrap; }
        .sig-line  {
          flex: 1;
          border-bottom: 1px solid #000;
          height: 20px;
          min-width: 60px;
        }
        .sig-name  { font-size: 12px; white-space: nowrap; }

        .invoice-footer {
          font-size: 11px;
          color: #888;
          text-align: center;
          margin-top: 12px;
          border-top: 1px solid #eee;
          padding-top: 8px;
        }
      `}</style>
    </>
  )
}
