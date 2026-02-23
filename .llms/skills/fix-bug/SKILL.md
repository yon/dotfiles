---
name: fix-bug
description: "Fix a bug with root cause analysis and regression testing. Trigger: fix bug, broken, regression, error, crash, not working, failing"
---

# /fix-bug -- Root Cause Bug Fixing

## Philosophy

Every bug has a root cause, and symptoms are not causes. A null pointer exception is a symptom -- the root cause is that invalid data wasn't caught at the boundary. Fix the root cause, not the symptom. Always write a regression test BEFORE fixing -- this proves the bug exists and ensures it never returns. A bug fix without a regression test is an invitation for the bug to come back.

---

## Anti-Pattern: Symptom-Chasing

```
WRONG (symptom fix):                   RIGHT (root cause fix):
1. See NullPointerException            1. See NullPointerException
2. Add null check where it crashes     2. Write regression test
3. Ship it                             3. Trace: WHY is this null?
4. Bug returns in different form       4. Find: validation missing at API boundary
                                       5. Fix: add validation at boundary
                                       6. Verify: regression test passes
```

Symptom-chasing treats every crash site as the problem. But a null that shouldn't exist usually means it was allowed in somewhere upstream. Adding a null check at the crash site doesn't stop the null from propagating through other code paths. Fixing at the boundary stops it everywhere.

---

## Workflow

```
Step 0: WORKTREE (mandatory)
  |__ EnterWorktree(name="fix-[issue]")

Step 0.5: READ CONTEXT
  |__ Read .context.md for the module where the bug manifests

Step 1: GATHER INFORMATION
  |__ Expected behavior?
  |__ Actual behavior?
  |__ Steps to reproduce?
  |__ When did it start? (recent change? always broken?)
  |__ Any error messages or logs?

Step 2: REPRODUCE WITH TEST
  |__ Write a test that demonstrates the failure
  |__ Test MUST fail before the fix
  |__ Name: test_[scenario]_should_[expected_behavior]
  |__ Checklist:
        [ ] Test fails
        [ ] Test fails for the RIGHT reason
        [ ] Test describes correct behavior (not buggy behavior)

Step 3: ROOT CAUSE ANALYSIS
  |__ Read relevant code
  |__ Trace execution path from input to failure
  |__ Identify WHERE behavior diverges from expectation
  |__ Ask: "Why does this happen?" then ask "Why?" again
  |     (Keep asking until you reach the actual cause)
  |__ Document the root cause (not the symptom)
  |__ Checklist:
        [ ] Root cause identified (not symptom)
        [ ] Can explain WHY the bug occurs
        [ ] Can explain why the fix prevents recurrence

Step 4: PLAN & FIX
  |__ For non-trivial bugs: save plan to working/plans/
  |__ Implement minimal fix at the root cause
  |__ Don't refactor unrelated code
  |__ Checklist:
        [ ] Fix addresses root cause
        [ ] Fix is minimal (no scope creep)
        [ ] No unrelated changes mixed in

Step 5: VERIFY
  |__ Regression test now PASSES
  |__ make check -- all green, no regressions
  |__ Checklist:
        [ ] Regression test passes
        [ ] Full suite passes
        [ ] No new warnings introduced

Step 6: UPDATE CONTEXT
  |__ Update .context.md with bug root cause and fix description

Step 7: REVIEW
  |__ Spawn review subagents:
        - code-reviewer (fix quality)
        - test-reviewer (regression test quality)

Step 8: DELIVER
  |__ Present summary:
  |     - Root cause explanation
  |     - What was changed (minimal diff)
  |     - Regression test added
  |     - Full suite results
  |__ Commit message format:
        fix(scope): short description

        Root cause: [explanation]
        Regression test: [test name]

        Closes #[issue]
```

---

## Rules

- **ALWAYS write regression test BEFORE fixing** -- the test proves the bug exists
- **Test must FAIL before fix and PASS after** -- this is non-negotiable
- **Fix the root cause, not the symptom** -- ask "why?" until you find the real cause
- **Minimal change** -- fix the bug, don't refactor surrounding code
- **Commit test WITH fix** -- they travel together, always

---

## Options

- `/fix-bug [issue number or description]` -- start with context
- `/fix-bug` -- interactive, asks for bug description
