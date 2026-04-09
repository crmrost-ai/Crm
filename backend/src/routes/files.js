const router = require('express').Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { PrismaClient } = require('@prisma/client')
const { requireAuth, requireRole } = require('../middleware/auth')

const prisma = new PrismaClient()

const UPLOAD_DIR = path.join(__dirname, '../../uploads')

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const timestamp = Date.now()
    const safe = file.originalname.replace(/[^\w.\-]/g, '_')
    cb(null, `${timestamp}_${safe}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 МБ
  fileFilter: (req, file, cb) => {
    // Разрешаем: изображения, PDF, AI, CDR, PSD, ZIP, документы
    const allowed = /\.(jpg|jpeg|png|gif|webp|pdf|ai|cdr|psd|eps|zip|rar|doc|docx|xls|xlsx|tiff|tif|svg)$/i
    if (allowed.test(file.originalname)) {
      cb(null, true)
    } else {
      cb(new Error('Недопустимый тип файла'))
    }
  },
})

router.use(requireAuth)

// POST /api/orders/:id/files — загрузить файл к заказу
router.post('/:id/files', requireRole('MANAGER', 'ADMIN', 'CONTRACTOR'), upload.single('file'), async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } })
    if (!order) return res.status(404).json({ error: 'Заказ не найден' })

    const existing = Array.isArray(order.files) ? order.files : []
    const newFile = {
      name: req.file.originalname,
      filename: req.file.filename,
      url: `/api/files/${req.file.filename}`,
      size: req.file.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: req.user.id,
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { files: [...existing, newFile] },
    })

    res.json(newFile)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// DELETE /api/orders/:id/files/:filename — удалить файл
router.delete('/:id/files/:filename', requireRole('MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } })
    if (!order) return res.status(404).json({ error: 'Заказ не найден' })

    const existing = Array.isArray(order.files) ? order.files : []
    const toDelete = existing.find(f => f.filename === req.params.filename)

    if (toDelete) {
      const filePath = path.join(UPLOAD_DIR, toDelete.filename)
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { files: existing.filter(f => f.filename !== req.params.filename) },
    })

    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router
