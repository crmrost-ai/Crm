'use client'

import { useState } from 'react'
import { formatPhone } from '@/lib/phone'

export default function PhoneInput({ value, onChange, className = '', placeholder = '+7 (___) ___-__-__', ...props }) {
  function handleChange(e) {
    const raw = e.target.value
    // Если пользователь удаляет — позволяем удалять свободно
    if (raw.length < (value || '').length) {
      onChange(raw)
      return
    }
    const formatted = formatPhone(raw)
    onChange(formatted)
  }

  return (
    <input
      type="tel"
      className={className || 'input'}
      placeholder={placeholder}
      value={value || ''}
      onChange={handleChange}
      {...props}
    />
  )
}
