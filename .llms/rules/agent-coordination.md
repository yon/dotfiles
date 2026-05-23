# Agent Coordination — When and How to Spawn Parallel Subagents

**Use parallel subagents when concurrency provides genuine value — not as a default.** Coordination overhead, token cost, and integration complexity are real. The right team size is 2-4 subagents for most work; rarely more than 8.

For the mechanics of spawning (Claude Code's `Task` tool, worktree isolation, sub-context management), defer to `superpowers:dispatching-parallel-agents` and `superpowers:subagent-driven-development`. This document covers the *when* and the *rules*.

______________________________________________________________________

## When to Use Parallel Subagents

### Strong fits

- **Parallel code review** — each reviewer takes one dimension (security, performance, tests, docs) without context dilution.
- **Multi-module implementation** — each subagent owns separate files; no merge conflicts.
- **Competing-hypothesis debugging** — subagents test different theories simultaneously.
- **Research swarms** — multiple angles explored in parallel (one reads code, another checks git history, another searches docs).
- **Large-scale refactoring split by module boundary** — each subagent owns its files.

### Don't bother

- Single-file changes — direct work is faster.
- Tightly coupled changes that would force subagents to edit the same files — sequence them instead.
- Simple tasks where coordination overhead exceeds the win.
- Exploratory work where you don't yet know what files are involved — explore first, then parallelize if it pays off.

______________________________________________________________________

## Critical Rules

### 1. File ownership — no shared edits

The #1 cause of parallel-work failure is two subagents editing the same file.

- State explicitly in each task prompt which files (or directory) the subagent owns.
- Prefer directory-level ownership ("you own `src/auth/*`, nothing else").
- Config files (`package.json`, `go.mod`, `Cargo.toml`) are owned by exactly one subagent.
- If file boundaries are unclear, use worktree isolation (`superpowers:using-git-worktrees`) so each subagent works in its own copy.

### 2. Subagents start fresh

A subagent does NOT inherit the lead's conversation history. It only has the task prompt, the project's `CLAUDE.md` (loaded automatically), and read access to the codebase.

Every task prompt must include:

- Specific files the subagent will work on.
- Requirements, constraints, and what "done" looks like.
- Key decisions already made (so it doesn't re-litigate them).

### 3. Adversarial separation

The subagent that writes code NEVER reviews it. The subagent that reviews NEVER edits.

- Writers: `production-code-engineer`, `code-shell-expert`.
- Reviewers: `code-reviewer`, `security-reviewer`, `architecture-reviewer`, `performance-reviewer`, `test-reviewer`, `doc-reviewer`.
- The lead coordinates but does not override reviewer findings without justification.

### 4. Verify the combined result

Individual subagent success does not guarantee integration success. The lead must run `make check` (or equivalent) on the combined result after all subagents complete. If integration fails, identify which subagent's work broke it and message that subagent to fix.

______________________________________________________________________

## Coordination Patterns

| Pattern | Shape | When |
|---------|-------|------|
| **Parallel review (read-only)** | Lead reads changed files → spawns N reviewers in parallel → synthesizes reports | Zero conflict risk; after a feature is built |
| **Module-parallel implementation** | Lead partitions files → spawns writer subagents in parallel → integration verify → spawns reviewers | Clear module boundaries |
| **Dependent phases** | Phase 1 (writers in parallel) → Phase 2 (integration) → Phase 3 (review) | Some work blocks other work |
| **Research swarm** | Lead defines questions → spawns `Explore` subagents in parallel → synthesizes findings | Open-ended investigation |
| **Adversarial pair** | Lead spawns implementer + read-only critic; loop until critic approves | High-stakes code (security, finance, data integrity) |

______________________________________________________________________

## Token Cost

Each subagent has its own context (CLAUDE.md, agent definition, file contents). N subagents = roughly N times the token usage of sequential work. Use parallelism when time savings or context isolation outweigh the cost — not as a default mode.
