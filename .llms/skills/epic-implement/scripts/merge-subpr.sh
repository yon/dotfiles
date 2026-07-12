#!/usr/bin/env bash
# merge-subpr.sh <pr-num> <epic-pr-num>
#
# The ONLY supported path for landing a sub-PR onto the epic integration
# branch. Run from inside the target repo. Refuses unless the sub-PR is OPEN
# and mergeable, then runs exactly `gh pr merge <pr> --squash` (so the PR ends
# in state Merged — never local-squash-and-close), then:
#   - closes the linked sub-issue(s)
#   - ticks the epic PR checklist line(s) for the sub-issue / sub-PR
#   - deletes the remote branch
#   - destroys the worktree via worktree.sh (manifest path)
#
# Exit codes:
#   0  merged and cleaned up
#   2  USAGE
#  24  MISSING_DEPENDENCY   gh or jq not on PATH
#  30  PR_NOT_OPEN          state != OPEN — gh pr merge NOT called
#  31  PR_NOT_MERGEABLE     GitHub reports not mergeable — gh pr merge NOT called
#  32  MERGE_FAILED         gh pr merge itself failed
#  33  WRONG_BASE           sub-PR base is not the epic PR's head branch —
#                           gh pr merge NOT called (guards sub-issues landing
#                           straight on main via a defaulted gh pr create)
set -euo pipefail

fail() { # fail <NAME> <code> <message...>
  local name=$1 code=$2
  shift 2
  echo "merge-subpr.sh: ${name}: $*" >&2
  exit "$code"
}

[ $# -eq 2 ] || fail USAGE 2 "usage: merge-subpr.sh <pr-num> <epic-pr-num>"
pr=$1
epic_pr=$2
case "$pr$epic_pr" in
  *[!0-9]*) fail USAGE 2 "PR numbers must be numeric, got '$pr' '$epic_pr'" ;;
esac

command -v gh >/dev/null 2>&1 || fail MISSING_DEPENDENCY 24 "gh is required"
command -v jq >/dev/null 2>&1 || fail MISSING_DEPENDENCY 24 "jq is required"
script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

pr_json=$(gh pr view "$pr" --json state,mergeable,headRefName,baseRefName,title,closingIssuesReferences)
state=$(jq -r .state <<<"$pr_json")
mergeable=$(jq -r .mergeable <<<"$pr_json")
head_ref=$(jq -r .headRefName <<<"$pr_json")
base_ref=$(jq -r .baseRefName <<<"$pr_json")
title=$(jq -r .title <<<"$pr_json")
linked_issues=$(jq -r '.closingIssuesReferences[].number' <<<"$pr_json")
epic_head=$(gh pr view "$epic_pr" --json headRefName -q .headRefName)

if [ "$state" != "OPEN" ]; then
  fail PR_NOT_OPEN 30 "refusing PR #$pr: state is $state, not OPEN. gh pr merge NOT called."
fi
if [ "$base_ref" != "$epic_head" ]; then
  fail WRONG_BASE 33 "refusing PR #$pr: base is '$base_ref', expected the epic branch '$epic_head'. Retarget with: gh pr edit $pr --base $epic_head. gh pr merge NOT called."
fi
if [ "$mergeable" != "MERGEABLE" ]; then
  fail PR_NOT_MERGEABLE 31 "refusing PR #$pr: GitHub reports mergeable=$mergeable. gh pr merge NOT called."
fi

# One conventional commit per issue on the epic branch: subject = PR title
# (which the dispatch template mandates as `type(scope): summary (#issue)`)
# plus the sub-PR ref for the audit trail.
echo "merge-subpr.sh: merging PR #$pr (branch $head_ref) via gh pr merge --squash"
gh pr merge "$pr" --squash --subject "$title (PR #$pr)" \
  || fail MERGE_FAILED 32 "gh pr merge $pr --squash failed"

# Close linked sub-issues (squash lands on the epic branch, not the default
# branch, so GitHub will not auto-close them).
for issue in $linked_issues; do
  gh issue close "$issue" --comment "Landed on the epic branch via PR #$pr (squash-merged into epic PR #$epic_pr)." \
    || echo "merge-subpr.sh: warning: could not close issue #$issue" >&2
done

# Tick the epic PR checklist: any unchecked task line referencing the sub-PR
# or a linked sub-issue.
tick_refs="#$pr"
for issue in $linked_issues; do tick_refs="$tick_refs #$issue"; done
epic_body=$(gh pr view "$epic_pr" --json body -q .body)
new_body=$epic_body
for ref in $tick_refs; do
  new_body=$(printf '%s\n' "$new_body" | awk -v ref="$ref" '
    {
      line = $0
      if (line ~ /^[[:space:]]*[-*][[:space:]]+\[ \]/) {
        idx = index(line, ref)
        if (idx > 0) {
          after = substr(line, idx + length(ref), 1)
          if (after == "" || after !~ /[0-9]/) sub(/\[ \]/, "[x]", line)
        }
      }
      print line
    }')
done
if [ "$new_body" != "$epic_body" ]; then
  printf '%s\n' "$new_body" | gh pr edit "$epic_pr" --body-file - >/dev/null
  echo "merge-subpr.sh: ticked epic PR #$epic_pr checklist for: $tick_refs"
else
  echo "merge-subpr.sh: note: no unchecked epic PR #$epic_pr checklist line matched: $tick_refs" >&2
fi

# Delete the remote branch.
repo_slug=$(gh repo view --json nameWithOwner -q .nameWithOwner)
if gh api -X DELETE "repos/$repo_slug/git/refs/heads/$head_ref" >/dev/null 2>&1; then
  echo "merge-subpr.sh: deleted remote branch $head_ref"
else
  echo "merge-subpr.sh: warning: could not delete remote branch $head_ref (already gone?)" >&2
fi

# Destroy the worktree recorded in the manifest for this PR/branch.
common_dir=$(git rev-parse --git-common-dir)
case "$common_dir" in
  /*) ;;
  *) common_dir="$PWD/$common_dir" ;;
esac
manifest="$common_dir/epic-worktrees.json"
wt_path=""
if [ -f "$manifest" ]; then
  wt_path=$(jq -r --arg branch "$head_ref" --argjson pr "$pr" \
    '[.worktrees[] | select(.branch == $branch or .pr == $pr) | .path] | first // empty' "$manifest")
fi
if [ -n "$wt_path" ]; then
  "$script_dir/worktree.sh" destroy "$wt_path"
else
  echo "merge-subpr.sh: note: no manifest worktree entry for PR #$pr / branch $head_ref" >&2
fi

echo "merge-subpr.sh: PR #$pr merged into epic PR #$epic_pr branch and cleaned up"
