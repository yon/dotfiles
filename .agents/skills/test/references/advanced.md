# Advanced testing

Choose techniques for the behavior and failure modes that matter. Start with the tools already in
the project; verify current official documentation before adding or configuring a version-dependent
tool. Each added technique should have a repeatable command, useful assertions, and an explicit
scope or runtime budget. Report work that was not completed within that budget.

## Select by risk

| Surface                                                    | Useful evidence                                                                                   |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Pure domain rules, parsing, normalization, serialization   | Examples, boundaries, properties, fuzzing where appropriate                                       |
| Workflows, retries, caches, inventories, state transitions | Stateful models, replay/idempotency cases, controlled concurrency                                 |
| Database queries, transactions, migrations                 | Real isolated engine, constraints, rollback and upgrade paths                                     |
| Service or message boundaries                              | Provider-verified contracts and integration tests                                                 |
| User-facing flows                                          | Component behavior and selected end-to-end journeys; accessibility or visual checks when relevant |
| Critical decisions with high line coverage                 | Scoped mutation analysis of assertions and branch protection                                      |
| Timeouts, partial failure, resource limits                 | Controlled fault injection and workload-specific checks                                           |

## Property-based testing and fuzzing

Use generated inputs to challenge meaningful properties over a specified domain. Generative testing
samples that domain; it does not prove the property for every possible input.

- Derive properties from the contract: conservation, ordering, uniqueness, idempotency,
  monotonicity, round trips, or agreement with an independent model. Check their assumptions;
  floating-point arithmetic and normalization can invalidate naive laws.
- Include empty, singleton, boundary, repeated, malformed, and extreme inputs where relevant. Define
  valid and invalid domains separately and verify rejection behavior. Avoid filtering so
  aggressively that few useful cases remain.
- A round-trip assertion alone can miss a paired encoder/decoder mistake. Add independent known
  examples or compatibility checks.
- Exercise project code, not only the standard library or generator. A JSON round trip must restrict
  inputs to the application's JSON-compatible domain; arbitrary objects can include values the
  format cannot represent. Verify the generator API for the installed version.
- Keep seeds or replay artifacts, tool versions, and minimized counterexamples. Turn important
  failures into durable regression cases without abandoning broader generated exploration. Budget
  fuzzing explicitly and preserve crash inputs; a timeout or missing crash does not prove safety.

Example property design for a project allocator: allocated amounts remain nonnegative, their sum
never exceeds the budget, and a stated fairness rule holds. Check a small hand-computed example as
well. "The result is a list" does not test the allocation policy.

## Stateful and model-based testing

For behavior affected by action order, generate sequences against both the real system and a simpler
independent model. Check invariants after relevant transitions. Include retries, duplicate delivery,
cancellation, rollback, or expiry when part of the contract.

Keep the model simpler than the implementation and avoid sharing the same decision helpers. Record
and shrink failing sequences. Ordinary sequential state-machine tests do not cover concurrent
interleavings automatically; add controlled scheduling or a concurrency-specific test for those
risks.

## Mutation testing

Use small source changes to test whether assertions detect meaningful behavioral differences. Start
with critical affected functions or modules and their relevant tests, including moved code. Preserve
a passing baseline and run mutations in isolation.

Classify outcomes using the tool's actual semantics:

- **Killed:** a relevant test detects the altered behavior. Inspect suspicious kills caused solely
  by unrelated flaky failures.
- **Survived:** investigate missing cases, weak assertions, or behavior the contract permits.
- **No coverage:** inspect collection, scope, and missing execution paths.
- **Equivalent:** the mutation cannot change observable behavior within the specified domain.
  Explain that domain and why no meaningful distinguishing test exists; do not declare equivalence
  merely because a test was difficult to write.
- **Invalid, timed out, or tool error:** retain the tool's classification and report separately; do
  not relabel these as demonstrated behavioral detection.

