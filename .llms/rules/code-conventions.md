# Code Conventions

**Consistency reduces cognitive load. These conventions apply project-wide.**

______________________________________________________________________

## Linters as Canonical Standards

**Linter configurations are the single source of truth for coding standards.** When prose documentation and linter config disagree, update the linter config — it is the canonical source.

### Common Linter Stacks

| Language | Linter | Formatter | Type Checker |
|----------|--------|-----------|-------------|
| Python | ruff | ruff format | mypy / pyright |
| TypeScript/JS | eslint | prettier | tsc --strict |
| Rust | clippy | rustfmt | (built-in) |

### Rules

- **Custom rules belong in linter config**, not in prose documentation
- **Pre-commit hooks enforce linter compliance** — code that fails linting does not get committed
- **Never disable a linter rule without documented justification:**
  ```
  # lint:ignore S101 — using assert for test preconditions, not production validation
  ```
- **Linter overrides require a reason in the comment** — bare `# noqa` or `// eslint-disable` is not acceptable
- **Run `make lint` before every commit** — see `quality-and-verification.md` for the full checklist

______________________________________________________________________

## Naming

### General Rules

- Names should reveal intent — `calculate_order_total` not `calc` or `process`
- Avoid abbreviations unless universally understood (`id`, `url`, `http`)
- Boolean names should read as questions: `is_valid`, `has_permission`, `can_delete`
- Collection names should be plural: `users`, `order_items`, `pending_tasks`
- Functions that return values are named for what they return: `get_user`, `find_orders`
- Functions that perform actions are named for what they do: `send_email`, `delete_account`

### Conventions by Element

| Element | Convention | Example |
|---------|-----------|---------|
| Variables/functions | [snake_case / camelCase] | `user_count` / `userCount` |
| Classes/types | [PascalCase] | `OrderService` |
| Constants | [UPPER_SNAKE_CASE] | `MAX_RETRY_COUNT` |
| File names | [snake_case / kebab-case] | `order_service.py` / `order-service.ts` |
| Test files | [test\_ prefix / .test suffix] | `test_order.py` / `order.test.ts` |

______________________________________________________________________

## File Organization

### Structure Within a File

```
1. Module docstring / file header (brief — what this module does)
2. Imports (stdlib → third-party → local, separated by blank lines)
3. Constants
4. Type definitions / interfaces
5. Main class or function definitions
6. Helper / private functions
7. Module-level code (if any — prefer entrypoints)
```

### Module Organization

- One primary concern per file
- Group related files in directories with clear names
- Keep nesting shallow (max 3-4 directory levels)
- Index/barrel files for clean public APIs (if language supports it)

______________________________________________________________________

## Functions

### Guidelines

- **Short** — aim for < 30 lines, hard limit at 50
- **Single purpose** — does one thing, named for that thing
- **Few parameters** — 0-3 is ideal, > 5 is a smell (use a config object/struct)
- **Pure when possible** — same input → same output, no side effects
- **No side effects in names that don't suggest them** — `get_user()` must not send email

### Error Handling

- Return errors explicitly (`Result`, `Either`, error returns) — don't rely on exceptions for control flow
- Handle errors at the appropriate level — don't catch and re-throw without adding context
- Use custom error types for domain errors — not generic strings
- Log errors with context (what was being attempted, with which inputs)

______________________________________________________________________

## Comments

### When to Comment

- **Why**, not what — the code says what, comments say why
- Complex algorithms — explain the approach before the code
- Business rules — link to the requirement or ticket
- Workarounds — explain what's being worked around and when it can be removed
- Public APIs — document the contract (params, returns, errors, examples)

### When NOT to Comment

- Obvious code — `i++ // increment i` adds noise
- Instead of refactoring — if code needs a comment to explain WHAT it does, rewrite the code
- Commented-out code — delete it. Git remembers.
- TODO without a ticket — `// TODO fix this` is a lie. Use `// TODO(#123): fix race condition in session cleanup`

______________________________________________________________________

## Error Handling Patterns

### Preferred Pattern (by language type)

**For languages with Result types (Rust, functional):**

```
// Return errors explicitly, handle at the caller
fn get_user(id: UserId) -> Result<User, UserError>
```

**For languages with exceptions (Python, Java, TypeScript):**

```
// Use exceptions for unexpected failures
// Use Result/Optional for expected failures (not found, validation)
// Never catch generic Exception/Error except at the top-level handler
```

### Anti-Patterns

- **Empty catch blocks** — always handle or re-raise
- **Pokemon exception handling** (`catch Exception`) — catch specific errors
- **Using exceptions for control flow** — use `Optional`/`Result` for expected cases
- **Swallowing errors silently** — log + re-raise, or return an error value

______________________________________________________________________

## Logging

### Log Levels

| Level | When | Example |
|-------|------|---------|
| ERROR | Something failed that shouldn't | Database connection lost |
| WARN | Something unexpected but handled | Retry succeeded after timeout |
| INFO | Significant business events | User registered, order placed |
| DEBUG | Development diagnostics | Function entry/exit, intermediate values |

### Rules

