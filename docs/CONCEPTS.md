# Concepts (Explain Like I'm 16)

## HTTP Request / Response
A browser talks to a server using HTTP.
- Request = "Please do this" (URL + method + headers + optional body).
- Response = "Here is what happened" (status + headers + body).

Example:
```http
POST /api/auth/signin
Authorization: Basic abc123...
```

If credentials are right, server returns success + token.

## Basic Auth + base64
Basic auth means sending credentials inside `Authorization` header:
- Format before encoding: `username:password`
- Then base64 encode that text
- Send as: `Authorization: Basic <encoded>`

Important:
- Base64 is not encryption.
- HTTPS is what protects it in transit.

Project example:
```js
const basic = btoa(`${username}:${password}`)
headers.Authorization = `Basic ${basic}`
```

## JWT (JSON Web Token)
JWT is a signed token string from server after login.
At high level, it includes:
- user identity info (claims)
- expiry time (`exp`)

Why we store it:
- So user does not need to re-login for every request.
- App stores it at `zone01_graphql_jwt` in localStorage.

## Bearer Auth Header
After login, API calls use:
```http
Authorization: Bearer <JWT>
```

This tells server: "this request is from the logged-in user tied to this token."

## GraphQL Basics
GraphQL lets client ask exactly for needed fields.

### Query shape
```graphql
query UserProfile {
  user {
    login
    email
  }
}
```

### Nested relations
You can request related objects in one query.
```graphql
query LatestProjects($limit: Int!) {
  transaction(limit: $limit) {
    amount
    object { name }
  }
}
```

### Arguments and filters
You can filter rows and pass variables.
```graphql
query XPByRange($from: timestamptz!, $limit: Int!) {
  transaction(
    where: { createdAt: { _gte: $from } }
    limit: $limit
  ) {
    amount
    createdAt
  }
}
```

## GraphQL vs REST (simple)
REST:
- Usually many endpoints (`/users`, `/transactions`, `/audits`)
- You may over-fetch or under-fetch fields

GraphQL:
- One endpoint for many data shapes
- Client controls exact fields in query
- Great when UI needs multiple related pieces of data

In this project:
- One GraphQL endpoint returns identity, XP, audits, skills, latest projects through dedicated queries.

## Why nested queries matter in THIS project
Without nesting, app might need extra requests to map project IDs to project names.
With nested fields (like `object { name }`), one query already contains enough context to render UI labels and chart annotations.

## What `where` / `_eq` means in THIS project
`where` is a filter block.
- `_eq` means "equals"
- `_ilike` means case-insensitive pattern matching
- `_gte` means "greater than or equal"

Examples used here:
- `type: { _eq: "xp" }` -> only XP transactions
- `createdAt: { _gte: $from }` -> only recent items
- `event.path: { _ilike: "%/div-01" }` -> division-specific data

## Why SVG graphs?
`<svg>` is vector graphics in the browser.
- Looks sharp at any zoom
- Easy to generate with JS (`createElementNS`)
- Good for custom charts without extra libraries

Mini SVG example:
```html
<svg viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" />
</svg>
```

## Mini Exercises
### Exercise 1: Change skills limit
In GraphiQL, run `TopSkills` with different limit values.
- Start with `{"limit": 5}`
- Try `{"limit": 3}`
- Observe fewer rows returned.

### Exercise 2: Change XP date range variable
In GraphiQL, run `XPByRange` with different `from` date values.
- Try older date -> more transactions
- Try recent date -> fewer transactions
- Observe how this would change line chart density in UI.
