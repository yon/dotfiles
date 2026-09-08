---
name: epic-implement
description: Implement a GitHub epic's sub-issues with coordinated agents, isolated worktrees, independent review, and verified integration into an epic PR. Use for an epic or backlog; use issue-implement for one issue.
---

# Implement an epic

Deliver one reviewed integration PR containing one squash commit per sub-issue. The owner merges the
epic PR and handles deployment or live verification. Use the supplied epic number; if missing,
discover native Epic issues and the fallback `epic` label, then ask which epic to execute.

## Read first

Read the repository's `AGENTS.md`, applicable harness entrypoints, latest execution plan, and
epic/sub-issue bodies and comments. Repository conventions govern the gate, interfaces, migrations,
ownership, and reserved operations. Issue contracts are design truth; the execution plan coordinates
their implementation.

Use `<skill-dir>/scripts/run.sh` for the operations below. This thin wrapper runs TypeScript with
Bun. It automatically reads `<repository>/.agents/epic-implement.json`; `--config <path>` before the
operation overrides that file. Read [configuration.md](references/configuration.md) when setting up
execution or changing parameters. The [Claude/Bedrock example](examples/README.md) preserves the
previous role choices in an optional adapter. The core workflow has no required harness, provider,
or model.

## Agent lifecycle

Record each implementor and reviewer against its issue/PR. Route fixes and rebases to the same
implementor, and finding verification to its finder, using the harness's available continuation
mechanism. If continuation is unavailable, invoke a fresh process with the issue, PR, current
revisions, and unresolved findings. Replace stalled or incoherent agents with a documented handoff.
Release crews only when their owned work is integrated or parked and their state is recorded.

## Model tiers

Use configured role-to-model mappings when launching external runners. For native subagents, select
the corresponding supported model/capability without inventing aliases. Mechanical verification
needs reliable tool execution; implementors and specialists need appropriate coding/domain
competence; correctness/security reviewers need strong adversarial reasoning; escalation needs
judgment. Independent review means a separate reviewer context, even when the same model is used.
Unsupported required model or execution capabilities block that dispatch, not unrelated runnable
work.

## Epic states

**PickEpic / Resume.** Re-derive state from GitHub, remote branches, PR merge commits, and local
manifests. A checked box or closed issue alone does not establish integration. Resume existing
branches/PRs; do not duplicate work. Missing local receipts must be reconstructed from reviewed PR
evidence and verified merge ancestry, never inferred from issue state. Recheck isolation before each
resumed isolated dispatch.

**Prepare.** Resolve the actual base from `base_ref` or the remote's advertised default branch.
Create the epic worktree using `worktree create N epic/N-slug --integration`; it leaves the primary
checkout alone. If the branch has no diff yet, add or update a useful execution-plan document in the
repository's documentation location: issue/contract links, dependency order, ownership, and
verification plan. Independently review and gate that scoped planning commit, then push it and
create the draft epic PR against the resolved base. An empty commit cannot create a PR diff.
Establish the parent PR before any child merge; if repository policy disallows the planning
document, resolve that bootstrap constraint rather than bypassing the merge helper. Sub-PRs target
the epic branch. Reuse an existing epic PR.

**Seal.** Classify each issue before dispatch:

- `required`: real outbound operations, live data stores, credential access, scheduler/deployment
  configuration, or tests that could reach those boundaries. Run only through the configured
  isolated runner after `seal N` succeeds. When unsure, choose required.
- `worktree`: pure code/tests with external effects mocked, inside the harness's normal permission
  boundary. Use a configured host runner or native subagent in its assigned worktree.

A worktree separates branches, not permissions or network access. The repository owns the isolation
launcher and probe. The probe must check the actual boundaries the task needs, including mounts,
protected paths, credential reach, and egress. A running container or successful model call is
insufficient. Missing or failed verification blocks isolated dispatch. Do not substitute a generic
image or a host process. Container checkouts must be independent local clones, never worktrees using
bind-mounted host Git metadata. The example adapter requires the launcher/operator to provision the
matching branch and revision before each dispatch; it does not reset work or copy credentials.

**Orchestrate.** Default to two implementors, configurable only with verified disjoint ownership.
Discover sub-issues and native dependencies through GitHub; reconcile them with the plan. An issue
is runnable only when its prerequisites are integrated into the current epic branch, its contract is
actionable, it is not owner-gated, and its exact file set does not overlap active work. Keep
owner-gated issues parked. Use `readiness` and `worktree check` as mechanical checks; see
[execution-state.md](references/execution-state.md) for snapshot/receipt contracts.

When a sub-PR merges, fetch and fast-forward the epic worktree, invalidate dependent review
snapshots, and return other open sub-PRs to RebaseVerify. When one parks, continue independent work.
A stalled agent needs a status check and then a recorded replacement if necessary. Never use
`git stash` on a shared checkout. Worktree ownership includes committed, staged, unstaged, and
untracked changes, including closed but unmerged PRs until explicitly cleaned up.

**CriteriaPreGate / ContractPreGate.** Require numbered testable acceptance criteria and concrete
contracts for changed public interfaces: signatures/types, schemas, and error behavior as
appropriate. Repair straightforward omissions from existing design and code, record them on the
issue, and have a separate agent challenge their meaning. Park unresolved design decisions or
conflicting sibling interfaces; do not invent architecture to keep a slot busy.

