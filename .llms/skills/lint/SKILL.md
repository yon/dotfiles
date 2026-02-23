---
name: lint
description: "Run linters, formatters, and static analysis. Trigger: lint, format, standards, style check, code quality, lint setup"
---

# /lint -- Linters, Formatters, and Static Analysis

## Philosophy

Linter configs ARE the canonical coding standards. Not prose documentation -- machine-enforced rules. If a convention is not in the linter config, it is a suggestion, not a standard. Every project should have a linter stack configured on day one, and the CI pipeline should block non-compliant code from merging.

---

## Anti-Pattern: Prose-Only Standards

```
WRONG (prose standards):               RIGHT (linter-enforced):
1. Write 10-page style guide           1. Configure linter rules
2. Hope developers read it             2. Pre-commit hook enforces
3. Review for style manually           3. CI blocks non-compliant code
4. Style guide gets stale              4. Linter config IS the style guide
```

---

## Workflow

### Step 1: Determine Scope

```
/lint              --> make lint (all files)
/lint [file|dir]   --> lint specific files or directory
/lint fix          --> make format, then make lint
/lint --fix        --> make format, then make lint
/lint setup        --> scaffold linter stack (see linter-stacks.md)
```

- [ ] Scope identified
- [ ] Correct command determined

### Step 2: Run

| Mode | Commands |
|------|----------|
| Check only | `make lint` |
| Specific files | Run linter directly with file arguments |
| Auto-fix | `make format` then `make lint` |
| Setup | See `/lint setup` section below |

- [ ] Linter executed
- [ ] Output captured

### Step 3: Report

```
Lint Results:
- Errors: [N] (must fix)
- Warnings: [N] (should fix)
- Info: [N] (optional)
```

For each issue:
```
[severity] [file:line] [rule-id] -- [message]
```

Group by file, then by severity within each file. Most critical issues first.

- [ ] Results grouped and formatted
- [ ] Actionable items clear

### Step 4: Auto-Fix (if `/lint fix`)

1. Run `make format` first (auto-fixable formatting issues)
2. Then run `make lint` (remaining issues that need manual attention)
3. Report what was auto-fixed vs what remains

```
Auto-Fixed:
- [N] formatting issues (via formatter)
- [N] import ordering issues

Remaining (manual fix required):
- [N] errors
- [N] warnings
```

- [ ] Formatter ran successfully
- [ ] Remaining issues reported

---

## `/lint setup` Mode

When the user runs `/lint setup`, scaffold the linter stack for the project's language:

1. **Detect language** -- check for `pyproject.toml`, `package.json`, `Cargo.toml`, etc.
2. **Read `linter-stacks.md`** for the recommended configuration
3. **Create config files** -- write the linter config for the detected language
4. **Update Makefile** -- add `lint`, `format`, and `typecheck` targets if missing
5. **Verify** -- run the new lint command to confirm it works

- [ ] Language detected
- [ ] Config files created
- [ ] Makefile updated
- [ ] Lint runs successfully

---

## Supporting Files

- **`linter-stacks.md`** -- Configuration examples per language (Python/Ruff, TypeScript/ESLint, Rust/Clippy)

---

## Rules

- Linters run on every commit (pre-commit hook) and in CI
- Formatting is auto-fixable and should never be a manual task
- Linter warnings in new code are treated as errors -- do not add new warnings
- When adding a new lint rule, fix all existing violations in the same commit or explicitly suppress them with a tracking issue
- The linter config is checked into version control -- it is part of the codebase
