#!/usr/bin/env bash
# seal-verify.sh <epic-num>
#
# Run from a Git repository. Success requires its executable isolation probe
# to pass NOW; environment liveness or a previous success is insufficient.
# EPIC_SEAL_PROBE selects an executable path (default scripts/seal-probe.sh).
# EPIC_SEAL_LAUNCHER optionally selects an executable path (default
# scripts/devcontainer-up.sh when present). Relative paths resolve from the
# repository root; both programs run there. These variables are paths, not
# shell commands. No image, harness, credentials, or container engine is assumed.
#
# Probe contract: receive environment name epic-N as the sole argument; exit 0
# only after checking the repository's required mount, credential, network,
# and privilege boundaries. Probe failures must exit nonzero. The probe must
# inspect the actual environment used for dispatch, be safe to rerun, and must
# not treat a running process or a responsive model as proof of isolation.
#
# A passing initial probe reuses the environment without launching. Otherwise,
# an available launcher receives epic number N; a successful launch is followed
# by another mandatory probe. Provisioning and engine details belong to these
# repository-owned programs. Review their checks before trusting their result.
# No success is cached; call again before dispatch/resume and after changes.
#
# Exit: 0 PROBE_PASSED, 2 USAGE, 10 PROBE_UNAVAILABLE,
#       11 LAUNCH_FAILED, 14 PROBE_FAILED.
set -euo pipefail

fail() {
  local name=$1 code=$2
  shift 2
  echo "seal-verify.sh: ${name}: $*" >&2
  exit "$code"
}

[ $# -eq 1 ] || fail USAGE 2 'usage: seal-verify.sh <epic-num>'
epic=$1
case "$epic" in
  *[!0-9]*|'') fail USAGE 2 'epic number must be numeric' ;;
esac
case "$epic" in
  *[1-9]*) ;;
  *) fail USAGE 2 'epic number must be positive' ;;
esac
name="epic-${epic}"
repo_root=$(git rev-parse --show-toplevel 2>/dev/null) || fail USAGE 2 'run from a Git repository'
cd "$repo_root"

probe=${EPIC_SEAL_PROBE:-scripts/seal-probe.sh}
case "$probe" in
  /*) ;;
  *) probe="$repo_root/$probe" ;;
esac
[ -f "$probe" ] && [ -x "$probe" ] || fail PROBE_UNAVAILABLE 10 "isolation probe is missing or not executable: $probe"

if "$probe" "$name"; then
  echo "seal-verify.sh: PROBE_PASSED: '$name' passed the repository isolation probe"
  exit 0
fi

launcher=${EPIC_SEAL_LAUNCHER:-}
if [ -z "$launcher" ] && [ -e "$repo_root/scripts/devcontainer-up.sh" ]; then
  launcher=scripts/devcontainer-up.sh
fi
[ -n "$launcher" ] || fail PROBE_FAILED 14 "'$name' failed the isolation probe; no launcher is configured"
case "$launcher" in
  /*) ;;
  *) launcher="$repo_root/$launcher" ;;
esac
[ -f "$launcher" ] && [ -x "$launcher" ] || fail LAUNCH_FAILED 11 "launcher is missing or not executable: $launcher"
echo "seal-verify.sh: initial probe failed; invoking repository launcher for '$name'"
"$launcher" "$epic" || fail LAUNCH_FAILED 11 "launcher failed for '$name'"
"$probe" "$name" || fail PROBE_FAILED 14 "'$name' failed the isolation probe after launch"
echo "seal-verify.sh: PROBE_PASSED: '$name' passed the repository isolation probe"
