import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const script = resolve(import.meta.dir, "../scripts/readiness.ts");
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
interface Receipt {
  issue: number;
  pr: number;
  epic_branch: string;
  merge_commit: string;
  head_sha: string;
  base_sha: string;
}
interface Result {
  ready: number[];
  blocked: { issue: number; reasons: string[] }[];
  integrated: number[];
  in_flight: number[];
  complete: boolean;
}
class Fixture {
  root = realpathSync(mkdtempSync(join(tmpdir(), "epic-readiness-ts-")));
  repo = join(this.root, "repo");
  remote = join(this.root, "remote.git");
  path = join(this.root, "snapshot.json");
  env: NodeJS.ProcessEnv = {
    ...process.env,
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_GLOBAL: "/dev/null",
  };
  initial: string;
  merged: string;
  constructor() {
    for (const key of [
      "EPIC_REMOTE",
      "EPIC_MAX_IMPLEMENTORS",
      "GIT_DIR",
      "GIT_WORK_TREE",
      "GIT_INDEX_FILE",
    ])
      delete this.env[key];
    mkdirSync(this.repo);
    this.git("init", "--initial-branch=trunk");
    this.git("config", "user.email", "test@example.invalid");
    this.git("config", "user.name", "Test");
    writeFileSync(join(this.repo, "a"), "initial");
    this.git("add", "a");
    this.git("commit", "-m", "initial");
    this.initial = this.git("rev-parse", "HEAD");
    this.git("init", "--bare", "--initial-branch=trunk", this.remote);
    this.git("remote", "add", "origin", this.remote);
    this.git("checkout", "-b", "epic/50");
    writeFileSync(join(this.repo, "a"), "integrated");
    this.git("commit", "-am", "child integration");
    this.merged = this.git("rev-parse", "HEAD");
    this.git("push", "origin", "epic/50");
    this.git("checkout", "trunk");
  }
  git(...args: string[]): string {
    const result = spawnSync("git", args, {
      cwd: this.repo,
      env: this.env,
      encoding: "utf8",
    });
    if (result.status !== 0) throw new Error(result.stderr);
    return result.stdout.trim();
  }
  issue(number: number, extra: Partial<Issue> = {}): Issue {
    return {
      number,
      blocked_by: [],
      owner_gated: false,
      files_owned: [`file-${number}`],
      ...extra,
    };
  }
  receipt(issue = 1, extra: Partial<Receipt> = {}): Receipt {
    return {
      issue,
      pr: issue + 100,
      epic_branch: "epic/50",
      merge_commit: this.merged,
      head_sha: this.merged,
      base_sha: this.initial,
      ...extra,
    };
  }
  receipts(...entries: unknown[]): void {
    writeFileSync(
      join(this.repo, ".git/epic-integrations.json"),
      JSON.stringify({ integrations: entries }),
    );
  }
  invoke(issues: unknown[], flights: unknown[] = [], ok = true): string {
    writeFileSync(this.path, JSON.stringify({ issues, in_flight: flights }));
    const result = spawnSync(
      "bun",
      [script, this.path, "--epic-branch", "epic/50"],
      { cwd: this.repo, env: this.env, encoding: "utf8" },
    );
    expect(this.git("branch", "--show-current")).toBe("trunk");
    expect(this.git("rev-parse", "HEAD")).toBe(this.initial);
    if (ok) {
      if (result.status !== 0) throw new Error(result.stderr);
      return result.stdout;
    }
    expect(result.status).not.toBe(0);
    expect(result.stdout).toBe("");
    return result.stderr;
  }
  check(issues: Issue[], flights: Flight[] = []): Result {
    return JSON.parse(this.invoke(issues, flights)) as Result;
  }
}
let f: Fixture;
beforeEach(() => {
  f = new Fixture();
});
afterEach(() => {
  rmSync(f.root, { recursive: true, force: true });
});

