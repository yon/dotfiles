---
name: refactor
description: "Safely refactor existing code with tests as the contract. Trigger: refactor, tech debt, code smell, clean up, restructure, reorganize"
---

# /refactor -- Safe Code Restructuring

## Philosophy

Refactoring changes HOW code works without changing WHAT it does. The test suite is the contract -- if tests pass before and after, the refactoring is correct. For code without tests, write characterization tests first (see characterization-tests.md). Break refactoring into tiny commits, each leaving the codebase in a working state. Never mix refactoring with feature additions or bug fixes -- they are separate concerns with separate commits.

---

## Anti-Pattern: Big Bang Refactoring

```
WRONG (big bang):                      RIGHT (incremental):
1. Rewrite entire module               1. Add test for current behavior
2. Update all callers                   2. Make one small change
3. Fix cascading failures              3. Run tests -- still green?
4. Debug for hours                     4. Commit
5. Give up and revert                  5. Repeat (each commit is a safe checkpoint)
```

Big bang refactoring fails because you lose your safety net. When everything changes at once, a test failure could be caused by any of dozens of changes. Incremental refactoring means each commit is one change, so a failure points to exactly one cause -- and you can revert just that one step.

---

## Workflow

```
Step 0: WORKTREE
  |__ EnterWorktree(name="refactor-[scope]")

Step 0.5: READ CONTEXT
  |__ Read .context.md for the module being refactored
      (If missing, run /explore-module first)

Step 1: GATHER DESCRIPTION
  |__ What smells? (god function, duplication, tight coupling, etc.)
  |__ What's the goal? (smaller functions, better names, extract module, etc.)
  |__ Checklist:
        [ ] Specific code identified
        [ ] Goal is structural, not behavioral

Step 2: VERIFY CURRENT STATE
  |__ Read .context.md for module context
  |__ Run make check -- must be GREEN before starting
  |__ Checklist:
        [ ] Baseline is green
        [ ] .context.md is current (explore only if missing)

Step 3: CONSIDER ALTERNATIVES
  |__ Is this the right refactoring? Are there simpler options?
  |__ What's the risk? What could break?
  |__ Present alternatives if non-obvious

Step 4: DETAILED INTERVIEW
  |__ Scope: what's IN the refactoring?
  |__ Out of scope: what are we NOT changing?
  |__ Save plan to working/plans/YYYY-MM-DD_refactor-description.md
  |__ Wait for approval

Step 5: CHECK TEST COVERAGE
  |__ Run coverage for target code
  |__ Decision point:
  |     Coverage >= 80%  -->  proceed to Step 6
  |     Coverage < 80%   -->  write characterization tests first
  |                            (see characterization-tests.md)
  |__ Checklist:
        [ ] Tests exist for behaviors being refactored
        [ ] Tests pass before changes

Step 6: BREAK INTO TINY COMMITS
  |__ List each refactoring move as a separate step
  |__ Each step is independently committable
  |__ Each step leaves codebase working
  |__ Common moves: see catalog.md

Step 7: EXECUTE (one commit at a time)
  For each step:
    |__ Make the change
    |__ Run make check
    |__ Decision point:
    |     GREEN  -->  commit with descriptive message
    |     RED    -->  fix or revert this step
    |__ Checklist:
          [ ] Tests pass
          [ ] No behavior change
          [ ] Committed

Step 8: FINALIZE
  |__ Update .context.md with structural changes
  |__ Spawn review subagents:
  |     - architecture-reviewer (structural assessment)
  |     - code-reviewer (quality and principles)
  |__ Score and present summary
  |__ Checklist:
        [ ] All tests pass
        [ ] No behavior changes
        [ ] .context.md updated
```

---

## Supporting Files

- **catalog.md** -- catalog of common refactoring moves with step-by-step guides
- **characterization-tests.md** -- how to test code you don't fully understand before refactoring it

---

## Rules

- **Tests must pass at every step** -- not just at the end
- **No feature additions** -- refactoring and features are separate commits
- **No bug fixes** -- if you find a bug, note it, finish refactoring, fix separately
- **Commit after each logical step** -- so you can revert one step without losing all work

---

## Options

- `/refactor [file or module]` -- targeted refactoring
- `/refactor` -- interactive, asks what to improve
