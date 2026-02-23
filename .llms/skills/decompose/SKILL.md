---
name: decompose
description: "Break features into tracer bullet stories and tasks. Trigger: decompose, break down, split feature, tracer bullet, stories, tasks, decompose feature"
---

# /decompose -- Tracer Bullet Feature Decomposition

## Philosophy

Big features fail because they are built as big features. Decompose into tracer bullets -- each bullet cuts through all layers, delivers user-visible value, and fits in one PR. The first bullet is always the simplest end-to-end path that proves the architecture works. Every subsequent bullet adds one behavior.

---

## Anti-Pattern: Horizontal Decomposition

```
WRONG (horizontal):                    RIGHT (tracer bullets):
Epic: User Authentication             Epic: User Authentication

Tasks:                                 Bullet 1: Login (tracer bullet)
1. Build all database models           - Schema: users table
2. Build all service functions         - Logic: validate credentials
3. Build all API endpoints             - API: POST /login
4. Build all frontend components       - Test: login happy path
5. Wire everything together
                                       Bullet 2: Login failures
Each task touches one layer.           - Logic: invalid credentials error
No deliverable until step 5.           - API: 401 response
                                       - Test: invalid password, missing user

                                       Bullet 3: Registration
                                       - Schema: add email unique constraint
                                       - Logic: create user + hash password
                                       - API: POST /register
                                       - Test: register + then login
```

---

## Workflow

### Step 1: Gather Feature Description

```
/decompose [feature description]   --> decompose the described feature
/decompose                         --> interactive, ask for feature details
```

Gather:
- **What is the feature?** (high-level goal)
- **Who are the users?** (personas, API consumers, other services)
- **What are the acceptance criteria?** (how do we know it is done)

- [ ] Feature goal understood
- [ ] Users/consumers identified
- [ ] Acceptance criteria defined

### Step 2: Identify All Behaviors

List every user-facing behavior the feature provides:

| Category | Examples |
|----------|---------|
| Happy paths | Main success scenarios, primary use cases |
| Error paths | What goes wrong, how errors surface to users |
| Edge cases | Boundary conditions, empty states, limits |
| Admin/config | Settings, feature flags, operational controls |

Do not filter yet. List everything, then order.

- [ ] Happy paths listed
- [ ] Error paths listed
- [ ] Edge cases listed
- [ ] Admin/config behaviors listed

### Step 3: Order by Complexity

Sort behaviors from simplest to most complex:

1. **Simplest behavior = first tracer bullet (Bullet 1)** -- the thinnest end-to-end path
2. Next simplest = Bullet 2
3. Continue ordering...
4. Most complex or optional = last bullets

The first tracer bullet must:
- Touch every layer (schema, logic, API, tests)
- Be independently deployable
- Prove the architecture works end-to-end
- Be completable in a single session

- [ ] Behaviors ordered by complexity
- [ ] Tracer bullet identified (simplest end-to-end path)

### Step 4: Define Each Bullet

For each bullet, define:

| Field | Description |
|-------|-------------|
| **Name** | Descriptive 3-5 word title |
| **Behavior** | What the user can do after this bullet is deployed |
| **Layers touched** | Schema, logic, API, UI, tests |
| **Files to create/modify** | Specific file paths |
| **Tests to write** | Test names and what they verify |
| **Acceptance criteria** | User-verifiable conditions |
| **Dependencies** | Which bullets must come first |

- [ ] Each bullet fully defined
- [ ] Dependencies between bullets identified
- [ ] No bullet exceeds 10 files or 300 lines

### Step 5: Present Decomposition

```markdown
## Feature Decomposition: [Feature Name]

**Total Bullets:** [N]
**Estimated PRs:** [N]

### Bullet 1: [Name] (Tracer Bullet)
**Behavior:** [what the user can do after this]
**Layers:** [schema, logic, API, tests]
**Files:**
- `path/to/file` -- [what changes]
**Tests:**
- `test_name` -- [what it verifies]
**Acceptance:** [criteria]

### Bullet 2: [Name]
**Behavior:** [what this adds]
**Depends on:** Bullet 1
**Layers:** [list]
**Files:**
- `path/to/file` -- [what changes]
**Tests:**
- `test_name` -- [what it verifies]
**Acceptance:** [criteria]

### Bullet 3: [Name]
...
```

- [ ] All bullets documented
- [ ] Dependencies clear
- [ ] Each bullet is independently deployable

### Step 6: Approval

Present decomposition to the user. Adjust based on feedback:
- Merge bullets that are too small
- Split bullets that are too large
- Reorder if dependencies change

- [ ] User reviewed decomposition
- [ ] Adjustments applied
- [ ] Final decomposition approved

---

## Rules

- **Every bullet must be independently deployable** -- no bullet depends on a future bullet to work
- **Every bullet includes tests** -- no bullet ships without tests proving it works
- **First bullet is always the simplest end-to-end path** -- the tracer bullet
- **No bullet should touch more than 10 files or 300 lines** -- if it does, split it further
- **Each bullet = one PR** -- reviewable, mergeable, deployable independently
- **End-to-end, not layer-by-layer** -- every bullet touches all relevant layers, never just one layer

## Sizing Guidance

| Bullet Size | Action |
|-----------|--------|
| < 30 lines, 1-2 files | Consider merging with an adjacent bullet |
| 30-300 lines, 3-10 files | Good size |
| > 300 lines or > 10 files | Split into smaller bullets |
| Takes > 1 session | Definitely too large, split further |

## Integration with Plan-First Workflow

After decomposition is approved:
1. Each bullet becomes a plan (saved to `working/plans/`)
2. Implement bullets in order, one at a time
3. Each bullet goes through the full orchestrator loop (test, implement, verify, review)
4. Merge each bullet before starting the next

This ensures continuous integration -- the main branch is always deployable, and each merge proves the architecture holds.
