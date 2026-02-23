# Quality Gates & Verification Protocol

**Purpose:** Define objective quality thresholds and enforce verification at the end of every task that creates or modifies code. A Stop hook enforces verification automatically.

______________________________________________________________________

## Scoring System

- **80/100 = Commit threshold** — Good enough to save progress
- **90/100 = PR/Merge threshold** — High quality, ready for code review and merge
- **95/100 = Release threshold** — Production-ready, fully validated

______________________________________________________________________

## Source Code Deductions

### Critical (Must Pass for Commit)

| Issue | Deduction |
|-------|-----------|
| Build failure | -100 (auto-fail) |
| Test failure | -100 (auto-fail) |
| Type check error | -20 per error |
| Security vulnerability (high/critical) | -25 per finding |
| Lint error (not warning) | -5 per error |

### Major (Should Pass for PR)

| Issue | Deduction |
|-------|-----------|
| Missing tests for new code | -10 per uncovered function |
| Test coverage below threshold | -5 per 5% below target |
| Missing error handling at boundaries | -5 per instance |
| Hardcoded secrets/credentials | -25 (auto-fail if committed) |
| Mutable shared state without synchronization | -10 per instance |
| God function (> 50 lines) | -3 per function |
| Deep nesting (> 3 levels) | -2 per instance |

### Minor (Nice-to-Have for Excellence)

| Issue | Deduction |
|-------|-----------|
| Missing docstring on public API | -1 per function |
| Inconsistent naming convention | -1 per instance |
| TODO/FIXME/HACK without ticket reference | -1 per instance |
| Magic numbers without named constants | -1 per instance |

______________________________________________________________________

## Test Code Deductions

### Critical

| Issue | Deduction |
|-------|-----------|
| Test that never fails (always passes) | -15 per test |
| Test with no assertions | -10 per test |
| Test that depends on external state | -10 per test |

### Major

| Issue | Deduction |
|-------|-----------|
| Missing edge case coverage | -5 per gap |
| Test names don't describe behavior | -2 per test |
| Test setup/teardown leaks state | -5 per instance |
| Missing negative/error path tests | -5 per function |

______________________________________________________________________

## Engineering Principles Compliance

### Violations (deducted from score)

| Principle Violated | Deduction |
|-------------------|-----------|
| DRY — duplicated logic (> 10 lines identical) | -5 per instance |
| KISS — unnecessary abstraction layer | -3 per instance |
| SOLID — class/module with multiple responsibilities | -3 per instance |
| Immutability — unnecessary mutation of shared state | -5 per instance |
| DI — hardcoded dependency instead of injection | -3 per instance |
| Strong typing — use of `any` / `interface{}` / raw strings for types | -2 per instance |

______________________________________________________________________

## TDD Compliance Bonus

| Practice | Bonus |
|----------|-------|
| Tests written before implementation (visible in git history) | +5 |
| All public functions have corresponding tests | +3 |
| Edge cases and error paths tested | +2 |
| Test names follow Given/When/Then or equivalent pattern | +1 |

Maximum bonus: +10 (score capped at 100).

______________________________________________________________________

## Quality Gate Enforcement

### Commit Gate (score < 80)

Block commit. List blocking issues with required actions.

### PR Gate (score < 90)

Allow commit but warn. List issues with recommendations to reach PR quality.

### Release Gate (score < 95)

Allow PR but flag. List remaining polish items for release readiness.

### User can override with justification when needed.

______________________________________________________________________

## Verification Checklist

**At the end of EVERY task that creates or modifies code, verify the output works correctly.**

### 1. Build Verification

- [ ] Run `make build` — must complete with zero errors
- [ ] All compilation warnings addressed or documented
- [ ] No new deprecation warnings introduced

### 2. Test Verification

- [ ] Run `make test` — all tests must pass
- [ ] New code has corresponding tests (written FIRST per TDD)
- [ ] No previously passing tests now fail (regression check)
- [ ] Tests actually test behavior, not implementation details

### 3. Lint Verification

- [ ] Run `make lint` — zero errors, zero new warnings
- [ ] Code follows project formatting conventions
- [ ] No disabled lint rules without justification

### 4. Type Check Verification (if applicable)

- [ ] Run `make typecheck` — zero errors
- [ ] No use of escape hatches (`any`, `as unknown`, `// @ts-ignore`) without justification
- [ ] New types are properly defined and exported

### 5. Security Verification (for sensitive changes)

- [ ] No hardcoded credentials, API keys, or secrets
- [ ] No new dependencies with known vulnerabilities
- [ ] Input validation at system boundaries
- [ ] No SQL injection, XSS, or command injection vectors

### 6. Integration Verification (if applicable)

- [ ] Run `make test-int` if integration tests exist
- [ ] External service interactions use proper error handling
- [ ] Database migrations run cleanly (up and down)

______________________________________________________________________

## The Quick Path

For most tasks, run:

```bash
make check
```

This runs build + test + lint + typecheck in sequence. If `make check` passes, verification is complete for commit-level quality.

______________________________________________________________________

## Common Pitfalls

| Pitfall | What Goes Wrong | Prevention |
|---------|----------------|------------|
| "Tests pass locally" | Environment-specific assumptions | Use CI-equivalent commands |
| New dependency not declared | Build works because of cached install | Run `make clean && make deps && make build` |
| Tests pass but don't test anything | Empty test bodies, no assertions | Review agent checks for this |
| Lint passes but format is wrong | Linter and formatter disagree | Run both: `make lint && make format` |
| Build succeeds but runtime fails | Missing runtime config/env vars | Test with production-like config |

______________________________________________________________________

## Verification by Task Type

| Task Type | Minimum Verification |
|-----------|---------------------|
| New feature | `make check` + new tests green |
| Bug fix | `make check` + regression test added |
| Refactoring | `make check` + no behavior changes in tests |
| Dependency update | `make clean && make deps && make check` |
| Config change | `make build` + affected integration tests |
| Documentation only | Markdown renders correctly, links valid |
| CI/CD change | Pipeline runs successfully |

______________________________________________________________________

## When Verification Fails

1. **Do NOT present the task as complete.** The Stop hook will catch this.
1. **Fix the failing check** — read the error output carefully.
1. **Re-run verification** — confirm the fix doesn't break anything else.
1. **If stuck after 2 attempts** — report the failure to the user with full error output.

Never suppress errors, skip tests, or disable lint rules to make verification pass.
