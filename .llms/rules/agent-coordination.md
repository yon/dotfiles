# Agent Coordination — Parallel Subagent & Team Patterns

**Use the Task tool to spawn parallel subagents for work that benefits from concurrent execution.** Each subagent runs independently with its own context, and the lead (main session) coordinates.

______________________________________________________________________

## When to Use Parallel Subagents

### Strong Use Cases

| Scenario | Why Subagents Help | Example |
|----------|-------------------|---------|
| **Parallel code review** | Each reviewer focuses on one dimension without context dilution | Security reviews auth while performance reviews queries |
| **Multi-module implementation** | Each subagent owns separate files, no merge conflicts | Backend API + frontend components + database migrations |
| **Competing hypothesis debugging** | Subagents test different theories simultaneously | One checks race condition, another checks data corruption |
| **Research and investigation** | Multiple angles explored simultaneously | One reads code, another checks git history, another searches docs |
| **Large-scale refactoring** | Each subagent refactors a different module | Split by module boundary, each subagent owns their files |

### When NOT to Use Parallel Subagents

- **Single-file changes** — direct work is faster
- **Tightly coupled changes** — if subagents would need to edit the same files, use sequential work
- **Simple tasks** — coordination overhead isn't worth it for quick tasks
- **Exploratory work** — when you don't know what files will be touched (explore first, then parallelize)

______________________________________________________________________

## Worktree Isolation

**All non-trivial work happens in git worktrees.** This is the default for feature development, bug fixes, and refactoring.

### Worktree-First Protocol

| Skill | Worktree Command |
|-------|-----------------|
| `/create-feature [name]` | `EnterWorktree(name="feature-[name]")` |
| `/fix-bug [issue]` | `EnterWorktree(name="fix-[issue]")` |
| `/refactor [scope]` | `EnterWorktree(name="refactor-[scope]")` |

Each worktree = one branch = one PR. This provides complete isolation from the main working tree.

### Worktrees for Parallel Subagents

When spawning implementation subagents that edit files, use `isolation: "worktree"` to give each subagent its own worktree. This eliminates file ownership conflicts entirely — each subagent works in a separate copy of the codebase.

**Advantages over file-ownership partitioning:**

- No risk of two subagents editing the same file
- Each subagent can run `make check` independently
- Failed subagent work can be discarded without affecting others
- Clean merge at the end via git

**When to use worktrees vs file-ownership:**

| Approach | When | Trade-off |
|----------|------|-----------|
| Worktree isolation | Subagents touch overlapping files or uncertain boundaries | Higher setup cost, clean separation |
| File-ownership partitioning | Clear module boundaries, no file overlap | Lower setup cost, requires strict discipline |

### Worktree Cleanup

After work is complete:

- Merge the worktree branch back to the source branch
- Delete the worktree
- The system prompts for cleanup on session exit

______________________________________________________________________

## How It Works: The Task Tool

Subagents are spawned via the **Task tool** with a `subagent_type` parameter:

```
Task(subagent_type="senior-code-reviewer",
     prompt="<agent definition from .claude/agents/*.md>\n\nReview these files: ...")
```

### Available Subagent Types

| subagent_type | Best For |
|---------------|----------|
| `senior-code-reviewer` | Code review, architecture review, test review, doc review |
| `security-code-auditor` | Security audits, vulnerability analysis |
| `production-code-engineer` | Writing production code, implementing features |
| `code-shell-expert` | Shell scripts, system administration, infrastructure |
| `Explore` | Codebase research, finding files, understanding patterns |
| `Plan` | Designing implementation approaches |

### Agent Definitions

Agent definitions live in `.claude/agents/*.md`. When spawning a subagent, **read the agent definition file and include its content in the task prompt**. This gives the subagent its specialized instructions.

```
# Read the agent definition
agent_def = Read(".claude/agents/code-reviewer.md")

# Spawn with the definition included
Task(subagent_type="senior-code-reviewer",
     prompt=f"{agent_def}\n\nReview these files: {file_list}")
```

### Including Module Context in Prompts

When spawning subagents, include relevant `.context.md` content in the task prompt. This gives subagents accurate module state without needing to explore:

```
# Read module context
context = Read("src/auth/.context.md")

# Include in subagent prompt
Task(subagent_type="production-code-engineer",
     prompt=f"Module context:\n{context}\n\nImplement: ...")
```

