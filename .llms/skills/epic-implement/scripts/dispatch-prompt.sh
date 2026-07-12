#!/usr/bin/env bash
# dispatch-prompt.sh <issue-num> [gate-command]
#
# Emit the self-contained dispatch prompt for an implementor agent, rendered
# from dispatch-template.md (same directory). Run from inside the target repo.
#
# Slots filled:
#   {{ISSUE_NUMBER}}  the issue number
#   {{BRANCH}}        branch from the manifest entry
#   {{GATE_CMD}}      arg 2, else $EPIC_GATE_CMD, else `make check`
#   {{ISSUE_TEXT}}    issue body + ALL comments (gh issue view)
#   {{FILES_OWNED}}   files_owned read FROM the manifest entry that
#                     `worktree.sh create` wrote (single source of truth)
#   {{HOST_FACTS}}    contents of host-facts.md (same directory)
#
# Errors if the manifest has no entry for the issue: create the worktree
# first (`worktree.sh create <issue> <branch> [files...]`).
#
# Exit codes:
#   0  prompt emitted on stdout
#   2  USAGE
#  24  MISSING_DEPENDENCY   gh or jq not on PATH
#  40  NO_MANIFEST_ENTRY    no manifest entry for the issue
#  41  MISSING_FILE         template or host-facts.md not found
#  42  ISSUE_FETCH_FAILED   gh could not fetch the issue
set -euo pipefail

fail() { # fail <NAME> <code> <message...>
  local name=$1 code=$2
  shift 2
  echo "dispatch-prompt.sh: ${name}: $*" >&2
  exit "$code"
}

[ $# -ge 1 ] || fail USAGE 2 "usage: dispatch-prompt.sh <issue-num> [gate-command]"
issue=$1
case "$issue" in
  *[!0-9]*|'') fail USAGE 2 "issue number must be numeric, got '$issue'" ;;
esac
gate_cmd=${2:-${EPIC_GATE_CMD:-make check}}

command -v gh >/dev/null 2>&1 || fail MISSING_DEPENDENCY 24 "gh is required"
command -v jq >/dev/null 2>&1 || fail MISSING_DEPENDENCY 24 "jq is required"

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
template="$script_dir/dispatch-template.md"
host_facts="$script_dir/host-facts.md"
[ -f "$template" ] || fail MISSING_FILE 41 "template not found: $template"
[ -f "$host_facts" ] || fail MISSING_FILE 41 "host facts not found: $host_facts"

git rev-parse --git-dir >/dev/null 2>&1 || fail USAGE 2 "not inside a git repository"
common_dir=$(git rev-parse --git-common-dir)
case "$common_dir" in
  /*) ;;
  *) common_dir="$PWD/$common_dir" ;;
esac
manifest="$common_dir/epic-worktrees.json"

[ -f "$manifest" ] \
  || fail NO_MANIFEST_ENTRY 40 "no manifest at $manifest; run worktree.sh create for issue #$issue first"
entry=$(jq -e --argjson issue "$issue" '[.worktrees[] | select(.issue == $issue)] | first // empty' "$manifest") \
  || fail NO_MANIFEST_ENTRY 40 "no manifest entry for issue #$issue; run worktree.sh create first"
[ -n "$entry" ] && [ "$entry" != "null" ] \
  || fail NO_MANIFEST_ENTRY 40 "no manifest entry for issue #$issue; run worktree.sh create first"
branch=$(jq -r .branch <<<"$entry")

workdir=$(mktemp -d)
trap 'rm -rf "$workdir"' EXIT

# Issue body, then all comments. `gh issue view --comments` prints only the
# comment thread, so both calls are needed for the full conversation.
{
  gh issue view "$issue" && printf '\n' && gh issue view "$issue" --comments
} > "$workdir/issue.txt" || fail ISSUE_FETCH_FAILED 42 "gh issue view $issue failed"

jq -r '.files_owned[] | "- " + .' <<<"$entry" > "$workdir/files.txt"
if [ ! -s "$workdir/files.txt" ]; then
  echo "- (none declared — STOP and report back before editing any file)" > "$workdir/files.txt"
fi

# Render: block placeholders ({{ISSUE_TEXT}}, {{FILES_OWNED}}, {{HOST_FACTS}})
# must sit alone on their line and are replaced by file contents; inline
# placeholders are replaced literally (no regex, so `&&` in the gate command
# is safe).
awk -v issue_file="$workdir/issue.txt" \
    -v files_file="$workdir/files.txt" \
    -v facts_file="$host_facts" \
    -v issue_num="$issue" \
    -v branch="$branch" \
    -v gate_cmd="$gate_cmd" '
  function catfile(f,   l) { while ((getline l < f) > 0) print l; close(f) }
  function repl(s, tok, val,   i, out) {
    out = ""
    i = index(s, tok)
    while (i > 0) {
      out = out substr(s, 1, i - 1) val
      s = substr(s, i + length(tok))
      i = index(s, tok)
    }
    return out s
  }
  $0 == "{{ISSUE_TEXT}}"  { catfile(issue_file); next }
  $0 == "{{FILES_OWNED}}" { catfile(files_file); next }
  $0 == "{{HOST_FACTS}}"  { catfile(facts_file); next }
  {
    line = $0
    line = repl(line, "{{ISSUE_NUMBER}}", issue_num)
    line = repl(line, "{{BRANCH}}", branch)
    line = repl(line, "{{GATE_CMD}}", gate_cmd)
    print line
  }
' "$template"
