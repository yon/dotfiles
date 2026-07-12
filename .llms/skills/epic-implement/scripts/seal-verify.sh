#!/usr/bin/env bash
# seal-verify.sh <epic-num> [image]
#
# Verify the sealed devcontainer for an epic is alive and its claude CLI can
# reach Bedrock. The epic-implement skill forbids sealed dispatch unless this
# script exits 0.
#
# Finds or launches container `epic-<n>` via the host container CLI detected
# from PATH (Apple `container` preferred, `docker` fallback), copies the host's
# ~/.claude/settings.bedrock.json in, and runs a one-shot claude probe inside.
#
# Launching when the container is not already running: a repo-declared
# launcher ALWAYS wins — if the repo has scripts/devcontainer-up.sh (or
# $EPIC_SEAL_LAUNCHER names one), it is invoked with the epic number, because
# only the repo's launcher applies its isolation (mounts, firewall,
# postStart). A bare `run --detach <image>` (arg 2 / $EPIC_SEAL_IMAGE) is the
# fallback for repos with no launcher, and proves LIVENESS ONLY, not
# isolation — the script says so loudly. If the repo declares an isolation
# probe ($EPIC_SEAL_PROBE, or scripts/seal-probe.sh if present), it is run
# and must pass.
#
# Exit codes:
#   0  container alive, claude answered, probe passed (where one exists)
#   2  USAGE
#  10  NO_CONTAINER_CLI  neither `container` nor `docker` on PATH
#  11  LAUNCH_FAILED     container not running and could not be launched
#  12  CLAUDE_DEAD       claude probe produced no OK and no Bedrock denial
#  13  BEDROCK_DENIED    Bedrock denied the call (or settings file missing)
#  14  PROBE_FAILED      the repo's isolation probe exited nonzero
set -euo pipefail

fail() { # fail <NAME> <code> <message...>
  local name=$1 code=$2
  shift 2
  echo "seal-verify.sh: ${name}: $*" >&2
  exit "$code"
}

[ $# -ge 1 ] || fail USAGE 2 "usage: seal-verify.sh <epic-num> [image]"
epic=$1
case "$epic" in
  *[!0-9]*|'') fail USAGE 2 "epic number must be numeric, got '$epic'" ;;
esac
image=${2:-${EPIC_SEAL_IMAGE:-}}
name="epic-${epic}"

if command -v container >/dev/null 2>&1; then
  cli=container
elif command -v docker >/dev/null 2>&1; then
  cli=docker
else
  fail NO_CONTAINER_CLI 10 "neither 'container' nor 'docker' found on PATH"
fi
echo "seal-verify.sh: using container CLI: $cli"

repo_root=$(git rev-parse --show-toplevel 2>/dev/null || true)
launcher=${EPIC_SEAL_LAUNCHER:-}
if [ -z "$launcher" ] && [ -n "$repo_root" ] && [ -x "$repo_root/scripts/devcontainer-up.sh" ]; then
  launcher="$repo_root/scripts/devcontainer-up.sh"
fi

if ! "$cli" exec "$name" true >/dev/null 2>&1; then
  if [ -n "$launcher" ]; then
    echo "seal-verify.sh: container '$name' not running; launching via repo launcher: $launcher $epic"
    "$launcher" "$epic" || fail LAUNCH_FAILED 11 "repo launcher '$launcher $epic' failed"
  elif [ -n "$image" ]; then
    echo "seal-verify.sh: WARNING: no repo launcher found; bare-image launch verifies LIVENESS ONLY, not isolation (no mounts/firewall applied)" >&2
    if ! "$cli" run --detach --name "$name" "$image" sleep infinity >/dev/null 2>&1; then
      fail LAUNCH_FAILED 11 "'$cli run --detach --name $name $image' failed"
    fi
  else
    fail LAUNCH_FAILED 11 "container '$name' is not running and no repo launcher or image was given (EPIC_SEAL_LAUNCHER / arg 2 / EPIC_SEAL_IMAGE)"
  fi
  if ! "$cli" exec "$name" true >/dev/null 2>&1; then
    fail LAUNCH_FAILED 11 "container '$name' launched but exec inside it fails"
  fi
fi

# Repo-declared isolation probe: existence of a probe makes it mandatory.
probe=${EPIC_SEAL_PROBE:-}
if [ -z "$probe" ] && [ -n "$repo_root" ] && [ -x "$repo_root/scripts/seal-probe.sh" ]; then
  probe="$repo_root/scripts/seal-probe.sh"
fi
if [ -n "$probe" ]; then
  echo "seal-verify.sh: running repo isolation probe: $probe $name"
  "$probe" "$name" || fail PROBE_FAILED 14 "isolation probe '$probe $name' failed — the container is NOT verified sealed"
fi

settings_src="${HOME}/.claude/settings.bedrock.json"
if [ ! -f "$settings_src" ]; then
  fail BEDROCK_DENIED 13 "host settings file not found: $settings_src (claude in the container would 403 without it)"
fi

# Copy the settings in via exec+stdin: works identically on `container` and
# `docker`, and lands in the container user's HOME whatever that is.
# shellcheck disable=SC2016  # $HOME must expand inside the container, not on the host
if ! "$cli" exec -i "$name" sh -c 'mkdir -p "$HOME/.claude" && cat > "$HOME/.claude/settings.bedrock.json"' < "$settings_src"; then
  fail LAUNCH_FAILED 11 "failed to copy settings.bedrock.json into container '$name'"
fi

echo "seal-verify.sh: probing claude inside '$name'"
# shellcheck disable=SC2016  # $HOME must expand inside the container, not on the host
probe_out=$("$cli" exec "$name" sh -lc 'claude --settings "$HOME/.claude/settings.bedrock.json" -p "reply with exactly: OK"' 2>&1) || true

if printf '%s' "$probe_out" | grep -q "OK"; then
  echo "seal-verify.sh: SEAL_VERIFIED: container '$name' alive, claude answered OK"
  exit 0
fi
if printf '%s' "$probe_out" | grep -qiE '403|AccessDenied|access denied|inference[- ]profile|bedrock'; then
  fail BEDROCK_DENIED 13 "claude probe was denied by Bedrock. Output: $probe_out"
fi
fail CLAUDE_DEAD 12 "claude probe did not answer OK. Output: $probe_out"
