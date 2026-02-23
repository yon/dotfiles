---
name: explore-module
description: "Build or update .context.md for a module. Trigger: explore module, explore, understand module, what does this module do, context file, update context"
---

# /explore-module -- Module Context Files

## Philosophy

Understanding code before changing it is non-negotiable. But exploring a module from scratch every time is wasteful. `.context.md` files are the module's memory -- read them first, explore only if missing or stale. This skill creates and maintains these files so that understanding persists across sessions and across developers.

---

## Anti-Pattern: Explore Every Time

```
WRONG (explore every time):            RIGHT (read context first):
1. Run Glob/Grep to find files         1. Read .context.md
2. Read 10-20 files                    2. If current: you already understand
3. Build mental model                  3. If stale: update specific sections
4. Context lost at session end         4. If missing: explore and create it
                                       5. Context persists across sessions
```

---

## Workflow

### Step 1: Identify Module

```
/explore-module [path]   --> specific module or directory
/explore-module          --> interactive, ask which module
```

- [ ] Module path identified
- [ ] Module directory exists

### Step 2: Check Existing Context

Look for `.context.md` in the module directory:

```
EXISTS and recent (updated within last 2 weeks):
  --> Read it. You now understand the module.
  --> Suggest updates if anything looks outdated.

EXISTS but stale (updated more than 2 weeks ago):
  --> Read it for baseline understanding.
  --> Proceed to Step 3 to update outdated sections.

MISSING:
  --> Proceed to Step 3 for full exploration.
```

- [ ] Checked for `.context.md`
- [ ] Determined freshness (recent / stale / missing)

### Step 3: Explore (if needed)

When `.context.md` is missing or stale, explore the module:

1. **Read key files** -- start with entry points, public interfaces, and index/barrel files
2. **Trace public interfaces** -- exports, public functions, public classes, API endpoints
3. **Identify dependencies**:
   - Internal: which other modules does this one import from?
   - External: which third-party packages does it use?
4. **Check recent git history** for the module:
   ```
   git log --oneline -20 -- [module_path]
   ```
5. **Read tests** to understand expected behavior and edge cases

- [ ] Key files read
- [ ] Public interfaces mapped
- [ ] Dependencies identified (internal + external)
- [ ] Recent git history reviewed
- [ ] Tests read for behavioral understanding

### Step 4: Write or Update .context.md

Create or update the module's `.context.md` using this template:

```markdown
# Module: [name]

**Last Updated:** [YYYY-MM-DD]
**Status:** [Active / Stable / Deprecated / Under Refactoring]

## Purpose
[1-2 sentences describing what this module does and why it exists]

## Key Files
| File | Purpose |
|------|---------|
| `file.ext` | [what it does] |

## Public Interfaces
| Function/Class | Signature | Description |
|----------------|-----------|-------------|
| `function_name` | `(params) -> return` | [brief] |

## Dependencies
### Internal
- `module_name` -- [what we use from it]

### External
- `package_name` -- [what we use from it]

## Architecture Notes
[Key design decisions, patterns used, important invariants]

## Recent Changes
- [YYYY-MM-DD]: [what changed and why]

## Known Issues
- [any open problems or tech debt]
```

- [ ] `.context.md` written or updated
- [ ] All sections populated with accurate information
- [ ] Last Updated date set to today

### Step 5: Verify

Read back the `.context.md` to confirm it is accurate and complete:

- [ ] Purpose section is clear and concise
- [ ] Key files are all listed
- [ ] Public interfaces match actual exports
- [ ] Dependencies are correct (no missing, no phantom)
- [ ] Architecture notes capture non-obvious design decisions

---

## Maintenance

### When to Update .context.md

- **Before starting work** on a module: read `.context.md` first, always
- **After implementation**: update Key Files, Public Interfaces, and Recent Changes
- **Periodically**: run `/explore-module [path]` to refresh stale context files
- **After refactoring**: update Architecture Notes and Dependencies

### Integration with Orchestrator

The orchestrator protocol should update `.context.md` after implementation (between Step 3 and Step 4 of the orchestrator loop). This keeps context files current without manual effort.

### What Does NOT Go in .context.md

- Implementation details that are obvious from reading the code
- Temporary debugging notes (use session logs for those)
- TODO lists (use issue tracker or task files)
- Full API documentation (use doc generators for that)

The goal is a **quick orientation document** -- enough to understand the module's role, boundaries, and key decisions without reading every file.

---

## Rules

- One `.context.md` per module directory (not per file)
- Keep it concise -- if it exceeds 100 lines, you are documenting too much
- Always include the Last Updated date so staleness is visible
- `.context.md` files are checked into version control -- they are part of the codebase
- When in doubt about what constitutes a "module", use directory boundaries: any directory with 3+ source files is a candidate
