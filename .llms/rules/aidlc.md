# AI-DLC — AI Development Lifecycle

**The binding contract for AI-driven development; applies to all projects (per-project CLAUDE.md may tighten, never loosen). The `epic-plan` skill executes stages 1-3; the `epic-implement` skill executes stages 3-7 (leaving deploy + prove-live to the owner via checklist). This file states the invariants those skills implement — where a skill and this file disagree, fix whichever is wrong in the same session.**

```
CAPTURE → DESIGN → DECOMPOSE → BUILD (TDD) → VERIFY → REVIEW → INTEGRATE → DEPLOY → PROVE LIVE → LEARN
   ↑                                                                                          |
   └──────────────────────────────────────────────────────────────────────────────────────────┘
```

## 0. SCOPE — every task enters here

- **Trivial** (single-file edit with obvious scope: a typo, a rename, running a known skill, an informational question): just do it — no plan, no issue.
- **Direct work** (non-trivial, not epic-scale): read before writing — the relevant tests, `git log --oneline -10` for the area, dependencies and dependents — then plan first (plan mode or `superpowers:writing-plans`), then BUILD → VERIFY → REVIEW below. Review runs on the working diff (built-in `/code-review`); the gate is finding-driven the same as stage 6, but Minors may be fixed inline instead of filed.
- **Epic-scale** (multi-issue program of work): the full lifecycle below, captured as a GitHub epic.

## 1. CAPTURE

- Every unit of work is a GitHub issue, executor-ready: evidence, dated anchors (executor re-greps), contract sketch, verification commands, explicit out-of-scope. No untracked work — discoveries become issues before or immediately after the work.
- **Acceptance criteria are the correctness spec**: numbered `AC<n>`, given/when/then with concrete inputs and expected outputs, testable as written. Anything not phrasable that way is a design principle (epic level) or noise (cut).
- Dependencies wired natively (blocked-by) AND restated in the body; epics group work via sub-issues.
- The owner reviews and approves every epic and sub-issue body before it is filed.

## 2. DESIGN

- Contract before code: types, signatures, schema, state machines (terminal states enumerated as literal unions), error taxonomy (typed `Result<T,E>`, retryable vs permanent at the point of throw, context-rich).
- Migrations transactional, per project convention, with the backfill for existing rows specified alongside the new-code path.
- Research before invention: anything with established practice gets checked against production systems first (primary sources); adopt patterns, not dependencies.

## 3. DECOMPOSE

- One issue = one branch = one PR (tracer bullets per `git-and-delivery.md`). Push the base before dispatching agents.
- File ownership per agent; batch by conflict surface; migration-name collisions are the coordinator's to resolve at rebase.
- Agent prompts carry: the issue ref, context newer than the filing, the hard rules, and what to RETURN.

## 3a. DISPATCH — parallel subagents

- Parallelism earns its cost (each subagent pays its own full context; ~N× sequential tokens) only when concurrency has genuine value — 2-4 agents for most work; ~4 concurrent implementors is the epic cap. Strong fits: dimensional review panels, module-parallel implementation over disjoint files, competing-hypothesis debugging, research swarms. Skip it for single-file changes, tightly-coupled edits (sequence them), and exploration where the file set isn't known yet.
- Every dispatch prompt is self-contained — the agent has no conversation history, only the prompt, the project CLAUDE.md, and the codebase. State the files/directories it owns (exactly one owner per file; config files included), the definition of done, and decisions already made so it doesn't relitigate them.
- Worktree isolation: mandatory for PR-producing dispatch (branched from a pushed base); on demand for in-session parallel edits when ownership boundaries are unclear.
- Crews are long-lived per PR: fixes, rebases, and delta verification route back to the same implementor/finder via SendMessage; respawn (briefed from the PR + issue) only when an agent is dead or incoherent.
- Adversarial separation: writers never review their own work; reviewers never edit the deliverable. The lead verifies findings before acting and never overrides a reviewer without justification.
- Verify the combined result: individual agent success is not integration success — run the gate on the merged result and route failures back to the responsible agent.

