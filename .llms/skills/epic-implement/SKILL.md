---
name: epic-implement
description: Use when asked to implement an epic, a backlog of issues, or "/epic-implement N" — autonomous multi-agent execution of a GitHub epic's sub-issues, safe under a permission-bypassed session. Pass the epic number as the argument; if omitted, asks which open epic to run.
---

# Epic Implement

You are the MERGE COORDINATOR for ONE epic, end to end, autonomously. Subagents write code; you integrate and report. Design was done at planning time (`epic-plan`) — execute faithfully, don't re-design. The review contract you enforce is AI-DLC stage 6 (`~/.files/.llms/rules/aidlc.md`).

## The contract

1. **One epic, to completion** — every runnable sub-issue implemented, reviewed, merged into the epic branch, never main.
2. **Sealed** — all work in worktrees on an epic integration branch. Never touch the main checkout, live data stores, output/log directories, or schedulers (the repo's CLAUDE.md names them). No deploy, no live runs, no real sends. This is what makes permission-bypass safe.
3. **The owner merges** — you open exactly one PR (`epic/<n>-<slug>` → main) and NEVER merge it. Branch protection cannot distinguish you from the owner on the same token; do not rationalize past this.

## Read first

1. The target repo's CLAUDE.md — defines the gate command ("the gate" below), install step, migration convention, live-data rules, owner-gated surfaces. It is the authority for conventions.
2. The newest execution plan, if any: `ls docs/plans/*execution-plan*.md 2>/dev/null | sort | tail -1` — coordination only; issue bodies are the design truth. None → the epic body's wave order serves.
3. The AI-DLC and any design docs the issues reference.

## The state machines

Diagrams are the control flow; the state sections are each state's contract. A mismatch between them is a bug — fix whichever is wrong in the same session.

```mermaid
stateDiagram-v2
    [*] --> PickEpic
    PickEpic --> Seal : epic chosen (arg, or ask — the only question)
    PickEpic --> Resume : epic branch + draft epic PR already exist
    Seal --> Orchestrate
    Resume --> Orchestrate : state re-derived from GitHub

    Orchestrate --> CriteriaPreGate : slot free AND runnable,\nconflict-compatible issue
    CriteriaPreGate --> Dispatch : ACs present or written
    Dispatch --> Orchestrate : implementor running (per-PR machine)
    Orchestrate --> Orchestrate : PR merged / parked / agent stalled

    Orchestrate --> Finish : nothing runnable, nothing in flight
    Orchestrate --> Stop : epic unimplementable as specified
    Finish --> [*]
    Stop --> [*]
```

```mermaid
stateDiagram-v2
    [*] --> Implementing : dispatched (agent recorded vs PR)
    Implementing --> RebaseVerify : PR open vs epic branch,\ngate green, AC→test map
    RebaseVerify --> Conformance : rebased, conflicts combined, gate green
    note right of RebaseVerify
        Re-entered whenever the
        epic branch advances
    end note

    Conformance --> PanelCompose : map complete, AC-tagged tests passed
    Conformance --> Implementing : missing/unmapped AC (auto-Major)

    PanelCompose --> Reviewing
    Reviewing --> LeadVerify : findings already posted inline

    LeadVerify --> Merge : no surviving Critical/Major
    LeadVerify --> FixRound : surviving Critical/Major
    LeadVerify --> CapDecision : round 5, finding survives

    FixRound --> DeltaVerify : same implementor fixed, gate green
    FixRound --> RePanel : fix rewrote the approach
    DeltaVerify --> LeadVerify : verified by ITS OWN finder
    RePanel --> Reviewing : FRESH reviewers

    CapDecision --> Merge : accept, reason posted
    CapDecision --> Parked : block for owner; slot freed

    Parked --> [*]
    Merge --> [*]
```

## Agent lifecycle (applies across both machines)

- **Record every agent's ID against its PR at spawn** — implementor and reviewers alike.
- **Long-lived crews**: all later work on a PR routes to the SAME agents via SendMessage — the implementor fixes findings, rebases, and closes conformance gaps; each reviewer verifies fixes to its own findings. Fresh agents only when the original is dead or incoherent (note the substitution in the PR).
- **GC only when the PR closes** (merged or abandoned); check the agent→PR map for other PRs the implementor owns first.

## Model tiers (pass `model` explicitly on every dispatch)

| Tier | Roles |
|---|---|
| haiku | Gate/verification runs, AC-conformance check, Minor-issue filing, report assembly |
| sonnet | Implementors; tests / architecture / performance / data-integrity reviewers; hardener |
| opus | Adversarial-correctness and security reviewers; fresh delta verifiers (normal delta verification routes to the finder, inheriting its tier) |
| fable | Escalation only: cap-surviving adjudication, genuinely ambiguous rebase conflicts, "did the fix rewrite the approach", owner-escalation writeups |

Trigger checks are not model calls: `git diff --name-only` + grep against the trigger table.

## Epic states

**PickEpic.** Argument given → use it. Else derive open epics + runnable counts (`gh issue list --label epic`, sub_issues API, dependencies API) and ask via AskUserQuestion — the ONLY question; all else is autonomous. Never hardcode issue numbers. Epic branch + draft PR already exist → **Resume**.

**Seal.**

```bash
git fetch origin
git branch epic/<n>-<slug> origin/main && git push -u origin epic/<n>-<slug>
git worktree add .claude/worktrees/epic-<n> epic/<n>-<slug>
gh pr create --draft --base main --head epic/<n>-<slug>   # body: sub-issue checklist + empty owner live-verification checklist
```

Work only inside the epic worktree from here on.

**Resume.** All state lives in GitHub (epic branch, draft PR checklist, sub-PRs, issue states) — re-derive it, re-create the worktree if missing, respawn agents for open sub-PRs briefed from PR + issue, enter **Orchestrate**. Never re-create the branch/PR or redo merged work.

**Orchestrate.** Event-driven; ~4 concurrent implementors is a CAP, not a batch — fill a free slot immediately when a runnable, conflict-compatible issue exists. Runnable = all `blocked_by` closed AND not `owner-gated` AND the conflict matrix allows it alongside in-flight work (hot files: one toucher at a time, or explicit coordination warnings). Owner-gated / live-data / owner-decision issues are skipped and reported, never executed. Events:

- **Sub-PR merges** → slot frees; every other open sub-PR re-enters RebaseVerify (routed to its own implementor); re-derive runnability.
- **Sub-PR parks** → slot frees; its dependents stop being runnable; continue around it.
- **Agent stalls** (~30 min no progress) → probe via SendMessage; dead → respawn briefed from PR + issue, note substitution.

Exit: **Finish** (nothing runnable, nothing in flight) or **Stop** (epic unimplementable as specified — comment the evidence on the epic issue and end; redesign is planning work, not yours).

**CriteriaPreGate.** Every issue needs numbered testable ACs (per the epic-plan contract) before dispatch. Missing → YOU write them from the body and post as an issue comment titled "Acceptance criteria (added at dispatch)". Cheapest point to fix a vague spec.

**Dispatch.** One implementor per issue, worktree branched from `origin/epic/<n>-<slug>` (keep the epic branch pushed). Prompt must include:

- Repo install step; read the issue INCLUDING comments (dispatch-time ACs live there) + the plan's coordination notes.
- Branch `feat|fix|chore/<n>-<slug>` from the epic branch. TDD; fixtures quoted verbatim from the live system (read-only); schema via the repo's migration runner, never hand-written DDL.
- **AC→test map**: every `AC<n>` maps to tests whose descriptions contain `AC<n>`; the map goes in the PR description (or exact command + output for command-verified ACs). Unmappable AC = blocker, raise before pushing.
- Migrations per repo convention; never write to live data/output dirs; mutation scripts dry-run by default with explicit `--apply`.
- Gate green; conventional commits; NO AI attribution; `gh pr create --base epic/<n>-<slug>`. Return: PR URL, gate summary, deviations.
- You are long-lived: stay available — findings and rebase work come back to you until this PR closes.

**Finish.** Every sub-issue merged, parked, or skipped; gate green on the final branch. Report **complete** or **complete-with-remainder** (each parked/skipped/blocked issue with reason + link). Mark the epic PR ready-for-review: checklist with per-PR review outcomes, remainder, owner live-verification checklist, migration-rename notes — and state in the PR body: **merge with a MERGE COMMIT, not squash** — the one-commit-per-issue history is the deliverable (bisect/revert/blame at issue granularity; `git log --first-parent` still reads one entry per epic). Remove sub-issue worktrees; keep the epic worktree until the owner merges. Tell the owner what they must do: review commit-by-commit → merge (merge commit) → deploy → prove live.

## Per-PR states

**Implementing.** Per the dispatch prompt. Unmappable AC → coordinator resolves (clarify/amend the AC on the issue) and sends back. Exits: PR open vs epic branch, gate green, AC→test map present.

**RebaseVerify.** Rebase onto the CURRENT epic branch; semantic conflicts resolved by COMBINING intents (both new sections, both imports, both migrations renamed — never pick a side); full gate on the rebased branch. Re-entered whenever the epic branch advances, routed to the PR's own implementor. Clean rebase preserves gate progress; semantic conflicts re-run from Conformance.

**Conformance.** Mechanical (haiku or the lead): every AC appears in the map; every mapped test exists and passed in the gate output; command-verified ACs re-executed with matching output. No judgment. A gap → back to the same implementor as a Major; the panel never spawns for an incomplete implementation, and re-entry is from the top of the spine — conformance failures can never route around the panel.

**PanelCompose.** The **tests reviewer always runs**: (a) would each test fail if the implementation broke — hunt tautologies; (b) fixtures production-shaped; (c) edge cases BEYOND the ACs; (d) the ACs themselves against the issue's intent (the defense against implementor and checker agreeing on a wrong spec). Optional pool by trigger + lead judgment:

| Reviewer | Hard triggers |
|---|---|
| adversarial-correctness | state machines, concurrency, crash-recovery; irreversible-data logic (identity/dedup/merge); money/budget/threshold arithmetic; untrusted-input parsing; > ~5 files / ~300 lines or cross-module; you can't predict the diff's behavior (when unsure, trigger) |
| security | outbound sends, input parsing, auth/credentials, crypto, new dependencies, subprocess/shell, new or changed API endpoints, file upload/download |
| architecture | new modules, changed core interfaces (repo CLAUDE.md names them), cross-cutting refactors |
| performance | queries over the repo's largest datasets, ingest-scale loops, LLM/external-API paths |
| data-integrity | migrations, live-data scripts, FK/schema changes |
| hardener | new invariant-rich pure modules → property-based tests; irreversible-data or money logic → scoped mutation run, kill or waive survivors. Per the Test Hardening Ladder; edits tests only, never the code under test |

Repo CLAUDE.md rows augment this table, never replace it. The table is maintained: a post-merge Critical/Major that a skipped reviewer would have caught means a missing row — add it now. Adversarial-correctness mandate: "the ACs are verified — find what they MISS"; skipping it is normal for append-only/config/single-pure-function diffs. Post the composition + one-line rationale as a PR comment BEFORE reviews start — skips must be auditable.

**Reviewing.** Spawn reviewers in parallel with `gh` access. Each posts findings AS FOUND: inline file:line comments (`gh api .../pulls/{n}/comments -f commit_id=... -f path=... -f line=...`) plus one summary comment with severity triage or a clean bill. Every finding: severity + concrete failure scenario (file:line, inputs → wrong outcome); without a repro it's a question. The report to you is a recap of what's already posted — nothing lives only in chat.

**LeadVerify.** Verify each finding against the code before acting (reviewers can be wrong); changed severity or rejection → reply on that comment with the verdict. Minors → tracked issues (wired, linked in a reply), never blocking, never dropped. No surviving Critical/Major → **Merge**; surviving → **FixRound**; round 5 → **CapDecision**.

**FixRound.** Findings to the PR's own implementor (link the comment, don't retype). Fix + gate green → **DeltaVerify**; approach rewritten (state which in the PR) → **RePanel**.

