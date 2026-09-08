# Dependency and configuration checks

## Dependencies

- Identify resolved versions from lockfiles or equivalent build evidence, including relevant transitive dependencies. Separate deployed runtime dependencies from build and development dependencies while checking the authority each receives.
- Use available project scanners with their documented commands. Record the command, status, advisory source, and scan time; include database freshness when available. A failed or stale scan is not a clean result.
- Verify claimed advisories, affected version ranges, and fixed versions against current maintainer advisories or authoritative vulnerability databases when accessible. Do not invent an advisory or infer affectedness from a package name alone.
- Separate a confirmed affected dependency version from confirmed application exploitability. Explain feature use, reachability, exposure, and mitigating configuration; label unknown reachability explicitly. Do not discard an affected dependency solely because a quick search found no direct call.
- Keep the advisory's severity separate from contextual application priority. Recommend a verified compatible fix when established; otherwise state what compatibility or remediation needs checking. Do not automatically upgrade dependencies during a review.

## Configuration

- Inspect relevant deployment manifests, identity policies, network exposure, secrets references, debug behavior, trust settings, and runtime overrides.
- Establish which configuration is actually loaded in each relevant environment. Development defaults, commented examples, and production values can differ.
- For headers, cookies, CORS, transport protection, and proxy behavior, identify the enforcing layer and concrete risk before making a finding. Do not assume absent infrastructure fills a gap, or that every missing hardening control is exploitable.
- Consider least privilege at data, cloud, CI, and service boundaries in relation to what an attacker could do after crossing them.
- If a credential appears exposed, report a redacted location, evidence of its role, and exposure conditions. Recommend revocation or rotation when warranted without using the credential to prove it works.
