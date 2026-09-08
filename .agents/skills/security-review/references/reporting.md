# Reporting

Use a short report for a small review. Do not create a report file or publish comments unless requested or required by the established workflow.

For each actionable finding include:

- **Title and location:** stable identifier, affected path and precise line or symbol, and reviewed revision where available.
- **Severity and rationale:** Critical, High, Medium, or Low unless repository conventions differ. Explain impact, attacker privileges, exposure, prerequisites, and relevant mitigations. Do not manufacture a numeric risk score.
- **Confidence and validation:** explain the strength of evidence; distinguish an executed local reproduction, a verified static trace, and an unresolved assumption. Severity does not measure confidence.
- **Abuse path:** attacker-controlled entry, relevant checks, sensitive operation, and violated security property. Cite supporting caller or control locations as needed.
- **Evidence:** minimal redacted code or observed test result. Explain counterevidence examined and why it does not stop the path. State if a proposed reproduction was not run.
- **Remediation and regression check:** a focused correction and a test that should reject the unauthorized behavior while preserving legitimate use. Do not silently apply the fix during a review-only task.
- **Change relationship:** introduced, worsened, or pre-existing for a change review. For dependency findings, include resolved version and advisory evidence separately from application reachability.

Group findings by shared root cause without merging unrelated boundaries. Include a CWE or advisory identifier only when verified and useful.

End with scope and limitations: reviewed paths and revisions, important boundaries checked, tools run and their results, missing deployment evidence, unsupported analyses, and incomplete coverage. Keep unresolved hypotheses separate from confirmed findings and name the evidence needed to resolve them. Describe substantive hardening suggestions separately if requested or useful.

When no confirmed findings remain, report that fact within the reviewed scope. An empty finding list does not certify the application as secure.
