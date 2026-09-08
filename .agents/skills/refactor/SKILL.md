---
name: refactor
description: Restructure existing code while preserving observable behavior. Use for extracting functions, splitting modules, simplifying dependencies, renaming interfaces, or addressing structural problems in existing code.
---

# Refactor

Define the structural improvement and the behavior that must remain unchanged. Work in small, reviewable steps, using the repository's tooling and workflow.

## Establish the baseline

- Read relevant repository instructions and module context. Identify affected functions, branches, callers, public contracts, and side effects before editing.
- Run the repository's appropriate checks and focused tests for that scope. Record existing failures separately; resolve failures that prevent establishing the affected behavior before restructuring it. Do not describe a failing baseline as green.
- Follow the repository's branch, worktree, and commit conventions and the user's authorization. This skill does not require a worktree, a particular build command, or automatic commits.

## Require coverage of affected behavior

- Scope coverage to the functions and branches being restructured, plus callers and integration boundaries whose behavior could change. Repository-wide coverage does not establish that this scope is protected.
- Require meaningful assertions for affected observable behavior: relevant success paths, alternate branches, boundary inputs, errors, and side effects. Add missing characterization tests before restructuring those paths. See [characterization tests](references/characterization-tests.md) when existing tests do not establish the behavior.
- Use the project's available line and branch coverage reports to find gaps in this scope. Meet its applicable thresholds, but do not treat any percentage as sufficient evidence by itself. A line executed without a useful assertion is not a verified contract.
- Preserve coverage of affected behavior through moves, extraction, and deletion. Compare the original functions with their replacements; changed-line coverage alone can miss removed or relocated logic. Investigate any loss of covered paths even if the overall percentage rises.
- Do not add redundant tests for a mechanical change already protected by existing tests and static checks. For a rename, include references and externally visible names in the verification scope.
- If instrumentation is unavailable, map affected behaviors to tests and report that quantitative coverage was not measured. If an affected behavior cannot be exercised, identify the gap and remaining uncertainty rather than claiming full verification.

## Restructure incrementally

1. Choose the smallest sequence of structural changes that achieves the goal. For substantial work, outline independently reviewable steps. Consult the [catalog](references/catalog.md) only for relevant moves.
2. Make one logical change, then run focused checks before building on it. If it introduces a failure, correct the change or undo only your own failing step, preserving other work.
3. Keep feature additions and bug fixes separate from behavior-preserving changes. Record discovered bugs; change their behavior only as an explicit part of the requested scope, with separate validation and a distinct reviewable step.
4. After the final step, run the repository's required checks and appropriate integration tests. Review for changed contracts, error behavior, side-effect ordering, imports, and unnecessary abstraction.
5. Update existing module context when structure, interfaces, or dependency relationships change. Use the module-context skill when available; otherwise maintain the document directly.

## Report the result

Summarize the structural change, affected behavior verified, checks run, coverage scope and measurements when available, and any remaining gaps or baseline failures. Passing tests provide evidence for the cases exercised, not proof of equivalence for all inputs.
