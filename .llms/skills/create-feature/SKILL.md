---
name: create-feature
description: Use when adding a new feature, capability, or end-user-visible behavior that spans multiple layers
---

# /create-feature — TDD Feature Creation in Tracer Bullets

Build features as **vertical slices**, not horizontal layers. Each slice (a "tracer bullet") cuts through every layer it needs and ships one user-visible behavior. The first bullet is the simplest end-to-end path that proves the architecture; each next bullet adds one behavior.

**REQUIRED BACKGROUND:**
- `superpowers:test-driven-development` — RED/GREEN/REFACTOR is the core loop here.
- `superpowers:writing-plans` — for the per-bullet plan files.
- `superpowers:executing-plans` — for the build phase.
- `superpowers:using-git-worktrees` — for isolation.

See `tracer-bullets.md` for decomposition guidance and `tests.md` for test-naming and structure.

---

## Why vertical, not horizontal

Horizontal slicing (all DB → all logic → all API → wire up) postpones every integration question to the end, where pivots are expensive. Tracer bullets surface integration on bullet 1, where they're cheap.

---

## Workflow

```
0. Worktree         — `superpowers:using-git-worktrees`, named feature-[name]
1. Plan             — gather requirements, decompose into bullets (`superpowers:writing-plans`)
2. Validate plan    — /review-plan
3. Build per bullet — RED → GREEN → REFACTOR (see superpowers:test-driven-development)
4. Verify           — make check
5. Review           — /review (always); add security-reviewer if auth/input/secrets touched
6. Fix & score      — Critical/Major findings; re-verify; present score
```

If the project uses per-module `.context.md` files (see `/explore-module`), read them for every module you'll touch before planning, and update them after building.

Each bullet is its own miniature loop of steps 3–5. Don't move on until the current bullet is green.

---

## Per-bullet checklist

| Phase | Done when |
|---|---|
| RED | one new test, fails for the right reason, names a behavior |
| GREEN | minimum code to pass, no speculative features |
| REFACTOR | tests still green, no duplication with previous bullets |

---

## Options

- `/create-feature [name]` — start with a named feature
- `/create-feature` — interactive

---

## Supporting files

- `tests.md` — naming, structure, what to test per bullet
- `tracer-bullets.md` — how to decompose features into bullets
