# Evaluation results

Date: 2026-09-08. Scope: portable lint workflow and revised stack examples.

Fresh agents received the skill and task prompts without the assertions. Two agents executed real formatter commands in isolated fixture copies with Prettier 3.9.6 preinstalled. A third evaluated the three supplied-state scenarios without making repository changes. The coordinator scored the reports and verified fixture file bytes independently.

| Scenario                    | Assertions passed | Evidence                                                                                                                                        |
| --------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Check target that mutates   | 4/4               | Inspected the Make recipe, ran the nonmutating package command, reported formatting failure; all original files remained byte-identical.        |
| Scoped fix without Make     | 4/4               | Formatted only target.ts and verified it passes; unrelated.ts and package.json unchanged, no Makefile added, no global-clean claim.             |
| Typed linting project scope | 4/4               | Proposed project information for the existing rule, correct source/test scopes, syntax-only config handling, and explicit planned verification. |
| Legacy debt                 | 4/4               | Preserved entrypoints, rejected blanket disables/count ceilings, proposed enforceable rollout and baseline checks, disclosed coverage limits.   |
| Unavailable/ignored checks  | 4/4               | Reported unanalyzed source and setup failure without invented results, configuration changes, or unrequested installation.                      |

Feedback clarified that the reference also supports configuration repair and that repairing a typed rule does not require adopting a new preset.

Separate smoke verification used the actual fenced examples in temporary projects. TypeScript used Bun 1.3.14, ESLint and @eslint/js 9.39.5, typescript-eslint 8.65.0, TypeScript 5.9.3, and Prettier 3.9.6. The Make recipes used Bun as the project runner. Clean lint, typecheck, and formatting checks passed; an unhandled promise triggered no-floating-promises; formatting check failed on an unformatted file without writing it. Restored source passed again.

Rust used Clippy 0.1.98 and rustfmt 1.9.0. Clean lint, typecheck, and formatting checks passed; an introduced dbg! call failed the lint gate; formatting check rejected unformatted source without writing it. Restored source passed again.

Node's optional TypeScript-config loader path, Python lint examples, CI execution, and other toolchain/platform combinations were documentation-reviewed, not smoke-tested. The simulated scenarios measure proposed decisions; they are not evidence of an executed monorepo repair or legacy migration.
