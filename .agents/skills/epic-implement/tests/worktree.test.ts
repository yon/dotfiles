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
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";

const script = resolve(import.meta.dir, "../scripts/worktree.ts");
interface Entry {
  issue: number;
  base_ref: string;
  base_branch: string;
  pr: number | null;
}
class Fixture {
  root = realpathSync(mkdtempSync(join(tmpdir(), "epic-worktree-ts-")));
  repo = join(this.root, "project");
  remote = join(this.root, "remote.git");
  env: NodeJS.ProcessEnv = {
    ...process.env,
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_GLOBAL: "/dev/null",
  };
  before = "";
  constructor() {
    for (const key of [
      "EPIC_BASE_REF",
      "EPIC_REMOTE",
      "GIT_DIR",
      "GIT_WORK_TREE",
      "GIT_INDEX_FILE",
    ])
      delete this.env[key];
    mkdirSync(this.repo);
    this.git("init", "--initial-branch=trunk");
    this.git("config", "user.email", "test@example.invalid");
    this.git("config", "user.name", "Test");
    writeFileSync(join(this.repo, "owned.txt"), "baseline\n");
    writeFileSync(join(this.repo, "other.txt"), "other\n");
    this.git("add", ".");
    this.git("commit", "-m", "initial");
    this.git("init", "--bare", "--initial-branch=trunk", this.remote);
    this.git("remote", "add", "origin", this.remote);
    this.git("push", "-u", "origin", "trunk");
    this.git("branch", "release");
    this.git("push", "origin", "release");
    this.git("checkout", "-b", "personal-work");
    this.before = this.git("rev-parse", "HEAD");
    const bin = join(this.root, "bin");
    mkdirSync(bin);
    const gh = join(bin, "gh");
    writeFileSync(
      gh,
      `#!/usr/bin/env bun\nif(process.env.GH_FAIL==='1')process.exit(7);\nconst args=process.argv.slice(2);\nif(args[1]==='diff'){if(process.env.GH_DIFF_FAIL==='1')process.exit(8);console.log(process.env.GH_FILES??'owned.txt')}\nelse if(args[args.indexOf('--json')+1]!=='state')console.log(JSON.stringify({headRefName:process.env.GH_HEAD??'issue-one',baseRefName:process.env.GH_BASE??'trunk',state:process.env.GH_STATE??'OPEN'}));\nelse console.log(process.env.GH_STATE??'OPEN');\n`,
    );
    chmodSync(gh, 0o755);
    this.env.PATH = `${bin}:${this.env.PATH}`;
  }
  git(...args: string[]): string {
    return this.gitAt(this.repo, ...args);
  }
  gitAt(cwd: string, ...args: string[]): string {
    const result = spawnSync("git", args, {
      cwd,
      env: this.env,
      encoding: "utf8",
    });
    if (result.status !== 0) throw new Error(result.stderr);
    return result.stdout.trim();
  }
  run(args: string[], ok = true, cwd = this.repo): string {
    const result = spawnSync("bun", [script, ...args], {
      cwd,
      env: this.env,
      encoding: "utf8",
    });
    if (ok && result.status !== 0) throw new Error(result.stderr);
    if (!ok) expect(result.status).not.toBe(0);
    expect(this.git("branch", "--show-current")).toBe("personal-work");
    expect(this.git("rev-parse", "HEAD")).toBe(this.before);
    return result.stdout + result.stderr;
  }
  create(issue = "1", branch = "issue-one", files = ["--integration"]): string {
    this.run(["create", issue, branch, ...files]);
    return join(this.root, `project-issue-${issue}`);
  }
  entries(): Entry[] {
    return (
      JSON.parse(
        readFileSync(join(this.repo, ".git/epic-worktrees.json"), "utf8"),
      ) as { worktrees: Entry[] }
    ).worktrees;
  }
}
let f: Fixture;
beforeEach(() => {
  f = new Fixture();
});
afterEach(() => {
  rmSync(f.root, { recursive: true, force: true });
});

