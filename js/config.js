// File: js/config.js
// - Does: defines API URLs, token key, and debug toggle.
// - Exports: DOMAIN, SIGNIN_URL, GRAPHQL_URL, TOKEN_KEY, DEBUG, debugLog().
// - Used from: js/main.js, js/api.js, js/storage.js.
// - Audit refs: General (real endpoints + token key consistency).
export const DOMAIN = 'platform.zone01.gr'
export const SIGNIN_URL = `https://${DOMAIN}/api/auth/signin`
export const GRAPHQL_URL = `https://${DOMAIN}/api/graphql-engine/v1/graphql`
export const TOKEN_KEY = 'zone01_graphql_jwt'

const queryDebug = new URLSearchParams(window.location.search).get('debug')
const storageDebug = window.localStorage.getItem('zone01_debug')

export const DEBUG = queryDebug === '1' || storageDebug === '1'

// Debug logger guarded by DEBUG flag.
export function debugLog(...args) {
  if (DEBUG) {
    console.log('[DEBUG]', ...args)
  }
}
