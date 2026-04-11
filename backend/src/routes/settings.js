const router = require('express').Router()
const { PrismaClient } = require('@prisma/client')
const { requireAuth, requireRole } = require('../middleware/auth')

const prisma = new PrismaClient()

// Ключи настроек компании (типографии — продавца)
const SETTING_KEYS = [
  'companyName', 'companyFullName', 'inn', 'kpp', 'ogrn',
  'legalAddress', 'actualAddress', 'director', 'directorTitle',
  'bik', 'bankName', 'bankAccount', 'corrAccount',
  'phone', 'email', 'website',
  // Конфиги калькулятора (хранятся как JSON-строки)
  'calc_business_cards', 'calc_banners', 'calc_packaging', 'calc_souvenirs',
  // Каталог типов продукции
  'catalog_product_types',
]

router.use(requireAuth)

// GET /api/settings — все настройки как объект
router.get('/', async (req, res) => {
  try {
    const rows = await prisma.settings.findMany()
    const obj = {}
    for (const r of rows) obj[r.key] = r.value
    // Дополняем пустыми значениями для недостающих ключей
    for (const k of SETTING_KEYS) {
      if (!(k in obj)) obj[k] = ''
    }
    res.json(obj)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// PATCH /api/settings — обновить настройки (только admin)
router.patch('/', requireRole('ADMIN'), async (req, res) => {
  try {
    const updates = []
    for (const key of SETTING_KEYS) {
      if (key in req.body) {
        updates.push(
          prisma.settings.upsert({
            where: { key },
            update: { value: String(req.body[key] || '') },
            create: { key, value: String(req.body[key] || '') },
          })
        )
      }
    }
    await Promise.all(updates)

    const rows = await prisma.settings.findMany()
    const obj = {}
    for (const r of rows) obj[r.key] = r.value
    res.json(obj)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router
