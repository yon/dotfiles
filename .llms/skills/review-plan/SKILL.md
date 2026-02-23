---
name: review-plan
description: "Review implementation plans before building. Trigger: review plan, validate plan, check plan, plan review"
---

# /review-plan -- Plan Review Before Implementation

## Philosophy

A 30-minute plan review saves hours of implementation rework. Plans encode assumptions -- surfacing wrong assumptions before code is written is the highest-leverage review activity. Architecture mistakes caught in a plan cost minutes to fix. Architecture mistakes caught in code cost days.

---

## Anti-Pattern: Plan-and-Pray

```
WRONG (plan and pray):                 RIGHT (plan review):
1. Write detailed plan                 1. Write detailed plan
2. Implement immediately               2. Spawn reviewers on the plan file
3. Discover flaws during build         3. Reviewers find assumption gaps
4. Rework 60% of code                  4. Fix plan, THEN implement
```

---

## Workflow

### Step 1: Identify Plan

```
/review-plan [file]   --> review specific plan file
/review-plan          --> review most recent plan in working/plans/
```

- [ ] Plan file located
- [ ] Plan file read and understood

### Step 2: Spawn Plan Reviewers

Launch reviewers **in parallel**. Each reviewer reads the plan (not code) and checks a different dimension:

**Architecture Reviewer:**
```
Task(subagent_type="senior-code-reviewer",
     prompt="<content of .claude/agents/architecture-reviewer.md>\n\n
     Review this IMPLEMENTATION PLAN (not code):\n{plan_content}\n\n
     Check:\n
     - Are module boundaries clear and appropriate?\n
     - Are dependencies correctly identified?\n
     - Will this architecture scale for 6-12 months?\n
     - Are there coupling risks between components?\n
     - Are file ownership boundaries clear (important for parallel implementation)?\n
     Return: issues by severity (Critical/Major/Minor)")
```

**Test Reviewer:**
```
Task(subagent_type="senior-code-reviewer",
     prompt="<content of .claude/agents/test-reviewer.md>\n\n
     Review this IMPLEMENTATION PLAN (not code):\n{plan_content}\n\n
     Check:\n
     - Are test cases comprehensive (happy path, errors, edge cases)?\n
     - Is the TDD approach sound (tests before implementation)?\n
     - Are there untestable designs that should be restructured?\n
     - Are acceptance criteria specific and verifiable?\n
     Return: issues by severity (Critical/Major/Minor)")
```

**Security Reviewer** (if plan touches auth, data, or external services):
```
Task(subagent_type="security-code-auditor",
     prompt="<content of .claude/agents/security-reviewer.md>\n\n
     Review this IMPLEMENTATION PLAN (not code):\n{plan_content}\n\n
     Check:\n
     - Are there security-relevant decisions that need attention?\n
     - Is input validation planned at boundaries?\n
     - Are there auth/authz considerations missing?\n
     - Is sensitive data handled appropriately (encryption, logging, storage)?\n
     Return: issues by severity (Critical/Major/Minor)")
```

- [ ] Architecture reviewer spawned
- [ ] Test reviewer spawned
- [ ] Security reviewer spawned (if applicable)
- [ ] All reviewer reports collected

### Step 3: Compile Findings

Merge all reviewer reports into a single assessment:

```markdown
## Plan Review Results

**Plan:** [plan file path]
**Reviewers:** [list of reviewers used]

### Critical Plan Issues (MUST fix before implementation)
[Issues that would cause rework or architectural problems]

### Major Plan Issues (SHOULD fix before implementation)
[Issues that would cause friction but not fundamental problems]

### Minor Plan Issues (NICE to address)
[Suggestions that improve clarity or completeness]

### Reviewer Summaries
- **Architecture:** [one-line summary]
- **Testing:** [one-line summary]
- **Security:** [one-line summary]
```

- [ ] Reports merged
- [ ] Issues categorized by severity
- [ ] Actionable recommendations clear

### Step 4: Gate

Decision tree after review:

```
Critical issues found?
  YES --> Update plan to address critical issues, re-review
  NO  --> Continue

Major issues found?
  YES --> Update plan to address major issues, proceed with awareness
  NO  --> Continue

Minor or no issues?
  --> Plan is ready for implementation
```

- [ ] Gate decision made
- [ ] Plan updated if needed
- [ ] Ready to proceed (or re-review scheduled)

---

## What Reviewers Check in Plans (vs Code)

Plan review is different from code review. Reviewers focus on:

| Dimension | Plan Review Checks | Code Review Checks |
|-----------|-------------------|-------------------|
| Architecture | Module boundaries, coupling, scalability | Implementation of boundaries, dependency direction |
| Testing | Test strategy, coverage plan, testability | Test quality, assertions, edge cases |
| Security | Threat model, auth design, data flow | Input validation, injection, secrets |
| Feasibility | Can this be built as described? | Is this built correctly? |
| Completeness | Are all cases covered in the plan? | Are all cases handled in the code? |

---

## Rules

- Always review plans for features that touch more than 3 files
- Plan reviewers are read-only -- they report findings, they never modify the plan
- Critical plan issues block implementation -- do not proceed until resolved
- A plan that passes review still needs code review after implementation
- The plan review is fast (minutes) compared to implementation rework (hours)
