# Agent configuration

`~/.agents` links to this directory. Shared skills use the
[Agent Skills format](https://agentskills.io/specification):
`skills/<name>/SKILL.md`, with supporting references or assets inside the package.
Codex and Cursor discover personal skills in `~/.agents/skills`.
Claude reads the same packages through `.claude/skills -> ../.agents/skills`.

| Content | Source in this repository |
| --- | --- |
| Personal skills | `.agents/skills/` |
| Personal instructions | `.agents/AGENTS.md` |
| Claude instruction entry point | `.claude/CLAUDE.md -> ../.agents/AGENTS.md` |
| Claude rules, including path scoping | `.claude/rules/` |
| Claude subagent definitions | `.claude/agents/` |
| Writing guide | `.agents/skills/writing-in-yon-voice/references/yon-writing-style.md` |
| Agent template | `.agents/skills/create-agent/assets/agent.md` |

`AGENTS.md` is the canonical instruction file, exposed to Claude through its
`CLAUDE.md` symlink. `rules/` and `agents/` remain real directories in `.claude`.
Other harnesses need their own instruction entry point to load the shared file;
`.agents/AGENTS.md` is not automatically a global instruction source everywhere.
For project instructions, use a project `AGENTS.md` and a sibling
`CLAUDE.md -> AGENTS.md` when needed.

Restart existing harness sessions after changing discovery directories.
