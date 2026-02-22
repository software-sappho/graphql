// File: js/api.js
// - Does: sends signin and GraphQL HTTP requests.
// - Exports: signInRequest(), graphqlRequest().
// - Used from: js/auth.js and js/graphql.js.
// - Audit refs: Functional (invalid login error source), General (Bearer attach, endpoints).
import { SIGNIN_URL, GRAPHQL_URL, debugLog } from './config.js'

function normalizeMessage(rawMessage, fallback) {
  const text = String(rawMessage || '').trim()
  return text ? text.slice(0, 160) : fallback
}

async function parseErrorResponse(response, fallback) {
  let message = fallback

  try {
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const body = await response.json()
      message = body?.message || body?.error || JSON.stringify(body)
    } else {
      const text = await response.text()
      if (text) {
        try {
          const parsed = JSON.parse(text)
          message = parsed?.message || parsed?.error || text
        } catch {
          message = text
        }
      }
    }
  } catch {
    message = fallback
  }

  return normalizeMessage(message, fallback)
}

// Perform signin request and normalize API errors.
export async function signInRequest(basicToken) {
  debugLog('POST signin', SIGNIN_URL)

  const response = await fetch(SIGNIN_URL, {
    method: 'POST',
    headers: {
      // Why: signin endpoint expects Basic auth with base64(username/email:password).
      Authorization: `Basic ${basicToken}`,
      Accept: 'application/json, text/plain, */*'
    }
  })

  if (!response.ok) {
    const message = await parseErrorResponse(response, 'Login failed')
    // [AUDIT] Invalid credentials/error response converted to status + user-facing reason.
    throw new Error(`[${response.status}] ${message}`)
  }

  return response
}

// Execute GraphQL query against Zone01 GraphQL endpoint using Bearer JWT.
export async function graphqlRequest(query, variables, jwt) {
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      // [AUDIT] Token attach to GraphQL request.
      // Why: protected GraphQL endpoint requires Bearer JWT for user-specific data.
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, variables })
  })

  if (!response.ok) {
    const message = await parseErrorResponse(response, 'GraphQL request failed')
    throw new Error(`[${response.status}] ${message}`)
  }

  const body = await response.json()
  if (body.errors?.length) {
    throw new Error(normalizeMessage(body.errors[0].message, 'GraphQL error'))
  }

  return body.data
}
