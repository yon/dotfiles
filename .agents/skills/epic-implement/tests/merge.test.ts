import { afterEach, expect, test } from "bun:test";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const BASE = "a".repeat(40),
  HEAD = "b".repeat(40),
  MERGE = "c".repeat(40),
  OTHER = "d".repeat(40);
const script = resolve(import.meta.dir, "../scripts/merge-subpr.ts");
interface Pull {
  number: number;
  state: string;
  mergeable?: string;
  headRefName: string;
  headRefOid: string;
  baseRefName: string;
  mergeCommit?: { oid: string };
  closingIssuesReferences?: { number: number }[];
}
interface State {
  calls: string[][];
  child: Pull;
  parent: Pull;
  mode?: string;
  merge_parent: string;
  compare_status?: string;
}
interface Review {
  pr: number;
  head_sha: string;
  base_sha: string;
  gate_passed: boolean;
  independent_review: boolean;
  findings: { severity: string; status: string }[];
}
interface Fixture {
  root: string;
  env: NodeJS.ProcessEnv;
  state: State;
  review: Review;
}
const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
});
const fake = `import { readFileSync, writeFileSync } from 'node:fs';
interface Pull { state: string; headRefOid: string; mergeCommit?: {oid:string} }
interface State {calls:string[][]; child:Pull; parent:Pull; mode?:string; merge_parent:string; compare_status?:string}
const path=process.env.FAKE_STATE; if(!path) throw Error('missing state');
const s=JSON.parse(readFileSync(path,'utf8')) as State;
const a=process.argv.slice(2); s.calls.push(a); let result:unknown; let code=0;
if(a[0]==='pr'&&a[1]==='view') result=a[2]==='2'?s.child:s.parent;
else if(a[0]==='repo'&&a[1]==='view') result={nameWithOwner:'owner/repo'};
else if(a[0]==='api'&&a[1]?.includes('/commits/')) result={parents:[{sha:s.merge_parent}]};
else if(a[0]==='api'&&a[1]?.includes('/compare/')) result={status:s.compare_status??'identical'};
else if(a[0]==='pr'&&a[1]==='merge') {
 if(a.at(-2)!=='--match-head-commit'||a.at(-1)!==s.child.headRefOid) throw Error('missing pinned head');
 if(s.mode!=='failed'){s.child.state='MERGED';s.child.mergeCommit={oid:'c'.repeat(40)};s.parent.headRefOid='c'.repeat(40)}
 if(s.mode==='failed'||s.mode==='ambiguous') code=1;
} else throw Error(JSON.stringify(a));
writeFileSync(path,JSON.stringify(s));if(result!==undefined) console.log(JSON.stringify(result));process.exit(code);
`;
function quote(value: string): string {
  return "'" + value.replaceAll("'", "'\\''") + "'";
}
function fixture(): Fixture {
  const root = mkdtempSync(join(tmpdir(), "epic-merge-test-"));
  roots.push(root);
  expect(spawnSync("git", ["init", "-q", root]).status).toBe(0);
  const bin = join(root, "bin");
  mkdirSync(bin);
  const helper = join(root, "fake.ts");
  writeFileSync(helper, fake);
  writeFileSync(
    join(bin, "gh"),
    `#!/bin/sh\nexec ${quote(process.execPath)} ${quote(helper)} "$@"\n`,
    { mode: 0o755 },
  );
  return {
    root,
    env: {
      ...process.env,
      PATH: bin + ":" + process.env.PATH,
      FAKE_STATE: join(root, "state.json"),
    },
    state: {
      calls: [],
      merge_parent: BASE,
      child: {
        number: 2,
        state: "OPEN",
        mergeable: "MERGEABLE",
        headRefName: "child",
        headRefOid: HEAD,
        baseRefName: "epic",
        closingIssuesReferences: [],
      },
      parent: {
        number: 1,
        state: "OPEN",
        headRefName: "epic",
        headRefOid: BASE,
        baseRefName: "default",
      },
    },
    review: {
      pr: 2,
      head_sha: HEAD,
      base_sha: BASE,
      gate_passed: true,
      independent_review: true,
      findings: [],
    },
  };
}
function invoke(f: Fixture, status = 0): ReturnType<typeof spawnSync> {
  writeFileSync(join(f.root, "state.json"), JSON.stringify(f.state));
  writeFileSync(join(f.root, "review.json"), JSON.stringify(f.review));
  const result = spawnSync(
    process.execPath,
    [script, "2", "1", "--review", "review.json", "--issue", "20"],
    { cwd: f.root, env: f.env, encoding: "utf8" },
  );
  expect(result.status, String(result.stderr)).toBe(status);
  f.state = JSON.parse(
    readFileSync(join(f.root, "state.json"), "utf8"),
  ) as State;
  return result;
}
function noMerge(f: Fixture): void {
  expect(f.state.calls.some((a) => a[0] === "pr" && a[1] === "merge")).toBe(
    false,
  );
  expect(existsSync(join(f.root, ".git/epic-integrations.json"))).toBe(false);
}
test("verified success and already-merged resume are idempotent", () => {
  const f = fixture();
  invoke(f);
  const file = join(f.root, ".git/epic-integrations.json");
  const before = readFileSync(file, "utf8");
  const manifest = JSON.parse(before) as {
    integrations: { issue: number; merge_commit: string }[];
  };
  expect(manifest.integrations).toHaveLength(1);
  expect(manifest.integrations[0]).toMatchObject({
    issue: 20,
    merge_commit: MERGE,
  });
  f.state.calls = [];
  invoke(f);
  expect(readFileSync(file, "utf8")).toBe(before);
  expect(f.state.calls.some((a) => a[0] === "pr" && a[1] === "merge")).toBe(
    false,
  );
});
test("wrong base blocks", () => {
  const f = fixture();
  f.state.child.baseRefName = "default";
  invoke(f, 1);
  noMerge(f);
});
for (const field of ["child", "parent"] as const)
  test(`stale ${field} SHA blocks`, () => {
    const f = fixture();
    f.state[field].headRefOid = OTHER;
    invoke(f, 1);
    noMerge(f);
  });
