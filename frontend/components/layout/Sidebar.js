'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout, getUser } from '@/lib/auth'
import clsx from 'clsx'

const NAV_MANAGER = [
  { href: '/dashboard',    label: 'Дашборд',          icon: '📊' },
  { href: '/orders',       label: 'Заказы',           icon: '📋' },
  { href: '/orders/new',   label: '+ Новый заказ',    icon: null, accent: true },
  { href: '/clients',      label: 'Клиенты',          icon: '👥' },
  { divider: true },
  { href: '/calculator',   label: 'Калькулятор',      icon: '🧮' },
  { href: '/contractors',  label: 'Цеха',             icon: '🏭' },
  { href: '/products',     label: 'Каталог продукции',icon: '🗂️' },
]

const NAV_CONTRACTOR = [
  { href: '/dashboard',  label: 'Мои задания', icon: '📋' },
]

const NAV_ADMIN = [
  { href: '/dashboard',    label: 'Дашборд',          icon: '📊' },
  { href: '/orders',       label: 'Все заказы',       icon: '📋' },
  { href: '/clients',      label: 'Клиенты',          icon: '👥' },
  { divider: true },
  { href: '/calculator',   label: 'Калькулятор',      icon: '🧮' },
  { href: '/contractors',  label: 'Цеха',             icon: '🏭' },
  { href: '/products',     label: 'Каталог продукции',icon: '🗂️' },
  { divider: true },
  { href: '/admin/users',    label: 'Пользователи',   icon: '👤' },
  { href: '/admin/settings', label: 'Настройки',      icon: '⚙️' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const user = getUser()

  const nav =
    user?.role === 'ADMIN'      ? NAV_ADMIN :
    user?.role === 'CONTRACTOR' ? NAV_CONTRACTOR :
    NAV_MANAGER

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col min-h-screen fixed left-0 top-0">
      {/* Brand */}
      <div className="px-4 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">Т</span>
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm leading-none">Теремка</div>
            <div className="text-xs text-gray-400 mt-0.5">Типография Рост</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map((item, i) => {
          if (item.divider) return (
            <div key={i} className="my-2 border-t border-gray-100" />
          )
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                item.accent
                  ? 'bg-blue-600 text-white hover:bg-blue-700 font-medium mt-2'
                  : pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href) && item.href !== '/orders/new')
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {item.icon && <span>{item.icon}</span>}
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="px-3 py-2 text-xs text-gray-500">
          <div className="font-medium text-gray-700 truncate">{user?.name}</div>
          <div className="truncate">{user?.email}</div>
        </div>
        <button
          onClick={logout}
          className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Выйти
        </button>
      </div>
    </aside>
  )
}
