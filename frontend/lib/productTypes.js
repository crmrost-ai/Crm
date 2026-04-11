'use client'

import { useState, useEffect } from 'react'
import { PRODUCT_TYPE as DEFAULTS } from './constants'
import { api } from './api'

// Модульный кеш — загружается один раз за сессию
let _cache = null

export function clearProductTypesCache() {
  _cache = null
}

async function fetchProductTypes() {
  if (_cache) return _cache
  try {
    const settings = await api.getSettings()
    if (settings.catalog_product_types) {
      const arr = JSON.parse(settings.catalog_product_types)
      const result = {}
      for (const item of arr) {
        result[item.key] = { label: item.label, icon: item.icon, active: item.active !== false }
      }
      _cache = result
      return result
    }
  } catch {}
  // Fallback: дефолтные значения + active: true
  _cache = Object.fromEntries(
    Object.entries(DEFAULTS).map(([k, v]) => [k, { ...v, active: true }])
  )
  return _cache
}

// Хук для форм — возвращает только активные типы, с дефолтом пока грузится
export function useProductTypes() {
  const [types, setTypes] = useState(DEFAULTS)
  useEffect(() => {
    fetchProductTypes().then(all => {
      const active = {}
      for (const [k, v] of Object.entries(all)) {
        if (v.active !== false) active[k] = { label: v.label, icon: v.icon }
      }
      setTypes(active)
    })
  }, [])
  return types
}

// Хук для admin/catalog — возвращает все типы включая неактивные
export function useAllProductTypes() {
  const [types, setTypes] = useState(
    Object.entries(DEFAULTS).map(([key, v]) => ({ key, ...v, active: true }))
  )
  useEffect(() => {
    fetchProductTypes().then(all => {
      setTypes(Object.entries(all).map(([key, v]) => ({ key, ...v })))
    })
  }, [])
  return types
}
