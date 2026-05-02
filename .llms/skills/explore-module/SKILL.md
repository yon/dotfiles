---
name: explore-module
description: Use when starting work in an unfamiliar module, when a module's `.context.md` is missing or stale, or when asked to document or understand a module's role
---

# /explore-module — Build or Update `.context.md`

`.context.md` is the module's memory. Read it first; explore from scratch only when it's missing or stale. This skill creates and maintains those files so understanding survives across sessions.

---

## Workflow

```
1. Identify module    — /explore-module [path]  (or interactive)
2. Check .context.md
     present + recent (< 2 weeks)  → read it; you understand the module
     present + stale  (> 2 weeks)  → read for baseline, then update outdated sections
     missing                       → full exploration (step 3)
3. Explore (only if needed)
     - read entry points, public interfaces, index/barrel files
     - trace exports / public functions / API endpoints
     - identify dependencies (internal + external)
     - git log --oneline -20 -- [path]
     - read tests for behavioral expectations
4. Write/update .context.md (template below)
5. Verify accuracy   — purpose clear, key files complete, no phantom dependencies
```

---

## Template

```markdown
# Module: [name]

**Last Updated:** [YYYY-MM-DD]
**Status:** Active | Stable | Deprecated | Refactoring

## Purpose
1–2 sentences: what this module does and why it exists.

## Key Files
| File | Purpose |
|---|---|

## Public Interfaces
| Symbol | Signature | Description |
|---|---|---|

## Dependencies
**Internal:** module — what we use
**External:** package — what we use

## Architecture Notes
Key design decisions, patterns, invariants.

## Recent Changes
- YYYY-MM-DD: what + why

## Known Issues
- open problems / tech debt
```

---

## Maintenance rules

- One `.context.md` per module directory (not per file).
- Keep it under ~100 lines. If longer, you're documenting too much.
- Always include `Last Updated` so staleness is visible.
- Checked into version control — it's part of the codebase.
- Don't put obvious-from-code details, debug notes, TODOs, or generated API docs here.

---

## When to refresh

- Before starting work on a module: read first, always.
- After implementation: update Key Files, Public Interfaces, Recent Changes.
- After refactoring: update Architecture Notes and Dependencies.
- The orchestrator updates `.context.md` automatically after each implementation phase — see `orchestrator.md`.
