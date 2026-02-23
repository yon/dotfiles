---
name: security-audit
description: "Security review: OWASP, deps, secrets, permissions. Trigger: security audit, security review, vulnerability scan, OWASP check"
---

# /security-audit — Security Audit

Run a focused security review of the project using specialized subagents.

---

## Steps

### 1. Determine Scope
- `/security-audit` → full project audit
- `/security-audit [file or module]` → focused audit
- `/security-audit deps` → dependency-only audit

### 2. Dependency Audit
Run `make security` to check for known vulnerabilities in dependencies.

### 3. Code Audit
Spawn the security review subagent via the Task tool:

```
Task(subagent_type="security-code-auditor",
     prompt="<content of .claude/agents/security-reviewer.md>\n\n
     Perform a security audit of: {scope}\n\n
     Check:\n
     - OWASP Top 10 vulnerabilities\n
     - Hardcoded secrets/credentials in source files\n
     - Authentication/authorization patterns\n
     - Input validation gaps\n
     - Cryptographic misuse\n
     - Dependency-level vulnerabilities\n\n
     Return a structured report with severity ratings (Critical/High/Medium/Low).")
```

### 4. Configuration Audit
Review configuration files for:
- Debug mode enabled
- Default credentials
- Overly permissive settings
- Missing security headers
- Exposed internal services

### 5. Report

```markdown
## Security Audit Report

**Scope:** [what was audited]
**Date:** [ISO 8601]
**Risk Level:** [Critical / High / Medium / Low / Clean]

### Dependency Vulnerabilities
| Package | Version | CVE | Severity | Fix Available |
|---------|---------|-----|----------|--------------|
| [name] | [ver] | [CVE-ID] | [sev] | [yes/no — target version] |

### Code Findings
[Full security-reviewer agent report]

### Configuration Findings
[Issues found in config files]

### Summary
- Critical: [N]
- High: [N]
- Medium: [N]
- Low: [N]

### Recommended Actions (priority order)
1. [Most urgent fix]
2. [Next priority]
```

### 6. Gate Check
- Any **Critical** finding: Block deployment, require immediate fix
- Any **High** finding: Block PR, require fix before merge
- **Medium/Low**: Document and track
