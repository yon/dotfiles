#!/usr/bin/env bash
# Typed execution coordinator. Bun must be available on PATH.
set -euo pipefail
EPIC_SKILL_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)
export EPIC_SKILL_DIR
exec bun "$EPIC_SKILL_DIR/scripts/run.ts" "$@"
