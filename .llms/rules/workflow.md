# Workflow — Software Development Lifecycle

**These rules apply to ALL tasks, regardless of language or file type.**

> **Always-on:** `engineering-principles.md` and `security-practices.md` apply at every stage below.

______________________________________________________________________

## The 8-Stage SDLC

```
UNDERSTAND → PLAN → VALIDATE → BUILD → VERIFY → REVIEW → SHIP → OBSERVE
     ↑                                                              |
     └──────────────────────────────────────────────────────────────┘
```

| Stage | What Happens | Skills | Rule |
|-------|-------------|--------|------|
| UNDERSTAND | Explore codebase, read `.context.md` files | `/explore-module` | `code-conventions.md` |
| PLAN | Decompose into tracer bullets | `/decompose` | `workflow.md` |
| VALIDATE | Agents review the plan | `/review-plan` | `workflow.md` |
| BUILD | TDD, one tracer bullet at a time | `/create-feature`, `/fix-bug`, `/refactor` | `testing-protocol.md` |
| VERIFY | Linters as law, tests as contract | `/lint`, `/test` | `quality-and-verification.md` |
| REVIEW | Multi-agent code review | `/review`, `/team-review` | `agent-coordination.md` |
| SHIP | Small PR, one tracer bullet per PR | `/deploy` | `git-and-delivery.md` |
| OBSERVE | Tracing, context-rich outputs | — | `code-conventions.md` |

______________________________________________________________________

## UNDERSTAND — Read Before You Write

Before modifying any module:

1. Read the module's `.context.md` file FIRST
1. Read relevant tests to understand existing behavior
1. Check `git log --oneline -10` for recent changes in the area
1. Identify dependencies and dependents

______________________________________________________________________

## PLAN — Plan Before You Build

**For any non-trivial task, enter Plan Mode FIRST before writing code or making edits.**

A task is "non-trivial" if it involves:

- Creating or modifying more than one file
- Implementing a new feature or fixing a non-trivial bug
- Refactoring existing code
- Any task the user describes with multiple steps
- Any task where the approach is not immediately obvious

### The Plan-First Protocol

1. **Enter Plan Mode** — use `EnterPlanMode` to switch to planning
1. **Draft the plan** — outline what will change, which files are affected, and in what order
1. **Save the plan** — write it to `working/plans/` (see Plan Storage below)
1. **Present to user** — explain the plan and wait for approval
1. **Only after approval** — exit plan mode
1. **Immediately save initial session log** — capture the goal, plan summary, and key context while it's fresh (see Session Logging below)
1. **Implement via orchestrator** — the orchestrator protocol takes over (see `orchestrator.md`): implement → verify → review → fix → score → present results

### What a Good Plan Includes

- **Task description** — what are we trying to accomplish?
- **Acceptance criteria** — how do we know when it's done?
- **Files to modify** — which files will be created, edited, or deleted?
- **Tests to write** — what tests are needed BEFORE implementation? (TDD)
- **Approach** — step-by-step implementation strategy
- **Dependencies** — what must happen before what?
- **Verification steps** — how will we confirm it worked? (build, test, lint)
- **Risks** — what could go wrong? What's the rollback plan?

### When to Skip Planning

You may skip plan mode for:

- Single-file edits with a clear scope (fix a typo, rename a variable)
- Running existing skills/commands (`/test`, `/lint`)
- Purely informational questions
- Tasks the user explicitly says to do immediately

______________________________________________________________________

## VALIDATE — Plan Review Protocol

**After writing a plan, spawn review agents on the plan file before implementation begins.**

Use `/review-plan` to spawn three agents in parallel on the saved plan file:

| Reviewer | Focus |
|----------|-------|
| Architecture reviewer | Is the decomposition sound? Are module boundaries correct? |
| Test reviewer | Are the proposed tests sufficient? Missing edge cases? |
| Security reviewer | Are there security implications in the approach? |

Incorporate reviewer feedback into the plan before proceeding. If a reviewer raises a Critical issue, revise and re-validate.

______________________________________________________________________

## Work Decomposition

### Epic → Stories → Tasks

Break large features into a hierarchy:

| Level | Scope | Deliverable |
|-------|-------|-------------|
| **Epic** | Full feature or capability | Multiple PRs over days/weeks |
| **Story** | One tracer bullet through all layers | One PR, independently deployable |
| **Task** | One implementation step within a story | One commit or small group of commits |

### Tracer Bullets Over Horizontal Layers

Each story should cut through all layers (schema, API, UI, tests) rather than completing one horizontal layer at a time. This ensures:

- Every story delivers working, testable functionality
- Integration issues surface early
- Each PR is independently reviewable and deployable

### Tracer Bullet First

