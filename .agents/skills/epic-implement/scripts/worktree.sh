#!/usr/bin/env bash
# worktree.sh {create <issue> <branch> [--base <ref>] [files-owned...] | destroy <path> | check}
#
# Epic worktree lifecycle plus the shared ownership manifest. Run from inside
# the target repo (main checkout or any worktree); the repo is discovered from
# the working directory, never hardcoded.
#
# Manifest: <git-common-dir>/epic-worktrees.json — inside .git/, so it is
# unversioned by construction. Shape:
#   { "worktrees": [ { "issue": 200, "branch": "...", "path": "/abs/path",
#                      "files_owned": ["..."], "pr": null } ] }
#
#   create  — git worktree add from a PUSHED base ref (--base, default
#             origin/main; sub-issue worktrees pass the epic branch) + append
#             manifest entry. If <branch> already exists, checks it out
#             instead of creating (idempotent for the epic worktree).
#   destroy — remove the worktree (refuses if dirty: commit WIP, NEVER stash),
#             prune, delete the manifest entry.
#   check   — for each manifest entry with an open PR, compare
#             `gh pr diff --name-only` against files_owned; exit nonzero
#             naming any PR touching undeclared files.
#
# EVERY subcommand ends by asserting the main checkout's HEAD is `main` and
# printing `git worktree list`.
#
# Exit codes:
#   0  success
#   2  USAGE
#  20  MAIN_CHECKOUT_DRIFT   main checkout HEAD is not `main`
#  21  OWNERSHIP_VIOLATION   an open PR touches files outside files_owned
#  22  NO_MANIFEST           check ran but no manifest exists
#  23  GIT_FAILED            a git operation failed
#  24  MISSING_DEPENDENCY    jq (or gh, for check) not on PATH
set -euo pipefail

fail() { # fail <NAME> <code> <message...>
  local name=$1 code=$2
  shift 2
  echo "worktree.sh: ${name}: $*" >&2
  exit "$code"
}

command -v jq >/dev/null 2>&1 || fail MISSING_DEPENDENCY 24 "jq is required"

