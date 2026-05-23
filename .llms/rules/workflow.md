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

| Stage | What Happens | Skills / Rules |
|-------|-------------|----------------|
| UNDERSTAND | Read existing code, tests, recent git log | `/explore-module` |
| PLAN | Decompose into tracer bullets | `superpowers:writing-plans` (or native plan mode) |
| VALIDATE | Review the plan before building | `/review-plan` |
| BUILD | TDD, one tracer bullet at a time | `/create-feature`, `/refactor`, `superpowers:test-driven-development`, `superpowers:systematic-debugging` |
| VERIFY | Linters as law, tests as contract | `/lint`, `/test`, `quality-and-verification.md` |
| REVIEW | Multi-agent code review | `/review`, `superpowers:dispatching-parallel-agents` |
| SHIP | Small PR, one tracer bullet per PR | `/deploy`, `git-and-delivery.md` |
| OBSERVE | Tracing and context-rich outputs | `code-conventions.md` |

______________________________________________________________________

## UNDERSTAND — Read Before You Write

Before modifying any module:

1. Read relevant tests to understand existing behavior.
1. Check `git log --oneline -10` for recent changes in the area.
1. Identify dependencies and dependents.

______________________________________________________________________

## PLAN — Plan Before You Build

For non-trivial work — anything touching multiple files, implementing a feature, fixing a non-obvious bug, or refactoring — produce a written plan first. Use `superpowers:writing-plans` if available, or the harness's plan mode otherwise.

A task is trivial (skip the plan) only when it's a single-file edit with an obvious scope: a typo fix, a rename, running a known skill (`/test`, `/lint`), or a purely informational question.

### A good plan contains

- **Task description** and **acceptance criteria** — what are we trying to accomplish, and how do we know when it's done?
- **Files to modify** — what gets created, edited, or deleted.
- **Tests to write first** — TDD applies.
- **Approach** — step-by-step.
- **Verification** — `make check` (or equivalent) commands that prove it works.
- **Risks** — what could go wrong, and the rollback plan.

### After the plan is approved

The orchestrator pattern takes over: implement (TDD) → verify (`make check`) → review (parallel review agents per `agent-coordination.md`) → fix (Critical → Major → Minor) → score against `quality-and-verification.md` → present results. Cap at 5 review-fix rounds.

If the user says "just do it" / "you decide" / "handle it", skip the final approval pause but keep running the full verify-review-fix loop. Auto-commit only if the quality score clears the commit threshold (80).

______________________________________________________________________

## VALIDATE — Plan Review Protocol

After writing a plan, spawn review agents on it before building. Use `/review-plan` to dispatch:

| Reviewer | Focus |
|----------|-------|
| `architecture-reviewer` | Is the decomposition sound? Are module boundaries correct? |
| `test-reviewer` | Are the proposed tests sufficient? Edge cases covered? |
| `security-reviewer` | Are there security implications in the approach? |

Incorporate findings. If a reviewer raises a Critical issue, revise and re-validate.

______________________________________________________________________

## Work Decomposition

### Epic → Stories → Tasks

| Level | Scope | Deliverable |
|-------|-------|-------------|
| **Epic** | Full feature or capability | Multiple PRs over days/weeks |
| **Story** | One tracer bullet through all layers | One PR, independently deployable |
| **Task** | One implementation step within a story | One commit or small group |

### Tracer Bullets Over Horizontal Layers

Each story cuts through all layers (schema, API, UI, tests) rather than completing one horizontal layer at a time. Every story should deliver working, testable functionality. The first story of any epic is always the **tracer bullet** — the simplest end-to-end path that proves the architecture works. See `git-and-delivery.md` for the full pattern.

______________________________________________________________________

## Context Preservation

### Never `/clear` — Rely on Auto-Compression

`/clear` destroys all context including design decisions, corrections, and the project mental model. Auto-compression is graceful — it preserves the most important context while freeing space. Let the harness compress automatically.

### When context gets long

1. Save important context to disk: plans, decisions, correction logs.
1. Point Claude at saved files when context seems thin.
1. If you must start a new session, recover from the saved plan and `git log` — not from a blank slate.

### Session recovery

If starting fresh (new session or after heavy compression):

1. Read `CLAUDE.md` for project context.
1. Read the most recent plan file if one exists.
1. `git log --oneline -10` for recent changes.
1. `git diff` for uncommitted work.
1. State what you understand the current task to be before proceeding.

______________________________________________________________________

## Continuous Learning

When the user corrects a factual claim, when a build error reveals a wrong assumption, or when a review agent catches a systematic mistake — save it to memory (`MEMORY.md` per the harness's auto-memory system) so it persists across sessions. Categorize: `pattern`, `api`, `test`, `convention`, `performance`, `security`, `workflow`. Don't repeat the same mistake twice.
