// File: js/auth.js
// - Does: builds signin auth payload and manages logout token clear.
// - Exports: auth (login, logout).
// - Used from: js/main.js.
// - Audit refs: Functional (signin success path, logout path), General (auth handling).
import { signInRequest } from './api.js'
import { storage } from './storage.js'

function toHeaderBase64(value) {
  return btoa(unescape(encodeURIComponent(value)))
}

// Parse JWT from signin response headers or body.
async function extractToken(response) {
  const authHeader = response.headers.get('authorization')
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim()
  }

  const textBody = (await response.text()).trim()
  if (!textBody) return ''

  try {
    const parsed = JSON.parse(textBody)
    if (typeof parsed === 'string') return parsed.trim()
    return (parsed?.token || parsed?.jwt || parsed?.access_token || '').trim()
  } catch {
    return textBody
  }
}

export const auth = {
  // [AUDIT] Signin using Basic Auth (base64(username/email:password)).
  async login(username, password) {
    // [AUDIT] Success path starts by building Basic Authorization header.
    const basic = toHeaderBase64(`${username}:${password}`)
    const response = await signInRequest(basic)
    const token = await extractToken(response)

    if (!token) {
      throw new Error('[500] Login succeeded but no JWT was returned')
    }

    // [AUDIT] Success path storing JWT for authenticated GraphQL requests.
    storage.saveToken(token)
    return token
  },

  // [AUDIT] Logout clearing token from storage.
  logout() {
    storage.clearToken()
  }
}