describe("worktree lifecycle", () => {
  test("resolves trunk and resumes dirty matching worktree without duplicates or checkout changes", () => {
    const wt = f.create("1", "issue-one", ["owned.txt"]);
    expect(f.entries()[0]?.base_ref).toBe("origin/trunk");
    expect(f.entries()[0]?.base_branch).toBe("trunk");
    writeFileSync(join(wt, "owned.txt"), "WIP\n");
    f.run(["create", "1", "issue-one", "owned.txt"], true, wt);
    expect(f.entries()).toHaveLength(1);
    expect(readFileSync(join(wt, "owned.txt"), "utf8")).toBe("WIP\n");
    f.run(["create", "1", "issue-one", "other.txt"], false);
    f.run(["create", "1", "different", "owned.txt"], false);
  });
  test("uses configured remote, environment base, and explicit base precedence", () => {
    f.git("remote", "rename", "origin", "upstream");
    f.env.EPIC_REMOTE = "upstream";
    f.env.EPIC_BASE_REF = "upstream/release";
    f.create();
    expect(f.entries()[0]?.base_ref).toBe("upstream/release");
    f.create("2", "issue-two", ["--base", "upstream/trunk", "--integration"]);
    expect(f.entries()[1]?.base_ref).toBe("upstream/trunk");
    delete f.env.EPIC_BASE_REF;
    f.create("3", "issue-three");
    expect(f.entries()[2]?.base_ref).toBe("upstream/trunk");
    f.run(
      [
        "create",
        "4",
        "issue-four",
        "--base",
        "upstream/absent",
        "--integration",
      ],
      false,
    );
    expect(f.entries()).toHaveLength(3);
  });
  test("rejects overlapping exact ownership while exempting explicit integration worktree", () => {
    const integration = f.create();
    writeFileSync(join(integration, "aggregated.txt"), "integration");
    f.create("2", "issue-two", ["owned.txt"]);
    f.run(["create", "3", "issue-three", "owned.txt"], false);
    f.run(["check"]);
    expect(f.entries()).toHaveLength(2);
    expect(existsSync(join(f.root, "project-issue-3"))).toBe(false);
  });
  test("does not delete occupied unowned paths or adopt unknown branches", () => {
    const occupied = join(f.root, "project-issue-1");
    mkdirSync(occupied);
    writeFileSync(join(occupied, "precious"), "preserve");
    f.run(["create", "1", "issue-one", "--integration"], false);
    f.run(["destroy", occupied], false);
    expect(readFileSync(join(occupied, "precious"), "utf8")).toBe("preserve");
    f.git("branch", "unknown");
    f.run(["create", "2", "unknown", "--integration"], false);
  });
  test("checks committed, staged, unstaged, and untracked changes without PR", () => {
    const wt = f.create("1", "issue-one", ["owned.txt"]);
    writeFileSync(join(wt, "owned.txt"), "allowed");
    f.run(["check"]);
    writeFileSync(join(wt, "undeclared.txt"), "new");
    f.run(["check"], false);
    unlinkSync(join(wt, "undeclared.txt"));
    writeFileSync(join(wt, "other.txt"), "not owned");
    f.run(["check"], false);
    f.gitAt(wt, "add", "other.txt");
    f.run(["check"], false);
    f.gitAt(wt, "commit", "-m", "undeclared");
    f.run(["check"], false);
  });
  test("registers once and fails closed on PR state and diff errors", () => {
    f.create("1", "issue-one", ["owned.txt"]);
    f.run(["register", "1", "20"]);
    f.run(["register", "1", "20"]);
    expect(f.entries()[0]?.pr).toBe(20);
    f.run(["check"]);
    f.env.GH_FAIL = "1";
    f.run(["check"], false);
    f.run(["create", "2", "issue-two", "other.txt"], false);
    delete f.env.GH_FAIL;
    f.env.GH_DIFF_FAIL = "1";
    f.run(["check"], false);
    delete f.env.GH_DIFF_FAIL;
    f.env.GH_FILES = "other.txt";
    f.run(["check"], false);
    f.env.GH_STATE = "MERGED";
    f.create("2", "issue-two", ["owned.txt"]);
    f.run(["check"]);
  });
  test("rejects mismatched PR base without registration", () => {
    f.create();
    f.env.GH_BASE = "release";
    f.run(["register", "1", "20"], false);
    expect(f.entries()[0]?.pr).toBeNull();
  });
  test("refuses dirty removal then removes clean registered worktree only", () => {
    const wt = f.create("1", "issue-one", ["owned.txt"]);
    writeFileSync(join(wt, "owned.txt"), "WIP");
    f.run(["destroy", wt], false);
    expect(f.entries()).toHaveLength(1);
    f.gitAt(wt, "restore", "owned.txt");
    writeFileSync(join(wt, "untracked.txt"), "save me");
    f.run(["destroy", wt], false);
    unlinkSync(join(wt, "untracked.txt"));
    f.run(["destroy", wt]);
    expect(existsSync(wt)).toBe(false);
    expect(f.entries()).toHaveLength(0);
    f.run(["destroy", f.repo], false);
  });
  test("requires explicit integration exemption and rejects legacy empty ownership", () => {
    f.run(["create", "1", "issue-one"], false);
    f.run(["create", "1", "issue-one", "--integration", "owned.txt"], false);
    f.create();
    const path = join(f.repo, ".git/epic-worktrees.json");
    const data = JSON.parse(readFileSync(path, "utf8")) as {
      worktrees: { integration?: boolean }[];
    };
    const entry = data.worktrees[0];
    if (!entry) throw new Error("Missing fixture entry");
    delete entry.integration;
    writeFileSync(path, JSON.stringify(data));
    f.run(["check"], false);
  });
  test("closed unmerged PR retains ownership", () => {
    f.create("1", "issue-one", ["owned.txt"]);
    f.run(["register", "1", "20"]);
    f.env.GH_STATE = "CLOSED";
    f.run(["create", "2", "issue-two", "owned.txt"], false);
    f.env.GH_FILES = "other.txt";
    f.run(["check"], false);
  });
  test("concurrent creates serialize manifest updates", async () => {
    const pending = [1, 2, 3].map(
      (issue) =>
        new Promise<void>((done, reject) => {
          const child = spawn(
            "bun",
            [
              script,
              "create",
              String(issue),
              `branch-${issue}`,
              "--integration",
            ],
            { cwd: f.repo, env: f.env },
          );
          let error = "";
          child.stderr.on("data", (chunk: Buffer) => {
            error += chunk.toString();
          });
          child.on("error", reject);
          child.on("exit", (code) => {
            if (code === 0) done();
            else reject(new Error(error));
          });
        }),
    );
    await Promise.all(pending);
    expect(
      f
        .entries()
        .map((entry) => entry.issue)
        .sort(),
    ).toEqual([1, 2, 3]);
    f.run(["check"]);
  });
});
