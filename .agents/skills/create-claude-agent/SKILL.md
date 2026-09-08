---
name: create-claude-agent
description: Create or revise a Claude Code subagent definition using Yon's agent template. Use when asked to add or change a Claude subagent role.
---

# Create a Claude Code agent

Use [the agent template](assets/agent.md) as a starting point. Replace its
placeholder metadata and guidance with the requested role; include only the
sections that help that role perform its task.

Save project agents in the project's `.claude/agents/` directory, or personal
agents in `~/.claude/agents/` when the request is for a role used across projects.
Give the definition a unique `name` and a specific `description`. Omit optional
tool restrictions and presentation fields unless the role needs them.

The template is an asset, not an installed agent definition.
