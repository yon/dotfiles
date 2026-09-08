import { existsSync, lstatSync, readFileSync, realpathSync } from "node:fs";
import { basename, dirname, isAbsolute, join, posix, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { atomicWriteJson, withStateLock } from "./state-lock.ts";

interface Entry {
  issue: number;
  branch: string;
  path: string;
  files_owned: string[];
  pr: number | null;
  base_ref: string;
  base_branch: string;
  integration: boolean;
}
interface Manifest {
  worktrees: Entry[];
}
interface Worktree {
  path: string;
  branch: string;
}
interface PRDetails {
  headRefName: string;
  baseRefName: string;
  state: string;
}

function requireValue(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
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
function positive(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}
function string(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}
function normalized(value: string): boolean {
  return (
    value !== "." &&
    !value.startsWith("-") &&
    !isAbsolute(value) &&
    posix.normalize(value) === value &&
    !value.split("/").includes("..") &&
    !value.includes("\0")
  );
}
function run(cwd: string, executable: string, args: string[]): string {
  const result = spawnSync(executable, args, { cwd, encoding: "utf8" });
  requireValue(
    !result.error && result.status === 0,
    `${executable} ${args.join(" ")} failed: ${result.error?.message ?? result.stderr}`,
  );
  return result.stdout;
}
function git(cwd: string, ...args: string[]): string {
  return run(cwd, "git", args);
}
function parseEntry(value: unknown): Entry {
  const item = object(value, "worktree entry");
  keys(
    item,
    [
      "issue",
      "branch",
      "path",
      "files_owned",
      "pr",
      "base_ref",
      "base_branch",
      "integration",
    ],
    "worktree entry",
  );
  requireValue(
    positive(item.issue) &&
      string(item.branch) &&
      string(item.path) &&
      isAbsolute(item.path) &&
      string(item.base_ref) &&
      string(item.base_branch) &&
      typeof item.integration === "boolean" &&
      (item.pr === null || positive(item.pr)),
    "Malformed worktree registration; reconcile legacy metadata explicitly",
  );
  const files = item.files_owned;
  requireValue(
    Array.isArray(files) &&
      files.every((file: unknown) => string(file) && normalized(file)),
    "Ownership requires exact normalized relative paths",
  );
  const owned: string[] = files.map((file: unknown) => {
    requireValue(string(file), "Invalid file");
    return file;
  });
  requireValue(
    new Set(owned).size === owned.length,
    "Duplicate file ownership",
  );
  requireValue(
    item.integration === (owned.length === 0),
    "Empty ownership requires explicit integration registration; subissues must declare files",
  );
  return {
    issue: item.issue,
    branch: item.branch,
    path: item.path,
    files_owned: owned,
    pr: item.pr,
    base_ref: item.base_ref,
    base_branch: item.base_branch,
    integration: item.integration,
  };
}
function readManifest(path: string): Manifest {
  if (!existsSync(path)) return { worktrees: [] };
  const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
  const data = object(parsed, "manifest");
  keys(data, ["worktrees"], "manifest");
  requireValue(
    Array.isArray(data.worktrees),
    "Manifest requires worktrees array",
  );
  const entries = data.worktrees.map((item: unknown) => parseEntry(item));
  for (const field of ["issue", "branch", "path"] as const)
    requireValue(
      new Set(entries.map((entry) => entry[field])).size === entries.length,
      `Duplicate worktree ${field}`,
    );
  return { worktrees: entries };
}
function listWorktrees(cwd: string): Worktree[] {
  const result: Worktree[] = [];
  let entry: Worktree = { path: "", branch: "" };
  for (const field of git(cwd, "worktree", "list", "--porcelain", "-z").split(
    "\0",
  )) {
    if (!field) {
      if (entry.path) {
        result.push(entry);
        entry = { path: "", branch: "" };
      }
      continue;
    }
    if (field.startsWith("worktree "))
      entry.path = field.slice("worktree ".length);
    if (field.startsWith("branch "))
      entry.branch = field.slice("branch ".length);
  }
  return result;
}
function validateEntry(entry: Entry, primary: string): void {
  requireValue(
    listWorktrees(primary).some(
      (worktree) =>
        worktree.path === entry.path &&
        worktree.branch === `refs/heads/${entry.branch}`,
    ),
    `Registered worktree missing or branch mismatched: ${entry.path}`,
  );
}
function activeEntries(entries: Entry[], primary: string): Entry[] {
  return entries.filter((entry) => {
    if (entry.pr === null) return true;
    const state = run(primary, "gh", [
      "pr",
      "view",
      String(entry.pr),
      "--json",
      "state",
      "-q",
      ".state",
    ]).trim();
    requireValue(
      ["OPEN", "CLOSED", "MERGED"].includes(state),
      `Unexpected PR state: ${state}`,
    );
    return state !== "MERGED";
  });
}
function overlaps(entries: Entry[]): void {
  const owners = new Map<string, number>();
  for (const entry of entries)
    for (const file of entry.files_owned) {
      requireValue(
        !owners.has(file),
        `OWNERSHIP_VIOLATION: ${file} owned by issues #${owners.get(file)} and #${entry.issue}`,
      );
      owners.set(file, entry.issue);
    }
}
function baseReference(
  explicit: string | undefined,
  primary: string,
): { ref: string; branch: string } {
  const remotes = git(primary, "remote").trim().split("\n");
  let selected = explicit ?? process.env.EPIC_BASE_REF;
  if (selected?.startsWith("refs/remotes/"))
    selected = selected.slice("refs/remotes/".length);
  let remote: string;
  let branch: string;
  if (selected) {
    const matching = remotes
      .filter((item) => selected?.startsWith(`${item}/`))
      .sort((a, b) => b.length - a.length);
    const found = matching[0];
    requireValue(
      found,
      "Base must name a configured remote and branch: remote/branch",
    );
    remote = found;
    branch = selected.slice(remote.length + 1);
  } else {
    remote = process.env.EPIC_REMOTE ?? "origin";
    requireValue(remotes.includes(remote), `Remote ${remote} does not exist`);
    const candidates = git(primary, "ls-remote", "--symref", remote, "HEAD")
      .split("\n")
      .filter(
        (line) =>
          line.startsWith("ref: refs/heads/") && line.endsWith("\tHEAD"),
      );
    requireValue(
      candidates.length === 1 && candidates[0],
      "Cannot determine remote default branch; specify --base",
    );
    branch = candidates[0].slice("ref: refs/heads/".length, -"\tHEAD".length);
    selected = `${remote}/${branch}`;
  }
  git(primary, "check-ref-format", `refs/heads/${branch}`);
  git(
    primary,
    "fetch",
    "--quiet",
    remote,
    `+refs/heads/${branch}:refs/remotes/${remote}/${branch}`,
  );
  git(primary, "rev-parse", "--verify", `refs/remotes/${selected}^{commit}`);
  return { ref: selected, branch };
}
function changedFiles(entry: Entry): Set<string> {
  const changed = new Set<string>();
  for (const args of [
    ["diff", "--name-only", "--no-renames", "-z", `${entry.base_ref}...HEAD`],
    ["diff", "--name-only", "--no-renames", "-z", "HEAD"],
    ["ls-files", "--others", "--exclude-standard", "-z"],
  ]) {
    for (const file of git(entry.path, ...args).split("\0"))
      if (file) changed.add(file);
  }
  return changed;
}
function parsePR(value: unknown): PRDetails {
  const data = object(value, "PR details");
  keys(data, ["headRefName", "baseRefName", "state"], "PR details");
  requireValue(
    string(data.headRefName) && string(data.baseRefName) && string(data.state),
    "Malformed PR details",
  );
  return {
    headRefName: data.headRefName,
    baseRefName: data.baseRefName,
    state: data.state,
  };
}
function number(argument: string | undefined, label: string): number {
  requireValue(
    argument &&
      /^[1-9]\d*$/.test(argument) &&
      Number.isSafeInteger(Number(argument)),
    `${label} must be a positive integer`,
  );
  return Number(argument);
}
function occupied(path: string): boolean {
  try {
    lstatSync(path);
    return true;
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT")
      return false;
    throw error;
  }
}
function operate(args: string[], primary: string, manifestPath: string): void {
  const data = readManifest(manifestPath);
  const entries = data.worktrees;
  const [command, ...rest] = args;
  if (command === "create") {
    const issue = number(rest[0], "Issue");
    const branch = rest[1];
    requireValue(branch && !branch.startsWith("-"), "create requires branch");
    git(primary, "check-ref-format", "--branch", branch);
    let remaining = rest.slice(2);
    let explicit: string | undefined;
    let integration = false;
    while (remaining[0]?.startsWith("--")) {
      if (remaining[0] === "--base" && remaining[1]) {
        explicit = remaining[1];
        remaining = remaining.slice(2);
      } else if (remaining[0] === "--integration") {
        integration = true;
        remaining = remaining.slice(1);
      } else throw new Error("Unknown option or missing --base argument");
    }
    const files = [...new Set(remaining)].sort();
    requireValue(
      files.every((file) => file.length > 0 && normalized(file)),
      "Ownership requires exact normalized relative paths",
    );
    requireValue(
      integration === (files.length === 0),
      "Declare exact owned files, or use --integration with empty ownership",
    );
    const base = baseReference(explicit, primary);
    const path = join(dirname(primary), `${basename(primary)}-issue-${issue}`);
    const expected: Entry = {
      issue,
      branch,
      path,
      files_owned: files,
      pr: null,
      base_ref: base.ref,
      base_branch: base.branch,
      integration,
    };
    const matching = entries.filter(
      (entry) =>
        entry.issue === issue || entry.branch === branch || entry.path === path,
    );
    if (matching.length) {
      const entry = matching[0];
      requireValue(
        matching.length === 1 && entry,
        "Ambiguous worktree registration",
      );
      requireValue(
        entry.issue === issue &&
          entry.branch === branch &&
          entry.path === path &&
          entry.base_ref === base.ref &&
          entry.base_branch === base.branch &&
          entry.integration === integration &&
          JSON.stringify([...entry.files_owned].sort()) ===
            JSON.stringify(files),
        "Existing registration does not match worktree/base/ownership",
      );
      validateEntry(entry, primary);
      overlaps(activeEntries(entries, primary));
      console.log(`Resumed ${path}`);
      return;
    }
    requireValue(
      !occupied(path),
      `Refusing occupied unregistered path: ${path}`,
    );
    requireValue(
      !git(primary, "branch", "--list", branch).trim(),
      `Refusing unregistered existing branch: ${branch}`,
    );
    overlaps([...activeEntries(entries, primary), expected]);
    git(primary, "worktree", "add", "-b", branch, path, base.ref);
    entries.push(expected);
    atomicWriteJson(manifestPath, data);
    console.log(`Created ${path}`);
  } else if (command === "register") {
    requireValue(rest.length === 2, "register requires issue and PR");
    const issue = number(rest[0], "Issue");
    const pr = number(rest[1], "PR");
    const entry = entries.find((item) => item.issue === issue);
    requireValue(entry, "Issue has no registered worktree");
    requireValue(
      entry.pr === null || entry.pr === pr,
      "Issue already registered to another PR",
    );
    const details = parsePR(
      JSON.parse(
        run(primary, "gh", [
          "pr",
          "view",
          String(pr),
          "--json",
          "headRefName,baseRefName,state",
        ]),
      ) as unknown,
    );
    requireValue(
      details.headRefName === entry.branch &&
        details.baseRefName === entry.base_branch &&
        details.state === "OPEN",
      "PR head/base/state does not match registered worktree",
    );
    entry.pr = pr;
    overlaps(activeEntries(entries, primary));
    atomicWriteJson(manifestPath, data);
    console.log(`Registered PR #${pr} for issue #${issue}`);
  } else if (command === "destroy") {
    requireValue(rest.length === 1 && rest[0], "destroy requires path");
    const path = realpathSync(resolve(rest[0]));
    const entry = entries.find((item) => item.path === path);
    requireValue(
      entry && path !== primary,
      "Refusing removal of unowned or primary worktree",
    );
    validateEntry(entry, primary);
    requireValue(
      !git(
        path,
        "status",
        "--porcelain",
        "--untracked-files=all",
        "--ignored",
      ).trim(),
      "Refusing dirty worktree removal, including ignored/untracked files",
    );
    git(primary, "worktree", "remove", path);
    data.worktrees = entries.filter((item) => item !== entry);
    atomicWriteJson(manifestPath, data);
    console.log(`Removed ${path}`);
  } else if (command === "check" && rest.length === 0) {
    requireValue(existsSync(manifestPath), "No ownership manifest");
    const active = activeEntries(entries, primary);
    overlaps(active);
    for (const entry of active) {
      validateEntry(entry, primary);
      if (entry.integration) continue;
      const changed = changedFiles(entry);
      if (entry.pr !== null)
        for (const file of run(primary, "gh", [
          "pr",
          "diff",
          String(entry.pr),
          "--name-only",
        ])
          .trim()
          .split("\n"))
          if (file) changed.add(file);
      const unexpected = [...changed]
        .filter((file) => !entry.files_owned.includes(file))
        .sort();
      requireValue(
        unexpected.length === 0,
        `OWNERSHIP_VIOLATION: issue #${entry.issue} changed undeclared files: ${unexpected.join(", ")}`,
      );
    }
    console.log("Ownership check clean");
  } else throw new Error("Usage: worktree.sh create|register|destroy|check");
}
export function main(args: string[]): void {
  const cwd = process.cwd();
  const common = realpathSync(
    resolve(cwd, git(cwd, "rev-parse", "--git-common-dir").trim()),
  );
  const primary = listWorktrees(cwd)[0]?.path;
  requireValue(primary, "No primary checkout");
  withStateLock(join(common, "epic-worktrees.lock.d"), () => {
    const before = git(primary, "rev-parse", "HEAD", "--abbrev-ref", "HEAD");
    try {
      operate(args, primary, join(common, "epic-worktrees.json"));
    } finally {
      requireValue(
        before === git(primary, "rev-parse", "HEAD", "--abbrev-ref", "HEAD"),
        "PRIMARY_CHECKOUT_DRIFT: branch or HEAD changed",
      );
    }
  });
}
if (import.meta.main) {
  try {
    main(process.argv.slice(2));
  } catch (error: unknown) {
    console.error(
      `worktree: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  }
}
