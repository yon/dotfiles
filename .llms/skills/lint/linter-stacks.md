# Linter Stack Configurations

Reference configurations for common language stacks. Use these as starting points when running `/lint setup`. Customize rules based on project needs, but start strict and relax only with justification.

---

## Python

### Ruff (linter + formatter)

Ruff replaces flake8, isort, pyupgrade, and many other tools in a single fast binary.

```toml
# pyproject.toml
[tool.ruff]
target-version = "py312"
line-length = 120

[tool.ruff.lint]
select = [
    "E",    # pycodestyle errors
    "F",    # pyflakes
    "W",    # pycodestyle warnings
    "I",    # isort (import ordering)
    "N",    # pep8-naming
    "UP",   # pyupgrade (modern Python syntax)
    "S",    # bandit (security)
    "B",    # flake8-bugbear (common bugs)
    "A",    # flake8-builtins (shadowing builtins)
    "C4",   # flake8-comprehensions
    "DTZ",  # flake8-datetimez (timezone-aware datetimes)
    "T10",  # flake8-debugger (no debugger statements)
    "ISC",  # flake8-implicit-str-concat
    "ICN",  # flake8-import-conventions
    "PIE",  # flake8-pie (misc lints)
    "PT",   # flake8-pytest-style
    "RSE",  # flake8-raise
    "RET",  # flake8-return
    "SLF",  # flake8-self (private member access)
    "SIM",  # flake8-simplify
    "TID",  # flake8-tidy-imports
    "TCH",  # flake8-type-checking
    "ARG",  # flake8-unused-arguments
    "PTH",  # flake8-use-pathlib
    "ERA",  # eradicate (commented-out code)
    "PL",   # pylint
    "TRY",  # tryceratops (exception handling)
    "FLY",  # flynt (f-string conversion)
    "PERF", # perflint (performance)
    "RUF",  # ruff-specific rules
]

[tool.ruff.format]
quote-style = "double"
indent-style = "space"
```

**Key rules explained:**
- `S` (bandit): catches security issues like hardcoded passwords, SQL injection, use of `eval()`
- `B` (bugbear): catches common bugs like mutable default arguments, bare `except:`
- `UP` (pyupgrade): enforces modern Python syntax (f-strings, type unions, etc.)
- `PL` (pylint): broader code quality checks (complexity, design, refactoring suggestions)

### Mypy (type checker)

```toml
# pyproject.toml
[tool.mypy]
strict = true
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
disallow_incomplete_defs = true
check_untyped_defs = true
no_implicit_optional = true
warn_redundant_casts = true
warn_unused_ignores = true
```

**Customization:** If `strict = true` is too aggressive for an existing codebase, start with `disallow_untyped_defs = true` and add rules incrementally.

### Makefile targets

```makefile
lint:
	ruff check .
	mypy .

format:
	ruff check --fix .
	ruff format .

typecheck:
	mypy .
```

---

## TypeScript / JavaScript

### ESLint (linter)

For ESLint v9+ flat config:

```javascript
// eslint.config.js
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-floating-promises': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  }
);
```

For ESLint v8 (legacy config):

```json
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/strict"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/strict-boolean-expressions": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/no-floating-promises": "error",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

**Key rules explained:**
- `no-explicit-any`: forces proper typing instead of escape hatches
- `strict-boolean-expressions`: prevents truthy/falsy bugs (empty string, 0, null)
- `no-floating-promises`: catches unhandled promise rejections
- `no-unused-vars` with `_` pattern: allows intentionally unused parameters

### Prettier (formatter)

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### Makefile targets

```makefile
lint:
	npx eslint .
	npx tsc --noEmit

format:
	npx prettier --write .
	npx eslint --fix .

typecheck:
	npx tsc --noEmit
```

---

## Rust

### Clippy (linter)

```toml
# Cargo.toml or clippy.toml
[lints.clippy]
pedantic = { level = "warn", priority = -1 }
unwrap_used = "deny"
expect_used = "deny"
panic = "deny"
todo = "warn"
dbg_macro = "deny"
print_stdout = "warn"
```

**Key rules explained:**
- `pedantic`: enables a broad set of "nice to have" lints that catch common mistakes
- `unwrap_used` / `expect_used`: forces proper error handling instead of panics
- `panic`: prevents explicit panics in library code
- `dbg_macro` / `print_stdout`: catches debug output left in production code

### Rustfmt (formatter)

```toml
# rustfmt.toml
edition = "2021"
max_width = 100
tab_spaces = 4
use_field_init_shorthand = true
use_try_shorthand = true
```

### Makefile targets

```makefile
lint:
	cargo clippy -- -D warnings

format:
	cargo fmt

typecheck:
	cargo check
```

---

## General Guidance

### Starting a New Project

1. Pick the linter stack for your language from above
2. Start with the full recommended config -- it is easier to relax rules than to add them later
3. Run the linter on day one so violations never accumulate
4. Add pre-commit hooks so violations are caught before commit

### Adopting Linters in an Existing Project

1. Start with the recommended config
2. Run the linter and count existing violations
3. If violations are manageable (<50), fix them all in one commit
4. If violations are large (>50), use baseline/ignore files:
   - Ruff: `ruff check --add-noqa` to suppress existing violations
   - ESLint: `/* eslint-disable */` at file level for legacy files
5. Fix legacy violations incrementally, tracked by an issue

### Pre-Commit Hooks

Use pre-commit hooks to enforce linting before every commit:

```yaml
# .pre-commit-config.yaml (Python ecosystem)
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.3.0
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format
```

For other ecosystems, use `husky` (JS/TS) or shell scripts in `.git/hooks/`.
