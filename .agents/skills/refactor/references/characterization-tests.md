# Characterization tests

Characterization tests capture observed behavior before a refactor. They preserve the cases exercised, including existing quirks; they do not establish that the behavior is correct or that all inputs are covered.

## Choose the affected cases

Start with the functions, branches, and integration boundaries the refactor can affect. Inspect existing assertions and scoped coverage reports when available. Add tests for uncovered affected behavior, rather than chasing a repository-wide percentage.

Include relevant alternate branches, boundary inputs, error behavior, and side effects. For a module extraction, include callers and import behavior. For moving stateful code, include state sharing and initialization. Reuse existing protection when it is adequate.

## Capture before changing

1. Select representative inputs and run the current implementation.
2. Observe return values, exceptions, state changes, and relevant calls or their ordering. Do not invent expected results from reading the code alone.
3. Assert those observations at a stable public or integration boundary where practical. Use test doubles at external boundaries when needed, while exercising the real behavior being restructured.
4. Control nondeterminism such as time and randomness without masking behavior the task must preserve.
5. Run the tests against the original implementation before using them to judge the refactor. If they cannot run, report that limitation; they are not a verified baseline.

## Example: preserve side-effect order and failures

For an operation that formats, validates, sends, and logs, record the sequence and arguments before moving it into a collaborator. Check:

- Success: formatting, validation, sending, and logging occur once in the original order.
- Validation failure: sending and logging do not occur; the same exception propagates.
- Sending failure: logging does not occur; the same exception propagates.

Assert ordering when it is part of observable behavior, avoiding expectations about private helper names that the refactor is meant to change.

## Handle known bugs explicitly

A characterization test can preserve suspicious behavior while structure changes. Label it as observed behavior and reference an existing issue when available. Do not invent issue numbers or silently treat the behavior as intended.

If correcting the behavior is also requested, make that a distinct step with a test for the intended result. Do not adjust characterization assertions merely to make the restructured implementation pass.

## After restructuring

- Run the same behavior checks against the new implementation, including affected callers and boundaries.
- Investigate changed observations before altering expectations. Distinguish an accidental regression from a separately authorized behavior change.
- Keep useful tests. Rename them to match repository conventions if helpful, preserving their assertions during a behavior-preserving refactor.
- Remove redundant tests only when equivalent protection remains. Report uncovered affected behavior and unavailable measurements.
