#!/usr/bin/env bun
import { readFileSync } from "node:fs";
import { resolve, join, dirname, posix } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

interface Assignment {
  issue: number;
  path: string;
  branch: string;
  base_branch: string;
  base_ref: string;
  integration: boolean;
  files_owned: string[];
}
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
  requireThat(typeof value === "string", `${label} must be a string`);
  return value;
}
function line(value: unknown, label: string): string {
  const result = text(value, label);
  requireThat(result.trim() && !/[\r\n\0]/.test(result), `invalid ${label}`);
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
function assignment(common: string, issue: number): Assignment {
  const data = object(
    JSON.parse(
      readFileSync(join(common, "epic-worktrees.json"), "utf8"),
    ) as unknown,
    "manifest",
  );
  requireThat(Array.isArray(data.worktrees), "invalid worktree manifest");
  const entries = data.worktrees.map((entry: unknown) =>
    object(entry, "worktree entry"),
  );
  const matches = entries.filter(
    (entry) => entry.issue === issue && entry.integration !== true,
  );
  requireThat(
    matches.length === 1,
    "issue must have exactly one nonintegration worktree entry",
  );
  const entry = matches[0];
  requireThat(entry !== undefined, "missing assignment");
  requireThat(
    Array.isArray(entry.files_owned) && entry.files_owned.length > 0,
    "explicit file ownership is required",
  );
  const owned = entry.files_owned.map((raw: unknown) => {
    const name = line(raw, "owned path");
    requireThat(
      !posix.isAbsolute(name) &&
        !name.split("/").includes("..") &&
        name !== "." &&
        !name.endsWith("/") &&
        !/[\*?\[\]]/.test(name) &&
        posix.normalize(name) === name,
      "ownership must contain exact repository-relative file paths",
    );
    return name;
  });
  requireThat(new Set(owned).size === owned.length, "duplicate owned path");
  for (const other of entries) {
    if (other === entry || other.integration === true) continue;
    requireThat(
      Array.isArray(other.files_owned),
      "invalid ownership in another entry",
    );
    requireThat(
      !other.files_owned.some(
        (path: unknown) => typeof path === "string" && owned.includes(path),
      ),
      "file ownership overlaps another assignment",
    );
  }
  const result: Assignment = {
    issue,
    path: line(entry.path, "worktree path"),
    branch: line(entry.branch, "branch"),
    base_branch: line(entry.base_branch, "base branch"),
    base_ref: line(entry.base_ref, "base ref"),
    integration: false,
    files_owned: owned,
  };
  requireThat(
    result.branch !== result.base_branch,
    "implementation branch cannot be its own base",
  );
  return result;
}
function issueText(number: number): string {
  const issue = object(
    JSON.parse(
      command("gh", [
        "issue",
        "view",
        String(number),
        "--json",
        "number,title,body,comments,url",
      ]),
    ) as unknown,
    "issue",
  );
  requireThat(issue.number === number, "unexpected issue response");
  requireThat(Array.isArray(issue.comments), "issue comments must be a list");
  const blocks = [
    `Title: ${text(issue.title, "issue title")}`,
    `URL: ${text(issue.url, "issue URL")}`,
    text(issue.body, "issue body"),
  ];
  for (const raw of issue.comments) {
    const comment = object(raw as unknown, "comment");
    const author =
      comment.author == null
        ? "unknown"
        : text(object(comment.author, "author").login, "author login");
    blocks.push(`Comment by ${author}:\n${text(comment.body, "comment body")}`);
  }
  return blocks.join("\n\n");
}
export function dispatchPrompt(args: string[]): string {
  requireThat(
    args.length >= 1 && args.length <= 2,
    "usage: dispatch-prompt.sh ISSUE [gate-display]",
  );
  const issue = Number(args[0]);
  requireThat(
    Number.isSafeInteger(issue) && issue > 0,
    "issue number must be positive",
  );
  const gate = args[1] ?? process.env.EPIC_GATE_CMD ?? "make check";
  requireThat(gate.trim(), "gate display cannot be empty");
  const common = resolve(command("git", ["rev-parse", "--git-common-dir"]));
  const entry = assignment(common, issue);
  const values: Record<string, string> = {
    ISSUE_NUMBER: String(issue),
    BRANCH: entry.branch,
    BASE_BRANCH: entry.base_branch,
    BASE_REF: entry.base_ref,
    WORKTREE: entry.path,
    GATE_CMD: gate,
    FILES_OWNED: entry.files_owned.map((path) => "- " + path).join("\n"),
    ISSUE_TEXT: issueText(issue),
  };
  const skill =
    process.env.EPIC_SKILL_DIR ??
    resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const template = readFileSync(
    join(skill, "scripts/dispatch-template.md"),
    "utf8",
  );
  // Replacements are literal task data; inserted tokens are never interpreted again.
  return template.replace(
    /\{\{([A-Z_]+)\}\}/g,
    (_match: string, token: string) => {
      const value = values[token];
      requireThat(value !== undefined, `unknown template placeholder ${token}`);
      return value;
    },
  );
}
if (import.meta.main) {
  try {
    process.stdout.write(dispatchPrompt(process.argv.slice(2)));
  } catch (error: unknown) {
    console.error(
      `dispatch-prompt: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  }
}
