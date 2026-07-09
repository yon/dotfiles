# AI-DLC — AI Development Lifecycle

**How AI-driven development runs, end to end. This extends `workflow.md`'s 8-stage SDLC with the orchestration, verification, and learning discipline proven in practice (DJOS remediation program, 2026-07). Applies to all projects; per-project CLAUDE.md may tighten but not loosen it.**

```
CAPTURE → DESIGN → DECOMPOSE → BUILD (TDD) → VERIFY → REVIEW → INTEGRATE → DEPLOY → PROVE LIVE → LEARN
   ↑                                                                                          |
   └──────────────────────────────────────────────────────────────────────────────────────────┘
```

______________________________________________________________________

## 1. CAPTURE — every unit of work is a GitHub issue with dependencies

- **No untracked work.** Findings, features, remediations, follow-ups discovered mid-task — each becomes an issue before (or immediately after) the work happens. If it was worth doing, it is worth tracking.
- **Issues are executor-ready**: written so a lesser model executes them without re-investigation — evidence, file anchors (dated; executor re-greps), API/schema sketch, step list, acceptance criteria, verification commands, explicit out-of-scope.
- **Acceptance criteria are the correctness spec.** Numbered (`AC<n>`), phrased given/when/then with concrete inputs and expected outputs — testable as written. The implementor turns each into tests tagged with its AC number; review verifies conformance against the numbers mechanically. Anything not phrasable as a testable statement is a design principle (epic level) or noise, not a criterion.
- **Dependencies are captured natively** (GitHub blocked-by relationships) AND restated in the body. Epics group tracks with sub-issues and a wave-ordered execution plan.
- Anchor caveat in every issue: line numbers are from the filing date — re-locate with grep before editing.

## 2. DESIGN — API and schema before code

- The issue (or a committed plan doc in `docs/plans/YYYY-MM-DD-<slug>.md` for multi-issue tracks) states the contract first: types, function signatures, table columns, state machines, error taxonomy.
- **State machines get terminal states.** Any lifecycle column enumerates its full value set as a literal union type; "what marks it done" is designed, not discovered.
- **Error taxonomy up front**: expected failures are typed (`Result<T, E>` with a discriminated union), classified retryable vs permanent at the point of throw, and carry context (operation, inputs, underlying message).
- Schema changes: migrations are transactional, numbered per project convention, and the design states the backfill for existing rows — new-code-path behavior AND data-repair are both specified.
- Research before invention: for anything with established practice (queues, dedup, memory systems), check what production systems do first, with primary sources; adopt patterns, not dependencies, at personal-project scale.

## 3. DECOMPOSE — orchestration for a team of agents

- One issue = one branch = one PR (tracer bullets per `git-and-delivery.md`).
- **Push the base first.** Agent worktrees branch from `origin/<default>`; unpushed local commits mean every agent builds on a stale base. Verify `git rev-list origin/main..main` is empty before dispatching.
- File ownership per agent (per `agent-coordination.md`); when two branches must touch one file, warn both agents to keep diffs surgical and name a merge coordinator (the lead) who resolves overlaps at rebase.
- Batch by conflict surface: fully-disjoint issues run parallel; overlapping ones sequence or get explicit coordination warnings.
- Agent prompts carry: the issue reference, current-main context that changed since filing, hard rules (no live-data writes, branch name, verification gate, attribution policy), and what to RETURN.
- Migration-number collisions between parallel branches are expected: the merge coordinator renumbers at rebase (until conflict-free migrations land).

## 4. BUILD — TDD with domain coverage, not just line coverage

- Tests first, always — and **the acceptance criteria come first among the tests**: each `AC<n>` from the issue becomes one or more tests traceably tagged with its number, and the PR description carries the AC→test map (criterion → test name, or exact command + pasted output for command-verified ACs). An AC the implementor cannot map is raised to the lead before pushing, never shipped around. Coverage targets the DOMAIN, not the diff:
  - **Real-world fixtures**: test data mirrors production shapes — pull representative rows/ids/strings from the live system (read-only) and quote them verbatim. A regex tested only against invented ids is untested (a dedup finder once matched 0 of 58 live rows because fixtures used fabricated id shapes).
  - **Schema through the real migration runner**, never hand-written CREATE TABLE — hand-copied schemas drift and hide the exact bug class migrations exist to prevent.
  - Edge cases per type: boundaries (day/timezone, thresholds), empty sets, idempotency (run twice), unicode, negative paths, budget-exhausted paths.
  - Scripts that mutate data are tested for: dry-run correctness, apply, idempotent re-run, FK integrity.
  - **Hardening beyond the baseline is tiered by risk**, per the Test Hardening Ladder in `quality-and-verification.md`: property-based tests for pure functions with clear invariants (parsers, normalizers, arithmetic, round-trips); scoped mutation runs for identity/merge and money-adjacent logic on hardening passes, not per-PR. Physical constraints (tests, thresholds, kill rates) over prompt rules — a gate an agent must satisfy beats an instruction it can rationalize around.
