# OKR Playbook — Methodology, Attributions, and Anti-Patterns

Deeper reference behind `SKILL.md`. Quotes are verbatim where in quotation marks; paraphrases and conventions are flagged. Sources: Grove (*High Output Management*), Doerr (*Measure What Matters*), Google re:Work + OKR Playbook, Wodtke (*Radical Focus*), Castro, Cagan/SVPG, Bryar & Carr (*Working Backwards*).

## Table of contents
1. Definitions: Objective vs Key Result
2. Outcomes vs outputs vs activities
3. The completeness test
4. Committed vs aspirational, and grading
5. Focus: how many
6. Anti-pattern catalog
7. Guardrail / counter / health metrics
8. Cadence
9. Baselines & targets
10. Templates & formulas
11. Lineage
12. Verification caveats

---

## 1. Definitions: Objective vs Key Result
- **Objective = the WHAT** (qualitative, inspirational, time-bound). "An Objective is simply what is to be achieved, no more and no less." Objectives are "significant, concrete, action oriented, and (ideally) inspirational." — *Doerr*
- **Key Result = the HOW-FAR** (quantitative, measurable). "Effective KRs are specific, time-bound, and aggressive yet realistic. Most of all, they are measurable and verifiable." — *Doerr*
- "It's not a key result unless it has a number." — *Marissa Mayer, quoted in Doerr*
- No gray area: "You either meet a Key Result's requirements or you don't." Grove: "Did I do that or did I not do it? Yes? No? Simple." — *Doerr; Grove*
- Google: an objective should be such that "to an observer, it should be obvious whether an Objective has been achieved or not." Use endpoint language; avoid "keep hiring," "maintain market position."

## 2. Outcomes vs outputs vs activities (the single most important rule)
- **"Key results should describe outcomes, not activities. If the KRs include words like 'consult,' 'help,' 'analyze,' 'participate,' they're describing activities."** — *Google re:Work* (cleanest verbatim test)
- "Projects are what you do. Outcomes are the measurable benefits created by what you did." — *Castro*
- The disguised-task test: "If it can go in your backlog, it's not an outcome." — *Castro*
- Cagan: "define success by business results (aka outcome), and not simply activity or output."
- Examples of outputs masquerading as KRs: "Launch feature X," "Deploy MVP," "Migrate servers," "Hire 3 engineers." Each should become a metric delta the work is meant to cause.
- **The reframe move:** strip the build verb, lead with the metric, relocate the initiative to notes / a project breakdown. The initiative is the *plan*; the KR is the *result*.

## 3. The completeness test (necessary & sufficient)
- Google Playbook, verbatim: "Is it reasonably possible to score 1.0 on all the Key Results, but still not achieve the intent of the Objective? If so, add or rework the Key Results until their successful completion guarantees that the Objective is also successfully completed."
- Doerr: "Once they are all completed, the objective is necessarily achieved. (And if it isn't, the OKR was poorly designed in the first place.)"
- **One north-star + drivers:** an objective wants ONE outcome KR that measures the transformation, plus leading/driver KRs. Symptom of failure: objective titled "transform how we X," but all KRs measure activity ("ran the pilot," "shipped the tool," "onboarded N people"). Add the outcome KR.

