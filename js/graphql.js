// File: js/graphql.js
// - Does: defines app queries and maps responses into dashboard data.
// - Exports: getDashboardData(token, daysRange).
// - Used from: js/main.js.
// - Audit refs: General (normal/nested/arguments query types), Functional (data accuracy).
import { graphqlRequest } from './api.js'

function formatDateKey(isoDate) {
  return new Date(isoDate).toISOString().slice(0, 10)
}

function groupXPByDay(rows) {
  const map = new Map()

  rows.forEach((row) => {
    const key = formatDateKey(row.createdAt)
    map.set(key, (map.get(key) || 0) + (row.amount || 0))
  })

  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, amount]) => ({ date, amount }))
}

function projectTotals(rows) {
  const map = new Map()

  rows.forEach((row) => {
    const name = row.object?.name || 'Unnamed project'
    map.set(name, (map.get(name) || 0) + (row.amount || 0))
  })

  return Array.from(map.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
}

// [AUDIT] Normal GraphQL query (no args)
// Used for identity fields shown in profile.
const USER_QUERY = `
  query UserProfile {
    user {
      login
      email
      firstName
      lastName
    }
  }
`

// [AUDIT] Arguments GraphQL query (variables + where/_eq + limit)
// Also nested relationship fields: object/event.
const XP_BY_RANGE_QUERY = `
  query XPByRange($from: timestamptz!, $limit: Int!) {
    transaction(
      where: {
        type: { _eq: "xp" }
        event: { path: { _ilike: "%/div-01" } }
        createdAt: { _gte: $from }
      }
      order_by: { createdAt: asc }
      limit: $limit
    ) {
      amount
      createdAt
      object {
        name
      }
      event {
        path
      }
    }
  }
`

// [AUDIT] Normal GraphQL query (no args)
// Aggregate audit values.
const AUDIT_QUERY = `
  query AuditStats {
    audit_down: transaction_aggregate(
      where: { type: { _eq: "down" }, event: { path: { _ilike: "%/div-01" } } }
    ) {
      aggregate {
        sum {
          amount
        }
      }
    }
    audit_up: transaction_aggregate(
      where: { type: { _eq: "up" }, event: { path: { _ilike: "%/div-01" } } }
    ) {
      aggregate {
        sum {
          amount
        }
      }
    }
  }
`

// [AUDIT] Arguments GraphQL query (variables + where/_eq + limit)
const SKILLS_QUERY = `
  query TopSkills($limit: Int!) {
    transaction(
      where: { eventId: { _eq: 200 }, type: { _ilike: "skill%" } }
      distinct_on: [type]
      order_by: [{ type: asc }, { amount: desc }]
      limit: $limit
    ) {
      type
      amount
    }
  }
`

// [AUDIT] Nested GraphQL query (relationship)
// Also includes arguments (limit).
const LATEST_PROJECTS_QUERY = `
  query LatestProjects($limit: Int!) {
    transaction(
      where: {
        type: { _eq: "xp" }
        object: { type: { _eq: "project" } }
        event: { path: { _ilike: "%/div-01" } }
      }
      order_by: { createdAt: desc }
      limit: $limit
    ) {
      amount
      createdAt
      object {
        name
      }
    }
  }
`

// Execute all queries used by the active dashboard.
export async function getDashboardData(token, daysRange) {
  const from = new Date(Date.now() - Number(daysRange) * 24 * 60 * 60 * 1000).toISOString()

  const [userRes, xpRes, auditRes, skillsRes, latestRes] = await Promise.all([
    // [AUDIT] Used by app: normal query execution.
    graphqlRequest(USER_QUERY, {}, token),
    // [AUDIT] Used by app: arguments query execution (XP timeline).
    graphqlRequest(XP_BY_RANGE_QUERY, { from, limit: 2000 }, token),
    // [AUDIT] Used by app: normal aggregate query execution (audit).
    graphqlRequest(AUDIT_QUERY, {}, token),
    // [AUDIT] Used by app: arguments query execution (skills).
    graphqlRequest(SKILLS_QUERY, { limit: 5 }, token),
    // [AUDIT] Used by app: nested query execution (latest projects).
    graphqlRequest(LATEST_PROJECTS_QUERY, { limit: 5 }, token)
  ])

  const user = userRes.user?.[0] || {}
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.login || 'Unknown'

  const xpRows = xpRes.transaction || []
  const dailyXP = groupXPByDay(xpRows)
  const totalXP = xpRows.reduce((sum, row) => sum + (row.amount || 0), 0)
  const topProjects = projectTotals(xpRows).slice(0, 5)

  const up = auditRes.audit_up?.aggregate?.sum?.amount || 0
  const down = auditRes.audit_down?.aggregate?.sum?.amount || 0
  const ratio = down > 0 ? (up / down).toFixed(2) : up > 0 ? '∞' : '0.00'

  const skills = (skillsRes.transaction || []).map((skill) => ({
    name: String(skill.type || '').replace('skill_', '').replace(/-/g, ' ') || 'unknown',
    amount: skill.amount || 0
  }))

  const latestProjects = (latestRes.transaction || []).map((row) => ({
    name: row.object?.name || 'Unnamed project',
    amount: row.amount || 0,
    createdAt: row.createdAt
  }))

  return {
    rangeDays: Number(daysRange),
    user: {
      login: user.login || '-',
      email: user.email || '-',
      name: fullName
    },
    xp: {
      total: totalXP,
      daily: dailyXP,
      topProjects
    },
    audit: { up, down, ratio },
    skills,
    latestProjects
  }
}
