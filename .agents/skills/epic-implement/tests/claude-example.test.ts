import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseConfig } from "../scripts/run.ts";
const skill = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const adapter = resolve(skill, "examples/claude-bedrock.ts");
interface Log {
  argv: string[];
  stdin: string;
  cwd: string;
  bedrock: string | null;
}
let root: string,
  repo: string,
  settings: string,
  log: string,
  containerLog: string,
  claude: string,
  container: string,
  env: NodeJS.ProcessEnv;
const prompt =
  "Fix the boundary.\nLiteral `echo no` and $(touch no) stay text.\n";
const model = "model with spaces $(touch nope)";
function executable(name: string, code: string): string {
  const path = resolve(root, name);
  writeFileSync(path, "#!/usr/bin/env bun\n" + code);
  chmodSync(path, 0o755);
  return path;
}
function runAdapter(extra: string[] = [], mode = "host") {
  return spawnSync(
    process.execPath,
    [
      adapter,
      "--mode",
      mode,
      "--workspace",
      repo,
      "--settings",
      settings,
      "--model",
      model,
      "--claude",
      claude,
      ...extra,
    ],
    { env, input: prompt, encoding: "utf8" },
  );
}
function git(directory: string, ...args: string[]): string {
  const result = spawnSync("git", ["-C", directory, ...args], {
    env,
    encoding: "utf8",
  });
  expect(result.status).toBe(0);
  return result.stdout.trim();
}
function clone(): string {
  git(repo, "init", "-q");
  writeFileSync(resolve(repo, "code.txt"), "baseline\n");
  git(repo, "add", "code.txt");
  git(
    repo,
    "-c",
    "user.name=Eval",
    "-c",
    "user.email=eval@example.invalid",
    "-c",
    "commit.gpgsign=false",
    "-c",
    "core.hooksPath=/dev/null",
    "commit",
    "-qm",
    "baseline",
  );
  const path = resolve(root, "container workspace");
  expect(
    spawnSync("git", ["clone", "-q", "--no-hardlinks", repo, path], { env })
      .status,
  ).toBe(0);
  env.EPIC_ISOLATION_VERIFIED = "epic-42";
  return path;
}
function isolated(workspace: string, extra: string[] = []) {
  return runAdapter(
    [
      "--environment",
      "epic-42",
      "--container-cli",
      container,
      "--container-workspace",
      workspace,
      ...extra,
    ],
    "isolated",
  );
}
function record(): Log {
  return JSON.parse(readFileSync(log, "utf8")) as Log;
}
beforeEach(() => {
  root = realpathSync(mkdtempSync(resolve(tmpdir(), "epic-claude-example-")));
  repo = resolve(root, "host workspace");
  mkdirSync(repo);
  env = Object.fromEntries(
    Object.entries(process.env).filter(
      ([key]) =>
        !key.startsWith("EPIC_") &&
        !key.startsWith("GIT_") &&
        key !== "CLAUDE_CODE_USE_BEDROCK",
    ),
  );
  log = resolve(root, "claude.json");
  containerLog = resolve(root, "container.json");
  env.EXAMPLE_CLAUDE_LOG = log;
  env.EXAMPLE_CONTAINER_LOG = containerLog;
  settings = resolve(root, "settings bedrock.json");
  writeFileSync(settings, "{}");
  claude = executable(
    "fake claude.ts",
    `import {readFileSync,writeFileSync} from 'node:fs';
writeFileSync(process.env.EXAMPLE_CLAUDE_LOG!,JSON.stringify({argv:process.argv.slice(2),stdin:readFileSync(0,'utf8'),cwd:process.cwd(),bedrock:process.env.CLAUDE_CODE_USE_BEDROCK??null})); process.exit(Number(process.env.EXAMPLE_CLAUDE_EXIT??0));`,
  );
  container = executable(
    "fake container.ts",
    `import {readFileSync,writeFileSync} from 'node:fs'; import {spawnSync} from 'node:child_process';
const args=process.argv.slice(2); if(JSON.stringify(args.slice(0,3))!==JSON.stringify(['exec','-i','epic-42'])) process.exit(91);
writeFileSync(process.env.EXAMPLE_CONTAINER_LOG!,JSON.stringify(args)); const result=spawnSync(args[3]!,args.slice(4),{input:readFileSync(0),stdio:['pipe','inherit','inherit']}); process.exit(result.status??92);`,
  );
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe("Claude/Bedrock example (offline)", () => {
  test("host passes settings/model/argv/stdin with manual permissions", () => {
    const result = runAdapter();
    expect(result.status).toBe(0);
    expect(record()).toEqual({
      argv: [
        "--settings",
        settings,
        "--model",
        model,
        "--permission-mode",
        "manual",
        "--print",
      ],
      stdin: prompt,
      cwd: repo,
      bedrock: "1",
    });
    expect(existsSync(resolve(repo, "nope"))).toBe(false);
  });
  test("prompt-file contents become stdin", () => {
    const file = resolve(root, "prompt.md");
    writeFileSync(file, "Task from file\n");
    expect(runAdapter(["--prompt-file", file]).status).toBe(0);
    expect(record().stdin).toBe("Task from file\n");
  });
  test("missing and invalid settings fail before launching Claude", () => {
    unlinkSync(settings);
    expect(runAdapter().status).toBe(2);
    for (const content of ["not json", "[]", "null"]) {
      writeFileSync(settings, content);
      expect(runAdapter().status).toBe(2);
    }
    expect(existsSync(log)).toBe(false);
  });
  test("missing runner and runner failures remain visible", () => {
    expect(runAdapter(["--claude", resolve(root, "missing")]).status).toBe(2);
    env.EXAMPLE_CLAUDE_EXIT = "7";
    expect(runAdapter().status).toBe(7);
  });
  test("isolated argv, stdin, actual workspace and bypass mode", () => {
    const workspace = clone();
    const result = isolated(workspace);
    expect(result.status).toBe(0);
    expect(record()).toEqual({
      argv: [
        "--settings",
        settings,
        "--model",
        model,
        "--permission-mode",
        "bypassPermissions",
        "--print",
      ],
      stdin: prompt,
      cwd: workspace,
      bedrock: "1",
    });
    const args = JSON.parse(readFileSync(containerLog, "utf8")) as string[];
    expect(args.slice(0, 5)).toEqual(["exec", "-i", "epic-42", "sh", "-c"]);
    expect(args).not.toContain("-l");
    expect(existsSync(resolve(workspace, "nope"))).toBe(false);
  });
  test("isolated adapter requires fresh wrapper marker", () => {
    const workspace = clone();
    delete env.EPIC_ISOLATION_VERIFIED;
    expect(isolated(workspace).status).toBe(2);
    expect(existsSync(containerLog)).toBe(false);
  });
  test("dirty host or container fails without overwriting work", () => {
    const workspace = clone();
    for (const directory of [repo, workspace]) {
      const dirty = resolve(directory, "pending.txt");
      writeFileSync(dirty, "preserve this work");
      expect(isolated(workspace).status).toBe(2);
      expect(readFileSync(dirty, "utf8")).toBe("preserve this work");
      expect(existsSync(log)).toBe(false);
      unlinkSync(dirty);
    }
  });
  test("wrong container branch or revision fails", () => {
    const workspace = clone();
    const branch = git(workspace, "symbolic-ref", "--short", "HEAD");
    git(workspace, "checkout", "-qb", "wrong-branch");
    expect(isolated(workspace).status).toBe(2);
    git(workspace, "checkout", "-q", branch);
    git(
      workspace,
      "-c",
      "user.name=Eval",
      "-c",
      "user.email=eval@example.invalid",
      "-c",
      "commit.gpgsign=false",
      "-c",
      "core.hooksPath=/dev/null",
      "commit",
      "--allow-empty",
      "-qm",
      "different revision",
    );
    expect(isolated(workspace).status).toBe(2);
    expect(existsSync(log)).toBe(false);
  });
  test("missing container workspace or settings fails", () => {
    const workspace = clone();
    expect(isolated(resolve(root, "missing workspace")).status).toBe(2);
    unlinkSync(settings);
    expect(isolated(workspace).status).toBe(2);
    expect(existsSync(log)).toBe(false);
  });
  test("example config dispatches through wrapper with real adapter argv", () => {
    const workspace = clone();
    const path = resolve(root, "execution.json");
    const config = parseConfig(
      JSON.parse(
        readFileSync(resolve(skill, "examples/claude-bedrock.json"), "utf8"),
      ) as unknown,
      path,
    );
    const fakeHome = resolve(root, "home");
    mkdirSync(resolve(fakeHome, ".claude"), { recursive: true });
    writeFileSync(resolve(fakeHome, ".claude/settings.bedrock.json"), "{}");
    env.HOME = fakeHome;
    config.execution.runner?.push("--claude", claude);
    config.execution.probe = executable("probe.ts", "process.exit(0);");
    delete config.execution.launcher;
    config.execution.isolated_runner = [
      process.execPath,
      "{skill_dir}/examples/claude-bedrock.ts",
      "--mode",
      "isolated",
      "--workspace",
      "{workspace}",
      "--environment",
      "{environment}",
      "--container-cli",
      container,
      "--container-workspace",
      workspace,
      "--settings",
      settings,
      "--model",
      "{model}",
      "--prompt-file",
      "{prompt_file}",
      "--claude",
      claude,
    ];
    writeFileSync(path, JSON.stringify(config));
    const task = resolve(root, "task.md");
    writeFileSync(task, prompt);
    for (const isolation of ["worktree", "required"]) {
      env.EPIC_ISOLATION_VERIFIED = "stale";
      const result = spawnSync(
        process.execPath,
        [
          resolve(skill, "scripts/run.ts"),
          "--config",
          path,
          "agent",
          "--role",
          "implementor",
          "--epic",
          "42",
          "--workspace",
          repo,
          "--prompt-file",
          task,
          "--isolation",
          isolation,
        ],
        { cwd: repo, env, encoding: "utf8" },
      );
      expect(result.status).toBe(0);
      expect(record().argv).toContain("sonnet");
      expect(record().stdin).toBe(prompt);
      expect(record().argv).toContain(
        isolation === "required" ? "bypassPermissions" : "manual",
      );
    }
  });
  test("linked worktree metadata is rejected", () => {
    const workspace = clone();
    const linked = resolve(root, "linked");
    git(workspace, "worktree", "add", "--detach", linked);
    const result = isolated(linked);
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("independent container-local clone");
    expect(existsSync(log)).toBe(false);
  });
});
