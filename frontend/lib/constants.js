export const ORDER_STATUS = {
  NEW:          { label: 'Новая заявка',       color: 'blue' },
  CALCULATING:  { label: 'На расчёте',         color: 'yellow' },
  CALCULATED:   { label: 'Расчёт получен',     color: 'purple' },
  AGREED:       { label: 'Согласован',         color: 'indigo' },
  IN_PRODUCTION:{ label: 'В производстве',     color: 'orange' },
  READY:        { label: 'Готово',             color: 'green' },
  DELIVERED:    { label: 'Выдано клиенту',     color: 'teal' },
  CLOSED:       { label: 'Закрыт',             color: 'gray' },
  CANCELLED:    { label: 'Отменён',            color: 'red' },
}

export const ORDER_SOURCE = {
  PHONE:     { label: 'Телефон', icon: '📞' },
  WHATSAPP:  { label: 'WhatsApp', icon: '💬' },
  EMAIL:     { label: 'Email', icon: '✉️' },
  WEBSITE:   { label: 'Сайт', icon: '🌐' },
  TELEGRAM:  { label: 'Telegram', icon: '✈️' },
  OTHER:     { label: 'Другое', icon: '📋' },
}

export const PRODUCT_TYPE = {
  BUSINESS_CARDS: { label: 'Визитки / Листовки', icon: '🗂️' },
  BANNERS:        { label: 'Баннеры / Таблички', icon: '🖼️' },
  PACKAGING:      { label: 'Упаковка',           icon: '📦' },
  SOUVENIRS:      { label: 'Сувениры',           icon: '🎁' },
  OTHER:          { label: 'Другое',             icon: '📋' },
}

export const ROLE = {
  MANAGER:    'Менеджер',
  CONTRACTOR: 'Подрядчик',
  ADMIN:      'Администратор',
}

// Статусы доступные менеджеру для ручной смены
export const MANAGER_STATUS_FLOW = {
  NEW:          ['AGREED', 'CANCELLED'],
  CALCULATED:   ['AGREED', 'NEW', 'CANCELLED'],
  AGREED:       ['IN_PRODUCTION', 'CANCELLED'],
  IN_PRODUCTION:['READY', 'AGREED'],
  READY:        ['DELIVERED'],
  DELIVERED:    ['CLOSED'],
}

// Статусы доступные подрядчику
export const CONTRACTOR_STATUS_FLOW = {
  CALCULATING:  ['CALCULATED'],
  AGREED:       ['IN_PRODUCTION'],
  IN_PRODUCTION:['READY'],
}
