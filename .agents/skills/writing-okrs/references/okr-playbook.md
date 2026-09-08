# OKR playbook

Use this reference for methodology questions, contested metrics, and grading. The source notes describe particular approaches. The practical guidance is this skill's recommendation, not a universal OKR standard. Sources checked on 2026-09-08.

## Source notes

- **Google:** Prefer results with visible value and credible completion evidence. Its completeness test asks whether all KRs could succeed while the objective fails. Cross-team goals need explicit participating-team commitments. Google distinguishes a committed target of 1.0 from an aspirational expected average of 0.7 with variance. Its examples include service SLA commitments and infrastructure delivery, so its warning about business-as-usual does not prohibit every maintenance or milestone goal. These are Google's conventions, not mandatory rules for every organization. [Google's OKR Playbook](https://www.whatmatters.com/resources/google-okr-playbook).
- **Committed versus aspirational:** What Matters recommends declaring the type when setting the goal and responding to a threatened commitment through escalation and resource or priority decisions. A stretch goal has a different expectation. [Committed and Aspirational OKRs](https://www.whatmatters.com/okrs-explained/committed-and-aspirational-okrs).
- **Learning:** What Matters recognizes learning goals when a team lacks enough knowledge to choose a useful growth target. Experiments may produce unexpected or negative findings. Its examples include research activities; this skill adds stricter evidence and decision criteria to avoid rewarding activity alone. [What Is a Learning OKR?](https://www.whatmatters.com/faqs/learning-okr).
- **Team context:** SVPG connects product-team objectives to empowerment, cross-functional collaboration, and active leadership. Giving teams outcomes while prescribing every solution undermines that approach. This is product-organization guidance, not a ban on individual goals in other settings. [Team Objectives: Overview](https://www.svpg.com/team-objectives-overview/).
- **Accountability:** SVPG relates expectations to ambition and recommends examining causes, early escalation, and lessons when teams miss important commitments. [Team Objectives: Accountability](https://www.svpg.com/team-objectives-accountability/).

## Practical guidance: choose the result that matters

An objective describes a valuable end state. KRs define the evidence that would establish success. Initiatives describe the work proposed to produce it. Keep those distinctions visible without forcing every goal into the same wording.

| Situation                 | Useful success criterion                                                          | Common mistake                                       |
| ------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Improvement               | A defined customer or operational result changes by a deadline                    | Counting features without checking their effect      |
| Learning                  | Evidence resolves a stated uncertainty and supports a decision                    | Counting interviews or requiring a favorable finding |
| Necessary milestone       | An accepted capability meets explicit usability, quality, and completion criteria | Calling a launch proof of later adoption             |
| Maintenance or resilience | A material service or risk commitment holds throughout a defined period           | Listing every routine responsibility as a priority   |

Use a milestone when it represents a valuable commitment or prerequisite. Explain its limits as evidence of the broader outcome. Use a maintenance goal when protecting the condition deserves explicit attention, such as during rapid growth or a risky transition. Routine health measures can remain outside the priority OKRs.

Apply the completeness test to the whole set: imagine every KR passes and look for a plausible failure of the objective. Add the missing outcome, quality condition, or sustained effect. Do not add redundant KRs just to reach a preferred count. A leading indicator is a hypothesis about future impact; verify that connection instead of declaring it causal.

## Practical guidance: ownership and influence

- **Owned measure:** the team can directly change the process or capability, such as onboarding reliability or provisioning time. Describe the actual boundary; even owned measures can face outside constraints.
- **Influenced outcome:** customers or other teams must act, such as adopting a tool or renewing a subscription. Keep it when it captures the value sought, but name the dependency and the team's levers.
- **Shared outcome:** several teams jointly own the result. Name the coordinating owner, participating teams, each commitment, and how dependencies will be resolved.

For example, a platform team can own setup reliability and documentation quality while influencing sustained product-team adoption. Pair those measures or agree a shared adoption objective. Do not claim that attendance, training completion, or provisioning alone establishes adoption. Track whose work changed and whether it produced the intended benefit.

## Practical guidance: ratios and guardrails

Ratios can be useful: conversion rate, failure rate, and cost per successful transaction each answer a real question. Define both components, eligibility, exclusions, observation window, and minimum usable sample. Inspect the underlying counts and relevant cohorts. State how zero denominators and changes in population will be handled.

An illustrative failure: with 10 people, 100 PRs, and $10,000 of cost, PRs/person is 10 and cost/PR is $100. Splitting the same work into 200 PRs changes them to 20 and $50 without creating more value. Both measures improve from the same manipulation. Cost/PR is not an independent protector against inflated PR counts.

A better efficiency example measures cost per successfully completed customer task, while separately constraining task failure rate and tail latency. Define the task and success criteria, watch workload mix and underlying volumes, and investigate whether teams can exclude difficult cases. These guards cover specific harms; no metric pair prevents every form of gaming.

Keep a critical guardrail independently visible and enforce its threshold. An average or composite score must not conceal a breached condition. If throughput rose but the agreed reliability floor failed, report both facts and the unmet condition.

## Practical guidance: honest baselines and targets

For each KR record the metric definition, population, data source, observation window, accountable owner, deadline, and acceptance or grading rule. Include baseline and target when they are needed to interpret change.

- **Known baseline:** preserve its date and measurement method. Distinguish a relative improvement from percentage points.
- **Missing baseline:** mark it unknown, assign measurement ownership and a date, and label provisional targets. Do not invent zero or present a suggested number as agreed. If measurement itself resolves important uncertainty, it can support a learning goal with explicit evidence criteria.
- **Threshold or maintenance goal:** use a bounded requirement and observation period. A fabricated starting value adds no information.
- **Learning or milestone goal:** define evidence quality, acceptance conditions, and who makes the resulting decision. A count alone is usually insufficient.

When proposing numbers, explain the basis: historical variation, user need, service commitment, capacity, experiment, or explicit stretch judgment. If that basis is unavailable, present the number as a proposal requiring validation.

## Practical guidance: scoring and review

Agree grading before execution. Preserve the organization's scale and ambition labels when provided. Separate numerical progress, forecast confidence, and whether the commitment was met. Do not reclassify a missed commitment as aspirational after the fact.

For a linear increase from baseline B to target T, progress can be `(actual - B) / (T - B)`; for a reduction use `(B - actual) / (B - T)`. Use this only when the target differs from baseline and linear progress has meaning. Agree how to report regression and overachievement. Show actual values alongside any capped score. `actual / target` is not generally a valid change score when baseline is nonzero.

Binary milestones need acceptance evidence. Maintenance goals need evidence across their specified window. Learning goals need the promised quality of evidence and decision, including a useful negative finding. Do not interpolate those into arbitrary percentages or apply 0.7 as a universal success threshold.

Review often enough to change course, using the team's existing cadence where possible. Raise threatened commitments while options remain. Record agreed revisions with their rationale and date so the original promise stays visible. At the end, report results, unmet conditions, causal uncertainty, and useful lessons. Respect requests for either a complete batch review or an interactive KR-by-KR discussion.
