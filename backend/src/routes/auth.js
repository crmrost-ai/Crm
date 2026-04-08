const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')
const { requireAuth } = require('../middleware/auth')

const prisma = new PrismaClient()

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Введите email и пароль' })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.isActive) {
    return res.status(401).json({ error: 'Неверный email или пароль' })
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return res.status(401).json({ error: 'Неверный email или пароль' })
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  })
})

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const { id, name, email, role, phone, telegram } = req.user
  res.json({ id, name, email, role, phone, telegram })
})

module.exports = router
