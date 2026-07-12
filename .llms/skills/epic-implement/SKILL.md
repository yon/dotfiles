---
name: epic-implement
description: Use when asked to implement an epic, a backlog of issues, or "/epic-implement N" — autonomous multi-agent execution of a GitHub epic's sub-issues, safe under a permission-bypassed session. Pass the epic number as the argument; if omitted, asks which open epic to run. A single issue goes to issue-implement.
---

# Epic Implement

You are the MERGE COORDINATOR for ONE epic, end to end, autonomously. Subagents write code; you integrate and report. Design was done at planning time (`epic-plan`) — execute faithfully, don't re-design. The review contract you enforce is AI-DLC stage 6 (`~/.files/.llms/rules/aidlc.md`).

## The contract

1. **One epic, to completion** — every runnable sub-issue implemented, reviewed, merged into the epic branch, never main.
2. **Sealed** — all work in worktrees on an epic integration branch. Never touch the main checkout, live data stores, output/log directories, or schedulers (the repo's CLAUDE.md names them). No deploy, no live runs, no real sends. This is what makes permission-bypass safe. (enforced by the devcontainer where the repo provides one)
3. **The owner merges** — you open exactly one PR (`epic/<n>-<slug>` → main) and NEVER merge it. Branch protection cannot distinguish you from the owner on the same token; do not rationalize past this.
4. **Coordinator mechanics run through this skill's `scripts/` only** — seal verification, worktree lifecycle, dispatch prompts, sub-PR merges. Each script mechanizes an invariant that was violated live when it was prose; bypassing one to "save a step" recreates the failure it exists to prevent.

## Read first

1. The target repo's CLAUDE.md — the gate command ("the gate"), install step, migration convention, live-data rules, owner-gated surfaces. The authority for conventions.
2. The newest execution plan, if any: `ls docs/plans/*execution-plan*.md 2>/dev/null | sort | tail -1` — coordination only; issue bodies are the design truth. None → the epic body's wave order serves.
3. `scripts/` beside this file: `seal-verify.sh`, `worktree.sh` (create/destroy/check + the ownership manifest), `merge-subpr.sh`, `dispatch-prompt.sh` (+ `dispatch-template.md`, `host-facts.md`). Read each header once; they are the only supported path for what they do.

## The state machines

Diagrams are the control flow; the state sections are each state's contract. A mismatch between them is a bug — fix whichever is wrong in the same session.

```mermaid
stateDiagram-v2
    [*] --> PickEpic
    PickEpic --> Seal : epic chosen (arg, or ask — the only question)
    PickEpic --> Resume : epic branch + draft epic PR already exist
    Seal --> Orchestrate : scripts/seal-verify.sh exit 0 (when required)
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
    [*] --> TestsRed : dispatched (agent recorded vs PR)
    TestsRed --> Implementing : failing AC-tagged tests pushed,\nred-stage review passed
    Implementing --> RebaseVerify : PR open vs epic branch,\ngate green
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

    FixRound --> DeltaVerify : same implementor fixed\n(Minors folded in), gate green
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
- **Long-lived crews**: all later work on a PR routes to the SAME agents via SendMessage — the implementor fixes findings, rebases, and closes conformance gaps; each reviewer verifies fixes to its own findings. Fresh agents only when the original is dead or incoherent (note the substitution in the PR). Sealed-required crews have no SendMessage: "same implementor" means re-invoking `claude -p` inside the same container with the PR + finding as context, each round.
- **GC only when the PR closes** (merged or abandoned); check the agent→PR map for other PRs the implementor owns first.

## Model tiers (pass `model` explicitly on every dispatch)

| Tier | Roles |
|---|---|
| haiku | Gate/verification runs, AC-conformance check, report assembly |
| sonnet | Implementors; red-stage tests reviewer; specialist pool reviewers (except security); hardener |
| opus | Adversarial-correctness and security reviewers; the Tier-STANDARD single reviewer |
| fable | Escalation only: cap-surviving adjudication, genuinely ambiguous rebase conflicts, "did the fix rewrite the approach", owner-escalation writeups |

Tier checks are not model calls: `git diff --name-only` + grep against the trigger table.

## Epic states

**PickEpic.** Argument given → use it. Else derive open epics + runnable counts (`gh issue list --label epic`, sub_issues API, dependencies API) and ask via AskUserQuestion — the ONLY question; all else is autonomous. Never hardcode issue numbers. Epic branch + draft PR already exist → **Resume**.

**Seal.**

```bash
scripts/worktree.sh create <n> epic/<n>-<slug>       # creates the branch from origin/main
cd <epic-worktree>
git commit --allow-empty -m "chore(epic): seed epic #<n> branch"   # gh pr create refuses an empty diff
git push -u origin epic/<n>-<slug>
gh pr create --draft --base main --head epic/<n>-<slug>   # body: sub-issue checklist + empty owner live-verification checklist
```

Work only inside the epic worktree from here on.

**Physical seal — HARD GATE before ANY sealed-required Dispatch.** This flow runs under `--dangerously-skip-permissions`; physical isolation is the substitute for the per-call approval prompt, and a worktree alone is a *branch* boundary, not a *safety* boundary. `scripts/seal-verify.sh <n>` is the gate: it detects the host container CLI, launches container `epic-<n>` via the REPO'S OWN launcher where one exists (only the repo's launcher applies its mounts/firewall — a bare image is liveness, not isolation, and the script warns so), runs the repo's isolation probe where one exists, installs the Bedrock settings, and smoke-runs an in-container `claude`. **Exit 0 or no sealed-required dispatch — no exceptions, no prose substitutes.** Host truths (container CLI, Bedrock settings, gws auth, the no-stash rule) live in `host-facts.md` and reach every implementor via the dispatch template. Two invariants the script cannot enforce, so hold them yourself: never create or prune git worktrees INSIDE the container against the bind-mounted host `.git` (it corrupts host worktree registration — verified live); in-container implementors instead `git clone` fresh to a container-local path, branch from `origin/epic/<n>-<slug>`, and push normally. And read the in-container claude's log output after launch — silent immediate death means auth/config, not a crash to retry.

**Risk-tier waves.** Classify each sub-issue before Dispatch:

| Tier | Criteria | Dispatch mechanism |
|---|---|---|
| **sealed-required** | Touches (or its tests could plausibly touch, even by mistake) real outbound sends, live/production data stores, real network egress, credentials, or scheduler/deploy config | Actual Claude process INSIDE the verified seal: `container exec epic-<n> claude --dangerously-skip-permissions -p '<prompt>'`; poll `gh pr view` instead of SendMessage |
| **worktree-ok** | Pure logic/tests-only change, no I/O boundary touched, all externals mocked | Host Agent-tool subagent in a `scripts/worktree.sh create` worktree |

When unsure, default to `sealed-required`. Re-run `seal-verify.sh` on **Resume** — containers don't survive reboots.

**Resume.** All state lives in GitHub (epic branch, draft PR checklist, sub-PRs, issue states) — re-derive it, re-create the worktree if missing, respawn agents for open sub-PRs briefed from PR + issue, enter **Orchestrate**. Never re-create the branch/PR or redo merged work.

**Orchestrate.** Event-driven. **Default concurrency: 2 implementors.** Raise to 3-4 only when `scripts/worktree.sh check` manifests prove the in-flight file sets disjoint — rebase churn is O(merges × in-flight), so idle slots are cheaper than forced re-verification. Runnable = all `blocked_by` closed AND not `owner-gated` AND the conflict matrix allows it alongside in-flight work (hot files: one toucher at a time). Owner-gated / live-data / owner-decision issues are skipped and reported, never executed. Events:

- **Sub-PR merges** (via `scripts/merge-subpr.sh`) → slot frees; every other open sub-PR re-enters RebaseVerify (routed to its own implementor); re-derive runnability.
- **Sub-PR parks** → slot frees; its dependents stop being runnable; continue around it.
- **Agent stalls** (~30 min no progress) → probe via SendMessage; dead → respawn briefed from PR + issue, note substitution.
- **After any wave lands** → `scripts/worktree.sh check`: any PR touching files outside its manifest is a contamination signal; route to its implementor before merging anything.

Exit: **Finish** (nothing runnable, nothing in flight) or **Stop** (epic unimplementable as specified — comment the evidence on the epic issue and end; redesign is planning work, not yours).

**CriteriaPreGate.** Every issue needs numbered testable ACs (per the epic-plan contract) before dispatch. Missing → YOU write them from the body and post as an issue comment titled "Acceptance criteria (added at dispatch)", then give them the same adversarial pre-review epic-plan gives capture-time ACs. Cheapest point to fix a vague spec.

**Dispatch.** One implementor per issue. `scripts/worktree.sh create <issue> <branch> <files-owned...>` (branch `feat|fix|chore/<n>-<slug>` from the pushed epic branch; files from the plan's conflict notes), then `scripts/dispatch-prompt.sh <issue> "<gate command from the repo CLAUDE.md>"` emits the prompt — issue body + all comments, owned files, gate command, host facts, and the standing implementor rules (TDD red-first per **TestsRed**, live fixtures read-only, migrations per repo convention, AC→test map in the PR, conventional commits with Co-Authored-By attribution, long-lived availability). Sealed-required → run that prompt via `container exec`; worktree-ok → host Agent-tool subagent. Never hand-compose a dispatch prompt; gaps go in the template or host-facts.md so every later dispatch inherits the fix.

**Finish.** Every sub-issue merged, parked, or skipped; gate green on the final branch. Report **complete** or **complete-with-remainder** (each parked/skipped/blocked issue with reason + link). Post the **retro metrics** as an epic comment: first-panel zero-Critical/Major rate, fix commits per PR, live escapes found after merge, findings by surface tier — the numbers that tune the next run. Mark the epic PR ready-for-review: checklist with per-PR review outcomes, remainder, owner live-verification checklist (including the repo's prove-live surface checks where it has them), migration-rename notes — and state in the PR body: **merge with a MERGE COMMIT, not squash** (one-commit-per-issue history is the deliverable). Remove sub-issue worktrees via `scripts/worktree.sh destroy`; keep the epic worktree until the owner merges. Tell the owner what they must do: review commit-by-commit → merge (merge commit) → deploy → prove live.

## Per-PR states

**TestsRed.** The implementor writes FAILING tests first — every `AC<n>` tagged in a test description — and pushes the test-only diff before any implementation. The **red-stage tests reviewer** (sonnet, fresh context) reviews that diff alone: do the tests encode the ACs' intent (the defense against implementor and checker agreeing on a wrong spec)? Would each fail against a plausible wrong implementation — hunt tautologies and trivially-satisfiable assertions? Fixtures production-shaped? It certifies the AC→test map (the implementor proposes, the reviewer certifies — writer/checker separation at the spec layer). Gaps → implementor revises the tests, same reviewer re-checks. Certified → **Implementing**. There is NO post-implementation tests review pass when red-stage passed and later rounds didn't restructure the suite.

**Implementing.** Make the certified tests green. Unmappable AC → coordinator resolves (clarify/amend the AC on the issue) and sends back. Exits: PR open vs epic branch, gate green, certified map in the PR description.

**RebaseVerify.** Rebase onto the CURRENT epic branch; semantic conflicts resolved by COMBINING intents (both new sections, both imports, both migrations renamed — never pick a side); full gate on the rebased branch. Re-entered whenever the epic branch advances, routed to the PR's own implementor. Clean rebase preserves review state. A semantic conflict costs the gate plus ONE targeted reviewer pass scoped to the conflict region — never a fresh full panel.

**Conformance.** Mechanical (haiku or the lead): every AC appears in the certified map; every mapped test exists and passed in the gate output; command-verified ACs re-executed with matching output. No judgment. A gap → back to the same implementor as a Major; the panel never spawns for an incomplete implementation.

**PanelCompose.** Composition is by risk surface, not size:

| Tier | Trips on | Review |
|---|---|---|
| **Tier-FULL** | destructive-data writes/supersession/merges, outbound sends, auth/credentials, container/infra, migrations touching existing rows — OR any adversarial trigger: state machines, concurrency/crash-recovery, money/budget/threshold arithmetic, untrusted-input parsing, you can't predict the diff's behavior (when unsure, trigger) | adversarial-correctness (opus, mandate: "the ACs are verified — find what they MISS") + a `make test-mutation ARGS=<changed modules>` run (or repo equivalent) by the adversarial reviewer, surviving mutants filed as findings |
| **Tier-STANDARD** | everything else | ONE strong fresh-context reviewer (opus): correctness + conventions in a single mandate |

Specialist pool — grep triggers apply at EVERY tier, on top of the tier's base review: **security** — outbound sends, input parsing, auth/credentials, crypto, new dependencies, subprocess/shell, API endpoints, file upload/download; **architecture** — new modules, changed core interfaces, cross-cutting refactors; **performance** — queries over the repo's largest datasets, ingest-scale loops, LLM/external-API paths; **data-integrity** — migrations, live-data scripts, FK/schema changes; **hardener** — new invariant-rich pure modules (property-based tests only; mutation belongs to the adversarial reviewer); edits tests only, never the code under test. Repo CLAUDE.md rows augment this table, never replace it; a post-merge Critical/Major a skipped reviewer would have caught means a missing row — add it now. Post the composition + one-line rationale as a PR comment BEFORE reviews start.

**Reviewing.** Spawn reviewers in parallel with `gh` access. Each posts findings AS FOUND: inline file:line comments plus one summary comment. **Severity requires a verified trigger**: the finder demonstrates concrete input/state → broken output BEFORE posting a Critical/Major — narrative blast radius is not severity (re-verification showed ~10% of severity prose overstates). Without a repro it's a question. Nothing lives only in chat.

**LeadVerify.** Verify each **Critical/Major** against the code before acting (reviewers can be wrong); changed severity or rejection → reply on that comment with the verdict. Minors skip LeadVerify: they route straight to the implementor's next fix round, fixed inline in this PR — never filed as issues (a filed Minor is write-only backlog; the burn-down never happened). Minors the implementor disputes → ONE batch comment at merge for the owner to skim. Minors with NO surviving Critical/Major still get one inline fix round (fix + gate, no re-review beyond the finder's spot-check) before **Merge** — merging over unaddressed Minors is dropping them. Surviving Critical/Major → **FixRound**; round 5 → **CapDecision**.

**FixRound.** Findings to the PR's own implementor (link the comment, don't retype), pending Minors included. Fix + gate green → **DeltaVerify**; approach rewritten (state which in the PR) → **RePanel**.

**DeltaVerify.** Each finding back to ITS OWN finder with ONLY the fix-commits diff: resolved, nothing adjacent broken, and any tests ADDED in the fix sound? The finder reviews new tests live in this same pass — a fresh tests reviewer fires only on approach rewrite. Finder-verifies-fix keeps writer/checker separation and inherits its tier; fresh opus verifier only if the finder is dead. Re-fire any tier/pool trigger the fix diff newly trips. → **LeadVerify**.

**RePanel.** FRESH reviewers (originals anchor on prior conclusions); compose per PanelCompose against the new diff, red-stage recheck included if the suite was restructured; fresh reviewers join the crew. → **Reviewing**.

**CapDecision.** Never merge past a Critical/Major silently: **accept** with a documented reason posted as a reply → Merge; or **park** — label `owner-decision`, comment what survives and why, free the slot, epic continues. Parked items surface in Finish's remainder.

**Merge.** `scripts/merge-subpr.sh <sub-pr> <epic-pr>` — it refuses non-open PRs, squash-merges via GitHub (never locally; a closed-not-merged PR breaks the audit trail permanently), closes the sub-issue, updates the epic PR checklists, deletes the remote branch, and destroys the worktree through the manifest. Not cleanly mergeable → that's RebaseVerify work first. After: `git fetch` and fast-forward the epic worktree — never recreate the squash commit locally, never force-push. Closing invariant: every finding is a PR comment; every surviving Critical/Major ends as a merged fix (commit/PR ref) replied to the original comment; Minors end fixed in this PR or listed in the merge batch comment. Reopen all closed sub-issues if the epic PR is ever closed unmerged. Release the crew; signal Orchestrate.

## Standing rules

- NEVER merge the epic PR, push to main, or force-push. NEVER write outside worktrees, touch live data/outputs/schedulers, or send/draft real email — such steps go on the owner checklist.
- NEVER dispatch a `sealed-required` issue to a host-side agent because the container was inconvenient. If you catch yourself having done this, stop dispatching sealed-required work and get the owner's decision before continuing.
- `owner-gated` = skip and report; same for anything the repo reserves to the owner or anything irreversible.
- Untracked work is forbidden: discoveries become wired issues immediately. (Review Minors are the one exception — they end inline in their own PR.)
- LLM call sites tagged and budgeted per repo rules.
- Anything that surprises you → fix the instruction, template, or host-facts.md in the same session, so every later dispatch inherits it.

Start now: read the docs, derive state, pick the epic (ask only if no argument), seal or resume, run Orchestrate to completion.
