# Advanced Testing Techniques

Deep reference for testing techniques beyond standard unit and integration tests. Use these when standard tests are insufficient to build confidence in correctness.

---

## Property-Based Testing

### What

Test that properties hold for ALL valid inputs, not just specific hand-picked examples. The framework generates hundreds or thousands of random inputs and checks that your assertions hold for every one.

### When to Use

- Functions with wide input ranges (parsers, validators, serializers)
- Mathematical properties (commutativity, associativity, idempotency)
- Serialization round-trips (encode then decode should return original)
- Data structure invariants (sorted list stays sorted after insert)
- Any function where you can express "for all valid X, property P holds"

### Tools by Language

| Language | Library | Install |
|----------|---------|---------|
| Python | Hypothesis | `pip install hypothesis` |
| TypeScript/JS | fast-check | `npm install fast-check` |
| Rust | proptest | `cargo add proptest --dev` |
| Rust | quickcheck | `cargo add quickcheck --dev` |

### Example (Python with Hypothesis)

```python
from hypothesis import given, strategies as st

@given(st.lists(st.integers()))
def test_sort_preserves_length(xs):
    assert len(sorted(xs)) == len(xs)

@given(st.lists(st.integers()))
def test_sort_is_idempotent(xs):
    assert sorted(sorted(xs)) == sorted(xs)

@given(st.lists(st.integers(), min_size=1))
def test_sort_first_element_is_minimum(xs):
    assert sorted(xs)[0] == min(xs)
```

### Example (TypeScript with fast-check)

```typescript
import fc from 'fast-check';

test('sort preserves length', () => {
  fc.assert(
    fc.property(fc.array(fc.integer()), (arr) => {
      expect([...arr].sort()).toHaveLength(arr.length);
    })
  );
});

test('JSON round-trip', () => {
  fc.assert(
    fc.property(fc.anything(), (value) => {
      expect(JSON.parse(JSON.stringify(value))).toEqual(value);
    })
  );
});
```

### Tips

- Start with simple properties: length preservation, idempotency, round-trips
- Use `@example` decorators (Hypothesis) to pin specific edge cases
- When a property test fails, the framework shrinks the input to a minimal failing case -- read it carefully, it reveals the root cause

---

## Mutation Testing

### What

Automatically modify (mutate) your source code and check if your tests catch the changes. Each mutation that tests fail to catch is a "surviving mutant" -- indicating a gap in test coverage.

### When to Use

- Validating test suite quality for critical paths (auth, payments, data integrity)
- After achieving high line coverage to verify the coverage is meaningful
- During code review to assess whether tests are actually testing behavior

### Tools

| Language | Tool | Install |
|----------|------|---------|
| Python | mutmut | `pip install mutmut` |
| TypeScript/JS | Stryker | `npm install @stryker-mutator/core` |
| Rust | cargo-mutants | `cargo install cargo-mutants` |

### Targets

- **>80% mutation kill rate** for critical paths
- **>60% mutation kill rate** for general application code
- Focus on surviving mutants in critical code, not 100% kill rate everywhere

### Practical Guidance

- Mutation testing is **slow** -- run periodically, not on every commit
- Start with a small scope: one module or one critical file
- Common surviving mutations indicate weak test assertions:
  - Boundary conditions not tested (off-by-one)
  - Return values not asserted
  - Error paths not exercised
  - Boolean logic not fully covered

---

## Contract Testing

### What

Test the API boundaries between services. Consumers define what they expect from a provider; providers verify they meet those expectations. Both sides run tests independently.

### When to Use

- Microservice architectures with service-to-service calls
- API integrations with external services
- Any system where producer and consumer deploy independently

### Tools

| Tool | Languages | Best For |
|------|-----------|----------|
| Pact | Multi-language | Consumer-driven contracts |
| Schemathesis | Python | OpenAPI spec validation |
| Dredd | Multi-language | API Blueprint / OpenAPI |

### Pattern: Consumer-Driven Contracts

```
1. Consumer defines expectations:
   "When I call GET /users/123, I expect { id: 123, name: string, email: string }"

2. Expectations become a contract file (pact)

3. Provider verifies the contract:
   "Does my /users/123 endpoint return what the consumer expects?"

4. Both sides run contract tests independently in CI
```

### Key Principle

The consumer drives the contract because the consumer knows what it actually needs. The provider may return more data than the consumer uses -- that is fine. The contract only covers what the consumer depends on.

---

## Snapshot Testing

### What

Capture the output of a function or component and compare it against a stored "snapshot" file. On subsequent runs, the test fails if the output differs from the stored snapshot.

### When to Use

- Complex rendered output (HTML, CLI output, formatted reports)
- Serialized data structures (JSON responses, config generation)
- Any output where manually writing expected values is tedious and error-prone

### Tools

| Language | Tool | Notes |
|----------|------|-------|
| Python | pytest-snapshot, syrupy | syrupy is more modern |
| TypeScript/JS | jest (built-in), vitest (built-in) | `.toMatchSnapshot()` |
| Rust | insta | `cargo add insta --dev` |

### WARNING: Snapshot Fragility

Snapshots are fragile if the output changes frequently. Rules to follow:

- **Always review snapshot updates manually** -- never blindly accept `--update`
- **Do not snapshot non-deterministic output** -- timestamps, random IDs, memory addresses
- **Ask yourself: am I testing behavior or formatting?** If formatting, a snapshot is fine. If behavior, write a targeted assertion instead.
- **Stabilize non-deterministic fields** -- replace timestamps with fixed values, sort unordered collections

---

## Test Flakiness Management

### What Flaky Tests Are

A flaky test passes sometimes and fails sometimes without any code changes. Flaky tests erode trust in the test suite -- developers stop investigating failures because "it's probably flaky."

### Detection

- Track pass/fail rates per test over multiple CI runs
- Flag any test that fails >1% of runs as potentially flaky
- Many CI systems (GitHub Actions, CircleCI) support automatic retry -- use retry data to identify flaky tests

### Quarantine Protocol

1. **Identify** -- test fails intermittently, passes on retry
2. **Quarantine** -- move to a separate test suite that does not block CI
3. **Deadline** -- 2 weeks to fix or delete
4. **Fix or delete** -- no exceptions; a quarantined test that stays forever is worse than no test

### Common Causes and Fixes

| Cause | Symptom | Fix |
|-------|---------|-----|
| Time-dependent logic | Fails near midnight, month boundaries | Inject clock, freeze time in tests |
| Shared mutable state | Fails when tests run in different order | Isolate test data, use transactions, fresh fixtures |
| Network calls | Timeouts, connection refused | Mock external services, use test doubles |
| Race conditions | Intermittent failures in async code | Use proper synchronization, deterministic scheduling |
| Order dependency | Passes alone, fails in suite | Make each test independent, setup/teardown properly |
| Resource exhaustion | Fails on CI, passes locally | Close connections, limit parallelism, increase CI resources |
| Floating point | Fails on different architectures | Use approximate comparisons with epsilon |

### Prevention

- Write tests that are **deterministic by construction**: no real clocks, no real network, no shared state
- Use factories instead of shared fixtures
- Run tests in random order during CI to surface order dependencies early
