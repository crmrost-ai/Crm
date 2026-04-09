const TOKEN = process.env.TELEGRAM_BOT_TOKEN

/**
 * Отправить сообщение в Telegram.
 * chatId — числовой ID чата или @username (если бот может писать в канал/группу).
 * Чтобы получить свой chat_id: написать боту /start, затем открыть
 * https://api.telegram.org/bot{TOKEN}/getUpdates
 */
async function sendMessage(chatId, text) {
  if (!TOKEN || !chatId) return
  try {
    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    })
  } catch (e) {
    console.warn('[Telegram] Не удалось отправить сообщение:', e.message)
  }
}

/**
 * Уведомить подрядчика о новом задании.
 */
async function notifyContractorNewJob(contractor, order) {
  if (!contractor?.telegram) return
  const text =
    `📋 <b>Новое задание</b>\n` +
    `Заказ #${order.number}: ${order.title}\n` +
    `\n` +
    (order.calcRequest ? `<i>${order.calcRequest}</i>\n\n` : '') +
    `Войдите в систему, чтобы ввести расчёт.`
  await sendMessage(contractor.telegram, text)
}

/**
 * Уведомить менеджера о поступившем расчёте от цеха.
 */
async function notifyManagerCalcReceived(manager, order, contractor) {
  if (!manager?.telegram) return
  const text =
    `✅ <b>Расчёт получен</b>\n` +
    `Заказ #${order.number}: ${order.title}\n` +
    `Цех: ${contractor?.name || '—'}\n` +
    (order.estimatedPrice ? `Сумма: ${order.estimatedPrice.toLocaleString('ru')} ₽\n` : '') +
    `\n` +
    (order.calcResponse ? `<i>${order.calcResponse}</i>` : '')
  await sendMessage(manager.telegram, text)
}

/**
 * Уведомить менеджера о смене статуса заказа подрядчиком.
 */
async function notifyManagerStatusChange(manager, order, newStatus, contractor) {
  if (!manager?.telegram) return
  const STATUS_TEXT = {
    IN_PRODUCTION: 'В производстве',
    READY: 'Готово к выдаче',
    DELIVERED: 'Выдано клиенту',
  }
  const label = STATUS_TEXT[newStatus]
  if (!label) return
  const text =
    `🔔 <b>${label}</b>\n` +
    `Заказ #${order.number}: ${order.title}\n` +
    (contractor ? `Цех: ${contractor.name}` : '')
  await sendMessage(manager.telegram, text)
}

module.exports = { sendMessage, notifyContractorNewJob, notifyManagerCalcReceived, notifyManagerStatusChange }
