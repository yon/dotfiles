# `.llms/` — LLM-Facing Instructions

This directory is the single source of truth for instructions that AI coding harnesses load on session start. It's symlinked into vendor-specific directories so the content stays in one place.

```
~/.files/.llms/
├── global.md          → ~/.claude/CLAUDE.md
├── rules/             → ~/.claude/rules/
├── skills/            → ~/.claude/skills/
├── agents/            → ~/.claude/agents/
├── instructions/      → ~/.claude/instructions/
└── templates/         → ~/.claude/templates/
```

## What lives where

| Directory | Purpose | Portable across harnesses? |
|-----------|---------|----------------------------|
| `global.md` | Top-level instructions (loaded as `CLAUDE.md`, `GEMINI.md`, `AGENTS.md` etc.) | **Yes** — written to be vendor-neutral. |
| `rules/` | Reference docs the harness can load on demand. Engineering principles, code conventions, security, testing, git, quality gates, workflow, agent coordination. | **Yes** — these are concepts and standards, not tool calls. |
| `skills/` | Skill packages — each is a directory with a `SKILL.md` (frontmatter + workflow) plus supporting files. | **Partially.** Frontmatter format (`name`, `description`) matches Claude Code/Anthropic skills. Skill content references generic tools (`make check`, `git`, common CLIs) where possible. |
| `agents/` | Subagent definitions with YAML frontmatter (`name`, `description`, optional `tools`, `color`). | **Claude Code-specific.** Other harnesses that don't have subagent equivalents will ignore this directory. |
| `instructions/` | Ad-hoc reference material (style guides, language-specific patterns). | **Yes.** |
| `templates/` | Scaffolding (e.g. agent template). | **Yes.** |

## Skills and external dependencies

Several skills depend on Anthropic's `superpowers` plugin (writing-plans, executing-plans, test-driven-development, dispatching-parallel-agents, using-git-worktrees, etc). When those skills aren't available, the local skills fall back to the harness's built-in equivalents (e.g. plan mode in place of `superpowers:writing-plans`).

## Adding to this tree

- A new **rule** is a single markdown file in `rules/` referenced from `global.md`.
- A new **skill** is a directory `skills/<name>/` containing `SKILL.md` with frontmatter `name:` and `description:` — the description is what triggers discovery, so make it specific.
- A new **agent** is a single markdown file in `agents/<name>.md` with YAML frontmatter (`name`, `description`, optional `tools`, `color`). See `templates/agent.md`.

## Conventions

- Keep top-level files short; defer details to dedicated rule files or skills.
- Cross-reference instead of duplicating. If two files say the same thing, one of them should be a link to the other.
- Update or delete stale content rather than letting it accumulate — duplication and dead references are the main entropy sources here.
