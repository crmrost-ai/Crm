/**
 * Форматирует телефон в +7 (XXX) XXX-XX-XX
 * Принимает любой ввод: 8, +7, 9, просто цифры
 */
export function formatPhone(raw) {
  // Оставляем только цифры
  let digits = raw.replace(/\D/g, '')

  // Нормализуем начало: 8XXX → 7XXX, +7XXX → 7XXX
  if (digits.startsWith('8')) digits = '7' + digits.slice(1)
  if (digits.startsWith('7')) digits = digits
  else if (digits.length > 0) digits = '7' + digits

  // Обрезаем до 11 цифр
  digits = digits.slice(0, 11)

  // Форматируем
  const d = digits.slice(1) // убираем 7 в начале
  let result = '+7'
  if (d.length > 0) result += ' (' + d.slice(0, 3)
  if (d.length >= 3) result += ') ' + d.slice(3, 6)
  if (d.length >= 6) result += '-' + d.slice(6, 8)
  if (d.length >= 8) result += '-' + d.slice(8, 10)

  return result
}

/**
 * Проверяет что телефон полный (11 цифр)
 */
export function isPhoneComplete(formatted) {
  return formatted.replace(/\D/g, '').length === 11
}
