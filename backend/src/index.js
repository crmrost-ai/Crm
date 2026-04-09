const express = require('express')
const cors = require('cors')
const path = require('path')

const authRoutes = require('./routes/auth')
const ordersRoutes = require('./routes/orders')
const filesRoutes = require('./routes/files')
const clientsRoutes = require('./routes/clients')
const usersRoutes = require('./routes/users')
const dadataRoutes = require('./routes/dadata')
const settingsRoutes = require('./routes/settings')

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json())

// Статические файлы (загруженные к заказам)
app.use('/api/files', express.static(path.join(__dirname, '../uploads')))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/orders', ordersRoutes)
app.use('/api/orders', filesRoutes)
app.use('/api/clients', clientsRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/dadata', dadataRoutes)
app.use('/api/settings', settingsRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Теремка CRM', time: new Date() })
})

// Multer errors
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Файл слишком большой (максимум 50 МБ)' })
  }
  if (err.message === 'Недопустимый тип файла') {
    return res.status(400).json({ error: err.message })
  }
  console.error(err.stack)
  res.status(500).json({ error: 'Внутренняя ошибка сервера' })
})

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' })
})

app.listen(PORT, () => {
  console.log(`✅ Теремка API запущена на порту ${PORT}`)
})
