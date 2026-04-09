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

  // DaData
  searchParty: (query, type) => {
    const q = new URLSearchParams({ query, ...(type ? { type } : {}) }).toString()
    return request(`/dadata/party?${q}`)
  },

  // Users
  getContractors: () => request('/users/contractors'),
  getUsers: () => request('/users'),
  createUser: (data) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
}
