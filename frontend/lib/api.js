const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('teremka_token')
}

async function request(path, options = {}) {
  const token = getToken()
  const res = await fetch(`${BASE_URL}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (res.status === 401) {
    localStorage.removeItem('teremka_token')
    localStorage.removeItem('teremka_user')
    window.location.href = '/login'
    return
  }

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Ошибка запроса')
  return data
}

export const api = {
  // Auth
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => request('/auth/me'),

  // Orders
  getOrders: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request(`/orders?${q}`)
  },
  getOrder: (id) => request(`/orders/${id}`),
  createOrder: (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateOrder: (id, data) => request(`/orders/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  changeStatus: (id, status, comment) =>
    request(`/orders/${id}/status`, { method: 'POST', body: JSON.stringify({ status, comment }) }),
  sendToContractor: (id, contractorId, calcRequest) =>
    request(`/orders/${id}/send-to-contractor`, {
      method: 'POST',
      body: JSON.stringify({ contractorId, calcRequest }),
    }),
  submitCalcResponse: (id, calcResponse, estimatedPrice) =>
    request(`/orders/${id}/calc-response`, {
      method: 'POST',
      body: JSON.stringify({ calcResponse, estimatedPrice }),
    }),

  // Clients
  getClients: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request(`/clients?${q}`)
  },
  getClient: (id) => request(`/clients/${id}`),
  createClient: (data) => request('/clients', { method: 'POST', body: JSON.stringify(data) }),
  updateClient: (id, data) => request(`/clients/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteClient: (id) => request(`/clients/${id}`, { method: 'DELETE' }),

  // DaData
  searchParty: (query, type) => {
    const q = new URLSearchParams({ query, ...(type ? { type } : {}) }).toString()
    return request(`/dadata/party?${q}`)
  },
  getPartyByInn: (inn) => request(`/dadata/party/${inn}`),
  searchAddress: (query) => {
    const q = new URLSearchParams({ query }).toString()
    return request(`/dadata/address?${q}`)
  },
  searchBank: (query) => {
    const q = new URLSearchParams({ query }).toString()
    return request(`/dadata/bank?${q}`)
  },

  // Files
  uploadFile: (orderId, file) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('teremka_token') : null
    const formData = new FormData()
    formData.append('file', file)
    return fetch(`${BASE_URL}/api/orders/${orderId}/files`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(async r => {
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Ошибка загрузки')
      return data
    })
  },
  deleteFile: (orderId, filename) =>
    request(`/orders/${orderId}/files/${encodeURIComponent(filename)}`, { method: 'DELETE' }),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'PATCH', body: JSON.stringify(data) }),

  // Users
  getContractors: () => request('/users/contractors'),
  getUsers: () => request('/users'),
  createUser: (data) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
}