**DeltaVerify.** Each finding back to ITS OWN finder with ONLY the fix-commits diff (`git diff <pre-fix-sha>..HEAD`): resolved, and nothing adjacent broken? Finder-verifies-fix completes its review (it never wrote the fix — separation holds) and inherits its tier; fresh opus verifier only if the finder is dead. Re-fire any pool trigger the fix diff newly trips. → **LeadVerify**.

**RePanel.** FRESH reviewers (originals anchor on prior conclusions); compose per PanelCompose against the new diff; fresh reviewers join the long-lived crew. → **Reviewing**.

**CapDecision.** Never merge past a Critical/Major silently: **accept** with a documented reason posted as a reply → Merge; or **park** — label `owner-decision`, comment what survives and why, free the slot, epic continues. Parked items surface in Finish's remainder.

**Merge.** Squash INTO THE EPIC BRANCH; commit message `feat(scope): <title> (#<issue>, PR #<sub-pr>)` — one commit per issue so the owner reviews the epic PR commit-by-commit. Closing invariant: every finding is a PR comment; every survivor ends as a merged fix (commit/PR ref) or tracked issue (number), replied to the original comment. Then: close the sub-issue (`gh issue close <n> --comment "Implemented on epic/<n>-<slug> (PR #<sub-pr>); lands on main with epic PR #<epic-pr>."` — reopen all closed sub-issues if the epic PR is ever closed unmerged); update the epic PR checklist + owner live-verification checklist (this sub-issue's would-be prove-live steps: backup, rebuild, scheduler refresh, real runs, post-condition queries, dry-run→apply); push the epic branch; remove the worktree; release the crew; signal Orchestrate.

## Standing rules

- NEVER merge the epic PR, push to main, or force-push. NEVER write outside worktrees, touch live data/outputs/schedulers, or send/draft real email — such steps go on the owner checklist.
- `owner-gated` = skip and report; same for anything the repo reserves to the owner or anything irreversible.
- Untracked work is forbidden: discoveries become wired issues immediately.
- LLM call sites tagged and budgeted per repo rules.
- Anything that surprises you → fix the instruction/memory in the same session.

Start now: read the docs, derive state, pick the epic (ask only if no argument), seal or resume, run Orchestrate to completion.
