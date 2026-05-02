---
name: test
description: Use when running, debugging, or extending the test suite — unit, integration, e2e, property, mutation, or flaky-test management
---

# /test — Run and Analyze Tests

Tests are the specification. A green suite means the software does what was specified; a red one means either the spec changed or the code broke — both demand action.

For TDD itself (writing tests first, RED/GREEN/REFACTOR), use `superpowers:test-driven-development`. This skill is about running and analyzing.

See `advanced.md` for property-based, mutation, contract, and snapshot testing plus flaky-test management.

---

## Scope

| Invocation | Command |
|---|---|
| `/test` | `make test` (full suite) |
| `/test unit` | `make test-unit` |
| `/test int` or `/test integration` | `make test-int` |
| `/test e2e` | `make test-e2e` |
| `/test [pattern]` | runner with file/pattern argument |
| `/test mutation` | mutation tests (see `advanced.md`) |
| `/test property` | property-based tests |
| `/test flaky` | identify and manage flaky tests |
| `/test watch` | suggest the project's watch command |

---

## Reporting

```
Total: N   Passed: N   Failed: N   Skipped: N   Duration: Ns
```

For each failure:
1. Show the failing assertion with file:line.
2. Expected vs actual.
3. Trace the likely cause back to the source.
4. Suggest a fix — **do not apply** without permission.

---

## Watch mode

| Runner | Watch |
|---|---|
| pytest | `pytest-watch` / `ptw` |
| vitest | `vitest --watch` |
| jest | `jest --watch` |
| cargo | `cargo watch -x test` |