### Parallel Execution

To run subagents in parallel, spawn them **in the same response** (multiple Task calls in one message):

```
# These run concurrently:
Task(subagent_type="security-code-auditor", prompt="...")
Task(subagent_type="senior-code-reviewer", prompt="...")
Task(subagent_type="senior-code-reviewer", prompt="...")
```

______________________________________________________________________

## Coordination Patterns

### Pattern 1: Parallel Review (Read-Only)

All subagents read, none write. Zero conflict risk.

```
Lead reads changed files → spawns 4 review subagents in parallel → collects reports → synthesizes
```

### Pattern 2: Module-Parallel Implementation

Each writer subagent owns specific files. No overlap.

```
Lead partitions files → spawns writer subagents in parallel → runs make check → spawns reviewer subagents
```

### Pattern 3: Dependent Phases

Some work depends on other work completing first.

```
Phase 1: Spawn independent writers in parallel → wait for all to complete
Phase 2: Spawn integration subagent (depends on Phase 1 output)
Phase 3: Spawn review subagents (depends on Phase 2)
```

### Pattern 4: Research Swarm

Multiple Explore subagents investigate different angles simultaneously.

```
Lead defines questions → spawns Explore subagents in parallel → synthesizes findings
```

______________________________________________________________________

## Critical Rules

### 1. File Ownership — No Shared Edits

**The #1 source of parallel work failures is two subagents editing the same file.**

Prevention:

- In the Task prompt, explicitly state which files the subagent may edit
- Use directory-level ownership when possible ("You own src/auth/\*, do not edit anything else")
- If a shared file MUST be edited, sequence the tasks — one subagent edits first, then the other
- Config files (package.json, go.mod) should be owned by exactly ONE subagent
- When file boundaries are unclear, use worktree isolation instead

### 2. Context — Subagents Start Fresh

Subagents do NOT inherit the lead's conversation history. They only have:

- Their task prompt
- CLAUDE.md (loaded automatically)
- Full codebase read access

**Always include in task prompts:**

- Relevant `.context.md` content for modules being worked on
- Specific file paths the subagent will work on
- Requirements and constraints
- What "done" looks like
- Key decisions already made

### 3. Adversarial Separation

**The subagent that writes code NEVER reviews it. The subagent that reviews NEVER edits.**

- Use `production-code-engineer` or `code-shell-expert` for writing
- Use `senior-code-reviewer` or `security-code-auditor` for reviewing
- The lead coordinates but does not override reviewer findings without justification

### 4. Verify the Combined Result

Individual subagent success does not guarantee integration success. The lead MUST run `make check` on the combined result after all subagents complete.

### 5. Team Size

- **2-4 subagents** for most tasks (sweet spot)
- **5-8 subagents** for large parallel work with clear module boundaries
- **More than 8** is rarely useful — coordination overhead exceeds parallelism gains

______________________________________________________________________

## Tool Preferences

When choosing tools for subagent work, prefer reliability and low overhead:

### Preference Order

1. **Dedicated tools** — Read, Write, Edit, Glob, Grep (purpose-built, most reliable)
1. **Bash CLI** — git, make, npm, pip, etc. (well-understood, scriptable)
1. **MCP tools** — when dedicated tools or CLI don't cover the use case
1. **WebFetch** — last resort for web content (prefer `/curl` skill when available)

### Token Cost Awareness

Parallel subagents use more API tokens than sequential work:

- Each subagent has its own context (loaded with CLAUDE.md, agent definitions, file contents)
- N subagents = approximately N times the token usage of sequential work
- Include `.context.md` content to reduce exploration tokens

**Use parallel subagents when concurrency provides genuine value** (time savings on independent tasks), not as a default mode.

______________________________________________________________________

## Integration with Orchestrator

When the orchestrator (see `orchestrator.md`) determines that a task benefits from parallel execution:

1. **Planning phase** identifies parallelizable subtasks
1. **Orchestrator spawns subagents** instead of working sequentially
1. **Each subagent runs its own TDD loop** (test → implement → update .context.md → verify)
1. **Lead runs verification on the combined result** (`make check`)
1. **Lead spawns review subagents** on the combined changes
1. **Normal scoring and presentation** continues (see `quality-and-verification.md`)