The first story is always the **tracer bullet** — the simplest possible end-to-end path through the feature. It proves the architecture works before adding complexity. See `git-and-delivery.md` for the full tracer bullet pattern.

______________________________________________________________________

## Plan Storage

**Every plan must be saved to a file so it survives context compression.**

### Where to Save

```
working/plans/
├── 2026-02-07_add-user-authentication.md
├── 2026-02-07_refactor-payment-module.md
└── ...
```

### Naming Convention

`YYYY-MM-DD_short-description.md`

### Plan File Format

```markdown
# Plan: [Short Description]

**Date:** [YYYY-MM-DD HH:MM]
**Status:** DRAFT | APPROVED | IN PROGRESS | COMPLETED
**Task:** [What the user asked for]

## Acceptance Criteria

- [ ] [Criterion 1]
- [ ] [Criterion 2]

## Tests to Write First (TDD)

- [ ] [Test 1 — describe what it validates]
- [ ] [Test 2 — describe what it validates]

## Approach

1. [Step 1 — Write failing tests]
2. [Step 2 — Implement minimum code to pass]
3. [Step 3 — Refactor]
4. ...

## Files to Modify

- `path/to/file1.ext` — [what changes]
- `path/to/file2.ext` — [what changes]

## Verification

- [ ] `make build` passes
- [ ] `make test` — all tests green
- [ ] `make lint` — zero warnings
- [ ] `make typecheck` — zero errors

## Risks & Rollback

[Any risks, open questions, or decisions made]
```

### When to Update the Plan

- **Before starting:** Status = APPROVED
- **During implementation:** Check off completed steps
- **After completion:** Status = COMPLETED, add any deviations noted
- **If the plan changes:** Update the file and note what changed and why

______________________________________________________________________

## Session Logging

**Session logs live at `working/logs/YYYY-MM-DD_description.md`.** They are a running record of *why* things happened — not what changed (git handles that).

There are **three distinct logging behaviors:**

### Post-Plan Log (special trigger)

**Immediately after a plan is approved**, create the session log file with:

- The goal and plan summary
- Key context and constraints discussed during planning
- Rationale for the chosen approach, including rejected alternatives

This is a specific, predictable trigger: plan approved → save log. It captures decisions while context is richest, before implementation eats up the context window.

### Incremental Logging (during implementation)

**As you work, append to the session log whenever something worth remembering happens:**

- A design decision is made or changed mid-implementation
- An unexpected problem is discovered and solved
- The user expresses a preference or corrects an assumption
- A review agent catches something significant
- The approach deviates from the original plan

This is the most important behavior. Context gets compressed as the session progresses. If a key decision lives only in the conversation, it will be lost. Writing it to the log file immediately makes it permanent.

**Do not batch these updates.** Append a 1-3 line entry as soon as the event happens.

### End-of-Session Log (closing trigger)

**When the session is ending**, add a final section to the log with:

- Summary of what was accomplished
- Open questions for next session
- Any unresolved issues

Trigger: end-of-session signals ("let's wrap up", "commit this", "we're done").

**Do not wait to be asked for any of these.** All three behaviors are proactive.

______________________________________________________________________

## Context Preservation

### Never /clear — Rely on Auto-Compression

**NEVER use `/clear` to reset the conversation. Use auto-compression instead.**

- `/clear` is a **nuclear option** — it destroys ALL context, including design decisions, corrections, and the mental model of the project
- Auto-compression is **graceful degradation** — Claude Code's built-in compression preserves the most important context while freeing space
- Saved plans provide a **safety net** — even if compression loses details, the plan file on disk has the full strategy

### What to Do When Context Gets Long

1. **Let auto-compression handle it.** Claude Code will compress automatically when needed.
1. **Save important context to disk** — plans, decisions, correction logs
1. **Reference saved files** — point Claude to the plan file or quality report if context seems thin
1. **Start a new session if truly needed** — but start by reading the saved plan and recent git log, not from a blank slate

### Session Recovery Protocol

If starting a new session (or after heavy compression):

1. Read `.claude/CLAUDE.md` for project context
1. Read the most recent plan in `working/plans/`
1. Read `.context.md` files for modules relevant to the current task
1. Check `git log --oneline -10` for recent changes
1. Check `git diff` for any uncommitted work
1. State what you understand the current task to be

______________________________________________________________________

## Continuous Learning with [LEARN] Tags

**When a mistake is corrected, immediately save a `[LEARN:tag]` entry to MEMORY.md.**

Format: `[LEARN:category] Incorrect assumption → correct fact`

Common categories: `pattern`, `api`, `test`, `convention`, `performance`, `security`, `workflow`. Add a tag whenever the user corrects a factual claim, a build error reveals a wrong assumption, or a review agent catches a systematic error. These persist across sessions and prevent repeating the same mistake.
