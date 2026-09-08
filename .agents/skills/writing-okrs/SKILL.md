---
name: writing-okrs
description: Write, critique, and sharpen OKRs (Objectives and Key Results) so each KR is a measurable outcome the team actually controls. Use this whenever the user is drafting, reviewing, rephrasing, or grading objectives and key results, planning a quarter or fiscal year, working in an OKR tracker or goals doc, or asking "is this a good KR / good metric?" — even if they don't say the word "OKR" (e.g. "help me set goals for my team this quarter," "this metric feels gameable," "turn our strategy into measurable targets"). Applies to company, team, and individual goal-setting alike.
---

# Writing OKRs

## What good looks like

An **Objective** is the qualitative, inspirational *what* — where you're going. A **Key Result** is a quantitative *how-far* — a metric with a number that proves you got there. Doerr's template captures the relationship: **"I will [Objective] as measured by [Key Results]."**

The job of this skill is to get every KR to pass three tests — **outcome, control, completeness** — and to make objectives focused and honest. Most first-draft OKRs fail in one of a few predictable ways; the bulk of the value here is diagnosing which failure and reframing, not inventing metrics from nothing.

## How to work: KR-by-KR, propose-then-confirm

OKRs are high-stakes and the user owns them. Don't rewrite a whole set in one silent pass. Instead, go **one KR at a time**, and for each show:

- **Current:** the existing phrasing (verbatim).
- **Proposed:** your rewrite.
- **Why:** the specific failure it fixes (name the test it was failing).
- **Judgment calls:** surface real forks (e.g. "this is partly outside your control — keep as a shared outcome, or reframe to the slice you own?") and give a recommendation, don't just list options.

Then wait for the user before moving on. This mirrors how a good OKR review actually goes: the value is in the conversation about each tradeoff, not in a bulk find-replace. When drafting from scratch, draft the objective and its KRs, then walk the KRs one at a time the same way.

Batch the *writing to a doc/tracker* until the phrasings are settled — but if you do edit a tracker, re-read the row/cell layout immediately before each write (rows shift as items are added or moved; a stale assumption silently overwrites the wrong KR).

## The three tests every KR must pass

### 1. Outcome, not output or activity
A KR states the **measurable change in the world**, not the work you'll do to cause it. The cleanest test (Google re:Work): *if the KR contains words like "build," "ship," "launch," "establish," "onboard," "consult," "help," "analyze," "migrate," it's probably describing an activity.* A real KR is a metric delta — "from X to Y."

The fix is almost always the same: **lead with the metric; move the "build X" clause to a notes column or a project breakdown.** The initiative isn't wrong — it's just not the KR.

- ❌ "Build an observability automation layer and expose it as a self-serve skill."
- ✅ "[x]% of new services reach full instrumentation through the self-serve path by year-end." *(the build is how; this is the result)*

Test: "If it could go on your backlog as a task, it's not an outcome."

### 2. Inside your control boundary
Ask of every metric: **"If this misses, is it my team's failure — or someone else's behavior I don't control?"** If the latter, it's the wrong KR. A platform/infra team owns the *paved road* and *adoption of it*, not other teams' deploy cadence, code quality, or business results.

Reframe org-wide outcomes you don't own into the slice you do:
- ❌ "Increase deployment frequency across all teams" → you don't control how often other teams ship.
- ✅ "[x]% of teams adopt the safe golden path" → adoption of what you built is yours.

Adoption % is a legitimate **year-one** outcome for platform/enablement work. Graduate to harder value/outcome metrics once adoption is broad. When a metric is genuinely shared (e.g. incident MTTR = detect + decide + act), either scope the KR to the part you own (the platform recovery lever's speed) or label it a co-owned outcome honestly — don't pretend it's fully yours.

### 3. Completeness (necessary & sufficient)
The canonical test (Google Playbook): **"Is it reasonably possible to score 1.0 on all the Key Results, but still not achieve the intent of the Objective?"** If yes, the KRs are incomplete — add or rework until hitting them *guarantees* the objective is met.

The common version of this failure: an objective titled "transform how we X" whose KRs only measure "did we *start* doing X" (pilot completed, tool shipped, N people onboarded). Those are **drivers**, not the **outcome**. A healthy objective has **one north-star outcome KR** (the transformation itself) plus a few driver KRs. If none of the KRs measure the transformation, you're missing the most important one.

## Pair goals with guardrails — never fuse them into a ratio

A KR that drives one number invites **Goodhart's law**: "when a measure becomes a target, it ceases to be a good measure." The structural antidote (Grove's original insight, echoed by Wodtke's "health metrics" and Cagan's "backstop") is to **pair a goal metric with a counter-metric**: grow signups *without* raising churn; raise deploy speed *while holding* change-failure-rate flat; increase throughput *with* zero critical incidents.

Crucial distinction: a guardrail is a **separate clause**, not a **ratio**. Do not collapse two different things into one number.

- ❌ "PRs per AI-dollar" — fuses *leverage* (output per person) and *efficiency* (output per dollar) into one ungradable number, and it points the wrong way during adoption (you'd "win" by spending less on the very thing you're trying to grow).
- ✅ "Increase merged PRs per team member from X to Y, **while AI cost per PR stays at or below Z**" — leverage is the headline; cost is a guardrail.

Bonus: opposing guardrails cross-check gaming. PR count inflates by splitting work into smaller PRs; cost-per-PR pushes the opposite way. Paired, they're harder to game than either alone.

## Objectives: focus and honest framing

- **Few of them.** Grove: "if we try to focus on everything, we focus on nothing." Aim for ≤3–5 objectives, ~3 KRs each (some practitioners go as tight as 1 objective / 3 KRs per cycle).
- **Inspirational and unambiguous.** Use endpoint language ("climb the mountain"), not maintenance language ("keep hiring," "maintain position").
- **Transformation, not business-as-usual.** OKRs are for what makes you meaningfully better, not the work that happens anyway.
- **Lead the KR sentence with verb + metric.** "Migrate 50% of eligible services onto the new platform" beats "Platform reaches GA and 50% migrate" — milestones (GA) are preconditions or parentheticals, not the headline. Always name and define the denominator ("eligible services," "active repos").

## Baselines, targets, and committed vs aspirational

- Every KR is **"from [baseline] to [target]."** If you don't have the baseline yet (common for anything measured from zero), **don't fake a number and don't make "establish a baseline" the KR.** State the metric, mark the baseline "to be set in [period]," and finalize the target once known. Measuring the baseline is a legitimate gradable deliverable; it just lives in the notes, not as a pseudo-KR. (Migration KRs like "50% of N" usually *do* have a baseline knowable today — use it.)
- **Committed OKRs** are expected to hit 1.0; a miss demands an explanation. **Aspirational / moonshot OKRs** target ~0.7 with high variance — if you consistently score 1.0, they aren't ambitious enough (and may signal sandbagging). Decide which kind each objective is, because it changes how you grade.

## Before you finish

Run the quick checklist over the full set:
1. Does every KR pass outcome / control / completeness?
2. Does each objective have a north-star outcome, not just drivers?
3. Are gameable metrics paired with a guardrail (as a clause, not a ratio)?
4. ≤3–5 objectives, focused, transformational?
5. Every KR "from X to Y," with unknown baselines honestly deferred (not faked)?

For deeper methodology, attributions, anti-pattern catalog, and verbatim source quotes, see `references/okr-playbook.md`.
