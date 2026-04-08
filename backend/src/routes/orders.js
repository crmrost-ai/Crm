const router = require('express').Router()
const { PrismaClient } = require('@prisma/client')
const { requireAuth, requireRole } = require('../middleware/auth')

const prisma = new PrismaClient()

// Все маршруты требуют авторизации
router.use(requireAuth)

// GET /api/orders — список заказов
router.get('/', async (req, res) => {
  const { status, productType, source, contractorId, search, page = 1, limit = 20 } = req.query
  const skip = (Number(page) - 1) * Number(limit)

  const where = {}

  // Менеджер видит только свои заказы, подрядчик — только свои
  if (req.user.role === 'MANAGER') {
    where.managerId = req.user.id
  } else if (req.user.role === 'CONTRACTOR') {
    where.contractorId = req.user.id
  }

  if (status) where.status = status
  if (productType) where.productType = productType
  if (source) where.source = source
  if (contractorId) where.contractorId = contractorId

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { client: { name: { contains: search, mode: 'insensitive' } } },
      { client: { phone: { contains: search } } },
    ]
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { id: true, name: true, phone: true, company: true } },
        manager: { select: { id: true, name: true } },
        contractor: { select: { id: true, name: true } },
      },
    }),
    prisma.order.count({ where }),
  ])

  res.json({ orders, total, page: Number(page), limit: Number(limit) })
})

// GET /api/orders/:id — детали заказа
router.get('/:id', async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      client: true,
      manager: { select: { id: true, name: true, email: true, phone: true } },
      contractor: { select: { id: true, name: true, email: true, phone: true, telegram: true } },
      statusHistory: {
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, role: true } } },
      },
    },
  })

  if (!order) return res.status(404).json({ error: 'Заказ не найден' })

  // Проверка доступа
  if (req.user.role === 'MANAGER' && order.managerId !== req.user.id) {
    return res.status(403).json({ error: 'Нет доступа к этому заказу' })
  }
  if (req.user.role === 'CONTRACTOR' && order.contractorId !== req.user.id) {
    return res.status(403).json({ error: 'Нет доступа к этому заказу' })
  }

  res.json(order)
})

// POST /api/orders — создать заказ
router.post('/', requireRole('MANAGER', 'ADMIN'), async (req, res) => {
  const {
    source, productType, title, params, description, deadline,
    clientId, estimatedPrice, managerNote,
  } = req.body

  if (!source || !productType || !title || !clientId) {
    return res.status(400).json({ error: 'Обязательные поля: source, productType, title, clientId' })
  }

  const client = await prisma.client.findUnique({ where: { id: clientId } })
  if (!client) return res.status(404).json({ error: 'Клиент не найден' })

  const order = await prisma.order.create({
    data: {
      source,
      productType,
      title,
      params: params || {},
      description,
      deadline: deadline ? new Date(deadline) : null,
      clientId,
      managerId: req.user.id,
      estimatedPrice: estimatedPrice ? Number(estimatedPrice) : null,
      managerNote,
    },
    include: {
      client: true,
      manager: { select: { id: true, name: true } },
    },
  })

  // Записываем в историю
  await prisma.orderStatus_History.create({
    data: {
      orderId: order.id,
      status: 'NEW',
      comment: 'Заказ создан',
      userId: req.user.id,
    },
  })

  res.status(201).json(order)
})

// PATCH /api/orders/:id — обновить заказ
router.patch('/:id', async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } })
  if (!order) return res.status(404).json({ error: 'Заказ не найден' })

  if (req.user.role === 'MANAGER' && order.managerId !== req.user.id) {
    return res.status(403).json({ error: 'Нет доступа' })
  }

  const allowed = [
    'title', 'params', 'description', 'deadline', 'estimatedPrice',
    'finalPrice', 'managerNote', 'files',
  ]
  const data = {}
  for (const key of allowed) {
    if (req.body[key] !== undefined) data[key] = req.body[key]
  }

  if (req.body.deadline) data.deadline = new Date(req.body.deadline)

  const updated = await prisma.order.update({
    where: { id: req.params.id },
    data,
    include: {
      client: true,
      manager: { select: { id: true, name: true } },
      contractor: { select: { id: true, name: true } },
    },
  })

  res.json(updated)
})