- Implementation standards (enforced by `engineering-principles.md`): pure core / impure shell, `Result<T,E>` for expected failures, domain types and literal unions over strings, DI for testability, DRY via shared seams (extract a library from a script before writing the second copy), noun-verb naming or project convention.

## 5. VERIFY — the machine gate

- `make check` (or project equivalent) green before any push. Per `quality-and-verification.md`.
- Lint/typecheck config is law; fix the code or the config, never suppress silently.
- Keep tool scopes clean: exclude agent worktrees/artifacts from linter/test discovery so parallel work never pollutes the gate.

## 6. REVIEW — adversarial, multi-dimension, per PR, BEFORE merge

Review gates each PR individually, before it merges — not a post-hoc batch over an already-merged wave. This is a hard gate, not a courtesy pass.

- **AC conformance is checked mechanically before any panel spawns.** Cheapest tier (or no model): every AC in the issue appears in the PR's AC→test map, every mapped test exists and passed in the machine gate's output, every command-verified AC's command re-executes with matching output. A missing or unmapped AC returns to the implementor as a Major — reviewing an incomplete implementation wastes the whole panel. This replaces the "did it do what the issue asked" half of correctness review at near-zero cost.
- **Per-PR panel: a mandatory core plus a triggered optional pool.** As soon as conformance passes, spawn the panel against THAT PR's diff — one dimension per agent (per `agent-coordination.md`). **The tests reviewer runs on every PR, always** — its mandate, with conformance already machine-checked: assertions would actually fail if the implementation broke (no tautologies), fixtures are production-shaped, edge cases beyond the ACs are covered, and the ACs themselves match the issue's intent (the standing defense against implementor and checker agreeing on a wrong spec). The remaining dimensions form an optional pool with hard triggers (adversarial-correctness: state machines/concurrency/crash-recovery, identity merge/dedup logic, budget/threshold arithmetic, untrusted-input parsing, large or cross-module diffs, or the lead cannot predict the diff's behavior — when unsure, trigger; security: email/message sending, input parsing, auth, new dependencies, subprocess/shell execution; architecture: new modules, changed public interfaces, cross-cutting refactors; performance: queries over large tables, loops over ingest-scale batches, LLM call paths; data-integrity: migration files, scripts that mutate live data, FK changes), and beyond the triggers the lead adds any reviewer its read of the diff warrants. The adversarial-correctness mandate is "the ACs are verified — find what they MISS"; it never re-proves the happy path. The trigger table is a maintained artifact: a post-merge Critical/Major in a PR that skipped a reviewer means a trigger row was missing — add it in the same session (stage 11). The lead posts the panel composition and one-line rationale as a PR comment before reviews start, so a skipped dimension is an auditable decision, not an omission. Writers never review their own work. Each reviewer agent has `gh` access and posts its OWN comments directly — the lead does not collect findings in chat and batch-post afterward.
- **Reviewers comment as they find things, not after they finish.** Each finding gets posted the moment it's identified during that reviewer's pass, before moving to the next file or wrapping up: inline, file:line-anchored comments (`gh api repos/{owner}/{repo}/pulls/{n}/comments -f body="..." -f commit_id=... -f path=... -f line=...`) for issues tied to a specific section of code, PLUS one overall summary comment (`gh pr comment <n>`) per reviewer covering cross-cutting observations, severity triage, and a clean-bill statement if nothing was found. A reviewer's final text-output-to-the-lead report is a SUMMARY of what it already posted, not the first and only record of the finding.
- **The lead validates before acting, but the comments already exist.** Findings are triaged Critical/Major/Minor with concrete failure scenarios (file:line, repro) — the lead verifies claims against the code before dispatching a fix, since reviewers can be wrong (per `receiving-code-review` discipline). If the lead's verification changes a finding's severity or rejects it outright, post that verdict as a reply/follow-up comment on the original finding — don't silently overrule it out-of-band. The failure mode being designed against: a finding that only exists in chat/session context is undocumented the moment the session ends.
- **Model tiering per role.** Match model strength to the cost of that role being wrong: mechanical execution (verification runs, AC-conformance checks, issue filing from existing findings, report assembly) → cheapest tier; implementors and checklist-driven reviewers (tests, architecture, performance, data-integrity) → mid tier; adversarial-correctness and security reviewers and fix-round delta verifiers → strong tier; the frontier model is an escalation, never a default — reserved for adjudicating cap-surviving findings, genuinely ambiguous semantic conflicts, and owner escalations. Trigger checks that are pattern matches use no model at all.
- **Fix-and-reverify loop — delta verification, not full re-panel.** Critical/Major findings go back to an implementor (the original subagent, resumed, or a fresh one briefed with the findings — link the PR comment, don't retype it) to fix in the same branch/PR. Re-run `make check`; then verify the DELTA: one verifier per surviving finding, given the original PR comment and only the fix commits' diff, answering "does this resolve the finding, and does the fix break anything adjacent?" — plus re-firing any optional-pool trigger the fix diff newly trips. A full re-panel runs only when the fix rewrote the approach rather than patching it (the lead states which, in the PR). Repeat up to the same round cap as the rest of the AI-DLC (5). If a finding survives the cap, the lead decides explicitly: accept with a documented reason, or block and escalate to the owner — never merge past an unresolved Critical/Major silently.
- **Minors** become tracked issues under the right epic (native `blocked_by` wired) rather than blocking the PR — but they must be filed before or immediately after merge, not dropped, and a reply to the original PR comment links the filed issue number.
- **Only merge once the panel clears the PR** (no unresolved Critical/Major). This applies to every PR, in every project — not just batches or waves. Nothing lives only in a chat transcript; every finding is a PR comment first, and every surviving one becomes a fix already merged (referenced by commit/PR) or a tracked issue (referenced by number) as a reply to that comment.

## 7. INTEGRATE — the merge coordinator role

- Sequential rebase-verify-merge: rebase each branch onto current main, resolve semantic conflicts by COMBINING intents (not picking sides), re-run the full gate, squash-merge, repeat. Never merge a stale-base PR.
- After all merges: one integration verification on main.
- Clean up worktrees/branches immediately — stale worktrees pollute linters, test runners, and future agents.

## 8. DEPLOY — code on main is not code running

- Rebuild artifacts (`make build`) and refresh schedulers/daemons (`make deploy-launchd` or equivalent) — scheduled jobs run the built artifact, not the source tree.
- Migrations and one-time scripts apply at deploy under the data rules below.

## 9. PROVE LIVE — real-world verification is part of done

- **`make check` green is necessary, never sufficient.** Run the affected job for real on the real setup; verify observable outcomes: DB post-condition queries, files written, log lines, cost records.
- Data-mutation discipline: backup first → dry-run against the LIVE data → human-readable plan reviewed → apply → post-condition queries → idempotency re-run → export/dump per project convention.
- Agents never touch live data; the lead (or owner) runs live steps. Scripts default to dry-run; `--apply` is explicit.
- Paste the live evidence (queries, outputs) into the PR/issue before closing it.

## 10. OBSERVABILITY & COST — built in, not bolted on

Every feature ships with its own diagnosability:

- **Jobs**: registered in the run-ledger (start/finish/ok/detail with per-stage counters), covered by progress-based health (backlog delta, zero-progress detection, hung/too-fast runs) — "exited 0" is not "healthy".
- **Errors**: classified kind + real underlying message persisted where the operator looks (not just stderr); no silent catch blocks; stack traces preserved.
- **LLM calls**: tagged with a specific `call_site`, model, and token/cache counts; spend attributable by site and day.
- **Budgets**: every recurring LLM workload runs under an explicit budget with degrade (cheaper model) and defer (retry later, never drop) semantics; budget-starved work is surfaced, not silent. New scheduled LLM jobs get their own sub-budget.
- **No silent caps**: anything truncated, skipped, deferred, or sampled is counted and reported.

## 11. LEARN — close the loop

- Corrections, wrong assumptions, systematic agent mistakes → auto-memory (typed, with Why/How-to-apply) and, when durable, into CLAUDE.md or these rules.
- Instruction files are maintained artifacts: when reality changes (paths, budgets, conventions), the stale line gets fixed in the same session that discovered it.
- Post-mortems for silent failures answer one question first: which observability gap let this stay invisible, and which issue fixes that gap.

______________________________________________________________________

## Stage gates (quick card)

| Gate | Passes when |
|------|-------------|
| Capture | Issue exists, executor-ready, dependencies wired natively |
| Design | Types/schema/state machine/error taxonomy written before code |
| Build | Tests first; real-world fixtures; migrated-schema tests; idempotency |
| Verify | Full project gate green |
| Review | Panel ran BEFORE merge, per PR; no unresolved Critical/Major; every survivor is a fix already merged or a tracked issue |
| Integrate | Rebased on current main; semantic conflicts combined; gate re-run |
| Deploy | Artifacts rebuilt; schedulers refreshed |
| Prove live | Real run + DB/log evidence pasted; backup + dry-run→apply for data |
| Observability | Run-ledger, classified errors, tagged spend, budget, no silent caps |
| Learn | Memory/instructions updated for anything that surprised us |