Strengthen tests for real gaps and document justified exceptions through the project's existing
process. Follow applicable thresholds without inventing universal kill-rate targets, narrowing
exclusions to inflate a score, or changing production semantics to kill an equivalent mutant. Report
scope, counts, exclusions, incomplete work, and unresolved survivors.

## Contract and integration testing

Verify what the consumer actually depends on and check it against the provider implementation or
authoritative schema. A client stub passing its own expectations does not establish that the
provider honors the contract. Cover meaningful error responses and compatibility, not just
happy-path shapes.

Use the actual database or protocol implementation in isolated environments when its semantics are
relevant. An in-memory substitute can miss transaction, collation, SQL dialect, or constraint
behavior. Test migrations against supported prior states and data shapes, including preservation and
rollback where supported. Isolate resources and clean them up; do not use production data or
services by default.

When a service is unavailable, run useful lower-level checks and state what the substitute cannot
establish. Do not replace an integration test with a mock and continue calling it integration
coverage.

## End-to-end, snapshots, and visual checks

Select important journeys spanning real application layers. Verify externally visible outcomes, such
as persisted state or delivered test messages, rather than relying solely on a success banner. Use
stable selectors, isolated accounts/data, deterministic setup, and traces or logs that explain
failures.

Use snapshots for output whose full shape matters and can be meaningfully reviewed. Keep them
focused, stabilize irrelevant nondeterminism, and inspect every changed expectation. Preserve
ordering when order is part of the contract. Snapshot updates require a justified intended output
change, not simply a failing comparison. Pair broad snapshots with targeted assertions for critical
semantics.

## Flaky tests and asynchronous behavior

An intermittent failure can reveal a product race or resource leak. Reproduce with the relevant
seed, execution order, concurrency, environment, and timing evidence before classifying it as a test
defect. Use bounded repetitions to investigate; retain original failures and retry results.

- Isolate mutable fixtures and resources; inspect cleanup and order dependence.
- Inject clocks where appropriate, and await observable conditions instead of adding sleeps or
  larger timeouts blindly.
- Preserve real concurrency when it is the behavior under test. Controlled schedules and explicit
  synchronization can reveal races more usefully than repeated random runs.
- Keep lower-level external boundaries deterministic while retaining isolated integration checks for
  their real semantics.

Quarantine only under the project's policy or explicit task authorization, with visible failures, an
owner, a tracked fix, and a review date. Continue running quarantined checks. Do not automatically
delete tests after a deadline, conceal failed retries, or remove the only protection for a critical
behavior. If quarantine is not authorized, diagnose and report while preserving the existing gate.

## Failure injection and performance

For resilient systems, inject bounded failures at appropriate boundaries: partial responses,
timeouts, connection loss, duplicate messages, transaction aborts, or exhausted test resources.
Check recovery, bounded retries, data integrity, and cleanup with isolated fixtures.

For performance-sensitive behavior, select realistic workloads and explicit service goals. Record
environment, warmup, repeated measurements, and relevant resource metrics. Compare consistent
conditions and account for noise before declaring a regression. Do not turn every unit test into a
wall-clock threshold or run disruptive load against live services without authorization.

## CI and sustained improvement

Keep a fast reliable gate for normal changes and place expensive integration, generative, or
mutation work where risk and feedback cost justify it. Scheduling deeper runs is useful only if
failures stay visible and actionable. Verify test selection does not silently omit dependent modules
or unimported source.

Preserve failing inputs, relevant reports, and diagnostics without leaking credentials or sensitive
fixtures. Use declared environments and the same Make targets locally and in CI. Prefer an
incremental scoped coverage baseline that improves over time over lowering requirements when new
tests reveal gaps.

## Primary references

These explain the techniques; they are not runtime dependencies or a tool installation checklist.

- [Test layers and maintainable automated suites](https://martinfowler.com/articles/practical-test-pyramid.html)
- [Hypothesis stateful testing](https://hypothesis.readthedocs.io/en/latest/stateful.html)
- [Stryker equivalent mutants](https://stryker-mutator.io/docs/mutation-testing-elements/equivalent-mutants/)