## 4. Committed vs aspirational, and grading
- **Committed:** "expected score = 1.0; a score of less than 1.0 requires explanation." — *Google*
- **Aspirational / moonshot:** "expected average score of 0.7, with high variance." — *Google*
- Sweet spot 0.6–0.7: "If someone consistently fully attains their objectives, their OKRs aren't ambitious enough." — *re:Work*
- Scale 0.0–1.0. Color bands (green 0.7–1.0 / yellow ~0.4–0.6 / red 0.0–0.3) are convention (Rick Klau's GV talk), not verbatim canon.
- Wodtke's stomach test: aspirational KRs should give "a funny little feeling in the pit of your stomach saying 'It would take a miracle to hit all three.'" "Difficult, not impossible."

## 5. Focus: how many
- Grove: "The one thing an [OKR] system should provide par excellence is focus... if we try to focus on everything, we focus on nothing."
- Google: "three to five objectives... about three key results for each."
- Wodtke (tightest): one Objective per quarter, ~3 KRs (1–5).

## 6. Anti-pattern catalog
- **Sandbagging** (Google Trap): teams meeting all OKRs without needing all their headcount are "hoarding resources or not pushing their teams." Consistent 1.0 on aspirational = sandbagging.
- **KRs that are tasks** — see §2.
- **Goodhart's law:** "When a measure becomes a target, it ceases to be a good measure." Antidote: counter-metrics (§7).
- **Vanity metrics** (Ries): metrics that "make you feel good, but don't offer clear guidance for what to do" (total hits, registered users) vs actionable cohort metrics.
- **Business-as-usual:** "OKRs focus on transformation, not maintenance." Don't write OKRs for work that happens anyway.
- **Low-value / "Who cares?":** "OKRs should promise clear business value."
- **Easy-to-measure trap** (Cagan): "tempted to define key results by something easy to measure, rather than what's most meaningful to measure."
- **Volume metrics** (LinkedIn): "any metric measuring the volume of output of a developer is dangerous."
- **Fusing two metrics into a ratio:** see §7 — a goal and its guardrail must stay separate clauses, never one combined number.

## 7. Guardrail / counter / health metrics
The structural antidote to Goodhart — pair a goal metric with a protector.
- **Grove (origin):** "you should guard against overreacting. This you can do by pairing indicators, so that together both effect and counter-effect are measured." Output indicators get quality counterparts (vouchers processed ↔ errors found).
- **Wodtke:** "OKRs are what you push. Health Metrics are what you protect." Tracked green/yellow/red weekly (customer satisfaction, retention, code stability).
- **Cagan (backstop):** "a measure of quality... to ensure that the first key result is not inadvertently achieved by hurting something else." (Reduce incorrect deliveries / while total deliveries keeps growing.)
- **A/B-testing lineage (guardrail metrics):** safety thresholds that must not degrade during an experiment even if the primary metric improves (latency, errors, unsubscribe rate). Kohavi/Microsoft lineage — *not* Amazon canon; don't attribute a verbatim definition without re-fetching the source.
- **Ratio caution:** combining goal ÷ guardrail into one number destroys gradability and can invert during adoption phases. Keep them as "[goal] while [guardrail stays within bound]."

## 8. Cadence
- Set quarterly; objectives can be long-lived (rolled over a year), KRs evolve. Google: annual + quarterly, graded at quarter end with a mid-quarter check-in.
- Wodtke: set quarterly, **review weekly** — "Adjust your confidence levels every single week." Each KR starts at a "five of ten" confidence (50/50 = right level of stretch).

## 9. Baselines & targets
- Every KR is "from X to Y" — needs a baseline and a target. — *Castro*
- **Unknown baseline:** do NOT make "establish baseline" a KR (Castro, Cagan concur: "sometimes the most appropriate measure is not yet clear"). State the metric, defer the number to a notes field with a date, finalize the target once measurable. Measuring it is a real deliverable — it just isn't a KR. (Migration "% of N" KRs usually have a baseline today — use it.)

## 10. Templates & formulas
- Doerr's canonical: **"I will [Objective] as measured by [Key Results]."**
- Castro's outcome variant: "I will [achieve this outcome] as measured by [these metrics]."
- Grove's two questions (genuine HOM concept, exact wording unverified): Objective = "Where do I want to go?"; Key Results = "How will I pace myself to see if I am getting there?"
- Doerr's Four Superpowers: "Focus and commit to priorities, align and connect for teamwork, track for accountability, and stretch for amazing results."

## 11. Lineage
OKRs originate as Grove's iMBO at Intel (~1970s, *High Output Management*, 1983), evolving Drucker's MBO. Doerr learned them from Grove (1975), brought them to Google (1999). Doerr calls Grove "the Father of OKRs."

## 12. Verification caveats (carry into any output)
- Color-band cut-points: convention (Klau), not verbatim re:Work.
- Do NOT attribute as verbatim: "OKRs are not a task list" / "if it does not add value to the customer…" (Castro); "if in doubt, leave it out." Use the verified equivalents above.
- Grove's two questions: real concept, exact wording unconfirmed.
- **Stripe:** no authoritative OKR source found — don't cite.
- **Amazon:** uses *controllable input metrics* + the Weekly Business Review "safety net" and the PR/FAQ Working-Backwards process — not "OKRs" or "guardrail metrics" as named canon. PR/FAQ customer framing verified via Bryar & Carr / Commoncog: the press release "forces the execution team to grapple with the proposed customer value, from the perspective of the customer." Useful as a "start from the outcome the customer feels" discipline, but label it Working-Backwards, not OKR canon.
