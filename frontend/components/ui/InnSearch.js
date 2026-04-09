'use client'

import { useState, useRef, useEffect } from 'react'
import { api } from '@/lib/api'

export default function InnSearch({ clientType, onSelect }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [noKey, setNoKey] = useState(false)
  const timer = useRef(null)
  const ref = useRef(null)

  // Закрываем дропдаун при клике снаружи
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleChange(e) {
    const val = e.target.value
    setQuery(val)
    setOpen(false)
    setSuggestions([])

    clearTimeout(timer.current)
    if (val.length < 2) return

    timer.current = setTimeout(async () => {
      setLoading(true)
      try {
        const result = await api.searchParty(val, clientType)
        setSuggestions(result.suggestions || [])
        setOpen(true)
        setNoKey(false)
      } catch (err) {
        if (err.message?.includes('не настроен')) setNoKey(true)
      } finally {
        setLoading(false)
      }
    }, 350)
  }

  function handleSelect(s) {
    setQuery(s.inn || s.name)
    setOpen(false)
    onSelect(s)
  }

  const statusLabel = {
    ACTIVE: { text: 'Действует', color: 'text-green-600' },
    LIQUIDATING: { text: 'Ликвидируется', color: 'text-yellow-600' },
    LIQUIDATED: { text: 'Ликвидирована', color: 'text-red-500' },
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <input
          className="input pr-8"
          placeholder={clientType === 'ENTREPRENEUR'
            ? 'ИНН или ФИО предпринимателя...'
            : 'ИНН или название компании...'}
          value={query}
          onChange={handleChange}
        />
        {loading && (
          <div className="absolute right-2.5 top-2.5 w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {noKey && (
        <p className="text-xs text-amber-600 mt-1">
          ⚠️ Добавьте DADATA_TOKEN в .env для поиска по ИНН
        </p>
      )}

      {open && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-72 overflow-y-auto">
          {suggestions.map((s, i) => {
            const st = statusLabel[s.status]
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleSelect(s)}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium text-sm text-gray-900 leading-snug">{s.name}</div>
                  {st && <span className={`text-xs shrink-0 ${st.color}`}>{st.text}</span>}
                </div>
                <div className="text-xs text-gray-400 mt-0.5 flex gap-3">
                  <span>ИНН {s.inn}</span>
                  {s.kpp && <span>КПП {s.kpp}</span>}
                  {s.director && <span>{s.director}</span>}
                </div>
                {s.legalAddress && (
                  <div className="text-xs text-gray-400 truncate mt-0.5">{s.legalAddress}</div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {open && suggestions.length === 0 && !loading && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm text-gray-400">
          Ничего не найдено
        </div>
      )}
    </div>
  )
}
