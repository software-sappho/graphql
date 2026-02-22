# Debugging Guide

Use this when login or data loading fails.

## 1) DevTools Console
Check for:
- `Signin failed: ...`
- `Failed to load profile: ...`
- Network/CORS errors from fetch

If needed, enable optional debug logs by setting:
```js
localStorage.setItem('zone01_debug', '1')
```
Then reload.

## 2) DevTools Network
Look at two request types:
- Signin: `POST https://platform.zone01.gr/api/auth/signin`
- GraphQL: `POST https://platform.zone01.gr/api/graphql-engine/v1/graphql`

Verify:
- Status codes (`200`, `401`, `403`)
- Request headers (`Authorization`)
- Response body shape (text vs JSON)

## 3) DevTools Application (Storage)
Check Local Storage key:
- `zone01_graphql_jwt`

Expected:
- Present after successful login
- Removed after logout

## Common Failure Patterns

### A) Token key mismatch
- Symptom: login seems successful but profile immediately fails/returns to login.
- Check: token is saved and read using the same key (`zone01_graphql_jwt`).

### B) `res.text()` vs `res.json()` response mismatch
- Symptom: parse errors or empty token.
- Why: signin can return plain text token or JSON token.
- Current code handles both in `js/auth.js` (`extractToken()`).

### C) 401 / 403 from GraphQL
- Symptom: profile not loading; auth/session error shown.
- Causes: expired token, invalid token, wrong header.
- Check: `Authorization: Bearer <jwt>` is present in GraphQL request.

### D) CORS / fetch TypeError
- Symptom: request blocked before status appears.
- Check endpoint URL is full HTTPS Zone01 URL, not relative localhost API path.

## Test GraphQL With fetch In Console
Replace `YOUR_JWT_HERE`:
```js
fetch('https://platform.zone01.gr/api/graphql-engine/v1/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_HERE'
  },
  body: JSON.stringify({
    query: `query UserProfile { user { login email firstName lastName } }`,
    variables: {}
  })
})
  .then((r) => r.json())
  .then(console.log)
  .catch(console.error)
```
