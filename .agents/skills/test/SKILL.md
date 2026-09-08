---
name: test
description: Run and diagnose tests, establish automated testing in new projects, and improve existing suites with behavior-focused coverage and targeted hardening. Use for test strategy, test implementation, regression coverage, flaky tests, or property, mutation, contract, and end-to-end testing. Match the requested scope instead of turning a test run into a testing overhaul.
---

# Test

Build evidence that important behavior works and regressions will be detected. Prefer the project's Make targets. Preserve useful existing tests and tooling; strengthen the suite where failures would matter most.

## Choose the job and establish the baseline

- **Run:** execute the requested suite or selection and report results. Do not expand a run-only request into implementation or infrastructure changes.
- **Diagnose or fix:** reproduce the failure, investigate its cause, and apply corrections when already authorized by the task.
- **Bootstrap:** establish a small, runnable foundation for a new or untested project, then add meaningful behavior checks.
- **Improve or harden:** assess existing protection, close important gaps, and verify the new tests can detect relevant mistakes. Read [advanced testing](references/advanced.md) only for applicable techniques.

Inspect repository instructions, relevant module context, requirements, test layout, build manifests, CI, and Make recipes. Identify the actual runner, supported runtime, fixtures, services, and setup steps. Run existing relevant checks before changing them. Record failures, skipped tests, duration, and collection errors; zero collected tests is not evidence of tested behavior.

Before running checks that write data or call services, inspect the effective test configuration as well as the recipe. Use isolated resources and synthetic or sanitized fixtures; live or shared environments require authorization already covering those effects.

For substantial testing work, outline the highest-value gaps and chosen layers before editing. Map important behavior to its expected result, test location, and evidence. Use the existing planning or documentation convention rather than creating a new tracking file by default.

## Keep Make as the entry point

Use existing names and argument conventions. These are preferred roles, not a requirement that every repository provide every target:

| Target | Role |
| --- | --- |
| `make test` | Default automated suite |
| `make test-unit` / `make test-quick` | Focused fast feedback, as defined by the project |
| `make test-int` | Integration checks |
| `make test-e2e` | Critical workflows through the running application |
| `make test-coverage` | Coverage with an explicit source scope |
| `make test-property` / `make test-mutation` | Targeted advanced checks |
| `make check` | Repository's aggregate verification gate |

Read what a target actually does before relying on its name. Pass file, pattern, seed, or scope through supported Make variables; use the underlying runner if Make lacks a selector. Do not invent flags or targets. For new projects where testing setup is requested, add minimal targets for the chosen runner, with correct failure exit status and no hidden required setup. Extend existing Makefiles only when the requested testing work needs it; preserve working targets. Use documented runner commands when Make is unavailable. Watch mode is for requested interactive use, not final verification.

## New projects: build a useful foundation

1. Derive examples and invariants from requirements and public contracts. Resolve consequential ambiguity about expected behavior before encoding guesses as tests; work on the clear cases meanwhile.
2. Select the smallest maintainable testing stack suitable for the language, runtime, and application. Prefer existing dependencies and conventions. Add dependencies through the project's package manager and lockfile when needed for the requested setup.
3. Establish fast tests for core decisions, integration tests for real boundaries, and a small set of critical end-to-end flows where applicable. Let risk and architecture determine the mix, not fixed percentages of test types.
4. For new behavior or bug fixes, write a focused test and observe failure for the intended behavioral reason before the implementation change. Missing modules or broken setup alone do not demonstrate a regression test's sensitivity. Implement the smallest useful change, verify green, then refactor with checks passing.
5. Make local and CI execution consistent using the same targets and declared dependencies. Configure deterministic setup, isolated data, cleanup, and useful failure artifacts. Add CI wiring when in scope, but distinguish a locally passing command from a verified CI run.

## Existing projects: improve incrementally

1. Inventory the actual tests and baseline health. Prioritize critical behavior, recent defects, changed or frequently edited modules, and weakly protected boundaries. Include untested source files in coverage scope so reports do not only count imported code.
2. Read existing assertions and tests against real code. Add characterization tests for important observed behavior before risky restructuring. Such tests should pass against unchanged working code; do not delete or rewrite production code to manufacture a red phase.
3. Separate observed behavior from intended behavior. Label known quirks, and fix bugs as distinct authorized changes with regression tests. A test-hardening-only task does not authorize unrelated production changes.
4. Close relevant success, alternate-branch, boundary, error, and side-effect gaps. Include affected callers and moved or extracted logic. Meet project coverage requirements and improve scoped coverage without chasing a repository-wide number or lowering thresholds to pass.
5. Validate test sensitivity with a known-broken revision or narrowly scoped mutation/fault when it adds confidence, especially for critical logic. Use an isolated copy or the project's mutation tool; preserve the user's working tree. For routine changes, existing meaningful tests and static checks may be sufficient.
6. Add the advanced technique most likely to expose the next class of defect. Work in reviewable increments, keep commands repeatable, and continue through the requested scope. Do not install every tool by default or defer agreed work merely because one module improved.

## Write tests that can catch mistakes

- Assert observable contracts and relevant side effects through real subject code. Derive expected values independently from requirements, hand-checked cases, a simpler model, or a trusted reference. Do not reproduce the implementation's algorithm in the expectation or use the function under test to calculate its own expected output.
- Use clear scenario names and minimal, representative fixtures. Include relevant invalid and adversarial inputs as well as ordinary use. Reuse sanitized production-shaped examples when appropriate.
- Choose the lowest-cost layer that can detect the failure, with integration or end-to-end checks for contracts invisible at lower layers. Exercise actual dependencies in isolated integration environments when their semantics matter. Mock external or nondeterministic boundaries deliberately; never replace the behavior the test is meant to verify.
- Control clocks, randomness, shared state, and resource lifetimes. Await observable conditions with bounded timeouts rather than arbitrary sleeps. Keep real concurrency or protocol behavior where that is the subject of the test.
- Do not inflate counts with assertion-free tests, shallow existence checks, duplicate cases, or snapshots nobody reviews. Multiple assertions can support one coherent scenario.

## Diagnose and verify

Read the failing assertion, stack, and relevant output. Reproduce with the narrowest useful command, compare with the baseline and a working case, then test one causal hypothesis at a time. Distinguish product bugs from test defects, environment failures, and flakiness. Do not weaken assertions, update snapshots, skip tests, or add retries just to obtain green output.

After an authorized correction, rerun the focused test and the repository's relevant broader checks. Reassess when repeated hypotheses fail. Report blockers accurately without marking incomplete verification as success. A retry that passes does not erase the original failure.

Inspect final command completion, exit status, counts, and scope. Report what changed, which behaviors gained protection, tests passed/failed/skipped when available, duration, affected coverage or mutation results when measured, and important gaps. Keep facts such as "local integration tests passed" separate from unverified claims about CI, external services, or all supported platforms. Repeat checks when later changes invalidate their evidence, not merely because another message was sent.

## Keep improving the suite

Turn reproduced defects into useful regression cases, retain minimized generated failures, and track persistent flakiness through the project's existing process. Assess progress using important behavior protected, defects detected, unresolved gaps, reliability, and feedback time. Coverage and mutation scores are supporting evidence, not substitutes for correct test intent. Improve these shared instructions from recurring observed failures rather than accumulating rules for every one-off case.
