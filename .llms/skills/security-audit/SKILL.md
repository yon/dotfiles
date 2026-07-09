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
2. **Code.** Dispatch the `security-reviewer` agent (fall back to `general-purpose` with the persona injected only if it's unavailable). The prompt must request severity-rated (Critical/Major/Minor) findings on:
   - OWASP Top 10
   - hardcoded secrets / credentials
   - authn/authz patterns and gaps
   - input validation at boundaries
   - cryptographic misuse
3. **Configuration.** Read config and infra files for: debug mode on, default credentials, permissive CORS/firewall, missing security headers, exposed internal services.
4. **Report.**

```markdown
## Security Audit

**Scope:** [...]   **Risk Level:** [Critical / Major / Minor / Clean]

### Dependency Vulnerabilities
| Package | Version | CVE | Severity | Fix |
|---|---|---|---|---|

### Code Findings
[reviewer report]

### Configuration Findings
[issues]

### Summary
Critical: [N]   Major: [N]   Minor: [N]

### Priority Actions
1. …
```

---

## Gate

Same finding-driven gate as everywhere else (`quality-and-verification.md`): Critical and Major block (Critical additionally blocks deployment, fix immediately); Minor is documented and tracked, never blocking. CVE severities map: High -> Major, Medium/Low -> Minor.
