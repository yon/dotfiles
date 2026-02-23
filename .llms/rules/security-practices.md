# Security Practices

**Security is not a feature — it's a property of every line of code.**

______________________________________________________________________

## Principle: Secure by Default

Every component should be secure without requiring explicit action. Insecurity should require deliberate opt-in, with documentation explaining why.

______________________________________________________________________

## 1. Secrets Management

### NEVER

- Hardcode secrets, API keys, tokens, or passwords in source code
- Commit `.env` files, credentials, or private keys to git
- Log secrets — even at debug level
- Pass secrets via URL query parameters

### ALWAYS

- Use environment variables or a secrets manager
- Provide `.env.example` with dummy values (never real secrets)
- Add sensitive files to `.gitignore` BEFORE creating them
- Rotate credentials if they're ever exposed (even in a reverted commit — git history is permanent)

### Pre-Commit Check

Before every commit, verify:

```
No files matching: *.pem, *.key, *.env, credentials.*, secrets.*
No strings matching: api_key=, password=, secret=, token= (with actual values)
```

______________________________________________________________________

## 2. Input Validation — Parse, Don't Validate

### At Every System Boundary

- **HTTP endpoints:** Validate ALL parameters (path, query, body, headers)
- **CLI arguments:** Validate and sanitize before use
- **File inputs:** Validate format, size, and content type
- **Database results:** Don't trust data from the database if it could have been tampered with
- **Inter-service messages:** Validate schema and content

### The Pattern

```
Raw input → Parse into typed domain object → Use typed object everywhere
```

Once parsed, the type system guarantees validity. No need to re-validate downstream.

### Specific Threats

| Threat | Prevention |
|--------|-----------|
| SQL Injection | Parameterized queries ONLY. Never string concatenation. |
| XSS | Output encoding. CSP headers. Sanitize user-generated HTML. |
| Command Injection | Never pass user input to shell commands. Use library functions. |
| Path Traversal | Validate and resolve paths. Never use user input directly in file paths. |
| SSRF | Allowlist target URLs/IPs. Don't let users control outbound request targets. |
| Deserialization | Never deserialize untrusted data with `pickle`, `eval`, `unserialize`, etc. |

______________________________________________________________________

## 3. Authentication & Authorization

### Authentication

- Use established libraries/frameworks — NEVER roll your own crypto
- Hash passwords with bcrypt, argon2, or scrypt (NEVER MD5, SHA1, or SHA256 alone)
- Enforce strong password policies or use passwordless auth
- Implement rate limiting on auth endpoints
- Use HTTPS everywhere (no exceptions)

### Authorization

- Check permissions at the point of access, not just at the route level
- Principle of least privilege — grant minimum necessary permissions
- Default to deny — explicitly grant access, never explicitly deny
- Validate resource ownership — ensure users can only access their own data
- Log authorization failures

______________________________________________________________________

## 4. Dependency Security

### Before Adding a Dependency

- Check for known vulnerabilities (CVE databases, GitHub advisories)
- Verify the package is actively maintained
- Review popularity and community trust
- Check license compatibility
- Minimize dependency count — every dep is an attack surface

### Ongoing

- Run `make security` (dependency audit) regularly
- Enable automated vulnerability alerts (Dependabot, Snyk, etc.)
- Pin dependency versions — no `latest` or `*` in production
- Update dependencies regularly — old deps accumulate vulnerabilities

______________________________________________________________________

## 5. Error Handling & Information Disclosure

### NEVER Expose to Users

- Stack traces in production
- Database error messages
- Internal file paths or server details
- Specific authentication failure reasons ("user not found" vs "wrong password" — use generic "invalid credentials")

### ALWAYS

- Log detailed errors server-side for debugging
- Return generic, user-friendly error messages
- Use correlation IDs to link user-facing errors to server logs
- Fail closed — when in doubt, deny access and log

______________________________________________________________________

## 6. Data Protection

- **Encrypt at rest** — sensitive data in databases, backups, and logs
- **Encrypt in transit** — TLS for all network communication
- **Minimize data collection** — only collect what you need
- **Implement data retention** — delete what you no longer need
- **PII handling** — mask in logs, encrypt in storage, control access

______________________________________________________________________

## 7. Infrastructure Security

### Containers/Docker

- Use minimal base images (Alpine, distroless)
- Run as non-root user
- Don't store secrets in images or layers
- Scan images for vulnerabilities
- Pin base image versions (not `latest`)

### Configuration

- Disable debug mode in production
- Remove default credentials
- Enable security headers (CORS, CSP, HSTS, X-Frame-Options)
- Configure appropriate timeouts
- Set proper file permissions

______________________________________________________________________

## 8. Security Review Triggers

The security-reviewer agent should be invoked when:

- Authentication or authorization code is modified
- New external dependencies are added
- API endpoints are created or modified
- User input handling changes
- Cryptographic operations are added
- Configuration/infrastructure files change
- File upload/download functionality is added