describe("dependency readiness", () => {
  test("closed issue alone is not integration evidence", () => {
    const result = f.check([
      f.issue(1, { state: "CLOSED" }),
      f.issue(2, { blocked_by: [1] }),
    ]);
    expect(result.ready).toEqual([1]);
    expect(result.integrated).toEqual([]);
    expect(result.complete).toBe(false);
    expect(result.blocked[0]?.reasons).toContain("dependency_not_integrated:1");
  });
  test("requires receipt branch and ancestry; flights prevent completion", () => {
    f.receipts(f.receipt(), f.receipt(2, { epic_branch: "epic/other" }));
    const result = f.check([f.issue(1), f.issue(2, { blocked_by: [1] })]);
    expect(result.integrated).toEqual([1]);
    expect(result.ready).toEqual([2]);
    f.receipts(f.receipt(), f.receipt(2));
    expect(f.check([f.issue(1), f.issue(2)]).complete).toBe(true);
    const flying = f.check(
      [f.issue(1), f.issue(2)],
      [{ issue: 2, files_owned: ["file-2"] }],
    );
    expect(flying.complete).toBe(false);
    expect(flying.in_flight).toEqual([2]);
  });
  test("stale integration receipt blocks duplicate dispatch", () => {
    f.git("checkout", "-b", "not-integrated");
    writeFileSync(join(f.repo, "a"), "unmerged");
    f.git("commit", "-am", "not on epic");
    const stale = f.git("rev-parse", "HEAD");
    f.git("checkout", "trunk");
    f.receipts(f.receipt(1, { merge_commit: stale }));
    const result = f.check([f.issue(1)]);
    expect(result.complete).toBe(false);
    expect(result.ready).toEqual([]);
    expect(result.blocked[0]?.reasons[0]).toContain(
      "integration_receipt_not_in_epic",
    );
  });
  test("owner gates and unintegrated or unknown dependencies block dispatch", () => {
    const result = f.check([
      f.issue(1, { owner_gated: true }),
      f.issue(2, { blocked_by: [1] }),
      f.issue(3, { blocked_by: [99] }),
    ]);
    expect(result.ready).toEqual([]);
    expect(result.blocked[0]?.reasons).toEqual(["owner_gate"]);
    expect(result.blocked[2]?.reasons).toEqual(["unknown_dependency:99"]);
  });
  test("slots and exact ownership account for flights and newly chosen work", () => {
    const issues = [
      f.issue(4, { files_owned: ["shared"] }),
      f.issue(2, { files_owned: ["shared"] }),
      f.issue(3),
      f.issue(1),
    ];
    const result = f.check(issues, [{ issue: 1, files_owned: ["file-1"] }]);
    expect(result.ready).toEqual([2]);
    expect(result.blocked[0]?.reasons).toContain("implementor_limit");
    expect(result.blocked[1]?.reasons).toContain("ownership_conflict:shared");
    f.env.EPIC_MAX_IMPLEMENTORS = "3";
    const other = f.check(issues, [{ issue: 2, files_owned: ["shared"] }]);
    expect(other.ready).toEqual([1, 3]);
    expect(other.blocked[0]?.reasons).toContain("ownership_conflict:shared");
  });
  test("fetches configured remote and fails closed on missing remote", () => {
    f.git("remote", "rename", "origin", "upstream");
    f.env.EPIC_REMOTE = "upstream";
    expect(f.check([f.issue(1)]).ready).toEqual([1]);
    f.git("remote", "set-url", "upstream", join(f.root, "missing.git"));
    expect(f.invoke([f.issue(1)], [], false)).toContain("fetch");
  });
  test("malformed snapshots fail closed", () => {
    const cases: unknown[][] = [
      [],
      [f.issue(1), f.issue(1)],
      [{ ...f.issue(1), number: true }],
      [{ ...f.issue(1), blocked_by: ["2"] }],
      [{ ...f.issue(1), owner_gated: "false" }],
      [f.issue(1, { files_owned: ["../outside"] })],
      [{ number: 1 }],
      [{ ...f.issue(1), injected: true }],
    ];
    for (const issues of cases) f.invoke(issues, [], false);
    f.invoke([f.issue(1)], [{ issue: 2, files_owned: ["file-2"] }], false);
    f.invoke(
      [f.issue(1)],
      [{ issue: 1, files_owned: ["false-ownership"] }],
      false,
    );
    f.invoke(
      [
        f.issue(1, { files_owned: ["shared"] }),
        f.issue(2, { files_owned: ["shared"] }),
      ],
      [
        { issue: 1, files_owned: ["shared"] },
        { issue: 2, files_owned: ["shared"] },
      ],
      false,
    );
    f.env.EPIC_MAX_IMPLEMENTORS = "0";
    f.invoke([f.issue(1)], [], false);
  });
  test("invalid or unverifiable integration receipts fail closed", () => {
    f.receipts({ issue: 1 });
    f.invoke([f.issue(1)], [], false);
    f.receipts(f.receipt(1, { merge_commit: "f".repeat(40) }));
    f.invoke([f.issue(1)], [], false);
  });
});
