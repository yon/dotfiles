---
name: lint
description: Check code style and static analysis, fix lint or formatting problems, or establish linting in new and existing projects. Preserve the requested scope and the repository's tooling and conventions.
---

# Lint

Use executable configuration to enforce mechanical standards. Repository instructions still govern requirements that linters cannot express. Keep useful existing tools, rules, and Make targets; a lint request does not authorize a tooling migration.

## Choose the operation

| Request | Behavior |
| --- | --- |
| Check / `lint` | Run existing checks without source or configuration edits. |
| Check a file or directory | Use the tool's supported selector within the requested scope. |
| Fix / `lint fix` | Apply scoped formatting and lint corrections, then verify them. |
| Setup / `lint setup` | Establish or extend the lint stack appropriate to the project. |

Read applicable instructions, manifests, lockfiles, linter/formatter configuration, Make recipes, package scripts, and relevant CI before choosing commands. Distinguish existing failures from problems introduced by this task. Read only the relevant language section of [linter-stacks.md](linter-stacks.md) when setting up or repairing configuration.

## Command selection and scope

Prefer existing `make lint`, `make format`, `make format-check`, and `make typecheck` entrypoints, using their actual names and supported arguments. Inspect recipes and prerequisites: a target called `lint` may run auto-fixes, and a `format` target may rewrite the whole repository. A check-only request must use a nonmutating command; if the existing target mutates, use the configured underlying tool's check mode and explain the substitution.

Pass paths through supported Make variables or package scripts; otherwise invoke the installed underlying tool from the correct project/package root so its configuration applies. Quote paths and use argument arrays in helpers. Do not invent selection flags, a missing Make target, or a package script. If a checker only supports package/project scope, run that broader read-only check and disclose its scope; do not broaden edits.

Use repository-declared tool versions and its package manager/lockfile. Missing tools or configuration errors are setup failures, not clean lint results. Avoid package-runner commands that silently download a different version. Dependency installation belongs to requested setup or the repository's documented prerequisite workflow. Use TypeScript for new helper scripts; Bash/Make should be thin wrappers. Respect the target project's existing language.

Exclude generated, vendored, and build artifacts according to repository configuration. If requested files are ignored or not included in the type-checking project, report that gap and resolve it within scope; zero analyzed files is not a passing check. TypeScript lint rules requiring type information need a working project configuration, including the relevant package/test files.

## Fix and verify

1. Capture the relevant baseline and inspect existing user changes. Choose a supported scoped formatter or safe lint fix. Review available fix behavior before enabling options that can change runtime semantics.
2. Apply fixes only to the requested files or agreed scope. Prefer the formatter for mechanical layout. Manual semantic corrections need code review and appropriate focused tests; never treat every auto-fix as behavior-preserving.
3. Inspect the diff for unrelated formatting, generated output, configuration changes, deleted code, and lost user edits. Do not disable a rule, weaken type checks, add casts or suppressions, or remove behavior just to make output green. A justified exception must identify the exact rule/location and why it does not apply.
4. Rerun the scoped checks in nonmutating mode and relevant type checks. For semantic changes, run the affected tests. Distinguish pre-existing failures outside the edit scope from introduced failures; do not silently fix the entire repository or declare the full gate clean when it still fails.

## Setup in new projects

Choose the smallest compatible stack for the runtime, framework, and supported language versions. Prefer checked configuration and type-aware analysis where supported. Use [the stack examples](linter-stacks.md) as starting points, adapting versions and paths to the actual project.

Add minimal Make targets only when setup is requested and the project needs them. Preserve working recipes and conventions. Separate read-only `lint`, `format-check`, and `typecheck` from mutating `format` or `lint-fix`; reuse existing equivalents. Keep aggregate gates nonmutating and propagate tool failures. Configure CI to use the same checks when CI setup is in scope. Preserve existing hooks; install new hooks only as part of requested workflow setup, with no auto-fixing in CI.

Verify that clean representative source passes, a deliberate representative violation fails, and formatting check reports changes without writing them. For typed linting, exercise an actual type-aware rule, not only configuration loading. Use temporary fixtures or an isolated copy for deliberate faults, then remove them. Report tool versions and actual local results separately from unexecuted CI claims.

## Adoption in existing projects

Start with the current configuration and baseline. Prioritize correctness, type safety, and maintainable feedback over enabling every available rule. Introduce rules in coherent increments, assessing fix semantics, review scope, and noise instead of using an arbitrary violation-count threshold.

Fix relevant violations within the authorized scope and prevent new ones. For substantial legacy debt, prefer enforceable rollout by package/module or a tool-supported diagnostic baseline that distinguishes existing violations from new ones. Verify baseline behavior with an introduced violation. A whole-file disable or blanket `noqa` can hide new defects; do not generate them to force a passing result. Do not suppress unrelated rules or exempt entire legacy files from new checks.

Account for diagnostics whose locations move or span several lines. Raw changed-line filtering can miss defects elsewhere in an affected file; use affected-file/package analysis or a baseline with reliable matching, and disclose remaining coverage gaps. Track deferred work through the repository's existing process, filing issues only when authorized. No new warnings in the enforced scope is the target; historical warnings elsewhere must remain visible rather than being reported as a clean global gate.

## Report

State the checked/fixed scope, exact commands and outcomes, changes made, remaining diagnostics, and any unanalyzed files or setup failures. Group actionable diagnostics by file with severity, location, and rule when available. Separate auto-fixes from manual corrections and distinguish new findings from baseline debt. Count errors/warnings only when supported by tool output. Do not infer correctness or security from a clean linter run.

Reusable evaluation prompts and fixtures are in [evals/evals.json](evals/evals.json). Run each in a fresh context and isolated fixture copy; compare executed commands, file changes, and reported outcomes against its assertions.
