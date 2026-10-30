# Agent configuration

`~/.agents` links to this directory. It holds what Claude Code, Codex, OpenCode and Cursor share.
Shared skills use the [Agent Skills format](https://agentskills.io/specification):
`skills/<name>/SKILL.md`, with supporting references or assets inside the package.

## What each harness reads

| Content             | Source in this repository                                    | Claude                                  | Codex                                                 | OpenCode                              | Cursor             |
| ------------------- | ------------------------------------------------------------ | --------------------------------------- | ----------------------------------------------------- | ------------------------------------- | ------------------ |
| Global instructions | `.agents/AGENTS.md`                                          | `~/.claude/CLAUDE.md` (symlink in repo) | `~/.codex/AGENTS.md` (`make harness_links`)           | `~/.config/opencode/AGENTS.md` (same) | not file-managed   |
| Skills              | `.agents/skills/`                                            | `~/.claude/skills` (symlink in repo)    | `~/.agents/skills`                                    | not yet checked                       | `~/.agents/skills` |
| Path-scoped rules   | `.claude/rules/`                                             | loaded by path                          | read on demand when `AGENTS.md` points to them        | same as Codex                         | same as Codex      |
| Subagents           | `.claude/agents/`                                            | native                                  | n/a                                                   | n/a                                   | n/a                |
| Approved commands   | `.claude/settings.json`, `.agents/codex/rules/default.rules` | `permissions` in settings               | `~/.codex/rules/default.rules` (`make harness_links`) | n/a                                   | n/a                |

Personal writing guide: `.agents/skills/writing-in-yon-voice/references/yon-writing-style.md`. Agent
template: `.agents/skills/create-agent/assets/agent.md`.

## Owned elsewhere, not tracked

- **NC OS** writes the `<nc-os-managed-instructions>` block into `AGENTS.md` through the Codex and
  OpenCode links, and rewrites `.claude/settings.json`. Commit that churn now and then.
- **NC OS** also owns models, providers and MCP servers: `~/.claude.json`, `~/.codex/config.toml`,
  `~/.config/opencode/opencode.json`. Personal Codex defaults worth re-applying on a new machine:
  `model_reasoning_effort` and `approval_policy` in `~/.codex/config.toml`.
- **Installed skills** (`dj-*`, `nc-os-*`, `nuk-*`, `gh-stack` and others) are ignored by prefix in
  `.gitignore`. A skill you write shows up as untracked until you add it.
- **Claude runtime state**: `.gitignore` ignores everything in `.claude/` except the files it lists.
  Add a line there when you add a new kind of Claude config.

## Notes

- Claude Code reads a project's `AGENTS.md` when no `CLAUDE.md` sits in that folder or above it, so
  projects don't need a `CLAUDE.md -> AGENTS.md` symlink. Global instructions still need
  `~/.claude/CLAUDE.md`.
- `make harness_links` skips any target that is a real file. Move the file aside, then rerun.
- If Codex's approved-commands file turns into a real file, Codex replaced the link. Copy the new
  rules into `.agents/codex/rules/default.rules`, then rerun `make harness_links`.
- Restart existing harness sessions after changing discovery directories.