- **Structured logging** — use key-value pairs, not string interpolation
- **Include context** — request ID, user ID, operation name
- **Never log secrets** — passwords, tokens, PII
- **Log at boundaries** — incoming requests, outgoing responses, external calls

______________________________________________________________________

## Observability & Tracing

**Every operation should produce a trace, not just a log line.** Structured tracing provides the context needed to diagnose issues in production.

### Structured Tracing (OpenTelemetry-style)

- Every operation creates a **span** with a name, start time, and end time
- Spans nest to form a **trace** representing the full request lifecycle
- Spans carry **attributes** — structured key-value pairs describing the operation
- Logs are **events within spans**, not standalone entries

### Key Span Attributes

| Attribute | Example | Required? |
|-----------|---------|-----------|
| `trace.id` | `abc-123-def` | Yes |
| `span.name` | `process_payment` | Yes |
| `user.id` | `usr_xyz` | If applicable |
| `http.method` | `POST` | If HTTP |
| `http.status_code` | `200` | If HTTP |
| `db.statement` | `SELECT ...` | If database (sanitized) |
| `error.message` | `timeout after 5s` | If error |
| `error.type` | `TimeoutError` | If error |

### Correlation IDs

Every request gets a unique ID that flows through all operations:

- Generated at the system boundary (HTTP handler, message consumer)
- Passed to every function, logged in every span
- Returned in error responses so users can reference it in bug reports
- Propagated to downstream services via headers (`X-Request-ID`, `traceparent`)

### Structured Logging Within Spans

Logs should be events within a trace context, not standalone lines:

```
# BAD — standalone log, no context
logger.info("Payment processed")

# GOOD — structured event within a span
span.add_event("payment_processed", {
    "amount": 49.99,
    "currency": "USD",
    "gateway": "stripe",
    "duration_ms": 230
})
```

______________________________________________________________________

## Context-Rich Outputs

**Every error, result, and log entry should include enough context to understand what happened without reproducing the scenario.**

### Error Context

Every error includes four elements:

- **Operation** — what was being attempted
- **Inputs** — the relevant data (sanitized of secrets)
- **Expected outcome** — what should have happened
- **Actual outcome** — what actually happened

```
BAD:  raise ValueError("invalid input")
GOOD: raise ValueError(f"Cannot create order: quantity {qty} exceeds stock {available} for product {product_id}")

BAD:  return Err("failed")
GOOD: return Err(format!("Failed to connect to database at {host}:{port}: {err} (attempt {attempt}/{max_retries})"))
```

Cross-reference: See `engineering-principles.md` Fail Fast section for the full error context standard.

### Result Pattern with Metadata

When returning results, include operational metadata:

```python
@dataclass
class Result:
    value: Any
    metadata: dict  # operation, duration_ms, source, cache_hit, etc.

# Example
return Result(
    value=user,
    metadata={
        "operation": "get_user",
        "duration_ms": 45,
        "source": "database",
        "cache_hit": False
    }
)
```

### API Response Standards

Every API response includes:

- **`request_id`** — correlation ID for tracing
- **`timestamp`** — when the response was generated
- **Error responses** additionally include: error code, human-readable message, and machine-readable details

```json
{
  "request_id": "req_abc123",
  "timestamp": "2026-02-22T10:30:00Z",
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Cannot fulfill order: only 3 units available for product P-456",
    "details": {
      "product_id": "P-456",
      "requested": 5,
      "available": 3
    }
  }
}
```

______________________________________________________________________

## Dependency Management

- **Pin versions** — exact versions in lock files
- **Minimal dependencies** — every dep is a liability. Can you write it in 20 lines instead?
- **Audit before adding** — check maintenance status, security advisories, license
- **Group and document** — separate dev/test/prod dependencies, document why each exists
- **Update regularly** — scheduled dependency updates (weekly or monthly)

______________________________________________________________________

## Local Module Context (.context.md)

**Every module/directory with code files MUST have a `.context.md` file.** Claude reads this FIRST instead of exploring, giving immediate understanding of module purpose, interfaces, and state.

### Template

```markdown
# Module: [name]

## Purpose
[1-2 sentences describing what this module does and why it exists]

## Key Files
- `file.ext` — [what it does]
- `other_file.ext` — [what it does]

## Public Interfaces
- `function_name(params) -> return` — [brief description]
- `ClassName` — [brief description]

## Dependencies
- Internal: [modules this depends on]
- External: [third-party packages]

## Recent Changes
- [date]: [what changed and why]

## Known Issues
- [any open problems or technical debt]
```

### Maintenance Rules

- **Created** when a new module is first implemented
- **Updated** after every implementation phase (the orchestrator enforces this — see `orchestrator.md` Step 4)
- **Reviewed** at session start when working on a module
- **Accurate** — if `.context.md` is stale, update it before starting work

### Including in Subagent Prompts

When spawning subagents (see `agent-coordination.md`), read the relevant `.context.md` files and include their content in the task prompt. This gives subagents accurate module understanding without exploration overhead:

```
context = Read("src/payments/.context.md")
Task(subagent_type="production-code-engineer",
     prompt=f"Module context:\n{context}\n\nYour task: ...")
```
