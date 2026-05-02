---
name: review-plan
description: Use when an implementation plan has been written but not yet executed, before any code is built
---

# /review-plan — Plan Review Before Build

Catch architectural mistakes in the plan, where they cost minutes, instead of in the code, where they cost days.

**REQUIRED BACKGROUND:** `superpowers:writing-plans` (what a good plan looks like) and `superpowers:dispatching-parallel-agents` (how to fan out).

---

## Workflow

1. **Locate plan.** `/review-plan [file]` or default to most recent `working/plans/*.md`.
2. **Spawn reviewers in parallel** — each reads the plan (not code) and checks one dimension. Inject the persona via the Task prompt; `subagent_type: general-purpose` is a safe default.

| Reviewer | Checks |
|---|---|
| Architecture | module boundaries, coupling, scaling 6–12 months out, file-ownership clarity for parallel work |
| Test | TDD soundness, coverage of happy/error/edge paths, untestable designs, verifiable acceptance criteria |
| Security (only if plan touches auth, data, or external services) | threat model, boundary validation, authn/authz, sensitive-data handling |

3. **Compile** by severity (Critical / Major / Minor), one section per severity, attributed to the source reviewer.

4. **Gate.**

| Found | Action |
|---|---|
| Critical | Update plan, re-review |
| Major | Update plan, proceed with awareness |
| Minor / none | Plan is ready |

---

## Plan review ≠ code review

| Dimension | Plan review checks | Code review checks |
|---|---|---|
| Architecture | boundaries, coupling, scalability | implementation of those boundaries |
| Testing | strategy and coverage *plan* | actual test quality and assertions |
| Security | threat model, design | injection, secrets in code |
| Completeness | are all cases covered in the plan | are all cases handled in the code |

A plan that passes review still needs code review after implementation.

---

## Rules

- Always review plans that touch >3 files.
- Reviewers are read-only — they never modify the plan.
- Critical issues block implementation.
- Plan review is fast (minutes) vs implementation rework (hours). Use it.
