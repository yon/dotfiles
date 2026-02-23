---
name: team-implement
description: "Parallel subagent implementation with adversarial review. Trigger: team implement, parallel build, multi-agent build, parallel implementation"
---

# /team-implement — Parallel Subagent Implementation

Spawn parallel implementation subagents to build a feature, followed by adversarial review via separate subagents. Each implementer owns specific files and runs their own TDD cycle.

**Requires an approved plan.** If no plan exists, enter plan mode first.

---

## When to Use

- Feature spans **3+ independent modules** (API + service + repository, frontend + backend + tests)
- Task can be **partitioned by file ownership** with no shared-file conflicts
- The plan clearly identifies **which files belong to which subtask**

## When NOT to Use

- Tasks with tight coupling between subtasks
- When file ownership can't be cleanly separated
- Small features (1-2 files) — sequential is faster
- When you're unsure what files will be touched (explore first)

---

## Steps

### Phase 1: Partition (Lead)

1. **Read the approved plan** — identify subtasks and file ownership
2. **Validate partitioning:**
   - No file appears in two subagent assignments
   - Config files (package.json, Cargo.toml, pyproject.toml, etc.) are owned by exactly ONE subagent
   - Test files are co-owned with their corresponding source files
3. **Identify dependencies** between subtasks

### Phase 2: Spawn Implementation Subagents

Spawn parallel Task calls, one per module. Each gets explicit file ownership and TDD instructions.

```
Task(subagent_type="production-code-engineer",
     prompt="You are implementing Module X as part of a larger feature.\n\n
     ## Your Assignment\n
     Files you OWN (only edit these): src/module_x/*, tests/unit/test_module_x.*\n
     Files you may READ: [shared types, interfaces]\n\n
     ## Requirements\n
     [acceptance criteria for module X]\n\n
     ## TDD Workflow (MANDATORY)\n
     1. Write failing tests FIRST\n
     2. Implement minimum code to pass\n
     3. Refactor while keeping tests green\n
     4. Run tests: [test command for this module]\n\n
     ## Constraints\n
     - Do NOT edit files outside your assignment\n
     - Follow the project's code conventions\n
     - Return a summary of what you built and test results")

Task(subagent_type="production-code-engineer",
     prompt="You are implementing Module Y...[same pattern]")

Task(subagent_type="production-code-engineer",
     prompt="You are implementing integration wiring...\n
     Dependencies: Module X and Module Y must be complete first.\n
     Files you OWN: src/main.*, tests/integration/*\n...")
```

**Note:** If subtasks have dependencies (e.g., integration depends on modules), run the independent tasks first, wait for results, then spawn dependent tasks.

### Phase 3: Integration (Lead)

After all implementers complete:

1. **Run `make check`** on the combined result
2. If integration fails:
   - Identify which subagent's code caused the failure
   - Spawn a fix subagent with the error context and the relevant files
   - Re-run `make check` after fix
3. If integration passes: proceed to review

### Phase 4: Adversarial Review

**The review subagents MUST use different agent definitions than the implementation subagents.**

Spawn review subagents (via `/team-review` pattern):
```
Task(subagent_type="senior-code-reviewer",
     prompt="<.claude/agents/code-reviewer.md>\n\nReview: {all changed files}")

Task(subagent_type="security-code-auditor",
     prompt="<.claude/agents/security-reviewer.md>\n\nAudit: {all changed files}")

Task(subagent_type="senior-code-reviewer",
     prompt="<.claude/agents/test-reviewer.md>\n\nReview tests: {test files}")
```

### Phase 5: Fix Loop

For each finding (Critical → Major):
1. Spawn a fix subagent targeting the specific file with the finding
2. Run `make check` after fix
3. Repeat (max 3 rounds)

### Phase 6: Delivery

1. **Final `make check`** — must pass
2. **Score** — apply quality-gates rubric
3. **Present summary:**

```markdown
## Team Implementation Summary

**Task:** [from plan]
**Quality Score:** [N]/100

### Subagent Assignments
| Subagent | Role | Files Owned | Status |
|----------|------|-------------|--------|
| 1 | Implementer (Module X) | src/module_x/* | Complete |
| 2 | Implementer (Module Y) | src/module_y/* | Complete |
| 3 | Integration | src/main.*, tests/int/* | Complete |
| 4 | Code Reviewer (read-only) | — | Reviewed |
| 5 | Security Reviewer (read-only) | — | Reviewed |

### Adversarial Review
- Review rounds: [N]
- Issues found: [N critical, N major, N minor]
- Issues fixed: [N]

### Verification
- make check: PASS
- Quality score: [N]/100
```

---

## The Iron Rules

1. **Implementers NEVER review their own code** — different subagent types for review
2. **Reviewers NEVER edit code** — they report, fix subagents fix
3. **No shared file edits** — one owner per file, always
4. **Every implementer runs TDD** — tests first, then implementation
5. **Lead verifies the combined result** — individual success isn't enough
