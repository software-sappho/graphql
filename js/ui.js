// File: js/ui.js
// - Does: shows login/profile states and renders data sections.
// - Exports: ui object with state/render helpers.
// - Used from: js/main.js.
// - Audit refs: Functional (3 required sections + statistics section).
import { renderXPLineChart, renderAuditDonut, shortXP } from './charts.js'

const el = {
  loginView: document.getElementById('login-view'),
  profileView: document.getElementById('profile-view'),
  loginForm: document.getElementById('login-form'),
  username: document.getElementById('username'),
  password: document.getElementById('password'),
  togglePassword: document.getElementById('toggle-password'),
  loginButton: document.getElementById('login-button'),
  loginError: document.getElementById('login-error'),
  loginInfo: document.getElementById('login-info'),
  profileStatus: document.getElementById('profile-status'),
  dashboardGrid: document.getElementById('dashboard-grid'),
  headlineUser: document.getElementById('headline-user'),
  xpRange: document.getElementById('xp-range'),
  logoutButton: document.getElementById('logout-button'),
  downloadJSON: document.getElementById('download-json'),
  userName: document.getElementById('user-name'),
  userLogin: document.getElementById('user-login'),
  userEmail: document.getElementById('user-email'),
  xpTotal: document.getElementById('xp-total'),
  auditRatio: document.getElementById('audit-ratio'),
  auditUp: document.getElementById('audit-up'),
  auditDown: document.getElementById('audit-down'),
  skillsList: document.getElementById('skills-list'),
  lastProjects: document.getElementById('last-projects'),
  xpLineChart: document.getElementById('xp-line-chart'),
  auditDonutChart: document.getElementById('audit-donut-chart')
}

function resetStatus() {
  el.loginError.hidden = true
  el.loginInfo.hidden = true
  el.profileStatus.hidden = true
}

export const ui = {
  elements: el,

  // Show login view and hide profile.
  showLogin() {
    el.loginView.hidden = false
    el.profileView.hidden = true
  },

  // Show profile view and hide login.
  showProfile() {
    el.loginView.hidden = true
    el.profileView.hidden = false
  },

  // Toggle login form busy state.
  setLoginBusy(isBusy) {
    el.loginButton.disabled = isBusy
    el.loginButton.textContent = isBusy ? 'Logging in...' : 'Log In'
    el.username.disabled = isBusy
    el.password.disabled = isBusy
    el.togglePassword.disabled = isBusy

    if (isBusy) {
      el.loginInfo.hidden = false
      el.loginInfo.textContent = 'Logging in...'
    } else {
      el.loginInfo.hidden = true
      el.loginInfo.textContent = ''
    }
  },

  // Show login error banner.
  showLoginError(message) {
    el.loginError.hidden = false
    el.loginError.textContent = message
  },

  // Show profile status/error banner.
  setProfileMessage(message, isError = false) {
    el.profileStatus.hidden = false
    el.profileStatus.classList.toggle('error', isError)
    el.profileStatus.textContent = message
  },

  clearMessages() {
    resetStatus()
  },

  // Render all dashboard sections required by the project rubric.
  renderDashboard(data) {
    el.dashboardGrid.hidden = false
    el.profileStatus.hidden = true

    // [AUDIT] Section 1: Identity
    el.headlineUser.textContent = `${data.user.name} (${data.user.login})`
    el.userName.textContent = data.user.name
    el.userLogin.textContent = data.user.login
    el.userEmail.textContent = data.user.email

    // [AUDIT] Section 2: XP
    el.xpTotal.textContent = shortXP(data.xp.total)

    // [AUDIT] Section 3: Skills/Audits/Grades
    el.auditRatio.textContent = data.audit.ratio
    el.auditUp.textContent = shortXP(data.audit.up)
    el.auditDown.textContent = shortXP(data.audit.down)

    // Supporting section: Top skills.
    el.skillsList.innerHTML = ''
    if (!data.skills.length) {
      const li = document.createElement('li')
      li.textContent = 'No skills found for current account.'
      el.skillsList.appendChild(li)
    } else {
      data.skills.forEach((skill) => {
        const li = document.createElement('li')
        li.innerHTML = `<span>${skill.name}</span><strong>${skill.amount}%</strong>`
        el.skillsList.appendChild(li)
      })
    }

    // Supporting section: Latest projects.
    el.lastProjects.innerHTML = ''
    if (!data.latestProjects.length) {
      const li = document.createElement('li')
      li.textContent = 'No projects found.'
      el.lastProjects.appendChild(li)
    } else {
      data.latestProjects.forEach((project) => {
        const li = document.createElement('li')
        li.innerHTML = `<span>${project.name}</span><strong>${shortXP(project.amount)}</strong>`
        el.lastProjects.appendChild(li)
      })
    }

    // [AUDIT] Section 4: Statistics (SVG graphs)
    renderXPLineChart(el.xpLineChart, data.xp.daily)
    renderAuditDonut(el.auditDonutChart, data.audit)
  }
}
