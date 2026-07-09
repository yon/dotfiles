# Global Instructions

## Core Principles

- **Simplicity first.** Make changes as small as possible. Touch only what's needed.
- **Find root causes.** No temporary fixes, no working around symptoms. Senior-engineer standards.
- **Don't fake it.** Never claim work is done without verifying it works. If you can't verify in this environment, say so explicitly.

## Working Style

- **Plan before non-trivial work.** Anything touching multiple files or requiring more than a couple of steps gets a plan first (`superpowers:writing-plans` or its built-in equivalent).
- **Stop and re-plan when something goes sideways.** Don't push through. Re-orient and propose a revised approach.
- **Offload research and parallel work to subagents.** Keep the main context clean. One focused task per subagent.
- **Verify before declaring done.** Run the build, run the tests, demonstrate correctness — see `rules/quality-and-verification.md`.
- **Demand elegance, in proportion.** For non-trivial work, pause to ask if there's a cleaner path. For obvious fixes, just do it.
- **Fix bugs autonomously.** Given a failing test, error, or log, diagnose and fix. Don't ask for hand-holding on what's already evident.

## Tool Preferences

- **Web fetching:** use the `/curl` skill (browser headers, redirect-following) instead of the native WebFetch tool when fetching pages that might block bots.

## Session Recovery

Starting fresh or after heavy compaction: re-derive state from CLAUDE.md, the most recent plan file, `git log --oneline -10`, and `git diff` — never from a blank slate. State your understanding of the current task before proceeding.

## Reference Documents

These live alongside this file and are auto-loaded into every session (keep them lean):

- `rules/aidlc.md` — the development lifecycle governing ALL work: scope test (trivial/direct/epic), capture-as-issues, design-first, subagent dispatch and crew rules, TDD with real-world fixtures, review panels, deploy + prove-live, observability/cost gates, learn loop.
- `rules/engineering-principles.md` — DRY/KISS/SOLID enforcement, immutability, typing, DI.
- `rules/code-conventions.md` — naming, file organization, comments, logging, observability, security practices.
- `rules/quality-and-verification.md` — verification checklist and the test-hardening ladder.
- `rules/git-and-delivery.md` — branches, commits, PRs, work decomposition.
