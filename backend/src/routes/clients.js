const router = require('express').Router()
const { PrismaClient } = require('@prisma/client')
const { requireAuth, requireRole } = require('../middleware/auth')

const prisma = new PrismaClient()

router.use(requireAuth)

// GET /api/clients
router.get('/', async (req, res) => {
  const { search, type, page = 1, limit = 50 } = req.query
  const skip = (Number(page) - 1) * Number(limit)

  const where = {}
  if (type) where.type = type
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { email: { contains: search, mode: 'insensitive' } },
      { contactPerson: { contains: search, mode: 'insensitive' } },
      { inn: { contains: search } },
    ]
  }

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where, skip, take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { orders: true } } },
    }),
    prisma.client.count({ where }),
  ])

  res.json({ clients, total })
})

// GET /api/clients/:id
router.get('/:id', async (req, res) => {
  const client = await prisma.client.findUnique({
    where: { id: req.params.id },
    include: {
      orders: {
        orderBy: { createdAt: 'desc' },
        include: { manager: { select: { id: true, name: true } } },
      },
    },
  })
  if (!client) return res.status(404).json({ error: 'Клиент не найден' })
  res.json(client)
})

// POST /api/clients
router.post('/', requireRole('MANAGER', 'ADMIN'), async (req, res) => {
  const {
    type = 'INDIVIDUAL',
    name, phone, email, contactPerson, comment,
    inn, kpp, ogrn, ogrnip, legalAddress, director,
    bik, bankName, bankAccount, corrAccount,
  } = req.body

  if (!name) return res.status(400).json({ error: 'Имя / название обязательно' })

  const client = await prisma.client.create({
    data: {
      type, name, phone, email, contactPerson, comment,
      inn, kpp, ogrn, ogrnip, legalAddress, director,
      bik, bankName, bankAccount, corrAccount,
    },
  })
  res.status(201).json(client)
})

// PATCH /api/clients/:id
router.patch('/:id', requireRole('MANAGER', 'ADMIN'), async (req, res) => {
  const {
    name, phone, email, contactPerson, comment,
    inn, kpp, ogrn, ogrnip, legalAddress, director, type,
    bik, bankName, bankAccount, corrAccount,
  } = req.body

  const client = await prisma.client.update({
    where: { id: req.params.id },
    data: {
      name, phone, email, contactPerson, comment,
      inn, kpp, ogrn, ogrnip, legalAddress, director, type,
      bik, bankName, bankAccount, corrAccount,
    },
  })
  res.json(client)
})

// DELETE /api/clients/:id
router.delete('/:id', requireRole('MANAGER', 'ADMIN'), async (req, res) => {
  const orders = await prisma.order.count({ where: { clientId: req.params.id } })
  if (orders > 0) {
    return res.status(400).json({
      error: `Нельзя удалить клиента — у него ${orders} заказ(ов). Сначала удалите или перепривяжите заказы.`
    })
  }
  await prisma.client.delete({ where: { id: req.params.id } })
  res.json({ ok: true })
})

module.exports = router
