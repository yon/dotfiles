#!/usr/bin/env bash
set -euo pipefail
script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
export EPIC_SKILL_DIR=$(cd "$script_dir/.." && pwd)
exec bun "$script_dir/dispatch-prompt.ts" "$@"
