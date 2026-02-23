---
name: review
description: "Multi-agent code review with quality scoring. Trigger: review, code review, check quality, review code, review changes"
---

# /review -- Multi-Agent Code Review

## Philosophy

Code review catches what tests miss -- architectural drift, security gaps, readability problems, and design violations. Multiple specialized reviewers find more issues than one generalist because each reviewer brings deep focus to a single dimension. Reviews are read-only operations: reviewers report findings, they never edit code. The combination of independent perspectives produces a thorough, unbiased assessment.

---

## Anti-Pattern: Rubber-Stamp Review

```
WRONG (rubber stamp):                  RIGHT (multi-dimensional):
1. Glance at diff                      1. Read changed files fully
2. "Looks good to me"                  2. Spawn specialized reviewers in parallel
3. Merge                               3. Each reviewer focuses on one dimension
                                       4. Synthesize findings by severity
                                       5. Score against quality gates
```

---

## Workflow

### Step 1: Determine Scope

```
/review              --> all uncommitted changes (git diff)
/review [file|dir]   --> specific files or directory
/review --staged     --> staged changes only
/review --plan [file]--> review a plan file (delegates to /review-plan)
```

- [ ] Scope identified
- [ ] Files exist and are readable

### Step 2: Identify Changes

- Read all files in scope
- Categorize each changed file:

| Category | Examples |
|----------|---------|
| Application logic | Business rules, domain models, services |
| API | Endpoints, request/response schemas, middleware |
| Data layer | Queries, migrations, repository implementations |
| Config | Environment, build, deployment configuration |
| Tests | Unit, integration, e2e test files |
| Infrastructure | Docker, CI/CD, scripts |

- [ ] All files read
- [ ] Changes categorized

### Step 3: Select and Launch Reviewers

Based on change categories, read agent definitions from `~/.llms/agents/` and spawn reviewers **in parallel**:

| Agent File | subagent_type | When to Spawn |
|------------|---------------|---------------|
| `code-reviewer.md` | `general-purpose` | Always |
| `test-reviewer.md` | `general-purpose` | Always |
| `security-reviewer.md` | `general-purpose` | Auth, input handling, config, deps |
| `architecture-reviewer.md` | `general-purpose` | New modules, boundary changes |
| `performance-reviewer.md` | `general-purpose` | Data access, algorithms, hot paths |
| `doc-reviewer.md` | `general-purpose` | Public APIs, README changes |

**For plan review** (`/review --plan`):

| Agent File | subagent_type | When to Spawn |
|------------|---------------|---------------|
| `architecture-reviewer.md` | `general-purpose` | Always for plans |
| `test-reviewer.md` | `general-purpose` | Always for plans |
| `security-reviewer.md` | `general-purpose` | If plan touches auth/data |

**Spawning pattern** -- all selected reviewers in the same response:

```python
# Read agent definitions from ~/.llms/agents/
code_reviewer_def = Read("~/.llms/agents/code-reviewer.md")
test_reviewer_def = Read("~/.llms/agents/test-reviewer.md")
security_reviewer_def = Read("~/.llms/agents/security-reviewer.md")

# Spawn with agent definitions as prompts
Task(subagent_type="general-purpose",
     prompt=f"{code_reviewer_def}\n\nReview these files: {changed_files}")

Task(subagent_type="general-purpose",
     prompt=f"{test_reviewer_def}\n\nReview test coverage for: {test_files}")

Task(subagent_type="general-purpose",
     prompt=f"{security_reviewer_def}\n\nAudit: {changed_files}")
```

- [ ] Agent definitions read
- [ ] Reviewers spawned in parallel
- [ ] All reviewer reports collected

### Step 4: Run Verification

Run `make check` (build + test + lint + typecheck) to confirm the codebase is healthy independent of reviewer opinions.

- [ ] `make check` executed
- [ ] Results captured

### Step 5: Compile Results

Merge all agent reports into a single summary:

```markdown
## Combined Code Review

**Files Reviewed:** [list]
**Review Agents Used:** [list]
**Overall Quality:** [Excellent / Good / Needs Work / Significant Issues]
**Quality Score:** [N]/100

### Critical Issues (block commit)
[Merged from all agents, deduplicated]

### Major Issues (block PR)
[Merged from all agents, deduplicated]

### Minor Issues (polish)
[Merged from all agents, deduplicated]

### Verification
| Check | Status |
|-------|--------|
| Build | PASS/FAIL |
| Tests | PASS/FAIL |
| Lint  | PASS/FAIL |

### Agent Summaries
- **Code Review:** [one-line summary]
- **Test Review:** [one-line summary]
- **Security:** [one-line summary]
- **Architecture:** [one-line summary]
- **Performance:** [one-line summary]
- **Documentation:** [one-line summary]

### Recommended Actions
1. [Highest priority action]
2. [Next priority]
```

- [ ] Reports merged and deduplicated
- [ ] Issues grouped by severity
- [ ] Recommended actions prioritized

### Step 6: Score

Apply the quality-gates rubric to compute a score:

| Score | Gate Status |
|-------|-------------|
| >= 95 | Release quality |
| >= 90 | Ready for PR |
| >= 80 | Ready to commit |
| < 80  | Needs work before commit |

---

## Rules

- Reviewers are **read-only** -- they report findings, they never edit files
- Always spawn independent reviewers **in parallel** for speed
- Deduplicate findings when multiple agents flag the same issue
- Critical issues from ANY agent block the commit regardless of overall score
- The code-reviewer and test-reviewer agents are always included; others are conditional
- When reviewing a plan (`--plan`), focus on architecture, testability, and security -- not code style
