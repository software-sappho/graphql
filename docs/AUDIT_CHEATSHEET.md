# Audit Cheatsheet

Use this during evaluation to demo quickly.

Quick links:
- Spoken script answers: `docs/AUDIT_VERBAL_SCRIPT.md`
- Zone01 flow explanation: `docs/ZONE01_FLOW.md`
- Exact query index: `docs/GRAPHQL_QUERIES_INDEX.md`

## 1) Invalid login error
- Steps:
  1. Enter wrong credentials.
  2. Submit login.
- Expected:
  - Visible error message on login form.
- Code references:
  - `js/main.js` -> `handleLogin()` catch + `ui.showLoginError()`
  - `js/api.js` -> `signInRequest()` non-OK error creation
- GraphiQL check:
  - Not needed (auth failure path demo).

## 2) Valid login + 3 data sections
- Steps:
  1. Login with valid credentials.
  2. Wait for dashboard render.
- Expected:
  - Section 1 Identity (name/login/email)
  - Section 2 XP (total XP)
  - Section 3 Skills/Audits/Grades (skills list + audit metrics)
- Code references:
  - `js/ui.js` -> `renderDashboard()` Section 1/2/3 markers
- GraphiQL queries:
  - `UserProfile`, `TopSkills`, `AuditStats`, `XPByRange`

## 3) Data accuracy verification
- Steps:
  1. Open GraphiQL and run same queries.
  2. Compare numeric/text values with UI.
- Expected:
  - Values match current account data.
- Code references:
  - `js/graphql.js` -> `USER_QUERY`, `XP_BY_RANGE_QUERY`, `AUDIT_QUERY`, `SKILLS_QUERY`, `LATEST_PROJECTS_QUERY`
- GraphiQL queries:
  - Same query texts as README and `docs/GRAPHQL_QUERIES_INDEX.md`.

## 4) Section 4 Statistics
- Steps:
  1. After login, scroll to statistics area.
- Expected:
  - Two charts are visible.
- Code references:
  - `js/ui.js` -> Section 4 marker + chart render calls

## 5) Two different SVG graphs
- Steps:
  1. Inspect elements in DevTools.
  2. Check chart containers.
- Expected:
  - XP line graph and audit donut graph are rendered as `<svg>`.
- Code references:
  - `js/charts.js` -> `renderXPLineChart()`, `renderAuditDonut()`
- GraphiQL mapping:
  - XP line <- `XP_BY_RANGE_QUERY` (`amount`, `createdAt`)
  - Donut <- `AUDIT_QUERY` (`audit_up`, `audit_down`)

## 6) Logout
- Steps:
  1. Click Logout.
  2. Check localStorage + screen.
- Expected:
  - `zone01_graphql_jwt` removed.
  - App returns to login view.
- Code references:
  - `js/main.js` logout click handler
  - `js/storage.js` -> `clearToken()`

## 7) Hosted access
- Steps:
  1. Open hosted URL.
  2. Perform login -> view data -> logout.
- Expected:
  - Same behavior as local.
- Code references:
  - Entry: `index.html` -> `js/main.js`

## 8) Required query types
- Normal query:
  - `USER_QUERY`, `AUDIT_QUERY`
- Nested query:
  - `LATEST_PROJECTS_QUERY`, `XP_BY_RANGE_QUERY` (nested `object`/`event`)
- Arguments query:
  - `XP_BY_RANGE_QUERY`, `SKILLS_QUERY`, `LATEST_PROJECTS_QUERY`
- Code references:
  - `js/graphql.js` query constants + `getDashboardData()` execution list.