git rev-parse --git-dir >/dev/null 2>&1 || fail USAGE 2 "not inside a git repository"
common_dir=$(git rev-parse --git-common-dir)
case "$common_dir" in
  /*) ;;
  *) common_dir="$PWD/$common_dir" ;;
esac
main_checkout=$(dirname "$common_dir")
manifest="$common_dir/epic-worktrees.json"

finish() {
  local head
  head=$(git -C "$main_checkout" rev-parse --abbrev-ref HEAD)
  if [ "$head" != "main" ]; then
    fail MAIN_CHECKOUT_DRIFT 20 "main checkout $main_checkout HEAD is '$head', expected 'main'"
  fi
  echo "worktree.sh: main checkout HEAD ok (main)"
  git -C "$main_checkout" worktree list
}

manifest_read() {
  if [ -f "$manifest" ]; then cat "$manifest"; else echo '{"worktrees":[]}'; fi
}

manifest_write() { # stdin -> manifest, atomically
  local tmp
  tmp=$(mktemp "${manifest}.XXXXXX")
  cat > "$tmp"
  mv "$tmp" "$manifest"
}

cmd=${1:-}
case "$cmd" in
  create)
    [ $# -ge 3 ] || fail USAGE 2 "usage: worktree.sh create <issue> <branch> [--base <ref>] [files-owned...]"
    issue=$2
    branch=$3
    shift 3
    base_ref="origin/main"
    if [ "${1:-}" = "--base" ]; then
      [ $# -ge 2 ] || fail USAGE 2 "--base requires a ref"
      base_ref=$2
      shift 2
    fi
    case "$issue" in
      *[!0-9]*|'') fail USAGE 2 "issue number must be numeric, got '$issue'" ;;
    esac

    git -C "$main_checkout" fetch origin --quiet \
      || fail GIT_FAILED 23 "git fetch origin failed"
    git -C "$main_checkout" rev-parse --verify --quiet "$base_ref" >/dev/null \
      || fail GIT_FAILED 23 "base ref '$base_ref' does not exist (push it first)"

    wt_path="$(dirname "$main_checkout")/$(basename "$main_checkout")-issue-${issue}"
    [ -e "$wt_path" ] && fail GIT_FAILED 23 "worktree path already exists: $wt_path"

    if git -C "$main_checkout" rev-parse --verify --quiet "refs/heads/$branch" >/dev/null; then
      git -C "$main_checkout" worktree add "$wt_path" "$branch" \
        || fail GIT_FAILED 23 "git worktree add $wt_path $branch failed"
    else
      git -C "$main_checkout" worktree add "$wt_path" -b "$branch" "$base_ref" \
        || fail GIT_FAILED 23 "git worktree add $wt_path -b $branch $base_ref failed"
    fi

    files_json='[]'
    if [ $# -gt 0 ]; then
      files_json=$(printf '%s\n' "$@" | jq -R . | jq -s .)
    fi
    manifest_read \
      | jq --argjson issue "$issue" --arg branch "$branch" --arg path "$wt_path" \
           --argjson files "$files_json" \
           '.worktrees += [{issue: $issue, branch: $branch, path: $path, files_owned: $files, pr: null}]' \
      | manifest_write
    echo "worktree.sh: created worktree for issue #$issue"
    echo "$wt_path"
    finish
    ;;

  destroy)
    [ $# -eq 2 ] || fail USAGE 2 "usage: worktree.sh destroy <path>"
    wt_path=$2
    # Not --force: a dirty worktree means uncommitted WIP. Commit it to the
    # branch (NEVER git stash: the stash is shared across worktrees).
    git -C "$main_checkout" worktree remove "$wt_path" \
      || fail GIT_FAILED 23 "git worktree remove $wt_path failed (dirty? commit WIP to the branch, never stash)"
    git -C "$main_checkout" worktree prune
    manifest_read \
      | jq --arg path "$wt_path" '.worktrees |= map(select(.path != $path))' \
      | manifest_write
    echo "worktree.sh: destroyed worktree $wt_path"
    finish
    ;;

  check)
    [ $# -eq 1 ] || fail USAGE 2 "usage: worktree.sh check"
    command -v gh >/dev/null 2>&1 || fail MISSING_DEPENDENCY 24 "gh is required for check"
    [ -f "$manifest" ] || fail NO_MANIFEST 22 "no manifest at $manifest"

    violations=0
    while IFS=$'\t' read -r entry_issue entry_pr entry_files; do
      [ "$entry_pr" = "null" ] && continue
      state=$(cd "$main_checkout" && gh pr view "$entry_pr" --json state -q .state 2>/dev/null) || {
        echo "worktree.sh: warning: could not read PR #$entry_pr state; skipping" >&2
        continue
      }
      [ "$state" = "OPEN" ] || continue
      while IFS= read -r changed; do
        [ -z "$changed" ] && continue
        if ! printf '%s' "$entry_files" | jq -e --arg f "$changed" 'index($f) != null' >/dev/null; then
          echo "worktree.sh: OWNERSHIP_VIOLATION: PR #$entry_pr (issue #$entry_issue) touches undeclared file: $changed" >&2
          violations=$((violations + 1))
        fi
      done < <(cd "$main_checkout" && gh pr diff "$entry_pr" --name-only)
    done < <(jq -r '.worktrees[] | [(.issue|tostring), (.pr|tostring), (.files_owned|tojson)] | @tsv' "$manifest")

    if [ "$violations" -gt 0 ]; then
      echo "worktree.sh: OWNERSHIP_VIOLATION: $violations undeclared file(s) touched by open PRs" >&2
      finish
      exit 21
    fi
    echo "worktree.sh: ownership check clean"
    finish
    ;;

  *)
    fail USAGE 2 "usage: worktree.sh {create <issue> <branch> [files-owned...] | destroy <path> | check}"
    ;;
esac
