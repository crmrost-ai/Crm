const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Требуется авторизация' })
  }

  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Пользователь не найден или заблокирован' })
    }
    req.user = user
    next()
  } catch {
    return res.status(401).json({ error: 'Недействительный токен' })
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Недостаточно прав' })
    }
    next()
  }
}

module.exports = { requireAuth, requireRole }
