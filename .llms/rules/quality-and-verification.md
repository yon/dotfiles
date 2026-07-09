# Quality & Verification Protocol

**Purpose:** the verification discipline for every task that creates or modifies code, and the test-hardening ladder for earning confidence beyond the baseline.

**The gate is finding-driven, not score-driven.** Build/test/lint/typecheck failures block outright. Review findings block by severity: a surviving Critical or Major blocks merge; Minors become tracked issues in PR review (per `aidlc.md` stage 6) or may be fixed inline in working-diff review. There is no numeric quality score.

______________________________________________________________________

## Test Hardening Ladder

**Principle: physical constraints over prompt rules.** Agents can rationalize around a written rule; they cannot rationalize around a failing test, a surviving mutant, or a threshold a tool reports. Whenever a quality property matters, prefer encoding it as a deterministic, tool-checked gate (test, coverage floor, complexity ceiling, mutation kill) over restating it in an instruction. Agents also invert the old economics: practices that were too tedious to sustain by hand (property-based testing, mutation analysis, pushing coverage into the last file) are now cheap to run routinely — the constraint is compute and review attention, not effort. (Doctrine per Robert C. Martin's "Agentic Discipline" work, 2026.)

**Layered tests are double-entry bookkeeping.** Acceptance criteria, unit tests, and end-to-end/live verification state the same intent at different altitudes; drift between layers is where bugs hide. Layers are valuable precisely because they overlap — but overlap is a cost, so apply it in proportion (see tiers).

### The ladder — apply pragmatically, not maximally

Baseline is mandatory everywhere; each rung above is EARNED by risk, not applied by default. "Just because we can doesn't mean we should."

| Rung | What | When it applies |
|------|------|-----------------|
| **Baseline (always)** | Criteria-tagged unit tests (TDD), coverage on new code, complexity/function-size ceilings, lint/typecheck | Every change, every project — this is the existing gate |
| **Property-based testing** | Agent assesses suitability, defines domain + invariants, generates, fixes what it finds | Functions with clear invariants: parsers, encoders/decoders, normalizers, arithmetic (budgets, scores, thresholds), round-trip pairs (serialize/deserialize, build/resolve), order-independent merges. Not for glue code or I/O shells |
| **Mutation testing** | Run the mutation tool; every surviving mutant is either killed by a new/strengthened test or explicitly waived with a reason | Periodic hardening passes and high-risk modules (identity/merge logic, money/budget math, security-relevant parsing) — NOT per-PR; it is compute-heavy. A surviving mutant means a test that never really tested |
| **Spec-level overload** | Separate acceptance-spec layer (BDD-style scenarios) + automated E2E/QA procedures beyond the unit suite | Large or multi-team surfaces, user-facing flows with UI/protocol contracts. Skip for small tools and libraries where criteria-tagged unit tests already state intent twice |

### Hardening pass (role, not a person)

A hardening pass over a module = close coverage gaps → identify PBT candidates and add them → run mutation → kill or waive survivors → re-run the full gate. Dispatch it as its own agent with this checklist; it edits tests only, never the code under test (if a mutant can only be killed by changing the code, that is a finding to report, not a refactor to make). Findings that reveal real bugs become tracked issues.

### Guardrails

- **Test-to-code volume is not the metric.** Kill rate, coverage of new code, and invariant coverage are.
- **Compute honesty**: mutation runs are CPU-bound; as suites grow, scope them (changed-module impact analysis) rather than silently skipping. Anything skipped or scoped down is reported, never silent — same no-silent-caps rule as everything else.
- **Human judgment stays on intent and feel.** Gates verify what was specified; only the owner judges whether the specified thing is the right thing.

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

1. **Do NOT present the task as complete.**
1. **Fix the failing check** — read the error output carefully.
1. **Re-run verification** — confirm the fix doesn't break anything else.
1. **If stuck after 2 attempts** — report the failure to the user with full error output.

Never suppress errors, skip tests, or disable lint rules to make verification pass.
