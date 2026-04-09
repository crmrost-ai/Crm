const router = require('express').Router()
const { requireAuth } = require('../middleware/auth')

const DADATA_TOKEN = process.env.DADATA_TOKEN
const BASE = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs'
const CLEAN = 'https://cleaner.dadata.ru/api/v1/clean'

function dadataHeaders() {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Token ${DADATA_TOKEN}`,
  }
}

function noKey(res) {
  return res.status(503).json({ error: 'DADATA_TOKEN не настроен в .env' })
}

router.use(requireAuth)

// GET /api/dadata/party?query=&type=
router.get('/party', async (req, res) => {
  if (!DADATA_TOKEN) return noKey(res)
  const { query, type } = req.query
  if (!query) return res.status(400).json({ error: 'Укажите query' })

  const body = { query, count: 7 }
  if (type === 'ENTREPRENEUR') body.filters = [{ type: 'INDIVIDUAL' }]
  else if (type === 'COMPANY')  body.filters = [{ type: 'LEGAL' }]

  try {
    const r = await fetch(`${BASE}/suggest/party`, {
      method: 'POST', headers: dadataHeaders(), body: JSON.stringify(body),
    })
    const data = await r.json()
    const suggestions = (data.suggestions || []).map(s => ({
      value:       s.value,
      inn:         s.data.inn,
      kpp:         s.data.kpp || null,
      ogrn:        s.data.ogrn || null,
      ogrnip:      s.data.ogrnip || null,
      name:        s.data.name?.short_with_opf || s.value,
      fullName:    s.data.name?.full_with_opf || s.value,
      legalAddress:s.data.address?.value || null,
      director:    s.data.management?.name || null,
      directorPost:s.data.management?.post || null,
      type:        s.data.type === 'INDIVIDUAL' ? 'ENTREPRENEUR' : 'COMPANY',
      status:      s.data.state?.status || null,
      okved:       s.data.okved || null,
      okvedName:   s.data.okved_type || null,
      employees:   s.data.employee_count || null,
      registrationDate: s.data.state?.registration_date || null,
    }))
    res.json({ suggestions })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/dadata/party/:inn — детальная проверка по ИНН
router.get('/party/:inn', async (req, res) => {
  if (!DADATA_TOKEN) return noKey(res)
  try {
    const r = await fetch(`${BASE}/findById/party`, {
      method: 'POST',
      headers: dadataHeaders(),
      body: JSON.stringify({ query: req.params.inn, count: 1 }),
    })
    const data = await r.json()
    const s = data.suggestions?.[0]
    if (!s) return res.status(404).json({ error: 'Компания не найдена' })

    res.json({
      inn:          s.data.inn,
      kpp:          s.data.kpp,
      ogrn:         s.data.ogrn,
      ogrnip:       s.data.ogrnip,
      name:         s.data.name?.short_with_opf,
      fullName:     s.data.name?.full_with_opf,
      legalAddress: s.data.address?.value,
      director:     s.data.management?.name,
      directorPost: s.data.management?.post,
      type:         s.data.type === 'INDIVIDUAL' ? 'ENTREPRENEUR' : 'COMPANY',
      status:       s.data.state?.status,
      statusText: {
        ACTIVE:      'Действует',
        LIQUIDATING: 'В процессе ликвидации',
        LIQUIDATED:  'Ликвидирована',
        BANKRUPT:    'Банкрот',
        REORGANIZING:'Реорганизация',
      }[s.data.state?.status] || s.data.state?.status,
      registrationDate: s.data.state?.registration_date,
      liquidationDate:  s.data.state?.liquidation_date,
      okved:       s.data.okved,
      okvedName:   s.data.okved_type,
      employees:   s.data.employee_count,
      capital:     s.data.finance?.tax_system,
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/dadata/address?query=
router.get('/address', async (req, res) => {
  if (!DADATA_TOKEN) return noKey(res)
  const { query } = req.query
  if (!query) return res.status(400).json({ error: 'Укажите query' })

  try {
    const r = await fetch(`${BASE}/suggest/address`, {
      method: 'POST',
      headers: dadataHeaders(),
      body: JSON.stringify({ query, count: 7, language: 'ru' }),
    })
    const data = await r.json()
    const suggestions = (data.suggestions || []).map(s => ({
      value:      s.value,
      postalCode: s.data.postal_code,
      region:     s.data.region_with_type,
      city:       s.data.city_with_type || s.data.settlement_with_type,
      street:     s.data.street_with_type,
      house:      s.data.house,
      flat:       s.data.flat,
      lat:        s.data.geo_lat,
      lon:        s.data.geo_lon,
      fiasLevel:  s.data.fias_level, // 8 = дом, 7 = улица
    }))
    res.json({ suggestions })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/dadata/bank?query= — поиск банка по БИК/названию
router.get('/bank', async (req, res) => {
  if (!DADATA_TOKEN) return noKey(res)
  const { query } = req.query
  if (!query) return res.status(400).json({ error: 'Укажите query' })

  try {
    const r = await fetch(`${BASE}/suggest/bank`, {
      method: 'POST',
      headers: dadataHeaders(),
      body: JSON.stringify({ query, count: 5 }),
    })
    const data = await r.json()
    const suggestions = (data.suggestions || []).map(s => ({
      bik:         s.data.bic,
      name:        s.data.name?.short || s.data.name?.payment || s.value,
      fullName:    s.data.name?.full,
      corrAccount: s.data.correspondent_account,
      address:     s.data.address?.value,
      swift:       s.data.swift,
      status:      s.data.state?.status,
    }))
    res.json({ suggestions })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router
