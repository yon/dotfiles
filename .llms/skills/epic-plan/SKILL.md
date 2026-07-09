---
name: epic-plan
description: Use when capturing a feature, remediation, port/resurrection of old functionality, or any multi-issue program of work as a GitHub epic with sub-issues for later execution by separate agents — including when asked to "create an epic", "file this as issues", or "plan this so a lesser model can execute it".
---

# Epic Plan

You are capturing work as a GitHub epic whose sub-issues will be executed LATER, by SEPARATE agents (often weaker models), with none of your current context. Every claim you don't verify now becomes a bug in their run; every omission becomes their re-investigation. This is AI-DLC stages 1-3 (`~/.files/.llms/rules/aidlc.md`); `epic-implement` executes what you file.

**Executor bar (binding):** assume a skilled developer who knows nothing about this codebase, follows instructions literally, and does not infer. Exact commands, paths, regexes; quoted evidence. Never write "TBD", "handle edge cases appropriately", "similar to the above", "port the old logic" (without the command to view it), or a schema/API in prose only.

## 1. Investigate — evidence, not memory

- **Git archaeology.** Prior art (old version, deleted file, dead branch): `git log --all --oneline -i --grep=<term>`, `git log --all -S <term>`, read via `git show <commit>~1:<path>`. Record the exact commands IN the issue — the executor re-reads the source, not your summary. Mine `fix:` commits for hard-won lessons and bake each into the design.
- **Live evidence, read-only.** Real counts, ids, row shapes from the live system, quoted verbatim. "There are probably many" does not survive review. Never mutate while investigating.
- **Reconcile existing code.** Find partial ports, dead code, and helpers the work must consume or delete; name each, decide consume/extend/delete, forbid parallel copies.
- **Stamp**: date + main SHA on the epic, with "line numbers are from <date>; re-grep before editing."

## 2. Design — epic carries principles, each issue a contract

- **Epic body**: narrative + evidence, the reference commands, and the binding design principles all children obey (safety invariants, allowlists, gates, model decisions) — stated once, referenced by children.
- **Each sub-issue**: full contract — types/signatures as code (correct as written; if you can't make it correct, specify behavior + tests instead), schema as DDL, error taxonomy, the TDD matrix with fixtures quoted from the live evidence, acceptance criteria, live-proof steps for the lead, and an **Out of scope** naming the sibling that owns each exclusion.
- **Acceptance criteria** per AI-DLC stage 1: numbered `AC<n>`, given/when/then, concrete inputs and expected outputs — the implementor writes tests from them verbatim and review verifies against the numbers mechanically. Command-verified ACs state the exact command and expected output.
- Cite the repo's CLAUDE.md conventions; never restate one from memory.

## 3. Decompose and wire

- One issue = one branch = one PR; slice as independently-testable tracer bullets.
- Wire natively AND restate in bodies: `gh api repos/{owner}/{repo}/issues/<n>/dependencies/blocked_by -F issue_id=<id>`; children via `.../issues/<epic>/sub_issues -F sub_issue_id=<id>` (numeric `id`, not number). Apply repo labels.
- Note conflict surfaces (files two issues touch) with a one-toucher-at-a-time warning in each affected body.

## 4. Owner review gate — BEFORE anything is created

Once filed, these bodies are executed literally by agents that don't second-guess them — so nothing files until the owner approves it. Draft everything (epic + all sub-issues, complete per 1-3), then AskUserQuestion in rounds:

1. **Epic round**: scope, sub-issue list with dependency arrows, binding principles, and what you're least sure about; draft body as option preview. Options: approve / approve-with-changes / wrong-decomposition (+ any real alternative split you considered, with its own preview).
2. **Sub-issue rounds** (up to 4 questions per call): per issue — title, ACs, riskiest contract choices, Out-of-scope; full body as preview. Options: approve / approve-with-changes / needs-rework. Rework loops back before filing; file everything in one pass at the end so wiring never points at a body that later changed.
3. **Owner notes win** — but if a note conflicts with gathered evidence, surface the conflict in the next round rather than silently dropping either. Never file a body the owner hasn't seen in final form.

Skip ONLY on explicit pre-authorization this session ("file it", "don't ask"); note the authorization in the epic body.

## 5. Register in the program

Check for an execution-plan doc by RUNNING `ls docs/plans/*execution-plan*.md 2>/dev/null | sort | tail -1` — never assert absence without running it. Exists → add the epic's runnable set, chain order, conflict rows; commit. Doesn't → wave order goes in the epic body. Anything discovered-but-out-of-scope becomes its own issue before you finish.

## Failure modes (each observed in real audits — check your draft against all)

| Failure | Counter |
|---|---|
| Invented fixture shapes | Quote real ids/subjects verbatim from live evidence |
| Stale anchors trusted | Date + SHA stamp, re-grep caveat, prefer symbol names over line numbers |
| Re-specifies existing code | Reconciliation names the existing helper: consume or delete |
| Design lives in a side doc that rots | Issue body is the source of truth; docs carry only cross-issue coordination |
| LLM call without tag/budget (where repo requires) | Contract names them, or states "zero LLM calls" |
| Vague safety ("be careful") | Testable invariants: allowlists, env gates default-off, audit rows |
| Depends on a sibling's undesigned internals | The dependent body quotes the exact interface it consumes |

## Done when

Epic + sub-issues exist, natively wired and labeled, every body owner-approved in final form; every body passes the executor bar and the failure-mode table; evidence and commands embedded; program doc updated (or wave order in the epic); out-of-scope discoveries filed. A cold-start agent given one sub-issue's URL could execute it without asking you anything.
