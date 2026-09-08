import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { homedir, tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseConfig, expand } from "../scripts/run.ts";

const skill = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const runner = resolve(skill, "scripts/run.ts");
interface Log {
  argv: string[];
  cwd: string;
  marker: string | null;
  remote: string | null;
  base: string | null;
}
const fakeBody = `import {writeFileSync} from 'node:fs';
writeFileSync(process.env.CONFIG_EVAL_LOG!, JSON.stringify({argv:process.argv.slice(2),cwd:process.cwd(),marker:process.env.EPIC_ISOLATION_VERIFIED??null,remote:process.env.EPIC_REMOTE??null,base:process.env.EPIC_BASE_REF??null}));
process.exit(Number(process.env.CONFIG_EVAL_EXIT??0));`;
let root: string,
  repo: string,
  nested: string,
  config: string,
  prompt: string,
  log: string,
  fake: string,
  env: NodeJS.ProcessEnv;
function executable(path: string, body: string): string {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, "#!/usr/bin/env bun\n" + body);
  chmodSync(path, 0o755);
  return path;
}
function writeConfig(value: unknown, path = config): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(value));
}
function wrapper(args: string[], cwd = repo) {
  return spawnSync(process.execPath, [runner, ...args], {
    cwd,
    env,
    encoding: "utf8",
  });
}
function agent(isolation = "worktree", extra: string[] = []) {
  return wrapper([
    "agent",
    "--role",
    "implementor",
    "--epic",
    "42",
    "--workspace",
    repo,
    "--prompt-file",
    prompt,
    "--isolation",
    isolation,
    ...extra,
  ]);
}
function record(): Log {
  return JSON.parse(readFileSync(log, "utf8")) as Log;
}
beforeEach(() => {
  root = realpathSync(mkdtempSync(resolve(tmpdir(), "epic-config-")));
  repo = resolve(root, "repo with spaces");
  nested = resolve(repo, "nested");
  mkdirSync(nested, { recursive: true });
  env = Object.fromEntries(
    Object.entries(process.env).filter(
      ([key]) => !key.startsWith("EPIC_") && !key.startsWith("GIT_"),
    ),
  );
  expect(spawnSync("git", ["init", "-q", repo], { env }).status).toBe(0);
  config = resolve(repo, ".agents/epic-implement.json");
  mkdirSync(dirname(config));
  prompt = resolve(root, "prompt.md");
  writeFileSync(prompt, "A task\n");
  log = resolve(root, "result.json");
  env.CONFIG_EVAL_LOG = log;
  fake = executable(resolve(root, "fake runner.ts"), fakeBody);
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe("configuration", () => {
  test("default discovery from nested directory", () => {
    const result = wrapper(["show-config"], nested);
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      path: config,
      file_loaded: false,
      configuration: { gate: ["make", "check"], remote: "origin" },
    });
    writeConfig({ remote: "upstream", base_ref: "upstream/release" });
    expect(JSON.parse(wrapper(["show-config"], nested).stdout)).toMatchObject({
      file_loaded: true,
      configuration: { remote: "upstream", base_ref: "upstream/release" },
    });
  });
  test("explicit override and missing override", () => {
    writeConfig({ remote: "wrong" });
    const override = resolve(root, "override.json");
    writeConfig({ remote: "chosen" }, override);
    expect(
      JSON.parse(wrapper(["--config", override, "show-config"]).stdout),
    ).toMatchObject({ configuration: { remote: "chosen" } });
    expect(wrapper(["--config", "missing.json", "show-config"]).status).toBe(2);
  });
  test("strict invalid schema and malformed JSON fail", () => {
    for (const value of [
      null,
      [],
      { unknown: 1 },
      { remote: null },
      { remote: "-bad" },
      { gate: "make check" },
      { gate: [] },
      { max_implementors: true },
      { max_implementors: 0 },
      { execution: null },
      { models: { implementor: "" } },
      { execution: { unknown: true } },
      { execution: { runner: "x" } },
      { execution: { probe: [] } },
    ]) {
      expect(() => parseConfig(value, config)).toThrow();
    }
    writeFileSync(config, "{bad json");
    expect(wrapper(["show-config"]).status).toBe(2);
  });
  test("dangling default config fails rather than loading defaults", () => {
    symlinkSync(resolve(root, "missing"), config);
    expect(wrapper(["show-config"]).status).toBe(2);
  });
  test("gate passes literal argv and uses repository root", () => {
    const literal = "$(touch BAD); `touch BAD2` {model}";
    writeConfig({ gate: [fake, literal] });
    expect(wrapper(["gate"], nested).status).toBe(0);
    expect(record()).toMatchObject({ argv: [literal], cwd: repo });
    expect(wrapper(["gate", "ignored"]).status).toBe(2);
  });
  test("model, home, skill and task substitutions", () => {
    writeConfig({
      models: { implementor: "model with spaces" },
      execution: {
        runner: [
          fake,
          "{role}",
          "{epic}",
          "{environment}",
          "{workspace}",
          "{prompt_file}",
          "{model}",
          "{home}",
          "{skill_dir}",
        ],
      },
    });
    expect(agent().status).toBe(0);
    expect(record().argv).toEqual([
      "implementor",
      "42",
      "epic-42",
      repo,
      prompt,
      "model with spaces",
      homedir(),
      skill,
    ]);
  });
  test("executable placeholder expands before relative resolution", () => {
    const fakeHome = resolve(root, "home with spaces");
    executable(resolve(fakeHome, "bin/run"), fakeBody);
    env.HOME = fakeHome;
    writeConfig({ execution: { runner: ["{home}/bin/run", "literal"] } });
    expect(agent().status).toBe(0);
    expect(record().argv).toEqual(["literal"]);
  });
  test("relative executable resolves from config directory", () => {
    executable(resolve(dirname(config), "bin/runner"), fakeBody);
    writeConfig({ execution: { runner: ["bin/runner", "arg"] } });
    expect(agent().status).toBe(0);
    expect(record().argv).toEqual(["arg"]);
  });
  test("unknown placeholders, missing models and missing runners fail", () => {
    for (const part of [
      "{missing}",
      "{model}",
      "{home!r}",
      "{workspace:>20}",
      "{",
      "}",
    ]) {
      writeConfig({ execution: { runner: [fake, part] } });
      expect(agent().status).toBe(2);
    }
    expect(expand("{{literal}}", {})).toBe("{literal}");
    writeConfig({});
    expect(agent().status).toBe(2);
  });
  test("runner errors propagate", () => {
    writeConfig({ execution: { runner: [fake] } });
    env.CONFIG_EVAL_EXIT = "9";
    expect(agent().status).toBe(9);
    writeConfig({ execution: { runner: [resolve(root, "missing runner")] } });
    expect(agent().status).toBe(2);
  });
  test("missing or failed seal prevents dispatch despite stale marker", () => {
    env.EPIC_ISOLATION_VERIFIED = "epic-42";
    writeConfig({ execution: { isolated_runner: [fake] } });
    expect(agent("required").status).not.toBe(0);
    expect(() => record()).toThrow();
    executable(resolve(repo, "scripts/seal-probe.sh"), "process.exit(1);");
    expect(agent("required").status).not.toBe(0);
    expect(() => record()).toThrow();
  });
  test("host marker is cleared; isolated marker follows fresh probe", () => {
    Object.assign(env, {
      EPIC_ISOLATION_VERIFIED: "stale",
      EPIC_REMOTE: "wrong",
      EPIC_BASE_REF: "wrong",
      EPIC_SEAL_PROBE: "wrong",
    });
    const probeLog = resolve(root, "probe.json");
    env.CONFIG_EVAL_PROBE_LOG = probeLog;
    executable(
      resolve(dirname(config), "probe"),
      `import {writeFileSync} from 'node:fs'; writeFileSync(process.env.CONFIG_EVAL_PROBE_LOG!,JSON.stringify({marker:process.env.EPIC_ISOLATION_VERIFIED??null,args:process.argv.slice(2)}));`,
    );
    writeConfig({
      remote: "chosen",
      execution: { probe: "./probe", runner: [fake], isolated_runner: [fake] },
    });
    expect(agent().status).toBe(0);
    expect(record()).toMatchObject({
      marker: null,
      remote: "chosen",
      base: null,
    });
    expect(agent("required").status).toBe(0);
    expect(record().marker).toBe("epic-42");
    expect(JSON.parse(readFileSync(probeLog, "utf8"))).toEqual({
      marker: null,
      args: ["epic-42"],
    });
  });
  test("cross-repository workspace is rejected before probing or dispatch", () => {
    const other = resolve(root, "another-repo");
    mkdirSync(other);
    expect(spawnSync("git", ["init", "-q", other], { env }).status).toBe(0);
    writeConfig({ execution: { runner: [fake] } });
    expect(agent("worktree", ["--workspace", other]).status).toBe(2);
    expect(() => record()).toThrow();
  });
});
