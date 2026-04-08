const router = require('express').Router()
const { PrismaClient } = require('@prisma/client')
const { requireAuth, requireRole } = require('../middleware/auth')

const prisma = new PrismaClient()

router.use(requireAuth)

// GET /api/clients
router.get('/', async (req, res) => {
  const { search, page = 1, limit = 50 } = req.query
  const skip = (Number(page) - 1) * Number(limit)

  const where = {}
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { email: { contains: search, mode: 'insensitive' } },
      { company: { contains: search, mode: 'insensitive' } },
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
  const { name, phone, email, company, comment } = req.body
  if (!name) return res.status(400).json({ error: 'Имя клиента обязательно' })

  const client = await prisma.client.create({
    data: { name, phone, email, company, comment },
  })
  res.status(201).json(client)
})

// PATCH /api/clients/:id
router.patch('/:id', requireRole('MANAGER', 'ADMIN'), async (req, res) => {
  const { name, phone, email, company, comment } = req.body
  const client = await prisma.client.update({
    where: { id: req.params.id },
    data: { name, phone, email, company, comment },
  })
  res.json(client)
})

module.exports = router
