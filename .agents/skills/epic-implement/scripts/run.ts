#!/usr/bin/env bun
/** Repository execution configuration and epic operation dispatch. */
import { readFileSync, realpathSync, statSync, lstatSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { spawnSync } from "node:child_process";
import { parseArgs } from "node:util";

export interface Execution {
  launcher?: string;
  probe?: string;
  runner?: string[];
  isolated_runner?: string[];
}
export interface Config {
  remote: string;
  base_ref?: string;
  gate: string[];
  max_implementors: number;
  models: Record<string, string>;
  execution: Execution;
}
function object(
  value: unknown,
  keys: readonly string[],
  label: string,
): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    throw new Error(`${label} must be an object`);
  const result = value as Record<string, unknown>;
  for (const key of Object.keys(result))
    if (!keys.includes(key)) throw new Error(`Unknown ${label} key: ${key}`);
  return result;
}
function text(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0 || value.includes("\0"))
    throw new Error(`${label} must be a nonempty string`);
  return value;
}
function argv(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.length === 0)
    throw new Error(`${label} must be a nonempty argv array`);
  return (value as unknown[]).map((part) => text(part, label));
}
export function parseConfig(value: unknown, path: string): Config {
  const input = object(
    value,
    ["remote", "base_ref", "gate", "max_implementors", "models", "execution"],
    "config",
  );
  const config: Config = {
    remote: "origin",
    gate: ["make", "check"],
    max_implementors: 2,
    models: {},
    execution: {},
  };
  if ("remote" in input) config.remote = text(input.remote, "remote");
  if ("base_ref" in input) config.base_ref = text(input.base_ref, "base_ref");
  if (config.remote.startsWith("-") || config.base_ref?.startsWith("-"))
    throw new Error("Remote/base_ref cannot start with -");
  if ("gate" in input) config.gate = argv(input.gate, "gate");
  if ("max_implementors" in input) {
    if (
      typeof input.max_implementors !== "number" ||
      !Number.isSafeInteger(input.max_implementors) ||
      input.max_implementors < 1
    )
      throw new Error("max_implementors must be a positive integer");
    config.max_implementors = input.max_implementors;
  }
  if ("models" in input) {
    if (
      typeof input.models !== "object" ||
      input.models === null ||
      Array.isArray(input.models)
    )
      throw new Error("models must map roles to model names");
    for (const [role, model] of Object.entries(
      input.models as Record<string, unknown>,
    )) {
      text(role, "role");
      Object.defineProperty(config.models, role, {
        value: text(model, "model"),
        enumerable: true,
        writable: true,
        configurable: true,
      });
    }
  }
  if ("execution" in input) {
    const execution = object(
      input.execution,
      ["launcher", "probe", "runner", "isolated_runner"],
      "execution",
    );
    for (const key of ["launcher", "probe"] as const)
      if (key in execution)
        config.execution[key] = resolve(
          dirname(path),
          text(execution[key], key),
        );
    for (const key of ["runner", "isolated_runner"] as const)
      if (key in execution) config.execution[key] = argv(execution[key], key);
  }
  return config;
}
function missing(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}
export function loadConfig(
  path: string,
  explicit: boolean,
): { config: Config; loaded: boolean } {
  let data: string;
  try {
    data = readFileSync(path, "utf8");
  } catch (error) {
    if (missing(error) && !explicit) {
      // A broken symlink is a broken configuration, not absent configuration.
      try {
        lstatSync(path);
      } catch (statError) {
        if (missing(statError))
          return { config: parseConfig({}, path), loaded: false };
        throw statError;
      }
    }
    throw error;
  }
  const value: unknown = JSON.parse(data);
  return { config: parseConfig(value, path), loaded: true };
}
export function expand(
  template: string,
  values: Readonly<Record<string, string>>,
): string {
  let output = "";
  for (let index = 0; index < template.length;) {
    const char = template[index];
    if (char === "{") {
      if (template[index + 1] === "{") {
        output += "{";
        index += 2;
        continue;
      }
      const end = template.indexOf("}", index + 1);
      if (end < 0) throw new Error("Unclosed runner placeholder");
      const field = template.slice(index + 1, end);
      if (!Object.hasOwn(values, field))
        throw new Error(`Unsupported runner placeholder: ${field}`);
      const value = values[field];
      if (value === undefined || (field === "model" && value === ""))
        throw new Error(`No configured value for ${field}`);
      output += value;
      index = end + 1;
    } else if (char === "}") {
      if (template[index + 1] !== "}")
        throw new Error("Unmatched runner brace");
      output += "}";
      index += 2;
    } else {
      output += char;
      index += 1;
    }
  }
  return output;
}
function shellQuote(value: string): string {
  return `'${value.replaceAll("'", "'\"'\"'")}'`;
}
function environment(config: Config): NodeJS.ProcessEnv {
  const env = { ...process.env };
  for (const key of [
    "EPIC_REMOTE",
    "EPIC_BASE_REF",
    "EPIC_GATE_CMD",
    "EPIC_MAX_IMPLEMENTORS",
    "EPIC_SEAL_LAUNCHER",
    "EPIC_SEAL_PROBE",
    "EPIC_ISOLATION_VERIFIED",
  ])
    delete env[key];
  env.EPIC_REMOTE = config.remote;
  env.EPIC_GATE_CMD = config.gate.map(shellQuote).join(" ");
  env.EPIC_MAX_IMPLEMENTORS = String(config.max_implementors);
  if (config.base_ref) env.EPIC_BASE_REF = config.base_ref;
  if (config.execution.launcher)
    env.EPIC_SEAL_LAUNCHER = config.execution.launcher;
  if (config.execution.probe) env.EPIC_SEAL_PROBE = config.execution.probe;
  return env;
}
function git(dir: string, ...args: string[]): string {
  const result = spawnSync("git", ["-C", dir, ...args], { encoding: "utf8" });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`Git failed in ${dir}: ${args.join(" ")}`);
  return result.stdout.trim();
}
function invoke(
  command: readonly string[],
  cwd: string,
  env: NodeJS.ProcessEnv,
): number {
  const executable = command[0];
  if (!executable) throw new Error("Empty command");
  const result = spawnSync(executable, command.slice(1), {
    cwd,
    env,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.signal) throw new Error(`Runner terminated by ${result.signal}`);
  return result.status ?? 2;
}
export function main(args: readonly string[]): number {
  try {
    let remaining = [...args];
    let override: string | undefined;
    if (remaining[0] === "--config") {
      const value = remaining[1];
      if (!value || value.startsWith("--"))
        throw new Error("--config requires a path");
      override = value;
      remaining = remaining.slice(2);
    } else if (remaining[0]?.startsWith("--config=")) {
      override = remaining[0].slice("--config=".length);
      if (!override) throw new Error("--config requires a path");
      remaining = remaining.slice(1);
    }
    const operation = remaining[0];
    const opArgs = remaining.slice(1);
    if (operation === "--help" || operation === "-h") {
      console.log(
        "run.sh [--config PATH] worktree|seal|dispatch|merge|readiness|gate|agent|show-config [ARGS]",
      );
      return 0;
    }
    if (!operation) throw new Error("Operation required; use --help");
    const cwd = process.cwd();
    const repo = realpathSync(git(cwd, "rev-parse", "--show-toplevel"));
    const path = override
      ? resolve(cwd, override)
      : resolve(repo, ".agents/epic-implement.json");
    const { config, loaded } = loadConfig(path, override !== undefined);
    const env = environment(config);
    const skill = realpathSync(
      process.env.EPIC_SKILL_DIR ??
        resolve(dirname(fileURLToPath(import.meta.url)), ".."),
    );
    const scripts = resolve(skill, "scripts");
    if (operation === "show-config") {
      if (opArgs.length > 0) throw new Error("show-config takes no arguments");
      console.log(
        JSON.stringify(
          { path, file_loaded: loaded, configuration: config },
          null,
          2,
        ),
      );
      return 0;
    }
    if (operation === "gate") {
      if (opArgs.length > 0)
        throw new Error("gate takes no arguments; configure argv in JSON");
      return invoke(config.gate, repo, env);
    }
    if (operation === "agent") {
      const { values, positionals } = parseArgs({
        args: opArgs,
        strict: true,
        allowPositionals: false,
        options: {
          role: { type: "string" },
          epic: { type: "string" },
          workspace: { type: "string" },
          "prompt-file": { type: "string" },
          isolation: { type: "string", default: "required" },
        },
      });
      const epic = Number(values.epic);
      if (
        positionals.length > 0 ||
        !values.role ||
        !Number.isSafeInteger(epic) ||
        epic < 1 ||
        !values.workspace ||
        !values["prompt-file"] ||
        !["required", "worktree"].includes(values.isolation)
      )
        throw new Error(
          "Agent requires role, positive epic, workspace, prompt-file and valid isolation",
        );
      const workspace = realpathSync(values.workspace);
      const prompt = realpathSync(values["prompt-file"]);
      if (!statSync(workspace).isDirectory() || !statSync(prompt).isFile())
        throw new Error("Workspace must be a directory and prompt-file a file");
      const common = (dir: string): string =>
        realpathSync(resolve(dir, git(dir, "rev-parse", "--git-common-dir")));
      if (common(repo) !== common(workspace))
        throw new Error("Agent workspace belongs to a different repository");
      const template =
        values.isolation === "required"
          ? config.execution.isolated_runner
          : config.execution.runner;
      if (!template)
        throw new Error(
          "Configure the runner for the requested isolation before dispatch",
        );
      const substitutions: Readonly<Record<string, string>> = {
        role: values.role,
        epic: String(epic),
        environment: `epic-${epic}`,
        workspace,
        prompt_file: prompt,
        model: Object.hasOwn(config.models, values.role)
          ? (config.models[values.role] ?? "")
          : "",
        home: homedir(),
        skill_dir: skill,
      };
      const command = template.map((part) => expand(part, substitutions));
      const executable = command[0];
      if (!executable) throw new Error("Empty executable");
      if (executable.includes("/") && !isAbsolute(executable))
        command[0] = resolve(dirname(path), executable);
      if (values.isolation === "required") {
        const status = invoke(
          [resolve(scripts, "seal-verify.sh"), String(epic)],
          repo,
          env,
        );
        if (status !== 0) return status;
        env.EPIC_ISOLATION_VERIFIED = `epic-${epic}`;
      }
      return invoke(command, workspace, env);
    }
    const operations: Readonly<Record<string, string>> = {
      worktree: "worktree.sh",
      seal: "seal-verify.sh",
      dispatch: "dispatch-prompt.sh",
      merge: "merge-subpr.sh",
      readiness: "readiness.sh",
    };
    const script = Object.hasOwn(operations, operation)
      ? operations[operation]
      : undefined;
    if (!script) throw new Error(`Unknown operation: ${operation}`);
    return invoke([resolve(scripts, script), ...opArgs], cwd, env);
  } catch (error) {
    console.error(
      `epic execution: ${error instanceof Error ? error.message : String(error)}`,
    );
    return 2;
  }
}
if (import.meta.main) process.exit(main(process.argv.slice(2)));
