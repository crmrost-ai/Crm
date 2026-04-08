'use client'

export function saveAuth(token, user) {
  localStorage.setItem('teremka_token', token)
  localStorage.setItem('teremka_user', JSON.stringify(user))
}

export function getUser() {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(localStorage.getItem('teremka_user'))
  } catch {
    return null
  }
}

export function logout() {
  localStorage.removeItem('teremka_token')
  localStorage.removeItem('teremka_user')
  window.location.href = '/login'
}

export function isAuthenticated() {
  return !!localStorage.getItem('teremka_token')
}
