'use client'

import { useState, useRef, useEffect } from 'react'
import { api } from '@/lib/api'

export default function AddressInput({ value, onChange, placeholder }) {
  const [query, setQuery] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const timer = useRef(null)
  const ref = useRef(null)

  // Sync if parent changes value externally
  useEffect(() => {
    setQuery(value || '')
  }, [value])

  useEffect(() => {
    function handleClick(e) {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleInput(e) {
    const val = e.target.value
    setQuery(val)
    onChange(val)

    clearTimeout(timer.current)
    if (val.length < 3) { setSuggestions([]); setOpen(false); return }

    timer.current = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await api.searchAddress(val)
        setSuggestions(data.suggestions || [])
        setOpen(true)
      } catch {}
      setLoading(false)
    }, 350)
  }

  function select(s) {
    setQuery(s.value)
    onChange(s.value)
    setSuggestions([])
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <input
        className="input pr-8"
        value={query}
        onChange={handleInput}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder || 'Начните вводить адрес...'}
        autoComplete="off"
      />
      {loading && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs animate-pulse">
          ...
        </span>
      )}
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0"
              onMouseDown={() => select(s)}
            >
              <div className="text-gray-800">{s.value}</div>
              {s.postalCode && (
                <div className="text-xs text-gray-400">{s.postalCode}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