for (const field of ["gate_passed", "independent_review"] as const)
  test(`${field} required`, () => {
    const f = fixture();
    f.review[field] = false;
    invoke(f, 1);
    noMerge(f);
  });
for (const [severity, status] of [
  ["high", "open"],
  ["critical", "accepted"],
  ["major", "deferred"],
  ["urgent", "fixed"],
  ["low", "probably_fixed"],
] as const)
  test(`${severity}/${status} blocks`, () => {
    const f = fixture();
    f.review.findings = [{ severity, status }];
    invoke(f, 1);
    noMerge(f);
  });
test("resolved high finding passes", () => {
  const f = fixture();
  f.review.findings = [{ severity: "high", status: "resolved" }];
  invoke(f);
});
test("failed merge records nothing and is not retried", () => {
  const f = fixture();
  f.state.mode = "failed";
  invoke(f, 1);
  expect(
    f.state.calls.filter((a) => a[0] === "pr" && a[1] === "merge"),
  ).toHaveLength(1);
  expect(existsSync(join(f.root, ".git/epic-integrations.json"))).toBe(false);
});
test("ambiguous result reconciles remote success", () => {
  const f = fixture();
  f.state.mode = "ambiguous";
  invoke(f);
});
test("base race requires revalidation after merge", () => {
  const f = fixture();
  f.state.merge_parent = OTHER;
  const result = invoke(f, 1);
  expect(String(result.stderr)).toContain("revalidation required");
  expect(f.state.child.state).toBe("MERGED");
  expect(existsSync(join(f.root, ".git/epic-integrations.json"))).toBe(false);
});
test("already merged but no longer on epic branch blocks", () => {
  const f = fixture();
  f.state.child.state = "MERGED";
  f.state.child.mergeCommit = { oid: MERGE };
  f.state.parent.headRefOid = OTHER;
  f.state.compare_status = "diverged";
  invoke(f, 1);
  noMerge(f);
});
test("unknown mergeability blocks", () => {
  const f = fixture();
  f.state.child.mergeable = "UNKNOWN";
  invoke(f, 1);
  noMerge(f);
});
test("closed parent blocks", () => {
  const f = fixture();
  f.state.parent.state = "MERGED";
  invoke(f, 1);
  noMerge(f);
});
test("explicit issue mismatch blocks", () => {
  const f = fixture();
  f.state.child.closingIssuesReferences = [{ number: 99 }];
  invoke(f, 1);
  noMerge(f);
});
