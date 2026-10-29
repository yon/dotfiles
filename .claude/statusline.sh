#!/usr/bin/env bash
# Prior pwd + git line, followed by the News OS spend statusline.
input=$(cat)
cwd=$(jq -r '.workspace.current_dir' <<<"$input")
git_info=""
if git -C "$cwd" rev-parse --git-dir >/dev/null 2>&1; then
  repo=$(basename "$(git -C "$cwd" rev-parse --show-toplevel 2>/dev/null)")
  branch=$(git -C "$cwd" rev-parse --abbrev-ref HEAD 2>/dev/null)
  staged=""; unstaged=""
  git -C "$cwd" diff --quiet --cached 2>/dev/null || staged="+"
  git -C "$cwd" diff --quiet 2>/dev/null || unstaged="!"
  git_info=$(printf ' \033[2m%s (%s%s%s)\033[0m' "$repo" "$branch" "$unstaged" "$staged")
fi
printf '\033[2m%s\033[0m%s\n' "$cwd" "$git_info"
"$HOME/.nc-os/tools/bun/current/bun" "$HOME/.nc-os/marketplace-cache/nc-os-core/plugin/statusline/nc-os-statusline.ts" <<<"$input"
