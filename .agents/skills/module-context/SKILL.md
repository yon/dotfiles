---
name: module-context
description: Create and maintain concise module context documents that preserve codebase knowledge across sessions. Use when exploring an unfamiliar module, when substantial exploration would be reusable, or when code changes or discoveries make existing module context incomplete or inaccurate.
---

# Module context

Preserve enough verified knowledge for the next session to navigate a module with fewer broad searches and source reads. Load only context relevant to the current task. Use the document to guide exploration; verify consequential claims against current source and tests before relying on them.

## Choose the scope and document

- Work at a meaningful module boundary, such as a package, service, or cohesive subsystem. Do not create a document for every directory.
- Read existing module documentation first. Maintain an equivalent existing document when it serves this purpose; otherwise use `.context.md` in the module directory. This filename is a documentation convention, not an automatically loaded instruction file.
- Keep documents with the code in version control. Link to related module documents when needed instead of copying their contents or loading them all.
- Create missing context when the exploration is substantial enough to benefit future work, or when explicitly requested.

## Read, check, and explore

1. Read the context document before exploring broadly. Identify which claims matter for the current task.
2. Check relevant source changes against the document's reviewed commit. Include the module, its recorded sources outside the module, and applicable shared configuration or dependency changes. Inspect staged, unstaged, and relevant untracked files too. A date alone does not establish freshness.
3. Use changes to identify sections needing review; a changed file does not require regenerating the entire document. If the baseline is missing, unavailable, or from divergent history, verify relevant claims directly. Without Git, use available version history and direct source inspection.
4. Fill gaps through targeted inspection of entry points, public interfaces, callers, dependencies, tests, and relevant history. Use whichever file search, reading, and version-control tools are available. No particular harness, tool name, or delegation facility is required.
5. Distinguish observed behavior from inferred rationale. Mark unresolved uncertainty rather than presenting guesses as architectural decisions. Stop expanding the investigation once the document supports useful navigation within the requested scope.

## Write useful context

Aim for roughly 50–100 lines, allowing more when justified by module complexity. Omit empty or unhelpful sections. Favor durable facts that would otherwise take several searches to rediscover:

- Purpose, responsibilities, and boundaries.
- Entry points and the key paths through the module.
- Important public contracts, invariants, failure behavior, and surprising constraints.
- Significant internal and external dependencies, including sources outside the module that affect its behavior.
- Relevant tests and verified commands for focused validation.
- File paths and symbol names that lead directly to supporting code or documentation.

Avoid exhaustive file or API inventories, copied implementation, session logs, and running changelogs. Keep facts in one place and link to existing detailed documentation. Prefer paths and symbols over brittle line numbers.

Use this compact shape as a starting point, adapting it to the module:

```markdown
# Module: [name]

Reviewed: [date]
Baseline: [commit inspected, or unavailable]
Sources: [module paths and important dependencies outside it]
Coverage: [review scope, uncommitted changes inspected, and any remaining gaps]

## Purpose and boundaries
[Responsibilities and what belongs elsewhere.]

## Entry points and flow
[Key paths, symbols, and how work moves through the module.]

## Contracts and constraints
[Important interfaces, invariants, failure behavior, and surprises.]

## Dependencies
[Significant relationships and links to related context.]

## Validation
[Relevant tests and verified focused commands.]

## Maintenance
Update this document when the module's behavior, interfaces, dependencies, or
invariants change. Verify against source and tests; remove obsolete claims.
```

## Maintain during normal work

- Correct stale claims when discovered. After implementation or refactoring, update affected context as part of the same change.
- Preserve accurate unrelated content. Remove obsolete claims, broken references, and duplication; do not append a history of every edit.
- Record the commit actually inspected and describe any uncommitted changes included in the review. Do not claim that a commit includes work still in the working tree.
- Advance the document's overall baseline only after checking changes across its recorded scope. For a partial review, retain the previous baseline and record the narrower coverage so unchecked sections are not presented as fresh.
- When relevant code and documented facts are unchanged, leave the document unchanged. Do not refresh dates merely because it was read.
- Before finishing, verify changed paths and symbols exist, claims match the inspected implementation and tests, and the document points a future reader to useful next steps. Report any unverified claims or remaining gaps.

## Improve this skill through use

When use reveals a recurring problem in these instructions, propose a focused correction with the observed example. Keep module-specific findings in the module document; revise this shared skill when asked to apply the reusable improvement.

Assess usefulness through real module tasks: did the document lead to the correct implementation and tests with fewer broad searches? Measure token savings only when usage data is available. Do not claim savings from document length alone.
