'use client'

const PRESETS = [
  { label: '3 дня',   days: 3 },
  { label: '7 дней',  days: 7 },
  { label: '14 дней', days: 14 },
  { label: '1 месяц', days: 30 },
]

function addDays(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0] // YYYY-MM-DD
}

export default function DateQuickPick({ value, onChange, label = 'Срок выполнения' }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type="date"
        className="input"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      {/* Быстрый выбор */}
      <div className="flex gap-1.5 mt-1.5 flex-wrap">
        {PRESETS.map(p => (
          <button
            key={p.days}
            type="button"
            onClick={() => onChange(addDays(p.days))}
            className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          >
            +{p.label}
          </button>
        ))}
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
          >
            ✕ сбросить
          </button>
        )}
      </div>
    </div>
  )
}