**Dispatch.** Create an issue worktree from the pushed epic branch with
`worktree create ISSUE BRANCH --base REMOTE/EPIC_BRANCH FILE...`. Register its PR with
`worktree register ISSUE PR`. Use `dispatch ISSUE` to produce the prompt from the live issue and
manifest, then give that prompt to the appropriate execution mechanism. Run external agents with
`agent --role implementor --epic N --workspace PATH --prompt-file PATH --isolation required|worktree`.
Carry explicit acceptance evidence and agent/PR state across handoffs.

## Per-PR states

**TestsRed.** For behavior changes, demonstrate that focused acceptance/regression tests fail for
the intended reason before the fix. Have a separate red-stage reviewer check the assertions against
plausible wrong implementations and certify the AC-to-evidence map. Characterization tests may begin
green; documentation and configuration changes can use appropriate command checks. Never invent red
tests or a coverage percentage to satisfy ceremony. Fixtures should preserve relevant production
shapes without copying private live records by default.

**Implementing.** Make the agreed tests pass. Keep changes within ownership, migrations within
repository conventions, and commits within the user's authorized workflow. Prefer the repository's
Make targets. Maintain the AC-to-test/command map and evidence in the PR; resume the existing PR
against the epic branch. Commit and push within scope automatically when authorized. Keep coherent
code and tests together, target roughly 300 handwritten lines, and reconsider splitting or explain
scope above 500.

**RebaseVerify / Conformance.** Rebase onto the current epic branch, combine both intents in
semantic conflicts, and run the configured gate. Verify every AC against actual passing tests or
recorded commands. Missing evidence returns to implementation. A clean rebase still needs current
gate and receipt revisions; semantic changes need targeted independent review, and an approach
rewrite needs fresh review of the revised design.

**PanelCompose / Reviewing.** Standard changes get one strong fresh-context reviewer covering
correctness and conventions. State machines, concurrency/recovery, destructive writes,
money/threshold logic, and untrusted input require adversarial correctness review. Add security,
data-integrity, architecture, or performance specialists when the changed surface warrants them.
Record the composition and rationale before dispatch.

Review the affected behavior and failure paths, not just the acceptance checklist. Use scoped
mutation testing for adversarial surfaces when supported, preferably `make test-mutation` with
changed-module arguments. Classify surviving mutants as gaps, equivalent/unreachable, or tooling
limits with evidence. Use property tests for suitable invariants; a hardener edits tests and reports
production bugs separately. Assess affected-code coverage and untested branches rather than relying
on an overall percentage. Record unavailable tools and residual coverage limits instead of claiming
a pass.

Post actionable findings with location, trigger/preconditions, evidence, consequence, and severity.
A safe local reproduction is preferred; a conclusive static source-to-effect trace is valid. Never
trigger a real send, data mutation, or exploit to earn a finding. Keep findings and dispositions on
the PR rather than only in agent chat.

**LeadVerify / FixRound / DeltaVerify.** Verify Critical/Major findings before routing them;
document rejected or downgraded findings with reasons. The implementor fixes confirmed findings and
in-scope Minors; each finder checks its own fixes and new tests. Re-run the gate and add reviewers
for newly introduced risk surfaces. Disputed or out-of-scope Minors need an explicit disposition,
not silent deletion. Fresh reviewers re-evaluate an approach rewrite.

**CapDecision.** After five unsuccessful fix rounds, park the PR with remaining evidence and
required owner decision. A round cap never authorizes acceptance of unresolved Critical/Major
findings. A separate owner decision can change scope or stop the work; it does not manufacture a
passing merge receipt.

**Merge.** Create the current revision-bound review receipt, run `worktree check`, then
`merge SUB_PR EPIC_PR --review RECEIPT --issue ISSUE`. The helper checks review/gate evidence,
refuses unresolved high-severity findings, merges through GitHub, and verifies ancestry before
recording integration. It cannot atomically pin the base with GitHub's merge command; a base race
detected after merge is integrated but unverified and requires fresh validation. Never claim it was
prevented.

After verified integration, update epic checklists and close the sub-issue if consistent with
repository policy. Delete a merged branch and destroy its clean owned worktree only after
reconciliation. Failed/ambiguous operations require inspecting the actual remote state before
retrying. Never locally recreate a squash merge or force-push an integration branch. If the epic PR
closes unmerged, reconcile issue states and reopen issues closed only because of that abandoned
integration.

**Finish.** Complete means every required issue is verified integrated and the final epic-branch
gate passes. Otherwise report incomplete, with each parked, blocked, skipped, or in-flight issue and
its next action. Keep an incomplete epic PR draft. When complete, make the epic PR ready for owner
review; request a merge commit to preserve the per-issue squash commits. Include actual test/review
outcomes, migration notes, and owner-only live checks. Report review/fix metrics only when recorded,
not guessed. Clean up eligible sub-issue worktrees; retain the epic worktree for the owner.

## Standing boundaries

Do not merge the epic PR, push to the default branch, force-push, or execute owner-reserved live
operations. Existing authorization permits routine scoped commits, PRs, review comments, and issue
updates. File unrelated discoveries automatically only under standing authorization, with
deduplication and clear independence from this epic. Otherwise report them without expanding the
task. Update instructions only for reusable demonstrated gaps, not every surprise.

From the skill directory, run `bun install --frozen-lockfile`, `bun run typecheck`, and `bun test`.
Runtime helpers use Bun's built-in APIs and require no installed packages; dependencies support type
checking. Behavioral scenarios in [evals/evals.json](evals/evals.json) exercise orchestration
decisions separately from script correctness.