// POST /api/orders/:id/status — сменить статус
router.post('/:id/status', async (req, res) => {
  const { status, comment } = req.body
  if (!status) return res.status(400).json({ error: 'Укажите status' })

  const order = await prisma.order.findUnique({ where: { id: req.params.id } })
  if (!order) return res.status(404).json({ error: 'Заказ не найден' })

  if (req.user.role === 'MANAGER' && order.managerId !== req.user.id) {
    return res.status(403).json({ error: 'Нет доступа' })
  }
  if (req.user.role === 'CONTRACTOR' && order.contractorId !== req.user.id) {
    return res.status(403).json({ error: 'Нет доступа' })
  }

  const [updated] = await prisma.$transaction([
    prisma.order.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        client: true,
        manager: { select: { id: true, name: true } },
        contractor: { select: { id: true, name: true } },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { user: { select: { id: true, name: true, role: true } } },
        },
      },
    }),
    prisma.orderStatus_History.create({
      data: { orderId: req.params.id, status, comment, userId: req.user.id },
    }),
  ])

  res.json(updated)
})

// POST /api/orders/:id/send-to-contractor — отправить на расчёт подрядчику
router.post('/:id/send-to-contractor', requireRole('MANAGER', 'ADMIN'), async (req, res) => {
  const { contractorId, calcRequest } = req.body
  if (!contractorId) return res.status(400).json({ error: 'Укажите contractorId' })

  const order = await prisma.order.findUnique({ where: { id: req.params.id } })
  if (!order) return res.status(404).json({ error: 'Заказ не найден' })

  if (req.user.role === 'MANAGER' && order.managerId !== req.user.id) {
    return res.status(403).json({ error: 'Нет доступа' })
  }

  const contractor = await prisma.user.findUnique({ where: { id: contractorId } })
  if (!contractor || contractor.role !== 'CONTRACTOR') {
    return res.status(404).json({ error: 'Подрядчик не найден' })
  }

  const [updated] = await prisma.$transaction([
    prisma.order.update({
      where: { id: req.params.id },
      data: {
        contractorId,
        calcRequest: calcRequest || null,
        calcRequestedAt: new Date(),
        status: 'CALCULATING',
      },
      include: {
        client: true,
        manager: { select: { id: true, name: true } },
        contractor: { select: { id: true, name: true } },
      },
    }),
    prisma.orderStatus_History.create({
      data: {
        orderId: req.params.id,
        status: 'CALCULATING',
        comment: `Отправлен на расчёт подрядчику: ${contractor.name}`,
        userId: req.user.id,
      },
    }),
  ])

  res.json(updated)
})

// POST /api/orders/:id/calc-response — подрядчик отвечает с расчётом
router.post('/:id/calc-response', requireRole('CONTRACTOR', 'ADMIN'), async (req, res) => {
  const { calcResponse, estimatedPrice } = req.body
  if (!calcResponse) return res.status(400).json({ error: 'Укажите calcResponse' })

  const order = await prisma.order.findUnique({ where: { id: req.params.id } })
  if (!order) return res.status(404).json({ error: 'Заказ не найден' })

  if (req.user.role === 'CONTRACTOR' && order.contractorId !== req.user.id) {
    return res.status(403).json({ error: 'Нет доступа' })
  }

  const [updated] = await prisma.$transaction([
    prisma.order.update({
      where: { id: req.params.id },
      data: {
        calcResponse,
        calcRespondedAt: new Date(),
        status: 'CALCULATED',
        estimatedPrice: estimatedPrice ? Number(estimatedPrice) : undefined,
      },
      include: {
        client: true,
        manager: { select: { id: true, name: true } },
        contractor: { select: { id: true, name: true } },
      },
    }),
    prisma.orderStatus_History.create({
      data: {
        orderId: req.params.id,
        status: 'CALCULATED',
        comment: `Расчёт получен от подрядчика`,
        userId: req.user.id,
      },
    }),
  ])

  res.json(updated)
})

module.exports = router
