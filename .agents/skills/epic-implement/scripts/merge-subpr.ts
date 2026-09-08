#!/usr/bin/env bun
/** Verify a child PR's review and remote integration, then record it without cleanup.
 * gh pins the child head but cannot atomically pin its base. A base race can merge
 * remotely before post-merge verification fails; revalidate instead of retrying.
 */
import { readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
import { withStateLock, atomicWriteJson } from "./state-lock";

interface Finding {
  severity: string;
  status: string;
}
interface Review {
  pr: number;
  head_sha: string;
  base_sha: string;
  findings: Finding[];
}
interface Pull {
  number: number;
  state: string;
  mergeable: string;
  headRefName: string;
  headRefOid: string;
  baseRefName: string;
  mergeCommit: string | null;
  issues: number[];
}
interface Integration {
  issue: number;
  pr: number;
  merge_commit: string;
  epic_branch: string;
  head_sha: string;
  base_sha: string;
}
const shaPattern = /^[0-9a-f]{40}$/;
function requireThat(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function object(value: unknown, label: string): Record<string, unknown> {
  requireThat(
    value !== null && typeof value === "object" && !Array.isArray(value),
    `${label} must be an object`,
  );
  return value as Record<string, unknown>;
}
function text(value: unknown, label: string): string {
  requireThat(
    typeof value === "string" && value.length > 0,
    `${label} must be a nonempty string`,
  );
  return value;
}
function number(value: unknown, label: string): number {
  requireThat(
    typeof value === "number" && Number.isSafeInteger(value) && value > 0,
    `${label} must be a positive integer`,
  );
  return value;
}
function sha(value: unknown, label: string): string {
  const result = text(value, label);
  requireThat(shaPattern.test(result), `invalid ${label}`);
  return result;
}
function command(name: string, args: string[]): string {
  const result = spawnSync(name, args, { encoding: "utf8" });
  requireThat(
    !result.error && result.status === 0,
    `${name} failed: ${result.error?.message ?? result.stderr}`,
  );
  return result.stdout.trim();
}
function github(args: string[]): unknown {
  return JSON.parse(command("gh", args)) as unknown;
}
function reviewReceipt(path: string, pr: number): Review {
  const data = object(
    JSON.parse(readFileSync(path, "utf8")) as unknown,
    "review receipt",
  );
  requireThat(
    number(data.pr, "receipt PR") === pr,
    "review receipt belongs to another PR",
  );
  requireThat(data.gate_passed === true, "review gate did not pass");
  requireThat(
    data.independent_review === true,
    "independent review is required",
  );
  requireThat(Array.isArray(data.findings), "findings must be a list");
  const severities = new Set([
    "critical",
    "high",
    "major",
    "medium",
    "moderate",
    "low",
    "minor",
    "info",
    "informational",
  ]);
  const statuses = new Set([
    "open",
    "unresolved",
    "fixed",
    "resolved",
    "false_positive",
    "accepted",
    "deferred",
  ]);
  const findings = data.findings.map((raw: unknown): Finding => {
    const entry = object(raw, "finding");
    const severity = text(entry.severity, "severity");
    const status = text(entry.status, "status");
    requireThat(
      severities.has(severity) && statuses.has(status),
      "unknown finding severity or status",
    );
    requireThat(
      !["critical", "high", "major"].includes(severity) ||
        ["fixed", "resolved", "false_positive"].includes(status),
      "unresolved Critical/High/Major finding blocks integration",
    );
    return { severity, status };
  });
  return {
    pr,
    head_sha: sha(data.head_sha, "head SHA"),
    base_sha: sha(data.base_sha, "base SHA"),
    findings,
  };
}
function snapshot(pr: number): Pull {
  const data = object(
    github([
      "pr",
      "view",
      String(pr),
      "--json",
      "number,state,mergeable,headRefName,headRefOid,baseRefName,mergeCommit,closingIssuesReferences",
    ]),
    "PR",
  );
  requireThat(
    number(data.number, "PR number") === pr,
    "unexpected PR snapshot",
  );
  const refs: unknown = data.closingIssuesReferences ?? [];
  requireThat(Array.isArray(refs), "invalid closing issue references");
  return {
    number: pr,
    state: text(data.state, "PR state"),
    mergeable: typeof data.mergeable === "string" ? data.mergeable : "UNKNOWN",
    headRefName: text(data.headRefName, "head branch"),
    headRefOid: sha(data.headRefOid, "PR head SHA"),
    baseRefName: text(data.baseRefName, "base branch"),
    mergeCommit:
      data.mergeCommit == null
        ? null
        : sha(object(data.mergeCommit, "merge commit").oid, "merge commit SHA"),
    issues: refs.map((ref: unknown) =>
      number(object(ref, "issue ref").number, "issue ref number"),
    ),
  };
}
function check(
  child: Pull,
  parent: Pull,
  review: Review,
  issue: number,
  requireBase: boolean,
): void {
  requireThat(parent.state === "OPEN", "epic PR must remain OPEN");
  requireThat(
    child.baseRefName === parent.headRefName &&
      child.headRefName !== parent.headRefName,
    "child targets wrong base or integration branch itself",
  );
  requireThat(
    child.state === "OPEN" || child.state === "MERGED",
    "child PR must be OPEN or MERGED",
  );
  requireThat(
    child.headRefOid === review.head_sha,
    "reviewed head SHA is stale",
  );
  if (requireBase) {
    requireThat(
      parent.headRefOid === review.base_sha,
      "reviewed base SHA is stale",
    );
    requireThat(
      child.mergeable === "MERGEABLE",
      "child mergeability is not confirmed",
    );
  }
  requireThat(
    child.issues.length === 0 || child.issues.includes(issue),
    "explicit issue conflicts with PR closing references",
  );
}
function verifyIntegration(
  child: Pull,
  parent: Pull,
  review: Review,
  issue: number,
): Integration {
  check(child, parent, review, issue, false);
  requireThat(
    child.state === "MERGED" && child.mergeCommit !== null,
    "merge is not confirmed; no integration recorded",
  );
  const repository = text(
    object(github(["repo", "view", "--json", "nameWithOwner"]), "repository")
      .nameWithOwner,
    "repository name",
  );
  requireThat(
    /^[^/\s]+\/[^/\s]+$/.test(repository),
    "repository identity is unknown",
  );
  const commit = object(
    github(["api", `repos/${repository}/commits/${child.mergeCommit}`]),
    "commit",
  );
  requireThat(
    Array.isArray(commit.parents) &&
      commit.parents.length === 1 &&
      object(commit.parents[0] as unknown, "parent").sha === review.base_sha,
    "PR merged but reviewed base differs from squash parent; revalidation required",
  );
  const comparison = object(
    github([
      "api",
      `repos/${repository}/compare/${child.mergeCommit}...${parent.headRefOid}`,
    ]),
    "comparison",
  );
  requireThat(
    comparison.status === "ahead" || comparison.status === "identical",
    "merge is not confirmed in current epic branch; revalidation required",
  );
  return {
    issue,
    pr: child.number,
    merge_commit: child.mergeCommit,
    epic_branch: parent.headRefName,
    head_sha: review.head_sha,
    base_sha: review.base_sha,
  };
}
function parseIntegration(raw: unknown): Integration {
  const entry = object(raw, "integration");
  return {
    issue: number(entry.issue, "issue"),
    pr: number(entry.pr, "PR"),
    merge_commit: sha(entry.merge_commit, "merge SHA"),
    epic_branch: text(entry.epic_branch, "epic branch"),
    head_sha: sha(entry.head_sha, "reviewed head"),
    base_sha: sha(entry.base_sha, "reviewed base"),
  };
}
function record(common: string, entry: Integration): void {
  withStateLock(join(common, "epic-integrations.lock.d"), () => {
    const target = join(common, "epic-integrations.json");
    let entries: Integration[] = [];
    try {
      const data = object(
        JSON.parse(readFileSync(target, "utf8")) as unknown,
        "integration manifest",
      );
      requireThat(
        Array.isArray(data.integrations),
        "invalid integration manifest; reconcile merged state",
      );
      entries = data.integrations.map((value: unknown) =>
        parseIntegration(value),
      );
    } catch (error: unknown) {
      if (!(
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ))
        throw error;
    }
    atomicWriteJson(target, {
      integrations: [...entries.filter((item) => item.pr !== entry.pr), entry],
    });
  });
}
export function mergeSubpr(args: string[]): Integration {
  requireThat(
    args.length === 6,
    "usage: merge-subpr.sh PR EPIC_PR --review FILE --issue N",
  );
  const pr = number(Number(args[0]), "PR");
  const epic = number(Number(args[1]), "epic PR");
  requireThat(pr !== epic, "cannot merge the epic PR itself");
  let reviewPath: string | undefined;
  let issue: number | undefined;
  for (let index = 2; index < args.length; index += 2) {
    const option = args[index];
    const value = args[index + 1];
    requireThat(value !== undefined, "missing option value");
    if (option === "--review") {
      requireThat(reviewPath === undefined, "duplicate review option");
      reviewPath = value;
    } else if (option === "--issue") {
      requireThat(issue === undefined, "duplicate issue option");
      issue = number(Number(value), "issue");
    } else throw new Error("unknown option");
  }
  requireThat(
    reviewPath !== undefined && issue !== undefined,
    "receipt and explicit issue required",
  );
  const review = reviewReceipt(reviewPath, pr);
  const common = resolve(command("git", ["rev-parse", "--git-common-dir"]));
  let child = snapshot(pr);
  let parent = snapshot(epic);
  check(child, parent, review, issue, child.state === "OPEN");
  if (child.state === "OPEN") {
    child = snapshot(pr);
    parent = snapshot(epic);
    check(child, parent, review, issue, child.state === "OPEN");
    if (child.state === "OPEN") {
      try {
        command("gh", [
          "pr",
          "merge",
          String(pr),
          "--squash",
          "--match-head-commit",
          review.head_sha,
        ]);
      } catch {
        console.error(
          "merge command failed; checking remote state before deciding",
        );
      }
    }
    child = snapshot(pr);
    parent = snapshot(epic);
  }
  const entry = verifyIntegration(child, parent, review, issue);
  record(common, entry);
  return entry;
}
if (import.meta.main) {
  try {
    console.log(
      JSON.stringify({
        status: "integrated",
        ...mergeSubpr(process.argv.slice(2)),
      }),
    );
  } catch (error: unknown) {
    console.error(
      `merge-subpr: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  }
}
