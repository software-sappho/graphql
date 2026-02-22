# Zone01 API Flow (Step by Step)

This file explains exactly how this project talks to Zone01 services.

## Base Domain
- Base domain in code: `platform.zone01.gr`.
- In this project, endpoints are defined in `js/config.js`:
  - `SIGNIN_URL = https://platform.zone01.gr/api/auth/signin`
  - `GRAPHQL_URL = https://platform.zone01.gr/api/graphql-engine/v1/graphql`
- Why everything is under one domain:
  - Same platform identity system
  - Consistent auth token usage between signin and GraphQL

## Story: Browser -> Signin -> Token -> GraphQL -> Render -> Logout
1. Browser shows login form (`index.html` + `js/ui.js`).
2. User submits credentials.
3. App sends signin request to `/api/auth/signin`.
4. Server returns JWT token.
5. App stores token in localStorage (`zone01_graphql_jwt`).
6. App sends GraphQL requests with `Authorization: Bearer <JWT>`.
7. App renders identity, XP, audit/skills, and SVG statistics.
8. On logout, app removes token and returns to login view.

## `/api/auth/signin`
### What Basic Auth is
- Basic Auth means sending credentials in `Authorization` header.
- Format is `Basic <base64(username_or_email:password)>`.

### Why base64 encode `username:password`
- HTTP headers must carry safe text format.
- Base64 is a transport encoding (not encryption).
- HTTPS protects credentials in transit.

Code path:
- Header built in `js/auth.js` -> `auth.login()`
- Request sent in `js/api.js` -> `signInRequest()`

Typical response:
- JWT token may come from:
  - `authorization` response header (`Bearer ...`)
  - plain text body
  - JSON body (`token` / `jwt` / `access_token`)
- Token extraction handled in `js/auth.js` -> `extractToken()`

## JWT
### What JWT contains (high level)
- Identity claims (who the user is)
- Expiry timestamp (`exp`)

### Why server trusts it
- JWT is signed by server.
- Client cannot forge a valid signature without server secret.

In this app:
- Stored at key: `zone01_graphql_jwt` in `js/storage.js`
- Expiry check: `storage.isExpired()` (JWT payload decode)

## `/api/graphql-engine/v1/graphql`
### Why every request is POST
- GraphQL API accepts query + variables in request body.
- POST makes body transport explicit and consistent.

### JSON body shape
```json
{
  "query": "...",
  "variables": { "from": "...", "limit": 2000 }
}
```

### Authorization header
```http
Authorization: Bearer <JWT>
```

Code path:
- `js/api.js` -> `graphqlRequest(query, variables, jwt)`

## GraphiQL at `/graphiql`
- URL: `https://platform.zone01.gr/graphiql`
- Why it helps:
  - Run the exact same queries used by app
  - Compare raw API values with rendered UI values
  - Prove query correctness during audit

Use with:
- Query constants from `js/graphql.js`:
  - `USER_QUERY`
  - `XP_BY_RANGE_QUERY`
  - `AUDIT_QUERY`
  - `SKILLS_QUERY`
  - `LATEST_PROJECTS_QUERY`
