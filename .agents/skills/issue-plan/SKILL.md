---
name: issue-plan
description: Investigate and draft or file a single GitHub issue for later implementation, including bugs, features, chores, and scoped investigations. Use when asked to capture work as an issue. Use epic-plan for work that needs multiple dependent issues; do not replace requested implementation with issue filing.
---

# Issue plan

Capture one coherent unit of work so a later implementer can understand the problem, intended outcome, evidence, and remaining decisions without the current conversation. Use the repository's issue conventions and available tools; no particular harness or plugin is required.

## Establish scope and authorization

- Identify the repository, requested outcome, and whether the user wants a draft or a filed issue. An explicit request to file or create an issue authorizes that action; do not ask again. A draft-only request does not authorize publication.
- Size the issue to a useful reviewable change or bounded investigation. For multiple independently delivered changes with dependencies, use epic-plan when available or propose the decomposition directly. Do not create unrelated follow-up issues automatically.
- Search existing open and closed issues for the same behavior and inspect likely matches before creating a new issue. A matching title alone does not establish duplication. If a duplicate exists, return its reference; update or comment only when the request or established workflow authorizes that action. State when search is unavailable or incomplete.

## Investigate and separate evidence from intent

Read relevant code, tests, contracts, documentation, and history. Verify important paths and symbols. Investigate enough to make the issue useful, while avoiding an unbounded debugging project.

Keep these categories distinct:

- **Observed:** what a user report, log, query, test, or executed reproduction actually shows. Attribute the source, time or revision when known, command/input, result, and relevant environment. Reproduce locally when feasible and authorized; mark reports and unexecuted repro steps as such.
- **Intended:** behavior established by requirements, a documented contract, an authoritative example, or an explicit user decision. Cite that basis. Existing buggy output cannot establish the expected result after a fix. Derive expected values from the intended contract and show the reasoning where useful.
- **Diagnosis:** a confirmed causal explanation with evidence, or clearly labeled hypotheses with discriminating next checks. A credible reported symptom can justify an issue even when reproduction or root cause is still unresolved.
- **Decisions:** consequential ambiguity about product behavior, public interfaces, compatibility, or ownership. Ask for missing information when necessary, or capture a bounded investigation with explicit unresolved decisions. Do not invent answers. Leave routine implementation choices to the executor within stated constraints.

When debugging, reproduce the symptom where possible, compare relevant working and failing cases, and test one causal hypothesis at a time. Distinguish unavailable evidence from negative results. Report a blocked reproduction honestly instead of fabricating output or refusing to record a useful investigation.

## Write the issue

Scale detail to the work and the repository template. Lead with the concrete problem and desired result. Include only sections useful to the issue:

| Type | Useful content |
| --- | --- |
| Bug | Reported or observed symptom; executed repro when available; intended behavior and its basis; verified cause or hypotheses; affected boundaries; regression criteria |
| Feature | User outcome; relevant interfaces, data contracts, and compatibility constraints; existing code to reuse; acceptance criteria |
| Chore | Current and desired state; affected configuration or workflow; verification; recovery considerations when relevant |
| Investigation | Evidence so far; open question; competing explanations; concrete next checks; deliverable that resolves or narrows uncertainty |

Include in-scope work, relevant exclusions, known dependencies, and verification. Use paths and symbols as durable anchors; add line numbers and the inspected revision when available, and tell the executor to recheck anchors against current code. Do not invent revision identifiers or stamp an unrelated branch as the reviewed baseline.

Suggested fix steps should explain known constraints and boundaries, not prescribe an unverified design. Reconcile relevant existing helpers or partial implementations before proposing new ones. Name ownership of exclusions when known; label unknown ownership instead of inventing an assignee.

## Acceptance criteria and durable fixtures

- Use numbered criteria with observable results. Given/when/then is useful when it makes the scenario concrete. Cover relevant boundaries, errors, and compatibility as well as the main outcome.
- A bug's regression criteria assert intended behavior, not the current defect. Investigation criteria require evidence and a decision or narrowed explanation, not a predetermined root cause or a promised fix.
- Include minimal synthetic or sanitized fixtures sufficient to reproduce the issue. Preserve the structural details that cause the behavior; label substitutions. Do not paste credentials, private email bodies, or full database records merely for completeness.
- When a necessary source cannot be embedded safely, give an appropriate durable reference, access requirements, and a minimal substitute where possible. Explain what the substitute cannot establish.
- Make replay meaningful: note deduplication, idempotency, expired state, or one-time inputs that could make a rerun silently do nothing. Prefer fresh isolated fixture state and explicit setup/cleanup; do not prescribe clearing live guards or resetting production data without authorization.
- Keep verification executable in the intended environment using documented commands, preferably existing Make targets. Distinguish commands already run from proposed checks for the future implementation.

## Review, file, and verify

Check that observed results match the evidence, expected results match the contract, uncertainty is visible, and the scope and criteria agree. For complex evidence chains, a separate skeptical review can help when supported and authorized; it is not a required named agent.

Prepare a complete reviewable body before publishing. For draft-only work, return the draft. When filing is authorized, use the available GitHub interface and supported repository conventions. Check supported issue types, labels, and relationships instead of assuming a particular CLI flag, schema, or required field exists. Use structured body arguments or a body file to preserve Markdown and avoid shell interpolation.

After a successful write, verify the resulting issue's body and relevant metadata and return its URL. On ambiguous failure, inspect remote state before retrying to avoid duplicate creation. If publication is blocked, preserve the completed draft and state the exact remaining action without claiming it was filed.

## Done when

The issue or draft gives a later implementer enough verified context to begin the scoped work, distinguishes facts from hypotheses and decisions, and explains how success will be checked. Remaining discovery is explicit. Report whether the outcome was drafted, filed, or matched to an existing issue.