## 4. BUILD — TDD with domain coverage

- Tests first; every `AC<n>` becomes tests tagged with its number; the PR description carries the AC→test map. An unmappable AC is a blocker raised before pushing, never shipped around.
- Real-world fixtures quoted verbatim from the live system (read-only); schema through the real migration runner, never hand-written DDL.
- Edge cases per type: boundaries, empty sets, idempotency (run twice), unicode, negative and budget-exhausted paths. Mutation scripts tested for dry-run correctness, apply, idempotent re-run, integrity.
- Hardening beyond baseline is tiered by risk per the Test Hardening Ladder (`quality-and-verification.md`): physical constraints over prompt rules.

## 5. VERIFY

- The project gate (`make check` or equivalent) green before any push. Lint/typecheck config is law — never suppress silently. Agent worktrees excluded from tool discovery.

## 6. REVIEW — hard gate, per PR, before merge

- AC conformance is checked mechanically before any panel: map complete, tagged tests passed in the gate output, command-verified ACs re-run.
- Panel: the tests reviewer always; an optional pool (adversarial-correctness, security, architecture, performance, data-integrity, hardener) joins by published triggers plus lead judgment, with the composition posted to the PR before reviews start. The single maintained trigger table lives in the `epic-implement` skill; repo CLAUDE.md rows augment it, never fork it. A post-merge Critical/Major in a PR that skipped a reviewer means a missing row — added the same session.
- Findings are PR comments posted as found: severity (Critical/Major/Minor) + concrete failure scenario. A finding without a repro is a question. The lead verifies before dispatching fixes and replies with verdicts — nothing lives only in chat.
- Fix rounds: the PR's own implementor fixes; the finding's own reviewer verifies the delta (fix-commits diff only); a full re-panel with FRESH reviewers only when the approach was rewritten. 5-round cap, then explicit accept-with-documented-reason or escalate — never merge past a Critical/Major silently.
- Model tiering by cost-of-being-wrong: mechanical work cheapest tier; implementors and checklist reviewers mid; adversarial-correctness and security strong; delta verification routes to the finder and inherits its tier (a fresh strong-tier verifier only when the finder is dead); the frontier model is escalation-only. Pattern-match trigger checks use no model.
- Minors become tracked issues (wired, linked in a reply to the finding) — never dropped, never blocking.
- Closing invariant: every finding is a PR comment first; every survivor ends as a merged fix (referenced by commit/PR) or a tracked issue (referenced by number), posted as a reply to the original comment.

## 7. INTEGRATE

- Sequential rebase-verify-merge; semantic conflicts resolved by COMBINING intents, never picking a side. Gate re-run per PR, one integration verification at the end, worktrees removed immediately.

## 8. DEPLOY

- Code on main is not code running: rebuild artifacts, refresh schedulers, apply migrations under the data rules in stage 9.

## 9. PROVE LIVE

- Gate-green is necessary, never sufficient: run the affected job for real and verify observable outcomes (post-condition queries, files written, log lines, cost records); paste the evidence into the PR/issue before closing.
- Data mutation: backup → dry-run against live data → reviewed plan → `--apply` → post-conditions → idempotency re-run. Agents never touch live data; scripts default to dry-run with explicit `--apply`.

## 10. OBSERVABILITY & COST — built in, not bolted on

- Jobs registered in the run-ledger with per-stage counters and progress-based health ("exited 0" is not "healthy"); errors classified with the real underlying message persisted where the operator looks; every LLM call tagged (call site, model, tokens) under a budget with degrade/defer semantics; nothing truncated, skipped, or sampled silently.

## 11. LEARN

- Corrections, wrong assumptions, and systematic agent mistakes go to memory — and, when durable, into CLAUDE.md or these rules — in the same session that discovered them. Post-mortems for silent failures answer first: which observability gap let this stay invisible, and which issue fixes it?
