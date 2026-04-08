const router = require('express').Router()
const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')
const { requireAuth, requireRole } = require('../middleware/auth')

const prisma = new PrismaClient()

router.use(requireAuth)

// GET /api/users/contractors — список подрядчиков (для менеджера, чтобы выбрать цех)
router.get('/contractors', async (req, res) => {
  const contractors = await prisma.user.findMany({
    where: { role: 'CONTRACTOR', isActive: true },
    select: { id: true, name: true, email: true, phone: true, telegram: true },
    orderBy: { name: 'asc' },
  })
  res.json(contractors)
})

// GET /api/users — все пользователи (только admin)
router.get('/', requireRole('ADMIN'), async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, phone: true, telegram: true, isActive: true, createdAt: true },
    orderBy: { name: 'asc' },
  })
  res.json(users)
})

// POST /api/users — создать пользователя (только admin)
router.post('/', requireRole('ADMIN'), async (req, res) => {
  const { name, email, password, role, phone, telegram } = req.body
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Обязательные поля: name, email, password, role' })
  }

  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) return res.status(400).json({ error: 'Email уже занят' })

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role, phone, telegram },
    select: { id: true, name: true, email: true, role: true, phone: true, telegram: true, isActive: true },
  })
  res.status(201).json(user)
})

// PATCH /api/users/:id — обновить пользователя (только admin)
router.patch('/:id', requireRole('ADMIN'), async (req, res) => {
  const { name, phone, telegram, isActive } = req.body
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { name, phone, telegram, isActive },
    select: { id: true, name: true, email: true, role: true, phone: true, telegram: true, isActive: true },
  })
  res.json(user)
})

module.exports = router
