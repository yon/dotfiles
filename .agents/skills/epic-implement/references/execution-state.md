# Execution evidence and scheduling

The helpers require Git, GitHub CLI, and Bun. Run them through `scripts/run.sh` to load repository
configuration. GitHub operations use the authenticated repository context; review and authorize the
repository's actual launcher/probe before using them.

## Worktrees

`worktree create ISSUE BRANCH [--base REMOTE/BRANCH] [--integration] FILE...` records exact
ownership in the common Git directory's `epic-worktrees.json`. Integration worktrees use
`--integration` with no owned files. Issue worktrees require a nonempty exact file list; directories
and globs are not ownership declarations. Include tests and any expected generated outputs.

`worktree register ISSUE PR` associates the PR. `worktree check` checks ownership against local and
PR changes. `worktree destroy PATH` removes only a registered, clean worktree. Matching existing
registrations resume; mismatched or unowned paths fail. An overlapping closed but unmerged PR still
owns its files until its worktree is explicitly reconciled and destroyed.

Manifests are updated under a directory lock and atomic rename. A timed-out lock requires checking
whether its owner still runs and reconciling state before manual removal. Do not steal locks or
remove another process's lock to force progress.

## Review receipt

The coordinator writes a receipt only after the actual gate and independent review pass on these
exact revisions:

```json
{
  "pr": 142,
  "head_sha": "1111111111111111111111111111111111111111",
  "base_sha": "2222222222222222222222222222222222222222",
  "gate_passed": true,
  "independent_review": true,
  "findings": [
    {"severity": "major", "status": "fixed"},
    {"severity": "minor", "status": "resolved"}
  ]
}
```

The sample SHAs illustrate the format; replace them with observed PR head and epic branch SHA.
Findings accept critical/high/major/medium/moderate/low/minor/info/informational severity and
open/unresolved/fixed/resolved/false_positive/accepted/deferred disposition. Critical/high/major
require fixed/resolved/false_positive. Preserve evidence links and explanations on the PR. This
local file is an assertion tied to revisions, not independent proof that review happened.

Run `merge SUB_PR EPIC_PR --review /path/to/receipt.json --issue ISSUE`. The helper pins the child
head on GitHub's squash merge request. It checks the resulting squash commit has the reviewed base
as its single parent and is an ancestor of the current epic head. GitHub's merge command cannot
atomically pin that base. If a base race is detected after a remote merge, stop treating that
integration as verified and revalidate the current combined branch. Do not blindly retry a failed or
ambiguous merge call.

Successful verified integration writes `epic-integrations.json` in the common Git directory:

```json
{
  "integrations": [{
    "issue": 41,
    "pr": 142,
    "merge_commit": "3333333333333333333333333333333333333333",
    "epic_branch": "epic/40-parser",
    "head_sha": "1111111111111111111111111111111111111111",
    "base_sha": "2222222222222222222222222222222222222222"
  }]
}
```

The helper does not close issues, edit epic checklists, or delete branches/worktrees. Perform those
steps after verification, respecting repository policy. If a local receipt was lost, reconstruct it
from actual reviewed PR and merge evidence. If an integration raced, review and gate the resulting
branch, record the revalidation on the PR, and reconcile the ledger with the actual merge commit and
verified current ancestry. Do not fabricate a receipt simply to unblock a dependency.

Race reconciliation is a coordinator operation, not a retry flag in the merge helper. Preserve the
actual child head and squash parent as historical `head_sha` and `base_sha` metadata. Separately
link the fresh combined-branch head and its passing gate/review evidence on the PR. Do not replace
historical `base_sha` with the current epic head to make a retry pass.

## Readiness snapshot

Refresh issue/dependency state and active crew ownership, then write a snapshot:

```json
{
  "issues": [
    {"number": 41, "blocked_by": [], "owner_gated": false, "files_owned": ["src/parser.ts", "tests/parser.test.ts"]},
    {"number": 42, "blocked_by": [41], "owner_gated": false, "files_owned": ["src/cli.ts", "tests/cli.test.ts"]},
    {"number": 43, "blocked_by": [], "owner_gated": true, "files_owned": ["deploy/scheduler.json"]}
  ],
  "in_flight": []
}
```

Use `readiness /path/to/snapshot.json --epic-branch epic/40-parser`. Active entries are
`{"issue":41,"files_owned":["src/parser.ts","tests/parser.test.ts"]}` and must match the issue's
declared ownership.

The helper fetches the configured remote epic branch and checks integration commit ancestry,
dependencies, owner gates, concurrency slots, and exact ownership conflicts. It emits `ready`,
`blocked` with reasons, `integrated`, `in_flight`, and `complete`. Closed issue status is ignored. A
dependency outside the snapshot remains blocked until its actual integration evidence and scope are
reconciled; do not silently treat closure as satisfaction. The snapshot is only as fresh as the
coordinator's GitHub reads. Refresh it after each merge, park, ownership change, or restart.

A `complete` scheduler result means all snapshot issues are integrated and no work is in flight. The
coordinator must also ensure the snapshot includes all required epic scope and that the final
combined branch gate passes before declaring the epic complete.
