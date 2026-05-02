---
name: refactor
description: Use when restructuring existing code without changing behavior — extracting functions, splitting modules, or addressing tech debt and code smells
---

# /refactor — Safe Code Restructuring

Refactoring changes HOW code works without changing WHAT it does. The test suite is the contract. Big-bang rewrites lose the safety net; incremental commits keep it.

**REQUIRED BACKGROUND:**
- `superpowers:test-driven-development` — tests are the contract; without them, write characterization tests first.
- `superpowers:using-git-worktrees` — refactors run in their own worktree.

See `catalog.md` for common refactoring moves and `characterization-tests.md` for testing code you don't fully understand yet.

---

## Workflow

```
0. Worktree           — refactor-[scope]
0.5 Read .context.md  — for the module being refactored (run /explore-module if missing)
1. Goal               — what smells, what structural improvement is the goal
2. Baseline green     — make check must pass before touching anything
3. Coverage check     — run coverage on the target
                       >= 80%  → proceed
                       < 80%   → write characterization tests first
4. Plan               — list each refactoring move as a separately committable step
                       save to working/plans/
5. Execute one step at a time:
     change → make check
       green → commit with descriptive message
       red   → fix or revert this step
6. Update .context.md — structural changes
7. Review             — /review (architecture + code dimensions)
```

---

## The non-negotiables

- **Tests pass at every step**, not just at the end.
- **No feature additions.** Refactoring and features are separate commits.
- **No bug fixes.** If you find a bug, note it, finish refactoring, fix separately.
- **Commit after each logical step.** A bad step reverts to a known-good checkpoint.

---

## Options

- `/refactor [file or module]` — targeted
- `/refactor` — interactive

---

## Supporting files

- `catalog.md` — common refactoring moves, step-by-step
- `characterization-tests.md` — pinning behavior of code you don't fully understand
