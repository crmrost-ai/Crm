const router = require('express').Router()
const { requireAuth } = require('../middleware/auth')

const DADATA_TOKEN = process.env.DADATA_TOKEN
const DADATA_URL = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs'

router.use(requireAuth)

// GET /api/dadata/party?query=ИНН_или_название&type=COMPANY|ENTREPRENEUR
// Поиск юрлиц и ИП
router.get('/party', async (req, res) => {
  const { query, type } = req.query
  if (!query) return res.status(400).json({ error: 'Укажите query' })

  if (!DADATA_TOKEN) {
    return res.status(503).json({ error: 'DaData API не настроен. Добавьте DADATA_TOKEN в .env' })
  }

  try {
    const body = {
      query,
      count: 7,
    }

    // Фильтр по типу
    if (type === 'ENTREPRENEUR') {
      body.filters = [{ type: 'INDIVIDUAL' }]
    } else if (type === 'COMPANY') {
      body.filters = [{ type: 'LEGAL' }]
    }

    const response = await fetch(`${DADATA_URL}/suggest/party`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Token ${DADATA_TOKEN}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const text = await response.text()
      return res.status(response.status).json({ error: `DaData ошибка: ${text}` })
    }

    const data = await response.json()

    // Нормализуем ответ под наши поля
    const suggestions = (data.suggestions || []).map(s => ({
      value: s.value,
      inn: s.data.inn,
      kpp: s.data.kpp || null,
      ogrn: s.data.ogrn || null,
      ogrnip: s.data.ogrnip || null,
      name: s.data.name?.short_with_opf || s.data.name?.full_with_opf || s.value,
      fullName: s.data.name?.full_with_opf || s.value,
      legalAddress: s.data.address?.value || null,
      director: s.data.management?.name || null,
      directorPost: s.data.management?.post || null,
      type: s.data.type === 'INDIVIDUAL' ? 'ENTREPRENEUR' : 'COMPANY',
      status: s.data.state?.status || null, // ACTIVE / LIQUIDATING / LIQUIDATED
    }))

    res.json({ suggestions })
  } catch (err) {
    console.error('DaData error:', err)
    res.status(500).json({ error: 'Ошибка при обращении к DaData' })
  }
})

module.exports = router
