# Running issue-plan evals

For each case in evals.json, create a fresh temporary workspace. Copy only that case's listed files
into the workspace by basename. Copy SKILL.md separately as the runtime skill; do not expose
evals.json, expected outputs, assertions, or other cases to the evaluated agent. Use a fresh agent
context, the case prompt, and the copied skill. Use non-login shells for local commands to avoid
unrelated startup hooks.

Only the local issue_tracker.py adapter may represent issue operations. It has no network access and
persists issues and a command log beside itself. Disable live connectors and network for the eval.
Source files are inputs; tracker state, event logs, and draft body files are outputs. Do not run
directly in the committed fixtures or give runs real credentials.

After the run, inspect the transcript, draft, tracker state, and event log against the case
assertions. Run `python3 evals/check_run.py CASE_ID WORKSPACE` from the skill directory to check
source preservation, duplicate search, creation count, and read-back behavior. This checks
mechanical outcomes only; it does not establish evidence quality or acceptance-criteria correctness.
Judge intended behavior, causal evidence, and investigation quality against the supplied contracts
and incident, with cited output evidence. Self-reported completion is not a grader.

Compare the same cases against the previous skill revision or no skill using identical inputs and
tools. Repeat important cases before interpreting differences as reliable improvement. Record the
skill revision, harness/model, command results, grading evidence, duration, and actual token usage
when available outside the runtime skill package. These three cases cover specific regressions, not
every issue-planning workflow.
