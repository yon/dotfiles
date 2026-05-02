---
name: review
description: Use when reviewing uncommitted, staged, or specified code changes before commit or PR
---

# /review — Multi-Dimensional Code Review

Spawn parallel specialized reviewers (read-only) and synthesize their findings.

**REQUIRED BACKGROUND:** `superpowers:requesting-code-review` — defines the request-for-review pattern. This skill adds parallel multi-reviewer dispatch.

**For parallel agent dispatch mechanics:** see `superpowers:dispatching-parallel-agents`.

---

## Scope

| Invocation | Target |
|---|---|
| `/review` | uncommitted changes (`git diff`) |
| `/review [file\|dir]` | specific path |
| `/review --staged` | staged only |
| `/review --plan [file]` | delegate to `/review-plan` |

---

## Reviewer selection

Read changed files, categorize, and pick reviewers:

| Change touches… | Spawn |
|---|---|
| any code | code reviewer (always) |
| tests or new code | test reviewer (always) |
| auth, input, config, deps | security reviewer |
| new modules / boundary changes | architecture reviewer |
| data access, hot paths | performance reviewer |
| public APIs, README | doc reviewer |

---

## Spawning

Spawn all selected reviewers in **one response** for true parallel execution. Each Task gets:
- the changed file list
- explicit dimension to focus on
- "read-only — produce a report, do not edit"
- "return findings categorized Critical / Major / Minor"

Available `subagent_type` values vary by environment — check what's registered. Safe fallback: `general-purpose` with the persona injected via prompt. If `superpowers:code-reviewer` or `feature-dev:code-reviewer` are available, prefer those for code review; `linux-systems-code-reviewer` for shell/infra.

---

## Verify, then synthesize

1. Run `make check` (build + test + lint + typecheck) — captures objective health independent of reviewer opinion.
2. Merge reports, dedupe, group by severity, attribute to source reviewer.
3. Apply quality-gates rubric (see `quality-and-verification.md`).

```markdown
## Combined Code Review

**Files:** [list]   **Reviewers:** [list]   **Score:** [N]/100

### Critical (block commit)
- **[reviewer]** [file:line] — [issue]

### Major (block PR)
…

### Minor
…

### Verification
| build | tests | lint | typecheck |
|---|---|---|---|
```

---

## Rules

- Reviewers are read-only. Findings only, no edits.
- Critical from ANY reviewer blocks commit, regardless of overall score.
- Code + test reviewers always run. Others are conditional on the diff.
- Do not downgrade reviewer severity without justification.
