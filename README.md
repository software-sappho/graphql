# Zone01 GraphQL Profile

## Overview
This app is a student profile dashboard for Zone01. It lets a user log in, fetches their profile data from Zone01 GraphQL, and shows it in readable sections with SVG-based statistics charts.

## Tech In Plain Words
- HTML: builds the page structure (login and profile sections).
- CSS: styles the page.
- JavaScript (vanilla): handles login, API requests, and rendering.
- Basic Auth: used only for signin (`username/email:password` encoded in base64).
- JWT: token returned after signin and saved in localStorage for session auth.
- Bearer Auth: JWT is sent in `Authorization: Bearer <token>` for GraphQL calls.
- GraphQL: asks for exactly the fields the UI needs.

## How The App Works
Text flow diagram:
1. User submits login form.
2. App sends `POST /api/auth/signin` with Basic auth header.
3. Server returns JWT.
4. App stores JWT in `localStorage` key `zone01_graphql_jwt`.
5. App sends GraphQL requests with `Bearer` token.
6. App renders profile sections and SVG charts.
7. User clicks logout.
8. App clears JWT and returns to login view.

## File-By-File Map
- `index.html`
  - Purpose: page layout and module entrypoint.
  - Key: loads `./js/main.js`.
- `styles.css`
  - Purpose: app styling.
- `js/main.js`
  - Purpose: app orchestration, login/logout, loading dashboard.
  - Key functions: `handleLogin()`, `loadDashboard()`, `bindEvents()`, `init()`.
- `js/auth.js`
  - Purpose: signin token extraction and logout.
  - Key functions: `auth.login()`, `auth.logout()`.
- `js/api.js`
  - Purpose: HTTP calls for signin + GraphQL.
  - Key functions: `signInRequest()`, `graphqlRequest()`.
- `js/graphql.js`
  - Purpose: GraphQL query definitions and response shaping.
  - Key function: `getDashboardData()`.
- `js/storage.js`
  - Purpose: JWT save/read/clear/decode/expiry checks.
  - Key methods: `saveToken()`, `getToken()`, `clearToken()`, `isExpired()`.
- `js/ui.js`
  - Purpose: DOM updates for sections and state messages.
  - Key methods: `showLogin()`, `showProfile()`, `renderDashboard()`.
- `js/charts.js`
  - Purpose: SVG chart creation.
  - Key functions: `renderXPLineChart()`, `renderAuditDonut()`.
- `js/config.js`
  - Purpose: constants and debug switch.
  - Key exports: `SIGNIN_URL`, `GRAPHQL_URL`, `TOKEN_KEY`, `DEBUG`.

## How To Run Locally
1. Open `graphql/` in VS Code.
2. Start Live Server from `index.html`.
3. Open the local URL in browser.

## Troubleshoot Common Errors
- CORS / network failure:
  - Symptom: fetch TypeError in console.
  - Check: DevTools Network request target is Zone01 domain (not localhost API path).
- Missing token:
  - Symptom: user is bounced back to login.
  - Check: Application -> Local Storage -> `zone01_graphql_jwt`.
- 401 / 403 responses:
  - Symptom: signin or GraphQL errors shown in UI.
  - Check: token expiry/validity, correct credentials, request headers.

## Audit Checklist
### Functional
- Invalid login shows error
  - How to demonstrate: enter wrong credentials and submit.
  - Where in code: `js/main.js` (`handleLogin()` catch), `js/api.js` (`signInRequest()` error handling).
- Valid login shows profile with 3 sections
  - How to demonstrate: login with valid account.
  - Where in code: `js/ui.js` (`renderDashboard()` Section 1/2/3 comments).
- Data accuracy verification
  - How to demonstrate: compare UI values with GraphiQL results.
  - Where in code: queries in `js/graphql.js`.
- 4th statistics section
  - How to demonstrate: verify SVG charts are shown.
  - Where in code: `js/ui.js` Section 4 + `js/charts.js`.
