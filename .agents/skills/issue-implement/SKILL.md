---
name: issue-implement
description: 'Use when asked to implement a single GitHub issue end to end — "implement #171", "fix issue N", "pick up that bug" — where the deliverable is a reviewed PR. Epics and multi-issue backlogs go to epic-implement.'
---

# Issue Implement

You are the LEAD for ONE issue: a dispatched implementor writes the code, independent reviewers review it, you verify findings and integrate, the owner merges. The review contract is AI-PDLC stage 6 (`~/.claude/rules/ai-pdlc.md`). **Read [epic-implement](../epic-implement/SKILL.md) (Model tiers, Per-PR states, PanelCompose / Reviewing, Agent lifecycle) before starting; they apply with the substitutions below.**

## The contract

1. One issue = one branch (`fix|feat|chore/<n>-<slug>` from the fetched remote base branch) = one PR targeting that same base branch.
2. **Sealed: ALL work happens in a worktree.** "Solo work doesn't need isolation" is the observed rationalization and it is false here: scheduled jobs run from the main checkout, and this skill must be safe under a permission-bypassed session. Never touch the main checkout, live data stores, output/log directories, or schedulers.
3. **You open the PR and NEVER merge it.** There is no delegation path inside this skill — "the owner would let me" or "he can authorize it" belongs to a different conversation, not this run.
4. **Live verification is the owner's.** The issue's prove-live recipe goes on an owner checklist in the PR body. You never mutate live data, run live jobs, or send/draft real email — not even "after merge", not even with a backup.

## States

1. **Setup.** Read the repo CLAUDE.md (gate command, install step, conventions). Resolve the base branch from the task and repository instructions; otherwise use the remote's default branch. Verify the remote branch exists and fetch it before creating the worktree. If the base is ambiguous or unavailable, resolve that before proceeding rather than guessing `main`. In the command template below, replace `<remote>` and `<base-branch>` with the verified values:
   ```bash
   git fetch <remote>
   git worktree add .claude/worktrees/issue-<n> -b fix/<n>-<slug> <remote>/<base-branch>
   ```
   Re-grep the issue's anchors before relying on them — dated line numbers drift.
2. **CriteriaPreGate + ContractPreGate.** Issue lacks numbered testable ACs → write them from the body and post as an issue comment titled "Acceptance criteria (added at dispatch)". New/changed public interfaces missing or prose-only → write the contract as code from the issue body plus the code it must fit and post it as "Contract (added at dispatch)" (both epic-implement's rules, verbatim — including its park-don't-invent escape for design decisions the issue doesn't answer, which here go back to the owner).
3. **Dispatch ONE implementor** (sonnet) with epic-implement's dispatch-prompt contract, base = the resolved repository base branch, in the worktree above. Dispatch is not about parallelism — it preserves writer/reviewer separation: you verify findings against code you did not write. Do not implement inline.
4. **Per-PR spine.** Run epic-implement's per-PR states — TestsRed → Implementing → Conformance → PanelCompose (risk tiers) → Reviewing → LeadVerify → FixRound / DeltaVerify / RePanel → CapDecision — exactly as written there, with two substitutions: use the resolved repository base branch, and RebaseVerify fires when that base advances. **The red-stage test review ALWAYS runs on any code diff** — "a diff this size is proportionate to self-review" is the observed rationalization; review by the writer counts as NO review. Tier-STANDARD still gets its one strong fresh-context reviewer post-implementation. Only diffs with no runtime surface (docs/config-only) may take the built-in `/code-review` instead.
5. **Finish.** Mark the PR ready-for-review with: the AC→test map, per-reviewer outcomes, the owner live-verification checklist (copied from the issue's verification section, including any idempotency-unblock recipe), and a squash-merge note per `git-and-delivery.md`. Close nothing — the owner merges, deploys, proves live, and closes the issue with evidence.

## Standing rules

- Minors are fixed inline in the PR's own fix round, never filed, never dropped (stage 6); disputed ones go to one batch comment at merge. Discoveries become wired issues immediately.
- Anything the issue marks `owner-gated`: stop and report, never decide.
- Agent lifecycle, model tiers, stall handling: per epic-implement.
- Anything that surprises you → fix the instruction or memory in the same session.
