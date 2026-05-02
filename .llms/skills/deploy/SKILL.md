---
name: deploy
description: Use when deploying to staging or production, shipping a release, or pushing to an environment
---

# /deploy — Deploy with Safety Checks

**REQUIRED BACKGROUND:** `superpowers:verification-before-completion` — evidence before assertions. `superpowers:finishing-a-development-branch` — integration options.

---

## Steps

1. **Target.** `/deploy` or `/deploy staging` → staging. `/deploy production` → production (requires explicit confirmation).
2. **Pre-deploy checks (mandatory).**
   - `make check` (build + test + lint + typecheck) — abort on any failure.
   - For production: also require quality score ≥ 90 (`make score`).
   - `git status` clean — warn if uncommitted changes are present.
3. **Deploy.**
   - Staging: `make deploy-staging`.
   - Production: prompt with current version + last staging deploy + commit; require typed `yes`; then `make deploy-production`.
4. **Verify.** Health check / smoke test. Report deployed version + commit.
5. **Record.** Deployment line in the session log. Note rollback command.

---

## Rules

- Never deploy to production without explicit user confirmation.
- Never deploy with failing checks.
- Always record deployments in the session log.
