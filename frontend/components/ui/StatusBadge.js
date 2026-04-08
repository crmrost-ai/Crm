import { ORDER_STATUS } from '@/lib/constants'
import clsx from 'clsx'

const colorMap = {
  blue:   'bg-blue-100 text-blue-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  purple: 'bg-purple-100 text-purple-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  orange: 'bg-orange-100 text-orange-700',
  green:  'bg-green-100 text-green-700',
  teal:   'bg-teal-100 text-teal-700',
  gray:   'bg-gray-100 text-gray-600',
  red:    'bg-red-100 text-red-700',
}

export default function StatusBadge({ status }) {
  const s = ORDER_STATUS[status]
  if (!s) return null
  return (
    <span className={clsx('badge', colorMap[s.color])}>
      {s.label}
    </span>
  )
}
