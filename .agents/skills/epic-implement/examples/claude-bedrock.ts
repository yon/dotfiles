#!/usr/bin/env bun
/** Optional Claude/Bedrock adapter. Repository programs own provisioning. */
import { readFileSync, realpathSync, statSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { homedir } from "node:os";
import { spawnSync } from "node:child_process";
import { parseArgs } from "node:util";

// Constant shell source; every variable argument is passed positionally.
export const containerRun = `
set -eu
workspace=$1
expected_head=$2
expected_branch=$3
settings=$4
claude=$5
model=$6
cd "$workspace" || {
  echo 'Claude example: container workspace is unavailable' >&2; exit 2;
}
[ -d .git ] && [ ! -L .git ] || {
  echo 'Claude example: expected an independent container-local clone' >&2; exit 2;
}
[ "$(git rev-parse --show-toplevel)" = "$(pwd -P)" ] &&
[ "$(git rev-parse HEAD)" = "$expected_head" ] &&
[ "$(git symbolic-ref --quiet --short HEAD)" = "$expected_branch" ] &&
[ -z "$(git status --porcelain --untracked-files=all)" ] || {
  echo 'Claude example: container workspace has wrong revision/branch or uncommitted changes' >&2; exit 2;
}
[ -f "$settings" ] && [ -r "$settings" ] || {
  echo 'Claude example: container settings are missing or unreadable' >&2; exit 2;
}
exec env CLAUDE_CODE_USE_BEDROCK=1 "$claude" --settings "$settings" --model "$model" --permission-mode bypassPermissions --print
`;
export function main(args: string[]): number {
  try {
    const { values } = parseArgs({
      args,
      strict: true,
      allowPositionals: false,
      options: {
        mode: { type: "string" },
        workspace: { type: "string" },
        settings: { type: "string" },
        model: { type: "string" },
        "prompt-file": { type: "string" },
        claude: { type: "string", default: "claude" },
        "container-cli": { type: "string", default: "container" },
        environment: { type: "string" },
        "container-workspace": { type: "string" },
      },
    });
    if (
      !["host", "isolated"].includes(values.mode ?? "") ||
      !values.workspace ||
      !values.settings ||
      !values.model
    )
      throw new Error("mode, workspace, settings, and model are required");
    const workspace = realpathSync(values.workspace);
    if (!statSync(workspace).isDirectory())
      throw new Error("workspace must be a directory");
    const prompt = readFileSync(values["prompt-file"] ?? 0);
    if (prompt.toString().trim().length === 0)
      throw new Error("prompt must not be empty");
    const env = { ...process.env };
    let command: string[];
    if (values.mode === "host") {
      const settings = realpathSync(
        values.settings.startsWith("~/")
          ? resolve(homedir(), values.settings.slice(2))
          : values.settings,
      );
      const content: unknown = JSON.parse(readFileSync(settings, "utf8"));
      if (
        typeof content !== "object" ||
        content === null ||
        Array.isArray(content)
      )
        throw new Error("host settings must be a readable JSON object");
      command = [
        values.claude,
        "--settings",
        settings,
        "--model",
        values.model,
        "--permission-mode",
        "manual",
        "--print",
      ];
      env.CLAUDE_CODE_USE_BEDROCK = "1";
    } else {
      if (!values.environment || values.environment.startsWith("-"))
        throw new Error("isolated mode requires an environment name");
      if (env.EPIC_ISOLATION_VERIFIED !== values.environment)
        throw new Error(
          "isolated mode must follow a fresh seal check through run.sh",
        );
      if (
        !values["container-workspace"] ||
        !isAbsolute(values["container-workspace"]) ||
        !isAbsolute(values.settings)
      )
        throw new Error(
          "container workspace and settings paths must be absolute",
        );
      const git = (...parameters: string[]): string => {
        const result = spawnSync("git", ["-C", workspace, ...parameters], {
          encoding: "utf8",
        });
        if (result.error) throw result.error;
        if (result.status !== 0)
          throw new Error(
            `Host workspace Git check failed: ${parameters.join(" ")}`,
          );
        return result.stdout.trim();
      };
      if (realpathSync(git("rev-parse", "--show-toplevel")) !== workspace)
        throw new Error("host workspace must be the worktree root");
      const branch = git("symbolic-ref", "--quiet", "--short", "HEAD");
      const head = git("rev-parse", "HEAD");
      if (git("status", "--porcelain", "--untracked-files=all"))
        throw new Error(
          "host worktree has uncommitted changes; reconcile explicitly before dispatch",
        );
      command = [
        values["container-cli"],
        "exec",
        "-i",
        values.environment,
        "sh",
        "-c",
        containerRun,
        "claude-bedrock",
        values["container-workspace"],
        head,
        branch,
        values.settings,
        values.claude,
        values.model,
      ];
    }
    const executable = command[0];
    if (!executable) throw new Error("executable is required");
    const result = spawnSync(executable, command.slice(1), {
      cwd: workspace,
      env,
      input: prompt,
      stdio: ["pipe", "inherit", "inherit"],
    });
    if (result.error) throw result.error;
    if (result.signal) throw new Error(`Runner terminated by ${result.signal}`);
    return result.status ?? 2;
  } catch (error) {
    console.error(
      `Claude example: ${error instanceof Error ? error.message : String(error)}`,
    );
    return 2;
  }
}
if (import.meta.main) process.exit(main(process.argv.slice(2)));
