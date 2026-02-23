---
name: create-feature
description: "Create a new feature using TDD and tracer bullets. Trigger: new feature, add feature, implement feature, build feature"
---

# /create-feature -- Full TDD Feature Creation

## Philosophy

Features are built as tracer bullets -- each bullet cuts through all layers (data, logic, API, UI, tests). The first bullet is the simplest end-to-end path. Each subsequent bullet adds one behavior. Every bullet follows RED, GREEN, REFACTOR. This avoids the trap of building all tests first, then all code -- which creates feedback gaps where assumptions go unchallenged until integration, when they're expensive to fix.

---

## Anti-Pattern: Horizontal Slices

```
WRONG (horizontal):                    RIGHT (vertical):
1. Write ALL test cases               1. Write ONE test for simplest path
2. Write ALL database models           2. Implement just enough to pass
3. Write ALL service logic             3. Refactor
4. Write ALL API handlers              4. Write NEXT test (next behavior)
5. Wire everything together            5. Implement, refactor
6. Pray it works                       6. Repeat until done
```

Horizontal slicing delays feedback. You discover integration problems at step 5, when you've already committed to all your abstractions. Tracer bullets surface integration problems on bullet 1, when changing course is cheap.

---

## Workflow

```
Step 0: WORKTREE
  |__ EnterWorktree(name="feature-[name]")

Step 0.5: READ CONTEXT
  |__ Read .context.md for every module that will be touched
      (If .context.md is missing, run /explore-module first)

Step 1: PLANNING
  |__ Gather requirements:
  |     - What should it do? (behavior)
  |     - What should it NOT do? (constraints)
  |     - Who uses it? (API consumers, end users)
  |     - What existing code does it interact with?
  |__ Enter plan mode
  |__ Decompose into tracer bullets (see tracer-bullets.md)
  |     |__ First bullet = simplest end-to-end path
  |__ For each bullet: list tests, files, acceptance criteria
  |__ Save plan to working/plans/YYYY-MM-DD_feature-name.md
  |__ Present plan, wait for approval

Step 2: VALIDATE PLAN (optional but recommended)
  |__ Run /review-plan on the plan file

Step 3: BUILD (repeat for each bullet)
  |
  |__ RED: Write failing test for this bullet's behavior
  |     |__ Checklist:
  |           [ ] Test name describes behavior (see tests.md)
  |           [ ] Test fails for the RIGHT reason
  |           [ ] One behavior per test
  |
  |__ GREEN: Write minimum code to pass
  |     |__ Checklist:
  |           [ ] Only code needed for this test
  |           [ ] No speculative features
  |
  |__ REFACTOR: Clean up while green
  |     |__ Checklist:
  |           [ ] Tests still pass
  |           [ ] No duplication with previous bullets
  |
  |__ REPEAT for next bullet

Step 4: UPDATE CONTEXT
  |__ Update .context.md for every module touched

Step 5: VERIFY
  |__ make check (build + test + lint + typecheck)

Step 6: REVIEW
  |__ Spawn review subagents:
        - code-reviewer (always)
        - security-reviewer (if auth, user input, config, or sensitive data)
        - test-reviewer (if complex test logic)

Step 7: FIX & SCORE
  |__ Address Critical/Major findings (max 3 rounds)
  |__ Re-verify: make check
  |__ Present summary with quality score
```

---

## Supporting Files

- **tests.md** -- guidance on writing good tests (naming, structure, what to test per bullet)
- **tracer-bullets.md** -- how to decompose features into tracer bullets

---

## Options

- `/create-feature [name]` -- start with a named feature
- `/create-feature` -- interactive, asks for feature description
