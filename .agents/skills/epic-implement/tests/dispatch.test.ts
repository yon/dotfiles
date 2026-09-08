import { afterEach, expect, test } from "bun:test";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  existsSync,
  rmSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
const script = resolve(import.meta.dir, "../scripts/dispatch-prompt.ts");
interface Assignment {
  issue: number;
  path: string;
  branch: string;
  base_ref?: string;
  base_branch?: string;
  integration: boolean;
  files_owned: string[];
}
interface Issue {
  number: number;
  title: string;
  body: string;
  url: string;
  comments: { author: { login: string }; body: string }[];
}
interface Fixture {
  root: string;
  env: NodeJS.ProcessEnv;
  entry: Assignment;
  entries: Assignment[];
  issue: Issue;
}
const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
});
function quote(value: string): string {
  return "'" + value.replaceAll("'", "'\\''") + "'";
}
function fixture(): Fixture {
  const root = mkdtempSync(join(tmpdir(), "epic-dispatch-test-"));
  roots.push(root);
  expect(spawnSync("git", ["init", "-q", root]).status).toBe(0);
  const bin = join(root, "bin");
  mkdirSync(bin);
  const fake = join(root, "fake.ts");
  writeFileSync(
    fake,
    "import{readFileSync}from'node:fs';if(process.env.FAIL_GH)process.exit(1);if(process.argv.slice(2,5).join(' ')!=='issue view 20')throw Error('wrong command');const p=process.env.FAKE_ISSUE;if(!p)throw Error('missing fixture');console.log(readFileSync(p,'utf8'));\n",
  );
  writeFileSync(
    join(bin, "gh"),
    `#!/bin/sh\nexec ${quote(process.execPath)} ${quote(fake)} "$@"\n`,
    { mode: 0o755 },
  );
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    PATH: bin + ":" + process.env.PATH,
    FAKE_ISSUE: join(root, "issue.json"),
    EPIC_SKILL_DIR: resolve(import.meta.dir, ".."),
  };
  delete env.EPIC_GATE_CMD;
  const entry: Assignment = {
    issue: 20,
    path: join(root, "worker"),
    branch: "fix/20",
    base_ref: "upstream/release",
    base_branch: "release",
    integration: false,
    files_owned: ["src/code.ts", "tests/code.test.ts"],
  };
  return {
    root,
    env,
    entry,
    entries: [entry],
    issue: {
      number: 20,
      title: "Fix boundary",
      body: "Reproduction here.",
      url: "https://example.invalid/issues/20",
      comments: [{ author: { login: "owner" }, body: "Keep old contract." }],
    },
  };
}
function invoke(
  f: Fixture,
  status = 0,
  args: string[] = [],
  manifest = true,
): string {
  writeFileSync(join(f.root, "issue.json"), JSON.stringify(f.issue));
  if (manifest)
    writeFileSync(
      join(f.root, ".git/epic-worktrees.json"),
      JSON.stringify({ worktrees: f.entries }),
    );
  const result = spawnSync(process.execPath, [script, "20", ...args], {
    cwd: f.root,
    env: f.env,
    encoding: "utf8",
  });
  expect(result.status, result.stderr).toBe(status);
  if (status) expect(result.stdout).toBe("");
  return result.stdout;
}
test("renders manifest base, ownership, issue body and comments", () => {
  const f = fixture();
  const output = invoke(f);
  for (const value of [
    "upstream/release",
    "release",
    "fix/20",
    "src/code.ts",
    "tests/code.test.ts",
    "Fix boundary",
    "Reproduction here.",
    "Keep old contract.",
    "https://example.invalid/issues/20",
    "make check",
    "AGENTS.md",
    "no fabricated red",
  ])
    expect(output).toContain(value);
  expect(output).not.toContain("{{");
});
test("inserted placeholders and shell syntax remain literal", () => {
  const f = fixture();
  f.issue.body = "Literal {{BRANCH}} and {{GATE_CMD}} and $(touch surprise)";
  const gate = "make test && echo {{ISSUE_TEXT}}";
  const output = invoke(f, 0, [gate]);
  expect(output).toContain(f.issue.body);
  expect(output).toContain(gate);
  expect(existsSync(join(f.root, "surprise"))).toBe(false);
});
test("argument overrides environment gate", () => {
  const f = fixture();
  f.env.EPIC_GATE_CMD = "make ci";
  expect(invoke(f)).toContain("`make ci`");
  expect(invoke(f, 0, ["make verify"])).toContain("`make verify`");
});
test("missing manifest blocks", () => {
  invoke(fixture(), 1, [], false);
});
test("empty ownership blocks", () => {
  const f = fixture();
  f.entry.files_owned = [];
  invoke(f, 1);
});
test("integration entry cannot be a worker", () => {
  const f = fixture();
  f.entry.integration = true;
  invoke(f, 1);
});
test("ambiguous issue assignment blocks", () => {
  const f = fixture();
  f.entries.push({ ...f.entry });
  invoke(f, 1);
});
test("overlapping ownership blocks", () => {
  const f = fixture();
  f.entries.push({ ...f.entry, issue: 21, branch: "fix/21" });
  invoke(f, 1);
});
for (const field of ["base_ref", "base_branch"] as const)
  test(`missing ${field} blocks`, () => {
    const f = fixture();
    delete f.entry[field];
    invoke(f, 1);
  });
for (const path of ["../escape", "/tmp/outside", "src/*", "src/", "src/./file"])
  test(`invalid owned path ${path} blocks`, () => {
    const f = fixture();
    f.entry.files_owned = [path];
    invoke(f, 1);
  });
test("failed GitHub fetch blocks", () => {
  const f = fixture();
  f.env.FAIL_GH = "1";
  invoke(f, 1);
});
test("wrong issue response blocks", () => {
  const f = fixture();
  f.issue.number = 21;
  invoke(f, 1);
});