- Logout
  - How to demonstrate: click logout, token removed, login view shown.
  - Where in code: `js/main.js` logout click handler, `js/storage.js` `clearToken()`.

### General
- Required query types
  - Normal: `USER_QUERY`, `AUDIT_QUERY` (`js/graphql.js`)
  - Nested: `LATEST_PROJECTS_QUERY`, `XP_BY_RANGE_QUERY`
  - Arguments: `XP_BY_RANGE_QUERY`, `SKILLS_QUERY`, `LATEST_PROJECTS_QUERY`
- Graphs are SVG (not canvas)
  - Where in code: `js/charts.js`, `createElementNS('http://www.w3.org/2000/svg', ...)`.

### Bonus
- Hosted access works  
  - Hosted URL: [View Project](https://software-sappho.github.io/graphql/)  
  - How to demonstrate: open hosted URL and complete login → profile → logout flow.

## GraphiQL Verification Guide
- GraphiQL URL: `https://platform.zone01.gr/graphiql`
- Compare process:
  1. Run query in GraphiQL.
  2. Note value(s).
  3. Compare with same section in UI.

### Identity section query
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

### XP section + XP chart query
```graphql
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
    object { name }
    event { path }
  }
}
```

### Audit section + donut chart query
```graphql
query AuditStats {
  audit_down: transaction_aggregate(
    where: { type: { _eq: "down" }, event: { path: { _ilike: "%/div-01" } } }
  ) {
    aggregate { sum { amount } }
  }
  audit_up: transaction_aggregate(
    where: { type: { _eq: "up" }, event: { path: { _ilike: "%/div-01" } } }
  ) {
    aggregate { sum { amount } }
  }
}
```

### Skills section query
```graphql
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
```

### Latest projects section query
```graphql
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
    object { name }
  }
}
```

## Hosting Notes
- Verify `index.html` loads `js/main.js` correctly on hosted domain.
- Verify signin + GraphQL requests go to Zone01 endpoints over HTTPS.
- Verify localStorage token handling works in hosted environment.
- Verify both SVG charts render and logout clears session.

## How to explain this project in 60 seconds
- It is a vanilla JS Zone01 profile app: no framework, just HTML/CSS/JS.
- User logs in with Basic Auth at `/api/auth/signin`, then receives a JWT.
- JWT is saved under `zone01_graphql_jwt` and used as `Bearer` token for GraphQL.
- GraphQL data comes from `/api/graphql-engine/v1/graphql` with query + variables payload.
- UI renders identity, XP, skills/audit metrics, and a statistics section.
- Statistics are two real SVG graphs: XP line chart and audit donut.
- During audit, I prove correctness by running the same queries in GraphiQL and matching values.
- Logout clears token and returns to login, proving session lifecycle is handled.

## Dark Mode
- Theme styling is powered by CSS variables in `styles.css`.
- Required theme tokens are defined at `:root`:
  - `--bg-primary`, `--bg-secondary`, `--text-primary`, `--text-muted`, `--accent`, `--border-color`, `--card-bg`
- Dark mode overrides are applied by adding `.dark` to `<body>`.
- Toggle UI:
  - A global button (`#theme-toggle`) in the upper-right corner switches between "Dark Mode" and "Light Mode".
  - It is visible on both login and dashboard screens (independent of auth state).
- Persistence:
  - Preference is saved in localStorage key `zone01_theme`.
  - On load, `js/main.js` reads `zone01_theme` and applies the class.
  - If no saved value exists, light mode is used by default.

### Blue Palette Choice
- Accent colors were switched from red to blue to improve visual hierarchy while keeping the same bold/poster style.
- Light mode accent set:
  - `--accent: #1e3a8a`
  - `--accent-soft: #3b82f6`
  - `--border-accent: #1e40af`
- Dark mode accent set:
  - `--accent: #60a5fa`
  - `--accent-soft: #3b82f6`
  - `--border-accent: #2563eb`
- SVG chart colors now use CSS variables (`var(--accent)`, `var(--border-accent)`) so both themes stay consistent.
# graphql
