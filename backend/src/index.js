const express = require('express')
const cors = require('cors')

const authRoutes = require('./routes/auth')
const ordersRoutes = require('./routes/orders')
const clientsRoutes = require('./routes/clients')
const usersRoutes = require('./routes/users')

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/orders', ordersRoutes)
app.use('/api/clients', clientsRoutes)
app.use('/api/users', usersRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Теремка CRM', time: new Date() })
})

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Внутренняя ошибка сервера' })
})

app.listen(PORT, () => {
  console.log(`✅ Теремка API запущена на порту ${PORT}`)
})
