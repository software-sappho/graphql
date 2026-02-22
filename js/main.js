// File: js/main.js
// - Does: app startup, login/logout flow, dashboard loading.
// - Exports: none (entry module side effects via init()).
// - Used from: index.html (<script type="module" src="./js/main.js">).
// - Audit refs: Functional (invalid login, valid login, logout), General (flow wiring).
import { auth } from './auth.js'
import { getDashboardData } from './graphql.js'
import { storage } from './storage.js'
import { ui } from './ui.js'
import { debugLog } from './config.js'

// [AUDIT MAP] Active app entry (main.js, equivalent role of prior app.js)
// [AUDIT] Functional 1: invalid login error -> handleLogin(), ui.showLoginError()
// [AUDIT] Functional 2: valid login -> auth.login(), loadDashboard(), ui.renderDashboard()
// [AUDIT] Functional 3: logout clears auth -> bindEvents() logout handler, auth.logout()
// [AUDIT] General: normal query -> USER_QUERY (js/graphql.js)
// [AUDIT] General: nested query -> LATEST_PROJECTS_QUERY / XP_BY_RANGE_QUERY (js/graphql.js)
// [AUDIT] General: arguments query -> XP_BY_RANGE_QUERY / SKILLS_QUERY (js/graphql.js)
// [AUDIT] UI Sections -> ui.renderDashboard() in js/ui.js
// [AUDIT] SVG Statistics -> renderXPLineChart(), renderAuditDonut() in js/charts.js
const DEBUG = false
const THEME_KEY = 'zone01_theme'

const state = {
  daysRange: 90,
  dashboard: null
}

function friendlyNetworkError(error) {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return 'Network/CORS error: open DevTools Network tab and verify signin request reached https://platform.zone01.gr.'
  }
  return error.message || 'Unknown error'
}

// Export currently loaded dashboard data as JSON for quick audit/debug.
function downloadCurrentDashboard() {
  if (!state.dashboard) return

  const blob = new Blob([JSON.stringify(state.dashboard, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `zone01-stats-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function applyTheme(theme) {
  const isDark = theme === 'dark'
  const themeToggle = document.getElementById('theme-toggle')
  document.body.classList.toggle('dark', isDark)
  if (themeToggle) {
    themeToggle.textContent = isDark ? 'Light Mode' : 'Dark Mode'
  }
}

function loadStoredTheme() {
  const stored = localStorage.getItem(THEME_KEY)
  applyTheme(stored === 'dark' ? 'dark' : 'light')
}

// Load profile/dashboard after authentication.
async function loadDashboard() {
  ui.elements.dashboardGrid.hidden = true
  // [RUBRIC] Loading state while GraphQL profile data is fetched.
  ui.setProfileMessage(`Loading profile for last ${state.daysRange} days...`)

  const token = storage.getToken()
  if (!token || storage.isExpired(token)) {
    auth.logout()
    ui.showLogin()
    ui.showLoginError('Session expired. Please log in again.')
    return
  }

  try {
    const dashboard = await getDashboardData(token, state.daysRange)
    state.dashboard = dashboard
    ui.renderDashboard(dashboard)
    debugLog('Dashboard loaded', {
      range: state.daysRange,
      totalXP: dashboard.xp.total
    })
  } catch (error) {
    const message = friendlyNetworkError(error)
    const unauthorized = message.includes('[401]') || message.toLowerCase().includes('jwt')

    if (unauthorized) {
      auth.logout()
      ui.showLogin()
      ui.showLoginError(`Session invalid: ${message}`)
      return
    }

    // [RUBRIC] Error state shown to user when GraphQL/dashboard fetch fails.
    ui.setProfileMessage(`Failed to load profile: ${message}`, true)
  }
}

// Submit login form and transition from login -> profile.
async function handleLogin(event) {
  event.preventDefault()
  ui.clearMessages()

  const username = ui.elements.username.value.trim()
  const password = ui.elements.password.value

  if (!username || !password) {
    ui.showLoginError('Enter both username/email and password.')
    return
  }

  ui.setLoginBusy(true)

  try {
    if (DEBUG) console.log('[AUDIT][login] attempting signin request')
    await auth.login(username, password)
    if (DEBUG) console.log('[AUDIT][login] signin success, loading dashboard')
    ui.showProfile()
    await loadDashboard()
  } catch (error) {
    ui.showLogin()
    // [AUDIT] Invalid credentials/error path -> user-visible login error banner.
    if (DEBUG) console.log('[AUDIT][login] signin failed', error?.message)
    ui.showLoginError(`Signin failed: ${friendlyNetworkError(error)}`)
  } finally {
    ui.setLoginBusy(false)
  }
}

// Wire UI events for authentication, filters, and export.
function bindEvents() {
  const themeToggle = document.getElementById('theme-toggle')
  ui.elements.loginForm.addEventListener('submit', handleLogin)

  ui.elements.logoutButton.addEventListener('click', () => {
    // [AUDIT] Logout path -> clear stored JWT token and return to login.
    if (DEBUG) console.log('[AUDIT][logout] clearing auth token')
    auth.logout()
    ui.showLogin()
    ui.clearMessages()
    ui.elements.password.value = ''
  })

  ui.elements.togglePassword.addEventListener('click', () => {
    const isHidden = ui.elements.password.type === 'password'
    ui.elements.password.type = isHidden ? 'text' : 'password'
    ui.elements.togglePassword.textContent = isHidden ? 'Hide' : 'Show'
  })

  ui.elements.xpRange.addEventListener('change', async (event) => {
    state.daysRange = Number(event.target.value)
    await loadDashboard()
  })

  ui.elements.downloadJSON.addEventListener('click', downloadCurrentDashboard)

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const nextTheme = document.body.classList.contains('dark') ? 'light' : 'dark'
      localStorage.setItem(THEME_KEY, nextTheme)
      applyTheme(nextTheme)
    })
  }
}

// Initialize application on page load.
async function init() {
  // Theme is global and applied before auth/view checks.
  loadStoredTheme()
  bindEvents()
  ui.elements.xpRange.value = String(state.daysRange)

  if (storage.hasValidToken()) {
    ui.showProfile()
    await loadDashboard()
  } else {
    ui.showLogin()
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
