'use client'

import { useState } from 'react'
import PhoneInput from '@/components/ui/PhoneInput'
import InnSearch from '@/components/ui/InnSearch'
import BankSearch from '@/components/ui/BankSearch'

const TYPES = [
  { value: 'INDIVIDUAL',   label: 'Физлицо',  icon: '👤' },
  { value: 'ENTREPRENEUR', label: 'ИП',        icon: '🧑‍💼' },
  { value: 'COMPANY',      label: 'Юрлицо',   icon: '🏢' },
]

const EMPTY = {
  type: 'INDIVIDUAL',
  name: '', phone: '', email: '', contactPerson: '', comment: '',
  inn: '', kpp: '', ogrn: '', ogrnip: '', legalAddress: '', director: '',
  bik: '', bankName: '', bankAccount: '', corrAccount: '',
}

export default function ClientForm({ value, onChange }) {
  const data = value || EMPTY
  const type = data.type || 'INDIVIDUAL'

  function set(field, val) {
    onChange({ ...data, [field]: val })
  }

  function setType(t) {
    // Сбрасываем реквизиты при смене типа
    onChange({ ...EMPTY, type: t, phone: data.phone, email: data.email })
  }

  function handleDadataSelect(s) {
    onChange({
      ...data,
      name:         s.name,
      inn:          s.inn || '',
      kpp:          s.kpp || '',
      ogrn:         s.ogrn || '',
      ogrnip:       s.ogrnip || '',
      legalAddress: s.legalAddress || '',
      director:     s.director || '',
    })
  }

  function handleBankSelect(bank) {
    onChange({
      ...data,
      bik:         bank.bik || '',
      bankName:    bank.bankName || '',
      corrAccount: bank.corrAccount || '',
    })
  }

  const isCompany = type === 'COMPANY'
  const isEntrepreneur = type === 'ENTREPRENEUR'
  const isBusiness = isCompany || isEntrepreneur

  return (
    <div className="space-y-4">
      {/* Тип клиента */}
      <div>
        <label className="label">Тип клиента</label>
        <div className="flex gap-2">
          {TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                type === t.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Поиск по ИНН через DaData (только для ИП и Юрлиц) */}
      {isBusiness && (
        <div>
          <label className="label">
            Поиск по ИНН или названию
            <span className="text-gray-400 font-normal ml-1">(автозаполнение)</span>
          </label>
          <InnSearch clientType={type} onSelect={handleDadataSelect} />
        </div>
      )}

      {/* Название / Имя */}
      <div className={isBusiness ? 'grid grid-cols-2 gap-3' : ''}>
        <div>
          <label className="label">
            {isCompany ? 'Название компании' : isEntrepreneur ? 'ФИО предпринимателя' : 'Имя'} *
          </label>
          <input
            className="input"
            placeholder={
              isCompany ? 'ООО «Пример»' :
              isEntrepreneur ? 'Иванов Иван Иванович' :
              'Иванов Иван'
            }
            value={data.name}
            onChange={e => set('name', e.target.value)}
          />
        </div>

        {/* ИНН — заполняется DaData, но можно вручную */}
        {isBusiness && (
          <div>
            <label className="label">ИНН</label>
            <input
              className="input"
              placeholder={isEntrepreneur ? '12 цифр' : '10 цифр'}
              value={data.inn}
              onChange={e => set('inn', e.target.value)}
              maxLength={12}
            />
          </div>
        )}
      </div>

      {/* Реквизиты юрлица */}
      {isCompany && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">КПП</label>
            <input className="input" placeholder="9 цифр" value={data.kpp}
              onChange={e => set('kpp', e.target.value)} maxLength={9} />
          </div>
          <div>
            <label className="label">ОГРН</label>
            <input className="input" placeholder="13 цифр" value={data.ogrn}
              onChange={e => set('ogrn', e.target.value)} maxLength={13} />
          </div>
          <div className="col-span-2">
            <label className="label">Руководитель</label>
            <input className="input" placeholder="Иванов Иван Иванович, Директор"
              value={data.director} onChange={e => set('director', e.target.value)} />
          </div>
        </div>
      )}

      {/* Реквизиты ИП */}
      {isEntrepreneur && (
        <div>
          <label className="label">ОГРНИП</label>
          <input className="input" placeholder="15 цифр" value={data.ogrnip}
            onChange={e => set('ogrnip', e.target.value)} maxLength={15} />
        </div>
      )}

      {/* Юридический адрес */}
      {isBusiness && (
        <div>
          <label className="label">Юридический адрес</label>
          <input className="input" placeholder="г. Москва, ул. Примерная, д. 1"
            value={data.legalAddress} onChange={e => set('legalAddress', e.target.value)} />
        </div>
      )}

      {/* Контактное лицо (для юрлиц) */}
      {isCompany && (
        <div>
          <label className="label">Контактное лицо</label>
          <input className="input" placeholder="Петрова Мария, менеджер по закупкам"
            value={data.contactPerson} onChange={e => set('contactPerson', e.target.value)} />
        </div>
      )}

      {/* Телефон + Email */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Телефон</label>
          <PhoneInput value={data.phone} onChange={v => set('phone', v)} />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" className="input" placeholder="ivan@example.ru"
            value={data.email} onChange={e => set('email', e.target.value)} />
        </div>
      </div>

      {/* Банковские реквизиты — только для ИП и Юрлиц */}
      {isBusiness && (
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Банковские реквизиты
          </div>
          <div>
            <label className="label">
              Поиск банка по БИК или названию
              <span className="text-gray-400 font-normal ml-1">(автозаполнение)</span>
            </label>
            <BankSearch
              value={{ bik: data.bik, bankName: data.bankName, corrAccount: data.corrAccount }}
              onChange={handleBankSelect}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">БИК</label>
              <input className="input font-mono" placeholder="044525225" value={data.bik}
                onChange={e => set('bik', e.target.value)} maxLength={9} />
            </div>
            <div>
              <label className="label">К/с банка</label>
              <input className="input font-mono" placeholder="30101810400000000225" value={data.corrAccount}
                onChange={e => set('corrAccount', e.target.value)} maxLength={20} />
            </div>
          </div>
          <div>
            <label className="label">Название банка</label>
            <input className="input" placeholder="ПАО Сбербанк" value={data.bankName}
              onChange={e => set('bankName', e.target.value)} />
          </div>
          <div>
            <label className="label">Расчётный счёт</label>
            <input className="input font-mono" placeholder="40702810938000123456" value={data.bankAccount}
              onChange={e => set('bankAccount', e.target.value)} maxLength={20} />
          </div>
        </div>
      )}

      {/* Комментарий */}
      <div>
        <label className="label">Комментарий</label>
        <textarea className="input resize-none" rows={2}
          placeholder="Дополнительная информация..."
          value={data.comment} onChange={e => set('comment', e.target.value)} />
      </div>
    </div>
  )
}
