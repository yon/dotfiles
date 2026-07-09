---
name: epic-plan
description: Use when capturing a feature, remediation, port/resurrection of old functionality, or any multi-issue program of work as a GitHub epic with sub-issues for later execution by separate agents — including when asked to "create an epic", "file this as issues", or "plan this so a lesser model can execute it".
---

# Plan Epic

You are capturing work as a GitHub epic whose sub-issues will be executed LATER, by SEPARATE agents (often weaker models), with none of your current context. Every claim you don't verify now becomes a bug in their run; every detail you leave out becomes their re-investigation.

**Executor bar (binding):** assume the executor is a skilled developer who knows almost nothing about this codebase, follows instructions literally, and does not infer. Exact commands, exact paths, exact regexes, quoted evidence. If `superpowers:writing-plans` is available in your environment, its "No Placeholders" section states the same bar and its step format is useful when an executor later expands one sub-issue into a step-level plan — but do not depend on it; this section is self-sufficient.

Never write: "TBD", "handle edge cases appropriately", "similar to the above", "port the old logic" (without the exact command to view it), or a schema/API described in prose only.

## 1. Investigate before designing — evidence, not memory

- **Git archaeology.** If anything like this existed before (old version, deleted file, dead branch): `git log --all --oneline -i --grep=<term>`, `git log --all -S <term>`, then read the final version via `git show <last-commit>~1:<path>`. Record those exact commands IN the issue — the executor re-reads the source, not your summary. Mine the fix-history (`fix:` commits) for hard-won lessons and bake each one into the design.
- **Live evidence, read-only.** Pull real counts, ids, senders, subjects, row shapes from the live system (DB queries, API reads). Quote them verbatim in the epic. A design justified by real numbers survives review; "there are probably many" does not. Never mutate anything while investigating.
- **Reconcile existing code.** Search for partial ports, dead code, and existing helpers the new work must consume or delete (`grep -rn <term> src/`). An issue that re-specifies something that already exists teaches the executor to build a duplicate. Name what exists, whether to consume, extend, or delete it, and forbid parallel copies.
- **Verify every anchor now** and stamp the epic with the date + main SHA, plus the caveat: "line numbers are from <date>; re-grep before editing."

## 2. Design at the epic level, contract per issue

- The **epic body** carries: the narrative + evidence, the reference commands (archaeology, queries), and the **binding design principles** every sub-issue obeys (safety invariants, allowlists, gates, "no LLM here", model decisions). Principles stated once at the epic, referenced by children.
- Each **sub-issue** carries a full contract: types/signatures (as code, not prose — and any embedded code must be CORRECT as written; if you cannot make it correct, specify behavior + tests instead of shipping known-buggy code with a fix-me note), schema (as SQL/DDL), error taxonomy, the TDD matrix (tests FIRST, fixtures quoted verbatim from the live evidence — a regex tested only against invented data is untested), acceptance criteria, live-proof steps for the lead, and an explicit **Out of scope** naming the sibling that owns each excluded piece.
- **Acceptance criteria are numbered and testable — they ARE the correctness spec.** Each is `AC<n>`, phrased given/when/then with concrete inputs and expected outputs, so the implementor can write a test from it verbatim and a mechanical checker can later verify "a test tagged AC<n> exists and passed." An AC that names a command instead of a test states the exact command and its expected output. Anything not phrasable this way is not a criterion — it's either a binding design principle (move it to the epic) or noise (cut it). Downstream review conformance is checked against these numbers, so a vague AC re-inflates the cost of every stage after capture.
- Follow the repo's CLAUDE.md conventions (naming, migration format, budget/observability rules for any LLM call, dry-run-by-default for data scripts). Where a convention exists, cite it; never restate it wrong from memory.

## 3. Decompose and wire

- One issue = one branch = one PR. Slice as tracer bullets: each sub-issue lands independently testable.
- Wire dependencies **natively** (`gh api repos/{owner}/{repo}/issues/<n>/dependencies/blocked_by -F issue_id=<id>`) AND restate them in each body. Attach children via the sub-issues API (`.../issues/<epic>/sub_issues -F sub_issue_id=<id>` — numeric `id`, not number). Apply the repo's labels.
- Note conflict surfaces: files two sub-issues (or existing open issues) both touch, with a one-toucher-per-wave warning in each affected body.

## 4. Register in the program

Check for an execution-plan doc by actually running `ls docs/plans/*execution-plan*.md 2>/dev/null | sort | tail -1` — never assert absence without running it (a tested agent claimed "no plan doc" in a repo that had two). If one exists, add the epic's runnable set, chain order, and conflict rows there, and commit. If not, put the wave order in the epic body. Untracked work is forbidden: anything discovered during investigation that is out of scope becomes its own issue before you finish.

## Failure modes (each observed in real audits — check your draft against all of them)

| Failure | Counter |
|---|---|
| Invented fixture shapes ("CHG123") | Quote real ids/subjects verbatim from live evidence |
| Anchors go stale, executor trusts them | Date + SHA stamp, re-grep caveat, prefer symbol names over line numbers |
| Re-specifies code that already exists | Reconciliation step names the existing helper: consume or delete |
| Design detail lives only in a side doc that rots | The issue body is the source of truth; docs carry only cross-issue coordination |
| LLM call without callSite/budget (when repo requires them) | Contract names them, or states "zero LLM calls" explicitly |
| Vague safety ("be careful sending email") | Invariants as testable rules: allowlists, env gates default-off, audit rows for every decision |
| Sub-issue depends on a sibling's internals not yet designed | The dependent body quotes the exact interface it consumes |

## Done when

Epic + sub-issues exist with native wiring and labels; every body passes the executor bar and the failure-mode table; evidence and reference commands are embedded; program doc updated (or wave order in the epic); anything discovered-but-out-of-scope is filed. A cold-start agent given only one sub-issue's URL could execute it without asking you anything.
