---
name: deploy
description: "Deploy to staging or production with safety checks. Trigger: deploy, ship, release, push to staging, push to production"
---

# /deploy — Deploy to Environment

Deploy the project to a target environment.

---

## Steps

### 1. Determine Target
- `/deploy staging` or `/deploy` → staging (default)
- `/deploy production` → production (requires confirmation)

### 2. Pre-Deploy Checks
**MANDATORY before any deployment:**

1. Run `make check` (build + test + lint + typecheck)
2. Verify all checks pass — **abort if any fail**
3. For production: verify quality score >= 90 (`make score`)
4. Check for uncommitted changes — warn if present

### 3. Deploy

**Staging:**
```bash
make deploy-staging
```

**Production:**
```
⚠️  PRODUCTION DEPLOYMENT
Are you sure you want to deploy to production?
Current version: [version/commit]
Last staging deploy: [date/commit]

Type "yes" to confirm.
```
Then: `make deploy-production`

### 4. Post-Deploy Verification
- Verify the deployment succeeded (health check, smoke test)
- Report the deployed version/commit

### 5. Rollback Information
- Show how to rollback if needed
- Record the deployment in the session log

## Rules
- **NEVER deploy to production without explicit user confirmation**
- **NEVER deploy with failing checks**
- **ALWAYS record deployments in session log**
