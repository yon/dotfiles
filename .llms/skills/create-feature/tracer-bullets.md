# Tracer Bullet Decomposition

Supporting material for `/create-feature`. Reference this when breaking a feature into tracer bullets during planning.

---

## What Is a Tracer Bullet?

A tracer bullet is a thin end-to-end path through ALL layers of the system:

```
   Data Layer  -->  Business Logic  -->  API/Handler  -->  Response/UI  -->  Tests
       |                |                    |                 |              |
       v                v                    v                 v              v
  [one table row]  [one rule]         [one endpoint]    [one response]  [one test]
```

Each tracer bullet is independently testable, reviewable, and (ideally) deployable. A tracer bullet delivers one observable behavior.

---

## The First Tracer Bullet

The first tracer bullet is always the simplest possible end-to-end path that proves the architecture works.

```
Feature: User authentication

First tracer bullet: Login with valid credentials --> returns JWT token

NOT included in the first tracer bullet:
  - Registration
  - Password reset
  - Token refresh
  - Role-based access
  - OAuth/SSO
  - Rate limiting
  - Account lockout
```

The first tracer bullet has maximum architectural value and minimum behavioral complexity. It validates that all the layers connect and data flows end-to-end. Everything else is incremental.

---

## Slicing Strategy

After the first tracer bullet, each subsequent bullet adds ONE behavior. Order by simplest-to-most-complex:

```
Feature: User authentication

Bullet 1: Login with valid credentials --> JWT token        (first tracer bullet)
Bullet 2: Login with invalid credentials --> 401 error      (error path)
Bullet 3: Token expiry --> 401 on expired token             (time-based behavior)
Bullet 4: Token refresh --> new token from refresh token    (second endpoint)
Bullet 5: Registration --> create account, return token     (new flow)
Bullet 6: Password reset --> email flow                     (external dependency)
Bullet 7: Role-based access --> admin vs user permissions   (authorization layer)
```

### How to Identify Tracer Bullets

1. **List all user-facing behaviors** the feature must support
2. **Order by complexity** -- simplest first, most complex last
3. **Each behavior is one tracer bullet** -- if a behavior requires multiple layers, that's fine (that's what end-to-end means)
4. **Error paths are tracer bullets too** -- "invalid login returns error" is its own bullet, not part of "valid login"

### Tracer Bullet Independence

Each tracer bullet should:
- Be testable without later bullets existing
- Not break if later bullets are delayed or cut
- Add incremental value (the system is better after each bullet)

If cutting a bullet would break earlier bullets, the dependency is wrong. Re-order or merge.

---

## Anti-Pattern: Building All of One Layer First

```
WRONG (horizontal / layer-by-layer):

Week 1: Build all database models (users, sessions, tokens, roles, permissions)
Week 2: Build all service logic (auth, registration, password reset, role checks)
Week 3: Build all API handlers (login, register, refresh, reset, admin)
Week 4: Wire everything together
Week 5: Debug why nothing works together
```

This approach delays integration testing until the end, when everything is built and changing course is expensive. Integration bugs discovered in week 5 may require rethinking decisions made in week 1.

```
RIGHT (tracer bullet / slice-by-slice):

Day 1: Bullet 1 -- login (model + service + handler + test, end-to-end)
Day 2: Bullet 2 -- invalid login (extend model + service + handler + test)
Day 3: Bullet 3 -- token expiry (extend model + service + handler + test)
...
```

Each day delivers a working, tested increment. Integration problems surface immediately.

---

## Slicing Difficult Features

### Feature with External Dependencies

Put the external dependency in the LAST tracer bullet, not the first. Use a stub for earlier bullets.

```
Feature: Payment processing

Bullet 1: Create order with total --> in-memory (no Stripe)
Bullet 2: Apply discount codes --> business logic only
Bullet 3: Process payment via Stripe --> real integration
```

### Feature with Complex UI

Start with the API, add UI last. The API is the contract.

```
Feature: Dashboard analytics

Bullet 1: API returns aggregated data --> JSON response
Bullet 2: Basic chart rendering --> minimal UI
Bullet 3: Interactive filters --> full UI
```

### Feature Spanning Multiple Services

One service per tracer bullet. Each bullet extends one service and its tests.

```
Feature: Notification system

Bullet 1: Create notification record --> notification service
Bullet 2: Email delivery --> email service integration
Bullet 3: In-app delivery --> websocket service integration
Bullet 4: User preferences --> preference service integration
```

---

## Each Tracer Bullet Is a PR

In a team context, each tracer bullet can be its own pull request:
- Small enough to review in one sitting
- Has its own tests
- Independently deployable (behind a feature flag if the feature is incomplete)
- Clear description: "Adds [behavior] to [feature]"

This keeps PRs small, reviews fast, and integration continuous.
