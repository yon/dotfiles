# Testing Protocol — TDD-First Development

**Tests are not an afterthought. Tests are the FIRST code written for every feature and bug fix.**

______________________________________________________________________

## The TDD Cycle (Red-Green-Refactor)

Every implementation follows this cycle:

### 1. RED — Write a Failing Test

- Write a test that describes the desired behavior
- Run it — confirm it FAILS (if it passes, the test is wrong or the feature already exists)
- The test name should read like a specification: `test_user_cannot_login_with_expired_token`

### 2. GREEN — Write Minimum Code to Pass

- Write the simplest code that makes the test pass
- Do NOT add extra functionality, error handling, or edge cases yet
- "Make it work" before "make it right"

### 3. REFACTOR — Clean Up While Green

- Improve the code structure while keeping all tests green
- Extract functions, rename variables, remove duplication
- Run tests after every refactoring step

### Repeat

- Add the next test (next behavior, next edge case)
- Continue the cycle until all acceptance criteria are met

______________________________________________________________________

## Test Structure

### Naming Convention

Tests should describe behavior, not implementation:

```
# GOOD — describes behavior
test_empty_cart_returns_zero_total
test_discount_applies_when_coupon_is_valid
test_api_returns_404_when_user_not_found

# BAD — describes implementation
test_calculate_method
test_discount_function
test_get_user
```

### Arrange-Act-Assert (AAA) / Given-When-Then

Every test follows this structure:

```
# Arrange (Given) — set up preconditions
# Act (When) — execute the behavior under test
# Assert (Then) — verify the expected outcome
```

Each section should be visually separated. One act and one logical assertion per test.

______________________________________________________________________

## Test Categories

### Unit Tests (`tests/unit/`)

- Test individual functions, classes, or modules in isolation
- Dependencies are mocked/stubbed
- Must be **fast** (< 100ms per test, entire suite < 10s)
- Must be **deterministic** (no randomness without seeding, no external deps)
- Must be **independent** (no shared mutable state between tests)
- Run on every commit: `make test-unit`

### Integration Tests (`tests/integration/`)

- Test interactions between components (DB, APIs, message queues)
- Use real dependencies or close approximations (testcontainers, in-memory DBs)
- Slower is acceptable, but still aim for < 1s per test
- Test realistic scenarios, not individual methods
- Run before PR: `make test-int`

### End-to-End Tests (`tests/e2e/`)

- Test the system from the user's perspective
- Use the actual deployment target (or staging environment)
- Focus on critical user journeys, not comprehensive coverage
- Fewest in number (test pyramid: many unit, some integration, few E2E)
- Run before release: `make test-e2e`

______________________________________________________________________

## What MUST Be Tested

### Always Test

- **Happy path** — the normal successful case
- **Edge cases** — empty inputs, zero values, boundary conditions, max lengths
- **Error paths** — what happens when things go wrong (invalid input, timeouts, failures)
- **Business rules** — any conditional logic that affects outcomes
- **State transitions** — when an entity changes state, verify pre/post conditions

### Test for Every Bug Fix

- **Regression test FIRST** — before fixing the bug, write a test that reproduces it
- The test must FAIL before the fix and PASS after
- This prevents the bug from ever returning

### What NOT to Test

- Framework/library internals (trust your dependencies)
- Private methods directly (test them through public interfaces)
- Trivial getters/setters with no logic
- Generated code (test the generator or the output behavior, not the generated code itself)

______________________________________________________________________

## Test Quality Standards

### A Test Is Good If

- It fails when the behavior it tests is broken
- It passes when the behavior is correct
- It tests ONE behavior (single reason to fail)
- It's readable as documentation of that behavior
- It runs fast and deterministically
- It doesn't depend on other tests or execution order

### A Test Is Bad If

- It never fails (useless — delete it)
- It tests implementation details (brittle — refactor it)
- It has multiple assertions testing different behaviors (split it)
- It requires complex setup that obscures intent (simplify it)
- It uses sleep/wait for timing (use proper async patterns)
- It depends on global state or test execution order (isolate it)

______________________________________________________________________

## Mocking Guidelines

### When to Mock

- External services (HTTP APIs, databases in unit tests, message queues)
- Time-dependent behavior (`now()`, timers, schedulers)
- Non-deterministic behavior (random numbers, UUIDs)
- Expensive operations (file I/O in unit tests, network calls)

### When NOT to Mock

- The code under test (obvious, but happens)
- Simple value objects or data structures
- In integration tests (use real or close-to-real deps)
- Everything — if you mock everything, you're testing mocks, not code

### Mock Hygiene

- Verify mock interactions only when the INTERACTION is the behavior you're testing
- Prefer stubs (return canned data) over mocks (verify calls) when possible
- Reset/clean up mocks between tests

