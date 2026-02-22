# GraphQL Queries Index

This is every query currently executed by the app (`js/graphql.js` -> `getDashboardData()`).

## 1) USER_QUERY
- Constant name: `USER_QUERY`
- Query type: **Normal** (no args)
- Returns (plain words): user login, email, first name, last name
- Used in UI: identity section (name/login/email)
- Audit checkbox support:
  - valid login -> 3 sections
  - data accuracy verification
  - mandatory query types (normal)

GraphiQL query:
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
Variables:
```json
{}
```

---

## 2) XP_BY_RANGE_QUERY
- Constant name: `XP_BY_RANGE_QUERY`
- Query type: **Arguments + Nested**
- Returns (plain words): XP transactions in date range, with project and event context
- Key fields: `amount`, `createdAt`, `object { name }`, `event { path }`
- Used in UI:
  - total XP section
  - XP line chart (statistics)
- Audit checkbox support:
  - valid login -> 3 sections
  - statistics section
  - graph accuracy
  - mandatory query types (arguments + nested)

GraphiQL query:
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
Variables example:
```json
{
  "from": "2025-01-01T00:00:00.000Z",
  "limit": 2000
}
```

---

## 3) AUDIT_QUERY
- Constant name: `AUDIT_QUERY`
- Query type: **Normal** (aggregate)
- Returns (plain words): total audit down amount and total audit up amount
- Used in UI:
  - audit metrics section
  - audit donut chart (statistics)
- Audit checkbox support:
  - valid login -> 3 sections
  - statistics section
  - graph accuracy
  - mandatory query types (normal)

GraphiQL query:
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
Variables:
```json
{}
```

---

## 4) SKILLS_QUERY
- Constant name: `SKILLS_QUERY`
- Query type: **Arguments** (limit + where filter)
- Returns (plain words): top skill transactions and percentages
- Used in UI: skills list section
- Audit checkbox support:
  - valid login -> 3 sections
  - data accuracy verification
  - mandatory query types (arguments)

GraphiQL query:
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
Variables example:
```json
{
  "limit": 5
}
```

---

## 5) LATEST_PROJECTS_QUERY
- Constant name: `LATEST_PROJECTS_QUERY`
- Query type: **Nested + Arguments**
- Returns (plain words): latest project XP transactions with project name
- Used in UI: latest projects list
- Audit checkbox support:
  - data accuracy verification
  - mandatory query types (nested + arguments)

GraphiQL query:
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
Variables example:
```json
{
  "limit": 5
}
```
