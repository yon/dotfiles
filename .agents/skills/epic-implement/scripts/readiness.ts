import { existsSync, readFileSync, realpathSync } from "node:fs";
import { isAbsolute, join, posix, resolve } from "node:path";
import { spawnSync } from "node:child_process";

interface Issue {
  number: number;
  blocked_by: number[];
  owner_gated: boolean;
  files_owned: string[];
  state?: string;
}
interface Flight {
  issue: number;
  files_owned: string[];
}
interface Snapshot {
  issues: Issue[];
  in_flight: Flight[];
}
interface Receipt {
  issue: number;
  pr: number;
  epic_branch: string;
  merge_commit: string;
  head_sha: string;
  base_sha: string;
}
interface Blocked {
  issue: number;
  reasons: string[];
}
interface Result {
  ready: number[];
  blocked: Blocked[];
  integrated: number[];
  in_flight: number[];
  complete: boolean;
}

function requireValue(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function positive(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}
function object(value: unknown, label: string): Record<string, unknown> {
  requireValue(
    typeof value === "object" && value !== null && !Array.isArray(value),
    `Invalid ${label}`,
  );
  return value as Record<string, unknown>;
}
function keys(
  value: Record<string, unknown>,
  allowed: string[],
  label: string,
): void {
  requireValue(
    Object.keys(value).every((key) => allowed.includes(key)),
    `Unknown fields in ${label}`,
  );
}
function paths(value: unknown, label: string): string[] {
  requireValue(
    Array.isArray(value) && value.length,
    `${label} must be a nonempty array`,
  );
  const result = value.map((file: unknown) => {
    requireValue(
      typeof file === "string" &&
        file.length > 0 &&
        file !== "." &&
        !file.startsWith("-") &&
        !isAbsolute(file) &&
        posix.normalize(file) === file &&
        !file.split("/").includes("..") &&
        !file.includes("\0"),
      `${label} requires exact normalized relative paths`,
    );
    return file;
  });
  requireValue(
    new Set(result).size === result.length,
    `${label} has duplicate paths`,
  );
  return result;
}
function snapshot(path: string): Snapshot {
  const value: unknown = JSON.parse(readFileSync(path, "utf8"));
  const data = object(value, "snapshot");
  keys(data, ["issues", "in_flight"], "snapshot");
  requireValue(
    Array.isArray(data.issues) && data.issues.length,
    "Snapshot requires a nonempty issues array",
  );
  requireValue(
    Array.isArray(data.in_flight),
    "Snapshot requires in_flight array",
  );
  const numbers = new Set<number>();
  const issues = data.issues.map((item: unknown): Issue => {
    const entry = object(item, "issue");
    keys(
      entry,
      ["number", "blocked_by", "owner_gated", "files_owned", "state"],
      "issue",
    );
    requireValue(
      positive(entry.number) && !numbers.has(entry.number),
      "Issue numbers must be unique positive integers",
    );
    numbers.add(entry.number);
    const deps = entry.blocked_by;
    requireValue(Array.isArray(deps), "Issue blocked_by must be an array");
    const dependencies = deps.map((dep: unknown) => {
      requireValue(
        positive(dep),
        "Dependency numbers must be positive integers",
      );
      return dep;
    });
    requireValue(
      new Set(dependencies).size === dependencies.length,
      "Duplicate dependencies",
    );
    requireValue(
      typeof entry.owner_gated === "boolean",
      "Issue requires boolean owner_gated",
    );
    requireValue(
      entry.state === undefined ||
        (typeof entry.state === "string" &&
          ["OPEN", "CLOSED"].includes(entry.state)),
      "Invalid optional issue state",
    );
    return {
      number: entry.number,
      blocked_by: dependencies,
      owner_gated: entry.owner_gated,
      files_owned: paths(entry.files_owned, "Issue files_owned"),
      ...(entry.state === undefined ? {} : { state: entry.state }),
    };
  });
  const flights = new Set<number>();
  const occupied = new Set<string>();
  const inFlight = data.in_flight.map((item: unknown): Flight => {
    const entry = object(item, "in-flight entry");
    keys(entry, ["issue", "files_owned"], "in-flight entry");
    requireValue(
      positive(entry.issue) &&
        numbers.has(entry.issue) &&
        !flights.has(entry.issue),
      "In-flight issues must be unique and present in snapshot",
    );
    flights.add(entry.issue);
    const owned = paths(entry.files_owned, "In-flight files_owned");
    const declared = issues.find(
      (issue) => issue.number === entry.issue,
    )?.files_owned;
    requireValue(
      declared &&
        JSON.stringify([...declared].sort()) ===
          JSON.stringify([...owned].sort()),
      "In-flight ownership differs from issue",
    );
    requireValue(
      owned.every((file) => !occupied.has(file)),
      "Existing in-flight issues have conflicting ownership",
    );
    owned.forEach((file) => occupied.add(file));
    return { issue: entry.issue, files_owned: owned };
  });
  return { issues, in_flight: inFlight };
}
function git(...args: string[]): string {
  const result = spawnSync("git", args, { encoding: "utf8" });
  requireValue(
    !result.error && result.status === 0,
    `git ${args.join(" ")} failed: ${result.error?.message ?? result.stderr}`,
  );
  return result.stdout.trim();
}
function receipt(value: unknown): Receipt {
  const data = object(value, "integration receipt");
  keys(
    data,
    ["issue", "pr", "epic_branch", "merge_commit", "head_sha", "base_sha"],
    "receipt",
  );
  requireValue(
    positive(data.issue) &&
      positive(data.pr) &&
      typeof data.epic_branch === "string" &&
      data.epic_branch.length > 0,
    "Invalid receipt issue, PR, or epic_branch",
  );
  for (const key of ["merge_commit", "head_sha", "base_sha"] as const)
    requireValue(
      typeof data[key] === "string" &&
        /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(data[key]),
      `Invalid receipt ${key}`,
    );
  // Each field is checked explicitly to retain a fully typed receipt.
  requireValue(
    typeof data.merge_commit === "string" &&
      typeof data.head_sha === "string" &&
      typeof data.base_sha === "string",
    "Missing receipt commit",
  );
  return {
    issue: data.issue,
    pr: data.pr,
    epic_branch: data.epic_branch,
    merge_commit: data.merge_commit,
    head_sha: data.head_sha,
    base_sha: data.base_sha,
  };
}
function integrations(
  branch: string,
  ref: string,
): { integrated: Set<number>; stale: Set<number> } {
  const common = realpathSync(resolve(git("rev-parse", "--git-common-dir")));
  const path = join(common, "epic-integrations.json");
  const parsed: unknown = existsSync(path)
    ? JSON.parse(readFileSync(path, "utf8"))
    : { integrations: [] };
  const data = object(parsed, "integration manifest");
  keys(data, ["integrations"], "integration manifest");
  requireValue(
    Array.isArray(data.integrations),
    "Invalid integration manifest",
  );
  const receipts = data.integrations.map((item: unknown) => receipt(item));
  const integrated = new Set<number>();
  const candidates = new Set<number>();
  for (const item of receipts) {
    if (item.epic_branch !== branch) continue;
    candidates.add(item.issue);
    const result = spawnSync(
      "git",
      ["merge-base", "--is-ancestor", item.merge_commit, ref],
      { encoding: "utf8" },
    );
    requireValue(
      !result.error && (result.status === 0 || result.status === 1),
      `Cannot verify receipt for #${item.issue}: ${result.error?.message ?? result.stderr}`,
    );
    if (result.status === 0) integrated.add(item.issue);
  }
  return {
    integrated,
    stale: new Set([...candidates].filter((issue) => !integrated.has(issue))),
  };
}
export function plan(args: string[]): Result {
  requireValue(
    args.length === 3 && args[0] && args[1] === "--epic-branch" && args[2],
    "Usage: readiness.sh snapshot.json --epic-branch epic/N",
  );
  const data = snapshot(args[0]);
  const branch = args[2];
  const rawLimit = process.env.EPIC_MAX_IMPLEMENTORS ?? "2";
  requireValue(
    /^[1-9]\d*$/.test(rawLimit) && Number.isSafeInteger(Number(rawLimit)),
    "EPIC_MAX_IMPLEMENTORS must be a positive integer",
  );
  const limit = Number(rawLimit);
  requireValue(
    data.in_flight.length <= limit,
    "Existing in-flight count exceeds configured limit",
  );
  requireValue(!branch.startsWith("-"), "Invalid epic branch");
  git("check-ref-format", `refs/heads/${branch}`);
  const remote = process.env.EPIC_REMOTE ?? "origin";
  requireValue(
    git("remote").split("\n").includes(remote),
    "EPIC_REMOTE must name a configured remote",
  );
  const ref = `refs/remotes/${remote}/${branch}`;
  git("fetch", "--quiet", remote, `+refs/heads/${branch}:${ref}`);
  const verified = integrations(branch, ref);
  const known = new Set(data.issues.map((issue) => issue.number));
  const integrated = new Set(
    [...verified.integrated].filter((issue) => known.has(issue)),
  );
  const flights = new Set(data.in_flight.map((flight) => flight.issue));
  const occupied = new Set(
    data.in_flight.flatMap((flight) => flight.files_owned),
  );
  const ready: number[] = [];
  const blocked: Blocked[] = [];
  for (const issue of [...data.issues].sort((a, b) => a.number - b.number)) {
    if (integrated.has(issue.number) || flights.has(issue.number)) continue;
    const reasons: string[] = [];
    if (verified.stale.has(issue.number))
      reasons.push(
        "integration_receipt_not_in_epic: reconcile before redispatch",
      );
    if (issue.owner_gated) reasons.push("owner_gate");
    for (const dependency of [...issue.blocked_by].sort((a, b) => a - b)) {
      if (!known.has(dependency))
        reasons.push(`unknown_dependency:${dependency}`);
      else if (!integrated.has(dependency))
        reasons.push(`dependency_not_integrated:${dependency}`);
    }
    const conflicts = issue.files_owned
      .filter((file) => occupied.has(file))
      .sort();
    if (conflicts.length)
      reasons.push(`ownership_conflict:${conflicts.join(",")}`);
    if (flights.size + ready.length >= limit) reasons.push("implementor_limit");
    if (reasons.length) blocked.push({ issue: issue.number, reasons });
    else {
      ready.push(issue.number);
      issue.files_owned.forEach((file) => occupied.add(file));
    }
  }
  return {
    ready,
    blocked,
    integrated: [...integrated].sort((a, b) => a - b),
    in_flight: [...flights].sort((a, b) => a - b),
    complete: integrated.size === data.issues.length && flights.size === 0,
  };
}
if (import.meta.main) {
  try {
    console.log(JSON.stringify(plan(process.argv.slice(2)), null, 2));
  } catch (error: unknown) {
    console.error(
      `readiness: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 2;
  }
}
