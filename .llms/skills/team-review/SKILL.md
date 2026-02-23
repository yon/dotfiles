---
name: team-review
description: "Parallel multi-agent code review from multiple angles. Trigger: team review, parallel review, multi-reviewer, thorough review"
---

# /team-review — Parallel Subagent Code Review

Spawn parallel review subagents that examine the codebase simultaneously from different angles. Each reviewer runs in its own context via the Task tool.

**This is a read-only operation.** No reviewer edits files. The lead synthesizes all findings.

---

## When to Use (vs. /review)

| Use `/review` when... | Use `/team-review` when... |
|----------------------|--------------------------|
| Reviewing a small change (< 5 files) | Reviewing a large change (10+ files) |
| Quick feedback is needed | Thorough, multi-dimensional analysis is needed |
| Token budget is a concern | Quality and depth matter more than cost |
| Changes are in a single module | Changes span multiple modules/layers |

---

## Steps

### 1. Determine Scope
- `/team-review` → all uncommitted changes
- `/team-review [file, dir, or commit range]` → specific scope
- `/team-review --staged` → staged changes only

### 2. Analyze the Change Set
Read all changed files. Categorize the nature of changes to determine which reviewers to spawn.

### 3. Spawn Review Subagents

Read the agent definition files from `.claude/agents/` and spawn parallel Task tool calls. **All reviewers are read-only — they produce reports, never edit files.**

#### Standard Team (most changes) — spawn ALL in the same response:
```
Task(subagent_type="security-code-auditor",
     prompt="<content of .claude/agents/security-reviewer.md>\n\n
     Review these files for security issues: {changed_files}\n
     Focus: OWASP top 10, input validation, secrets, auth\n
     Return a structured report with severity ratings.")

Task(subagent_type="senior-code-reviewer",
     prompt="<content of .claude/agents/code-reviewer.md>\n\n
     Review these files: {changed_files}\n
     Focus: correctness, readability, DRY/KISS/SOLID, anti-patterns\n
     Return a structured report with severity ratings.")

Task(subagent_type="senior-code-reviewer",
     prompt="<content of .claude/agents/test-reviewer.md>\n\n
     Review these test files: {changed_test_files}\n
     And their corresponding source files: {changed_source_files}\n
     Focus: TDD compliance, coverage gaps, test quality, test smells\n
     Return a structured report with severity ratings.")

Task(subagent_type="senior-code-reviewer",
     prompt="<content of .claude/agents/architecture-reviewer.md>\n\n
     Review these files: {changed_files}\n
     Focus: module boundaries, coupling, SOLID at system level\n
     Return a structured report with severity ratings.")
```

#### Extended Team (for large/critical changes, add):
```
Task(subagent_type="senior-code-reviewer",
     prompt="<content of .claude/agents/performance-reviewer.md>\n\n...")

Task(subagent_type="senior-code-reviewer",
     prompt="<content of .claude/agents/doc-reviewer.md>\n\n...")
```

### 4. Collect Results

All Task calls return their reports. Collect all outputs.

### 5. Synthesize

Merge all reports into a single review:

```markdown
## Team Code Review

**Scope:** [what was reviewed]
**Reviewers:** [N] subagents
**Overall Assessment:** [Excellent / Good / Needs Work / Significant Issues]
**Quality Score:** [N]/100

### Critical Issues (must fix before commit)
[Merged from all reviewers, deduplicated, attributed to source reviewer]
- **[reviewer]** [file:line] — [issue]

### Major Issues (should fix before PR)
[Same format]

### Minor Issues (polish)
[Same format]

### Reviewer Summaries
| Reviewer | Assessment | Critical | Major | Minor |
|----------|-----------|----------|-------|-------|
| Code | [status] | [N] | [N] | [N] |
| Security | [status] | [N] | [N] | [N] |
| Test | [status] | [N] | [N] | [N] |
| Architecture | [status] | [N] | [N] | [N] |

### Recommended Actions (priority order)
1. [Most critical fix]
2. [Next priority]
```

---

## Adversarial Guarantee

This skill enforces **complete separation of review and implementation**:
- Review subagents are spawned as **read-only** — they cannot edit files
- If the reviewed code was written by subagents, the review subagents MUST use different agent definitions
- The lead does NOT review — it only synthesizes
- Findings are reported with severity; the lead does not downgrade severity without justification
