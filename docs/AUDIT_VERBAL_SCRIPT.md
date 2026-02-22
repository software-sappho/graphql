# Audit Verbal Script

Use this during live evaluation. Each section gives you a short spoken script, demo steps, evidence, query, and code pointer.

## 1) Invalid login -> error message
### What auditor is checking
The app must reject bad credentials and show a clear user-facing error.

### 20-40 second spoken answer
"When login fails, I catch the signin error and show it on the login form. The API error includes status and message, so the user sees why it failed. This proves invalid auth is handled cleanly, not silently."

### Demo steps
1. Open login page.
2. Type wrong username/password.
3. Click `Log In`.

### Evidence
- UI: visible error message under login form.
- DevTools Network: signin request returns non-200 status.
- DevTools Console (optional): error flow log if debug enabled.

### GraphiQL query
Not required for this item.

### Where in code
- `js/main.js` -> `handleLogin()` catch -> `ui.showLoginError(...)`
- `js/api.js` -> `signInRequest()` error normalization

---

## 2) Valid login -> 3 sections
### What auditor is checking
Successful auth should load profile data and render required data sections.

### 20-40 second spoken answer
"After valid signin, we store the JWT, fetch dashboard GraphQL data, then render the required sections: identity, XP, and skills/audit metrics. The rendering is centralized in `renderDashboard()`."

### Demo steps
1. Login with valid credentials.
2. Wait for profile page.
3. Point at identity, XP total, and skills/audit area.

### Evidence
- DevTools Application -> Local Storage has `zone01_graphql_jwt`.
- DevTools Network shows GraphQL POST requests with 200.

### GraphiQL query
Use `UserProfile`, `TopSkills`, `AuditStats`, `XPByRange` (see index doc).

### Where in code
- `js/auth.js` -> `auth.login()`
- `js/storage.js` -> `saveToken()`
- `js/main.js` -> `loadDashboard()`
- `js/ui.js` -> `renderDashboard()` ([AUDIT] Section 1/2/3)

---

## 3) Accuracy via GraphiQL
### What auditor is checking
Numbers shown in UI should match API results.

### 20-40 second spoken answer
"I run the same GraphQL queries in GraphiQL and compare those values to the UI. Since the UI is directly mapped from those query responses, matching values prove data accuracy."

### Demo steps
1. Open GraphiQL: `https://platform.zone01.gr/graphiql`.
2. Paste query (for the section you are checking).
3. Compare returned values with dashboard.

### Evidence
- GraphiQL result panel values.
- Matching values in UI fields and chart labels.

### GraphiQL query
Start with:
```graphql
query UserProfile {
  user {
    login
    email
    firstName
    lastName
  }
}
```

### Where in code
- `js/graphql.js` -> all query constants + `getDashboardData()`

---

## 4) Statistics section -> 2 SVG graphs
### What auditor is checking
There is a fourth statistics section with at least two distinct SVG graphs.

### 20-40 second spoken answer
"The statistics section renders two different SVG graphs: an XP line chart and an audit donut chart. Both are created with SVG elements via `createElementNS`, not canvas."

### Demo steps
1. Login.
2. Scroll to statistics area.
3. Open DevTools Elements and expand chart containers.

### Evidence
- `<svg>` present under `#xp-line-chart`.
- `<svg>` present under `#audit-donut-chart`.

### GraphiQL query
- XP graph: `XPByRange`
- Audit graph: `AuditStats`

### Where in code
- `js/ui.js` -> Section 4 render calls
- `js/charts.js` -> `renderXPLineChart()`, `renderAuditDonut()`

---

## 5) Graph accuracy
### What auditor is checking
Graph values must be based on real query data.

### 20-40 second spoken answer
"The XP line points come from `transaction.amount` over `createdAt` from `XP_BY_RANGE_QUERY`. The donut uses aggregate totals from `AUDIT_QUERY`. So chart values are API-derived, not hardcoded."

### Demo steps
1. Run `XPByRange` in GraphiQL with variables.
2. Confirm timeline values correspond to chart points/scale.
3. Run `AuditStats` and compare up/down totals with donut text.

### Evidence
- GraphiQL response fields.
- Matching numeric labels in UI.

### GraphiQL query
```graphql
query AuditStats {
  audit_down: transaction_aggregate(
    where: { type: { _eq: "down" }, event: { path: { _ilike: "%/div-01" } } }
  ) { aggregate { sum { amount } } }
  audit_up: transaction_aggregate(
    where: { type: { _eq: "up" }, event: { path: { _ilike: "%/div-01" } } }
  ) { aggregate { sum { amount } } }
}
```

### Where in code
- `js/graphql.js` -> `XP_BY_RANGE_QUERY`, `AUDIT_QUERY`
- `js/charts.js` -> chart renderers

---

## 6) Hosted access
### What auditor is checking
Hosted deployment should be accessible and functional.

### 20-40 second spoken answer
"On hosted domain, the same entrypoint loads and the same API flow works: signin, token storage, GraphQL data load, charts, and logout. I verify it with the same steps as local."

### Demo steps
1. Open hosted URL.
2. Login.
3. Verify profile sections and charts.
4. Logout.

### Evidence
- Hosted page loads without path/import issues.
- Network calls hit Zone01 endpoints.

### GraphiQL query
Optional cross-check as above.

### Where in code
- `index.html` -> entry `js/main.js`
- all runtime modules under `js/`

---

## 7) Logout
### What auditor is checking
Logout should remove auth and return user to login.

### 20-40 second spoken answer
"Logout is explicit: we clear localStorage token, switch view back to login, and clear sensitive form state. This prevents stale session reuse."

### Demo steps
1. Click `Logout`.
2. Check screen and localStorage.

### Evidence
- `zone01_graphql_jwt` key removed.
- login view visible.

### GraphiQL query
Not required for this item.

### Where in code
- `js/main.js` logout click handler
- `js/auth.js` -> `logout()`
- `js/storage.js` -> `clearToken()`

---

## 8) Mandatory query types: normal, nested, arguments
### What auditor is checking
Code must actively use all required GraphQL query styles.

### 20-40 second spoken answer
"We actively execute all three required types: normal queries like `USER_QUERY`, nested queries like `LATEST_PROJECTS_QUERY` and `XP_BY_RANGE_QUERY` with related objects, and arguments queries using variables and filters like `$from`, `$limit`, and `where` clauses."

### Demo steps
1. Open `js/graphql.js`.
2. Show query constants and execution inside `getDashboardData()`.
3. Run one example of each in GraphiQL.

### Evidence
- Query constants in code + execution list.
- GraphiQL results.

### GraphiQL query
Use:
- Normal: `UserProfile`
- Nested: `LatestProjects`
- Arguments: `XPByRange` with variables

### Where in code
- `js/graphql.js` query constants + `getDashboardData()`

---

## Bonus: extra sections/graphs + good practices
### What auditor is checking
Any additional quality beyond minimum rubric.

### 20-40 second spoken answer
"Beyond minimum sections, we also show latest projects and top skills, plus robust error handling and loading states. Graphs are native SVG and all auth/network paths show user-readable errors."

### Demo steps
1. Highlight latest projects list and skills list.
2. Show loading message and invalid login error handling.

### Evidence
- UI states and additional sections visible.
- [AUDIT] comments in code for quick traceability.

### Where in code
- `js/ui.js`, `js/main.js`, `js/charts.js`
