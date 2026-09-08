import { afterEach, describe, expect, test } from "bun:test";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  chmodSync,
  existsSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const script = resolve(import.meta.dir, "../scripts/seal-verify.sh");
const temporary: string[] = [];
afterEach(() => {
  for (const dir of temporary.splice(0))
    rmSync(dir, { recursive: true, force: true });
});
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "epic-seal-"));
  temporary.push(root);
  const repo = join(root, "repo with spaces");
  mkdirSync(repo);
  const init = spawnSync("git", ["init", "-q", repo]);
  expect(init.status).toBe(0);
  const env = Object.fromEntries(
    Object.entries(process.env).filter(
      ([key]) => !key.startsWith("GIT_") && !key.startsWith("EPIC_SEAL_"),
    ),
  );
  function executable(name: string, body: string) {
    const path = join(repo, name);
    mkdirSync(resolve(path, ".."), { recursive: true });
    writeFileSync(path, "#!/bin/sh\nset -eu\n" + body + "\n");
    chmodSync(path, 0o755);
    return path;
  }
  function run(args = ["42"], cwd = repo) {
    return spawnSync("bash", [script, ...args], { cwd, env, encoding: "utf8" });
  }
  return { repo, env, executable, run };
}
describe("isolation verification", () => {
  test("missing probe fails without launching", () => {
    const f = fixture();
    f.executable("scripts/devcontainer-up.sh", "touch launched");
    expect(f.run().status).toBe(10);
    expect(existsSync(join(f.repo, "launched"))).toBe(false);
  });
  test("nonexecutable probe fails", () => {
    const f = fixture();
    chmodSync(f.executable("scripts/seal-probe.sh", "exit 0"), 0o644);
    expect(f.run().status).toBe(10);
  });
  test("failed probe without launcher fails", () => {
    const f = fixture();
    f.executable("scripts/seal-probe.sh", "exit 1");
    const r = f.run();
    expect(r.status).toBe(14);
    expect(r.stdout).not.toContain("PROBE_PASSED");
  });
  test("failed launcher fails", () => {
    const f = fixture();
    f.executable("scripts/seal-probe.sh", "exit 1");
    f.executable("scripts/devcontainer-up.sh", "exit 9");
    expect(f.run().status).toBe(11);
  });
  test("container liveness cannot replace probe", () => {
    const f = fixture();
    f.executable("scripts/seal-probe.sh", "echo probe >> probes; exit 1");
    f.executable("scripts/devcontainer-up.sh", "touch running");
    expect(f.run().status).toBe(14);
    expect(existsSync(join(f.repo, "running"))).toBe(true);
    expect(readFileSync(join(f.repo, "probes"), "utf8")).toBe("probe\nprobe\n");
  });
  test("launch/probe receives correct arguments from nested directory", () => {
    const f = fixture();
    f.executable(
      "scripts/seal-probe.sh",
      '[ "$1" = epic-42 ]\n[ -f isolated ]',
    );
    f.executable("scripts/devcontainer-up.sh", '[ "$1" = 42 ]\ntouch isolated');
    const nested = join(f.repo, "nested");
    mkdirSync(nested);
    const r = f.run(["42"], nested);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("PROBE_PASSED");
  });
  test("resume rechecks boundaries", () => {
    const f = fixture();
    f.executable(
      "scripts/seal-probe.sh",
      "echo probe >> probes\n[ -f isolated ]",
    );
    writeFileSync(join(f.repo, "isolated"), "");
    expect(f.run().status).toBe(0);
    rmSync(join(f.repo, "isolated"));
    expect(f.run().status).toBe(14);
    expect(readFileSync(join(f.repo, "probes"), "utf8")).toBe("probe\nprobe\n");
  });
  test("valid existing environment skips launcher", () => {
    const f = fixture();
    f.executable("scripts/seal-probe.sh", "exit 0");
    f.executable("scripts/devcontainer-up.sh", "touch launched; exit 1");
    expect(f.run().status).toBe(0);
    expect(existsSync(join(f.repo, "launched"))).toBe(false);
  });
  test("explicit paths override defaults", () => {
    const f = fixture();
    f.executable("scripts/seal-probe.sh", "exit 1");
    f.executable("scripts/devcontainer-up.sh", "exit 1");
    f.executable("custom probe.sh", '[ "$1" = epic-42 ]\n[ -f isolated ]');
    f.env.EPIC_SEAL_PROBE = "custom probe.sh";
    f.env.EPIC_SEAL_LAUNCHER = f.executable(
      "custom launcher.sh",
      '[ "$1" = 42 ]\ntouch isolated',
    );
    expect(f.run().status).toBe(0);
  });
  test("missing explicit probe cannot fall back", () => {
    const f = fixture();
    f.executable("scripts/seal-probe.sh", "exit 0");
    f.env.EPIC_SEAL_PROBE = "missing";
    expect(f.run().status).toBe(10);
  });
  test("invalid numbers and bare image fallback rejected", () => {
    const f = fixture();
    for (const args of [["0"], ["-1"], ["abc"], ["42", "image"]])
      expect(f.run(args).status).toBe(2);
  });
});
