---
name: security-audit
description: Use when auditing the project for OWASP issues, secrets, vulnerable dependencies, auth gaps, or misconfigured infrastructure
---

# /security-audit — Security Audit

Focused security review — code, dependencies, and configuration.

---

## Scope

| Invocation | Target |
|---|---|
| `/security-audit` | full project |
| `/security-audit [path]` | focused on a file or module |
| `/security-audit deps` | dependencies only |

---

## Steps

1. **Dependencies.** `make security` (or the project equivalent) — flag known CVEs.
2. **Code.** Spawn a security reviewer via the Task tool. Inject the persona; `general-purpose` is a safe `subagent_type` default. The prompt must request severity-rated (Critical/High/Medium/Low) findings on:
   - OWASP Top 10
   - hardcoded secrets / credentials
   - authn/authz patterns and gaps
   - input validation at boundaries
   - cryptographic misuse
3. **Configuration.** Read config and infra files for: debug mode on, default credentials, permissive CORS/firewall, missing security headers, exposed internal services.
4. **Report.**

```markdown
## Security Audit

**Scope:** [...]   **Risk Level:** [Critical / High / Medium / Low / Clean]

### Dependency Vulnerabilities
| Package | Version | CVE | Severity | Fix |
|---|---|---|---|---|

### Code Findings
[reviewer report]

### Configuration Findings
[issues]

### Summary
Critical: [N]   High: [N]   Medium: [N]   Low: [N]

### Priority Actions
1. …
```

---

## Gate

| Severity | Action |
|---|---|
| Critical | Block deployment. Fix immediately. |
| High | Block PR. Fix before merge. |
| Medium / Low | Document and track. |
