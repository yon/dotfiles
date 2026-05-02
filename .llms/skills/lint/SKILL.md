---
name: lint
description: Use when checking code style, running linters, formatters, or static analysis, fixing lint errors, or scaffolding a linter stack for a project
---

# /lint — Linters, Formatters, Static Analysis

Linter configs are the canonical coding standards — not prose docs. Anything not in the linter config is a suggestion, not a standard.

---

## Modes

| Invocation | Action |
|---|---|
| `/lint` | `make lint` (whole project) |
| `/lint [file\|dir]` | linter directly on a path |
| `/lint fix` or `/lint --fix` | `make format` then `make lint` |
| `/lint setup` | scaffold a linter stack (see below) |

See `linter-stacks.md` for per-language config (Python/Ruff, TS/ESLint, Rust/Clippy, etc.).

---

## Reporting

Group by file, severity within file, most critical first:

```
[severity] [file:line] [rule-id] — message
```

Summary:
```
Errors: N (must fix)   Warnings: N (should fix)   Info: N (optional)
```

For `/lint fix`, separately list what got auto-fixed vs what still needs manual attention.

---

## `/lint setup`

1. Detect language from `pyproject.toml` / `package.json` / `Cargo.toml` / etc.
2. Read `linter-stacks.md` for the recommended config.
3. Write the config files.
4. Add `lint`, `format`, `typecheck` Makefile targets if missing.
5. Run the new lint command to verify.

---

## Rules

- Linters run in pre-commit hooks and in CI.
- Formatting is auto-fixable; never manual.
- New code introduces no warnings — warnings are errors for new lines.
- Adding a new lint rule? Fix all existing violations in the same commit, or open tracked suppressions.
- The linter config is checked into version control.
