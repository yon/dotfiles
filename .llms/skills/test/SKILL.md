---
name: test
description: "Run test suites and analyze results. Trigger: test, run tests, TDD, test suite, unit test, integration test"
---

# /test -- Run Test Suite

## Philosophy

Tests are the specification. A passing test suite means the software works as specified. A failing test means either the specification changed or the software is broken -- both require action. Writing tests first (TDD) produces better designs because the test drives the interface before the implementation exists.

---

## Anti-Pattern: Test After

```
WRONG (test after):                    RIGHT (test first):
1. Write all the code                  1. Write a failing test
2. "Now let me add some tests"         2. Write minimum code to pass
3. Tests match implementation          3. Test drives the design
4. Tests are tautological              4. Tests are specifications
```

---

## Workflow

### Step 1: Determine Scope

```
/test                     --> make test (full suite)
/test unit                --> make test-unit
/test int                 --> make test-int
/test integration         --> make test-int
/test e2e                 --> make test-e2e
/test [file or pattern]   --> run tests matching the pattern
/test mutation            --> run mutation testing (see advanced.md)
/test property            --> run property-based tests (see advanced.md)
/test flaky               --> identify and manage flaky tests (see advanced.md)
```

- [ ] Scope identified
- [ ] Correct make target or test command determined

### Step 2: Run

Execute the appropriate command:

| Scope | Command |
|-------|---------|
| Full suite | `make test` |
| Unit only | `make test-unit` |
| Integration | `make test-int` |
| E2E | `make test-e2e` |
| Specific file | Language-specific runner with file/pattern argument |

- [ ] Tests executed
- [ ] Output captured

### Step 3: Report

```
Test Results:
- Total: [N]
- Passed: [N]
- Failed: [N]
- Skipped: [N]
- Duration: [N]s
```

- [ ] Results summarized

### Step 4: On Failure

For each failing test:

1. **Show the assertion that failed** -- the exact line and assertion
2. **Show expected vs actual values** -- what was expected, what was produced
3. **Analyze the likely cause** -- trace the failure back to the source
4. **Suggest fixes** -- propose a fix but do NOT apply without permission

```
FAILED: test_user_login_with_expired_token
  File: tests/unit/test_auth.py:45
  Assert: response.status_code == 401
  Expected: 401
  Actual: 500

  Likely cause: Token expiration check raises unhandled exception
  instead of returning 401 response.

  Suggested fix: Add try/except in validate_token() to catch
  ExpiredTokenError and return appropriate HTTP response.
```

- [ ] Each failure analyzed
- [ ] Root cause identified (not just symptoms)
- [ ] Fix suggested without applying

---

## TDD Mode

`/test watch` -- suggest the watch mode command for the project's test runner:

| Runner | Watch Command |
|--------|--------------|
| pytest | `pytest-watch` or `ptw` |
| vitest | `vitest --watch` |
| jest | `jest --watch` |
| cargo test | `cargo watch -x test` |

---

## Supporting Files

- **`advanced.md`** -- Property-based testing, mutation testing, contract testing, snapshot testing, flaky test management
