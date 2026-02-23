---
name: swarm
description: "General-purpose parallel subagent orchestration. Trigger: swarm, parallel, spawn agents, multi-agent, concurrent"
---

# /swarm — General-Purpose Parallel Subagent Orchestration

Flexibly spawn and manage parallel subagents for any task that benefits from concurrent execution. This is the low-level orchestration skill — use `/team-review` or `/team-implement` for those specific workflows.

---

## When to Use

- Custom subagent compositions not covered by `/team-review` or `/team-implement`
- Research/investigation tasks (multiple angles explored simultaneously)
- Competing hypothesis debugging
- Large-scale migrations or refactoring across many modules
- Any task where you want full control over parallel execution

---

## Steps

### 1. Define the Task

- `/swarm [description]` — describe what you need, lead designs the subagent team
- `/swarm research [question]` — spawn a research swarm
- `/swarm debug [issue]` — spawn competing hypothesis debuggers
- `/swarm migrate [scope]` — spawn parallel migration workers

### 2. Plan the Subagent Team (Lead)

Before spawning, the lead MUST:

1. **Define each subagent's role** — what they do, what they don't do
2. **Assign file ownership** — explicit, no overlaps for writers; unlimited for readers
3. **Model dependencies** — which tasks depend on which (spawn dependent ones after independent ones complete)
4. **Enforce adversarial separation** — if any subagent writes code, a DIFFERENT subagent must review it
5. **Set completion criteria** — what "done" looks like for each subagent

Present the plan to the user:

```markdown
## Swarm Plan

**Objective:** [what the swarm will accomplish]
**Subagents:** [N]
**Estimated scope:** [files/modules affected]

### Subagents
| # | Role | Type | subagent_type | Files Owned | Depends On |
|---|------|------|---------------|-------------|------------|
| 1 | [role] | Writer | production-code-engineer | [files] | — |
| 2 | [role] | Writer | code-shell-expert | [files] | — |
| 3 | [role] | Reader (critic) | senior-code-reviewer | — | 1, 2 |

### Adversarial Checks
- Writers: [list]
- Reviewers: [list] (MUST be disjoint from writers)
```

### 3. Get Approval

Wait for user approval before spawning. (Skip if "just do it" mode is active.)

### 4. Spawn Subagents

Use the Task tool with appropriate `subagent_type` values. Spawn independent subagents in the SAME response for parallel execution.

**Available subagent types:**
| subagent_type | Best For |
|---------------|----------|
| `senior-code-reviewer` | Code review, architecture review, test review |
| `security-code-auditor` | Security audits, vulnerability analysis |
| `production-code-engineer` | Writing production code, implementing features |
| `code-shell-expert` | Shell scripts, system administration, infra code |
| `Explore` | Codebase research, finding files, understanding patterns |
| `Plan` | Designing implementation approaches |

```
# Example: Research swarm (all read-only, spawn all at once)
Task(subagent_type="Explore",
     prompt="Trace the data flow from API endpoints to database for /users. Report the full path.")

Task(subagent_type="Explore",
     prompt="Find all places where UserSession is created or modified. List files and line numbers.")

Task(subagent_type="Explore",
     prompt="Check git history for recent changes to the auth module. Summarize what changed and why.")
```

### 5. Collect and Verify

After all subagents complete:
1. **Collect results** — gather reports/summaries from all subagents
2. **Integration verify** — `make check` on combined result (if code was written)
3. **Adversarial review** — if any code was written, spawn review subagents
4. **Score** — apply quality-gates rubric

### 6. Present Results

```markdown
## Swarm Summary

**Objective:** [what was accomplished]
**Subagents:** [N], [N] rounds of adversarial review
**Quality Score:** [N]/100

### Subagent Results
| # | Role | Status | Key Output |
|---|------|--------|------------|
| 1 | [role] | Complete | [1-line summary] |
| 2 | [role] | Complete | [1-line summary] |
| 3 | [role] | Complete | [1-line summary] |

### Files Modified
- [list with ownership attribution]

### Verification
- make check: PASS/FAIL
- Quality score: [N]/100

### Findings / Deliverables
[Main output — research findings, implemented features, migration report, etc.]
```

---

## Preset Swarm Templates

### Research Swarm
```
/swarm research "How does the auth system work?"

Spawn 3-4 Explore subagents in parallel (all read-only):
  1: Trace code flow from API endpoints
  2: Read tests to understand expected behavior
  3: Search for configuration and docs
  4: Check git history for recent changes

Zero conflict risk. Maximum parallel exploration.
```

### Debug Swarm
```
/swarm debug "Login fails intermittently"

Spawn 3-4 Explore subagents in parallel (all read-only):
  1: Check for race conditions in session handling
  2: Analyze database query patterns for timeouts
  3: Review recent changes to auth module via git blame
  4: Search for related error patterns

Each forms a hypothesis → lead synthesizes findings.
```

### Migration Swarm
```
/swarm migrate "Update all API handlers to new error format"

Phase 1 — Spawn writers in parallel (one per module):
  Task(subagent_type="production-code-engineer", prompt="Migrate src/handlers/auth/*...")
  Task(subagent_type="production-code-engineer", prompt="Migrate src/handlers/users/*...")
  Task(subagent_type="production-code-engineer", prompt="Migrate src/handlers/payments/*...")

Phase 2 — After writers finish, spawn reviewer:
  Task(subagent_type="senior-code-reviewer", prompt="Review all migrated files...")

Clear file ownership. Critic reviews AFTER all writers finish.
```

---

## Rules

1. **Always plan before spawning** — subagent structure must be explicit
2. **Always enforce adversarial separation** — writers != reviewers
3. **Always verify the combined result** — individual success != integrated success
4. **Prefer smaller teams** — 2-4 subagents is the sweet spot; only go larger with clear justification
5. **Spawn independent subagents in the same response** — this enables true parallel execution
