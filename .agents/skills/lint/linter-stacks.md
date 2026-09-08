# Linter stack examples

Use these for requested setup or to diagnose existing configuration. Preserve existing tools, package managers, runtime versions, configuration, and Make target names. Resolve compatible tool versions against the project's runtime, pin dependencies using its package manager, and commit the lockfile. Invoke installed tools through project scripts or its environment; do not use commands that download missing tools implicitly.

Check commands report findings without rewriting source. Fix commands are separate and run only within the requested scope. The whole-project fix targets below are for an explicitly requested whole-project fix. For a file or module request, pass explicit paths to the underlying tool instead.

## TypeScript

This example uses ESLint flat configuration, a TypeScript configuration file, typescript-eslint, and Prettier. Retain another established stack when it already meets the project's needs. Install compatible development dependencies: `eslint`, `@eslint/js`, `typescript-eslint`, `typescript`, `@types/node`, and `prettier`. For ESLint running under Node, include `jiti` 2.2.0 or later to load the TypeScript config; running under Bun supports it natively. [ESLint configuration loading](https://eslint.org/docs/latest/use/configure/configuration-files#typescript-configuration-files).

```typescript
// eslint.config.mts
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import tseslint from 'typescript-eslint';

export default defineConfig(
  { ignores: ['**/dist/**', '**/coverage/**'] },
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    linterOptions: { reportUnusedDisableDirectives: 'error' },
  },
  {
    files: ['src/**/*.{ts,tsx,mts,cts}', 'tests/**/*.{ts,tsx,mts,cts}'],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: dirname(fileURLToPath(import.meta.url)),
      },
    },
  },
);
```

Adapt `src` and `tests` to actual source roots and include them in the appropriate `tsconfig.json` files. Each file in the typed block must belong to a project known to the project service. Keep configuration and other files outside those projects in the syntax-only block, or deliberately add them to a suitable project. Do not enable typed rules globally and then suppress parser failures. [Typed linting](https://typescript-eslint.io/getting-started/typed-linting/).

`recommendedTypeChecked` includes rules such as `no-floating-promises` and avoids imposing every opinionated strict rule. When repairing an existing typed rule, configure its project scope without automatically adopting a new preset. Add stricter rules when their findings suit the project. For mixed JavaScript projects, add a separate JavaScript block with the correct runtime globals and rules; this sample's TypeScript blocks do not configure JavaScript. [Shared configurations](https://typescript-eslint.io/users/configs/).

Merge these scripts into the existing `package.json`; this example uses npm, so substitute the repository's runner when different. Keep existing Prettier options and ignore generated or vendored outputs in `.prettierignore`. Formatting remains a separate check. [Prettier CLI](https://prettier.io/docs/cli).

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "typecheck": "tsc --noEmit",
    "format:check": "prettier . --check",
    "format": "prettier . --write"
  }
}
```

Use the existing TypeScript project or build command for project references; do not replace it blindly with `tsc --noEmit`. ESLint loads the config without type checking it: include `eslint.config.mts` in an appropriate TypeScript check, with Node types, when setting up a new project.

```makefile
.PHONY: lint lint-fix typecheck format-check format
lint:
	npm run lint
lint-fix:
	npm run lint:fix
typecheck:
	npm run typecheck
format-check:
	npm run format:check
format:
	npm run format
```

## Rust

Use the repository's pinned toolchain with Clippy and rustfmt installed. Lint levels belong in `Cargo.toml`; `clippy.toml` holds lint parameters. Cargo supports the lint tables below from Rust 1.74. Preserve the crate's edition and minimum supported Rust version. [Cargo lint tables](https://doc.rust-lang.org/cargo/reference/manifest.html#the-lints-section), [Clippy configuration](https://doc.rust-lang.org/nightly/clippy/configuration.html).

```toml
# Cargo.toml, alongside the existing package configuration
[lints.clippy]
all = { level = "warn", priority = -1 }
dbg_macro = "deny"
```

For a workspace, put shared settings under `[workspace.lints.clippy]` in its root manifest and opt each member in with `[lints]` and `workspace = true`. Add selective restrictions based on the code's purpose; do not globally ban `unwrap`, `expect`, or `panic` without considering tests and intentionally infallible paths. Pedantic rules are optional. [Workspace lint inheritance](https://doc.rust-lang.org/cargo/reference/workspaces.html#the-lints-table).

```makefile
.PHONY: lint typecheck format-check format
lint:
	cargo clippy --workspace --all-targets -- -D warnings
typecheck:
	cargo check --workspace --all-targets
format-check:
	cargo fmt --all -- --check
format:
	cargo fmt --all
```

Match the repository's supported feature and target matrix; `--all-features` can enable mutually exclusive features. `-D warnings` is suitable for a clean enforced scope; in a legacy project, select a clean crate or adopt specific rules before making every warning fatal. Keep rustfmt options aligned with the pinned toolchain. Run automated Clippy fixes explicitly and inspect their diff; do not turn `make lint` into a mutation command.

## Existing Python projects

Support existing Python code with its established environment and tools. This does not call for new Python helper scripts. If no stack exists, Ruff handles linting and formatting; mypy can provide gradual type checking. Configure the actual supported Python version through the project's metadata rather than copying a version from an example. [Ruff configuration](https://docs.astral.sh/ruff/configuration/).

```toml
# pyproject.toml
[tool.ruff.lint]
select = ["E4", "E7", "E9", "F", "I", "B"]

[tool.mypy]
check_untyped_defs = true
warn_unused_ignores = true
```

Start type checking a coherent package and expand it. For new typed packages, enable `strict` in a targeted override or project-wide when appropriate; do not enable blanket missing-import suppression to get a passing run. [Mypy adoption](https://mypy.readthedocs.io/en/stable/existing_code.html).

These recipes assume the project's environment is active and Ruff and mypy are installed from its pinned dependencies. Use its existing environment runner if needed.

```makefile
.PHONY: lint lint-fix typecheck format-check format
lint:
	ruff check .
lint-fix:
	ruff check --fix .
typecheck:
	mypy .
format-check:
	ruff format --check .
format:
	ruff format .
```

## Adopting an existing codebase

Measure findings by rule and affected module. Enforce high-value rules in a clean scope first, then expand coverage without increasing existing debt. If a tool supports a baseline, keep it reviewed and ensure new violations fail the gate. Otherwise use explicit rule or module scopes and track what is excluded. Do not add blanket file disables, bulk `noqa` comments, or arbitrary violation-count thresholds.

Exceptions should identify the exact rule and smallest necessary scope, explain the reason, and be removed when stale. Keep unrelated formatting or bulk cleanup in its own reviewable change. Preserve existing hooks; add hooks only as part of requested setup, and keep CI checks runnable without them. Verify a clean fixture passes and a representative violation fails before declaring the gate effective.
