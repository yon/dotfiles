---
name: issue-plan
description: Use when capturing a single unit of work as a GitHub issue for later execution by a separate session — a bug found while debugging, a feature request, a chore, or a discovery out of scope for the current task. Triggers include "file an issue", "create an issue", "write this up as a bug". Multi-issue programs of work go to epic-plan.
---

# Issue Plan

You are capturing ONE unit of work (bug, feature, or chore) as a GitHub issue that will be executed LATER by a SEPARATE agent with none of your current context. This is AI-DLC stage 1 at single-issue scale (`~/.files/.llms/rules/aidlc.md`); `issue-implement` executes what you file. **epic-plan's "Executor bar" and "Failure modes" sections apply verbatim — read `~/.files/.llms/skills/epic-plan/SKILL.md` before drafting.**

## 1. Scope gate

- Decomposes into 2+ dependent issues → use `epic-plan` instead.
- Owner wants it done NOW, in-session → AI-DLC direct work; don't file issue theater.
- Otherwise continue here.

## 2. Investigate — execute, never transcribe

- Bugs: the root cause must be VERIFIED before capture (`superpowers:systematic-debugging` first). An unconfirmed hypothesis is a question, not an issue.
- **Every expected value in the issue comes from executing the real code or querying the real data — never from reasoning about what the code would do.** Run the actual function/parser/query and paste its output. Citing "per `<function>`'s existing logic" without running it is the observed failure mode: in testing it produced an AC asserting `decision='auto_send'` where the real function returns `'draft'`, a wrong spec the executor would faithfully implement against.
- The repro is EXECUTED, not narrated: the issue shows the command/state and its real output, side by side with the expected output after the fix.
- Evidence rules otherwise per epic-plan §1: git archaeology with exact commands, live evidence read-only, reconcile existing code (consume/extend/delete).

## 3. The body, by type

| Type | Must carry |
|---|---|
| bug | summary → evidence (quoted, dated) → root cause (file:line) → executed repro with pasted output → verified expected behavior → fix steps (non-binding, naming EVERY boundary the change crosses — schemas, transports, type defs) → out-of-scope → ACs → verification |
| feature | contract as code (types/signatures per epic-plan §2), consume-or-delete reconciliation of existing helpers, ACs, out-of-scope naming who owns each exclusion |
| chore | before/after state, exact commands, verification, rollback note if irreversible |

## 4. Durability and sizing

- **Embed fixture material verbatim** (email bodies, payloads, DB rows) in the issue — never instruct the executor to re-fetch at implement time what you can paste now; sources get archived, deleted, or rotated.
- **Verification steps must survive idempotency guards.** If a naive re-run will silently no-op (dedup keys, `existsBy*` short-circuits, done-status queue rows), say so explicitly and give the exact unblock recipe.
- **Size to one PR** (one issue = one branch = one PR): data backfill or historical cleanup beyond the code fix is its own wired issue, never an extra AC on this one.
- **No decision punts.** An AC containing "implementer's choice" is unfinished — decide it now, or mark the issue `owner-gated` on that point.
- Stamp: date + main SHA, with "re-grep anchors before editing."

## 5. Acceptance criteria

Numbered `AC<n>`, given/when/then, concrete inputs and expected outputs (aidlc stage 1). Expected outputs are the EXECUTED values from §2, quoted exactly.

## 6. Review and file

- **Dedup first:** `gh issue list --search "<keywords>"` — update or comment on an existing issue rather than filing a twin.
- Self-check against epic-plan's failure-mode table. Spawn one adversarial reviewer only when the evidence chain is long or a trust boundary is involved.
- Owner gate: an explicit "file it" / "create an issue" is pre-authorization — file and return the URL. Otherwise preview the full body via AskUserQuestion before filing.
- Apply repo labels (`gh label list`); wire blocked-by / sub-issue relations if it belongs under an epic.

## Done when

A cold-start agent given only the issue URL could implement it without asking you anything and without re-deriving any value you could have executed now.
