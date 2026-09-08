---
name: writing-okrs
description: Draft, critique, and improve objectives and key results, including metric quality, ownership, targets, guardrails, and scoring. Use for OKR planning or reviewing whether a goal measures meaningful progress; distinguish owned measures from influenced or shared outcomes.
---

# Writing OKRs

Make objectives clear and key results useful evidence of progress. Preserve the user's intended
outcome; expose tradeoffs and measurement gaps rather than substituting an easier metric. Use the
team's actual planning and scoring conventions.

## Work with the requested scope

Read the supplied objectives, team responsibilities, time horizon, existing measures, and
constraints. For revisions, present each KR's **current wording, proposed wording, why, and
consequential judgment calls**. Preserve existing wording accurately when quoting it.

Use a KR-by-KR presentation by default, with a short view of the whole set. If the user requests a
complete review, rewrite, or batch draft, handle the whole requested set in that response. If they
request an interactive walkthrough, take one KR at a time. Do not impose confirmation pauses between
every KR or turn a request for a draft into an interview. Draft what the available evidence
supports, label provisional choices, and ask only for missing decisions that materially affect the
result.

Editing a document or tracker follows existing task authorization. Before a write, reread the target
item and relevant layout; use stable IDs when available, otherwise verify its identity and position.
Preserve unrelated fields, update the intended item, and read it back. A stale row number is not
identity. Do not write an external tracker merely because a review was requested.

## Test the result and the ownership

**Value.** Explain the change the objective should create and who benefits. For each KR, distinguish
outcome, leading indicator, output/milestone, and activity. Prefer direct evidence of value or
reduced risk when measurable. Move implementation tasks to initiatives when they do not establish
success. Verb lists are clues, not verdicts: a migration can remove a defined operational risk,
while a renamed activity can remain an activity.

**Accountability.** Identify the team's concrete intervention and relevant dependencies:

- **Owned measure:** largely determined by the team's systems or decisions, with external
  assumptions explicit.
- **Influenced outcome:** depends on users or other teams too; state the team's contribution and
  dependency rather than claiming complete control.
- **Shared outcome:** name the accountable partners, their commitments, and how progress will be
  reviewed together. Proposed owners are not confirmed commitments.

Do not automatically reject an important outcome because control is incomplete. Pair it with
actionable evidence of the team's contribution or use agreed shared accountability. Adoption is
influenced by other teams' choices; it is not wholly owned just because the platform team built the
tool. Define sustained, meaningful adoption and connect it to value rather than counting signups or
installations alone.

**Completeness.** Review the KRs together against the objective: could they all pass while the
intended benefit fails? Add missing outcome or risk evidence where needed. Avoid several KRs that
reward the same behavior while leaving quality, access, reliability, or customer value unmeasured.
One primary outcome plus useful drivers can work; it is not a required structure for every
objective. Proxies support a judgment about success, not a mathematical guarantee of the objective
or a causal claim.

## Make each measure interpretable

For a proposed KR, specify or flag the metric definition, eligible population/denominator,
observation period, deadline, evidence source, accountable owner, and success threshold. Include a
baseline where it is needed to interpret an improvement. Put supporting detail in notes when the KR
sentence would become unwieldy.

Never invent observed baselines, feasible targets, owners' agreements, or data availability. When
data is missing, label the baseline unknown and any proposed target provisional; give a bounded
measurement/decision step and date for finalizing it. A missing baseline is not zero. A percentage
without a defined eligible population or a stable measurement window is not ready to grade.

Match the form to the job:

- **Improvement:** change a defined measure from an observed baseline to a justified target.
- **Threshold or maintenance:** achieve or preserve a meaningful service/quality bound over a
  defined window. No artificial delta is required. Routine operations often belong in health
  metrics, but a strategically important reliability or risk commitment can warrant an OKR.
- **Milestone:** demonstrate an accepted capability or removed constraint by a deadline, with an
  explicit pass condition and evidence. Use when completion itself matters; do not disguise a task
  list as customer value.
- **Learning:** resolve a consequential uncertainty to an agreed evidence standard and decision by a
  deadline. Counting interviews or merely collecting a baseline is generally an activity; define
  what uncertainty the evidence must resolve, including a valid negative or inconclusive result and
  its next decision. Do not force an unsupported growth target onto discovery work.

## Stress-test incentives and guardrails

Ask how someone could improve the number without improving the intended result: split units of work,
drop hard cases, shrink the eligible population, shift cost to another team, change the time window,
or reduce quality. Check both numerator and denominator, cohort/case mix, and the collection method.

Ratios and rates can be useful, such as cost per successfully completed transaction or failures per
deployment. Define the units and inspect absolute components too. Do not reject ratios
categorically, and do not compress several dimensions into one score that hides important tradeoffs.

Choose separate, observable guardrails for the likely harm; specify their bound and measurement
window. Test whether the same manipulation improves both the goal and its supposed guardrail. For
example, with work, staffing, and spending unchanged, splitting 10 PRs into 20 doubles PRs/person
and halves cost/PR. Both improve without added value. Cost/PR therefore does not counteract PR-count
gaming.

Prefer evidence of useful completed work and relevant quality/cost protections. For support speed,
consider case mix and repeat contacts/reopens alongside customer outcomes; for unit cost, check
successful completion and quality so dropping difficult transactions cannot manufacture efficiency.
No pair of metrics eliminates gaming or replaces qualitative review.

## Set and grade goals honestly

Keep the objective set small enough to drive choices. The right number, cadence, and balance of
improvement, learning, and maintenance depend on the organization. Do not require every objective to
be transformational or have an arbitrary number of KRs.

Distinguish **committed**, **aspirational**, and **learning** intent before scoring. Agree what
success and partial progress mean for each metric, including lower-is-better rates, thresholds, and
binary milestones. Follow the organization's established rubric; Google's expected aspirational
average of 0.7 is one convention, not a universal pass mark or a rule that 100% completion proves
sandbagging. Do not apply aspirational scoring to a committed threshold or safety guardrail.

Keep actual results, confidence in future delivery, and the agreed score separate. Do not average
away a violated guardrail or retroactively change targets to hide a miss. Record material scope or
measurement changes explicitly, preserving the original commitment and the reason for revision.

## Before delivery

Check that the full set covers the intended benefit, ownership/dependencies are honest, the measures
can be interpreted and graded, plausible gaming has been considered, and unknowns remain visible.
Deliver all work requested, with concise recommendations and open decisions. Label illustrative
examples and provisional numbers so they cannot be mistaken for approved commitments.

Read [the playbook](references/okr-playbook.md) for examples and attributed source guidance. It
separates source conventions from this skill's practical recommendations. Reusable scenarios and
assertions live in [evals/evals.json](evals/evals.json); evaluate them in fresh contexts without
showing expected answers first.