______________________________________________________________________

## Coverage Guidelines

- **Target:** 80%+ line coverage for application code (not tests, configs, or generated code)
- **Focus on behavior coverage** over line coverage — 100% line coverage with weak assertions is worthless
- **Critical paths:** 100% coverage for authentication, authorization, payment, and data mutation logic
- **View coverage as a floor, not a ceiling** — high coverage doesn't mean good tests, but low coverage means missing tests

______________________________________________________________________

## Test Performance

- **Unit test suite:** Must complete in < 30 seconds
- **Integration test suite:** Must complete in < 5 minutes
- **Parallelize:** Tests should be independent and safe to run in parallel
- **No external dependencies in unit tests:** If a unit test touches the network or filesystem, it's an integration test in disguise

______________________________________________________________________

## TDD for Bug Fixes — Special Protocol

1. **Reproduce:** Write a test that demonstrates the bug (must FAIL)
1. **Verify the test:** Run the test — confirm it fails for the RIGHT reason
1. **Fix:** Write the minimal code change to fix the bug
1. **Verify the fix:** Run the test — confirm it now PASSES
1. **Run full suite:** Confirm no regressions: `make test`
1. **Commit the test WITH the fix** — they travel together, always

______________________________________________________________________

## Advanced Testing Techniques

### Property-Based Testing

Use property-based testing when a function should satisfy invariants across a wide input space.

**When to use:**

- Functions with wide input spaces (parsers, serializers, math operations)
- Mathematical properties (commutativity, associativity, idempotency)
- Serialization round-trips (`deserialize(serialize(x)) == x`)
- Data transformations where output properties are predictable

**Tools by language:**

| Language | Library |
|----------|---------|
| Python | Hypothesis |
| TypeScript/JS | fast-check |
| Rust | proptest |

**Write properties that hold for ALL valid inputs, not just examples:**

```
# Example: a sorted list should always have length equal to the input
@given(lists(integers()))
def test_sort_preserves_length(xs):
    assert len(sorted(xs)) == len(xs)
```

### Mutation Testing

Mutation testing validates that your tests actually catch bugs by introducing small changes (mutations) to your code and checking whether tests fail.

**When to use:**

- Validating test suite quality for critical paths
- After a major refactor, to ensure tests are still meaningful
- Periodically as a health check (not on every commit — it's slow)

**Tools by language:**

| Language | Library |
|----------|---------|
| Python | mutmut |
| TypeScript/JS | Stryker |
| Rust | cargo-mutants |

**Targets:**

- \>80% mutation kill rate for critical paths (auth, payments, data mutation)
- \>60% mutation kill rate for general application code
- Run periodically (weekly or per-sprint), not on every commit

### Contract Testing

Contract testing verifies that API boundaries between services honor their agreed-upon contracts.

**When to use:**

- Testing API boundaries between microservices
- Validating API compatibility after changes
- Ensuring providers don't break consumers

**Tools:**

| Tool | Approach |
|------|----------|
| Pact | Consumer-driven contracts |
| Schemathesis | OpenAPI/Swagger-based fuzzing |
| dredd | API Blueprint / OpenAPI validation |

**Consumer-driven contracts:** consumers define the expectations, providers verify they meet them. This catches breaking changes before deployment.

### Snapshot Testing

Snapshot testing captures the output of a function and compares it against a stored reference.

**When to use:**

- Complex output that is tedious to assert manually (rendered HTML, serialized data, CLI output)
- Output that changes intentionally but rarely

**Warnings:**

- Snapshots are **fragile** — any change to output format triggers a failure
- Only use for output that changes **intentionally**, not frequently
- **Always review snapshot updates manually** — don't blindly accept updates
- Consider snapshots a supplement to behavioral assertions, not a replacement

### Test Flakiness Management

Flaky tests erode trust in the test suite. Manage them aggressively.

**Detection:**

- Track test pass/fail rates over time in CI
- A test that fails > 1% of runs is flaky

**Quarantine protocol:**

1. Move flaky test to a separate suite (`tests/quarantine/`) that doesn't block CI
1. File a ticket with the flaky test and suspected cause
1. **Fix-or-delete deadline: 2 weeks.** If not fixed in 2 weeks, delete it.
1. Never leave quarantined tests indefinitely — they rot.

**Common causes and fixes:**

| Cause | Fix |
|-------|-----|
| Time-dependent logic | Inject a clock, freeze time in tests |
| Shared mutable state | Isolate test state, use fresh fixtures |
| Network calls in unit tests | Mock external services |
| Race conditions | Use proper synchronization, avoid sleep-based waits |
| Order-dependent tests | Ensure tests are fully independent |
