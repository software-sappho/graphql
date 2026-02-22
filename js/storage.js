// File: js/storage.js
// - Does: token save/read/clear and JWT expiry decode checks.
// - Exports: storage object with token helpers.
// - Used from: js/main.js and js/auth.js.
// - Audit refs: Functional (token store, token read, logout clear).
import { TOKEN_KEY } from './config.js'

function decodeJWT(token) {
  const parts = token.split('.')
  if (parts.length !== 3) return null

  try {
    // [AUDIT] Safe base64url decoding with padding normalization
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padding = '='.repeat((4 - (base64.length % 4)) % 4)
    const payload = base64 + padding
    const decoded = atob(payload)
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

export const storage = {
  // [AUDIT] Token store path.
  saveToken(token) {
    localStorage.setItem(TOKEN_KEY, token)
  },

  // [AUDIT] Token read path.
  getToken() {
    return localStorage.getItem(TOKEN_KEY)
  },

  // [AUDIT] Logout clear path.
  clearToken() {
    localStorage.removeItem(TOKEN_KEY)
  },

  isExpired(token) {
    if (!token) return true
    const payload = decodeJWT(token)
    if (!payload || !payload.exp) return false
    return Date.now() >= payload.exp * 1000
  },

  hasValidToken() {
    const token = this.getToken()
    return Boolean(token) && !this.isExpired(token)
  }
}
