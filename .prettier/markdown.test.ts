import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { formatMarkdown } from "./markdown";

const scratch: string[] = [];
const unformatted = "# Title\n\n*   first\n*   second\n";

async function git(repo: string, args: string[], input?: string): Promise<string> {
  const process = Bun.spawn(["git", "--literal-pathspecs", "-C", repo, ...args], {
    stdin: input === undefined ? "ignore" : new Blob([input]),
    stdout: "pipe",
    stderr: "pipe",
  });
  const [status, stdout, stderr] = await Promise.all([
    process.exited,
    new Response(process.stdout).text(),
    new Response(process.stderr).text(),
  ]);
  if (status !== 0) throw new Error(`git ${args.join(" ")}: ${stderr}`);
  return stdout;
}

async function fixture(): Promise<{ repo: string; config: string; outer: string }> {
  const outer = await mkdtemp(join(tmpdir(), "markdown-format-test-"));
  scratch.push(outer);
  const repo = join(outer, "repo");
  await mkdir(join(repo, ".prettier"), { recursive: true });
  await git(repo, ["init", "--quiet"]);
  const config = join(repo, ".prettier", "config.json");
  await writeFile(config, JSON.stringify({ proseWrap: "preserve", tabWidth: 2 }));
  await writeFile(join(repo, ".prettierignore"), ".agents/AGENTS.md\n");
  return { repo, config, outer };
}

async function tracked(repo: string, path: string, content = unformatted): Promise<void> {
  await mkdir(dirname(join(repo, path)), { recursive: true });
  await writeFile(join(repo, path), content);
  await git(repo, ["add", "--", path]);
}

afterEach(async () => {
  await Promise.all(scratch.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("tracked Markdown formatting", () => {
  test("check reports changes without writing, then write makes check clean", async () => {
    const { repo } = await fixture();
    await tracked(repo, "README.md");

    const before = await formatMarkdown("check", repo);
    expect(before.checked).toBe(1);
    expect(before.changed).toEqual(["README.md"]);
    expect(await readFile(join(repo, "README.md"), "utf8")).toBe(unformatted);

    expect((await formatMarkdown("write", repo)).changed).toEqual(["README.md"]);
    expect(await readFile(join(repo, "README.md"), "utf8")).not.toBe(unformatted);
    expect((await formatMarkdown("check", repo)).changed).toEqual([]);
  });

  test("formats tracked md and mdx while leaving untracked, non-Markdown and deleted files alone", async () => {
    const { repo, config } = await fixture();
    await tracked(repo, "docs/guide.md");
    await tracked(repo, "docs/page.mdx");
    await tracked(repo, "notes.txt");
    await tracked(repo, "deleted.md");
    await rm(join(repo, "deleted.md"));
    await writeFile(join(repo, "private.md"), unformatted);

    const result = await formatMarkdown("write", repo, config);
    expect(result.changed.sort()).toEqual(["docs/guide.md", "docs/page.mdx"]);
    expect(await readFile(join(repo, "notes.txt"), "utf8")).toBe(unformatted);
    expect(await readFile(join(repo, "private.md"), "utf8")).toBe(unformatted);
    expect(await Bun.file(join(repo, "deleted.md")).exists()).toBe(false);
  });

  test("treats spaces, glob characters and newlines in filenames literally", async () => {
    const { repo, config } = await fixture();
    const path = "docs/odd [draft] *\n.md";
    await tracked(repo, path);
    expect((await formatMarkdown("write", repo, config)).changed).toEqual([path]);
    expect((await formatMarkdown("check", repo, config)).changed).toEqual([]);
  });

  test("never follows a tracked symlink or a substituted symlink parent", async () => {
    const { repo, config, outer } = await fixture();
    const external = join(outer, "external");
    await mkdir(external);
    await writeFile(join(external, "outside.md"), unformatted);
    await symlink(join(external, "outside.md"), join(repo, "link.md"));
    await git(repo, ["add", "--", "link.md"]);
    await tracked(repo, "nested/outside.md");
    await rm(join(repo, "nested"), { recursive: true });
    await symlink(external, join(repo, "nested"));

    expect((await formatMarkdown("write", repo, config)).changed).toEqual([]);
    expect(await readFile(join(external, "outside.md"), "utf8")).toBe(unformatted);
  });

  test("honors ignore patterns relative to the repository including canonical instructions", async () => {
    const { repo, config } = await fixture();
    await writeFile(join(repo, ".prettierignore"), ".agents/AGENTS.md\nvendor/**\n");
    await tracked(repo, ".agents/AGENTS.md");
    await tracked(repo, "vendor/readme.md");
    await tracked(repo, "docs/AGENTS.md");

    expect((await formatMarkdown("write", repo, config)).changed).toEqual(["docs/AGENTS.md"]);
    expect(await readFile(join(repo, ".agents/AGENTS.md"), "utf8")).toBe(unformatted);
    expect(await readFile(join(repo, "vendor/readme.md"), "utf8")).toBe(unformatted);
  });

  test("a configured parser failure prevents partial formatting of otherwise valid files", async () => {
    const { repo, config } = await fixture();
    // Markdown itself is tolerant; a fixture override produces a real parser error.
    await writeFile(
      config,
      JSON.stringify({
        proseWrap: "preserve",
        embeddedLanguageFormatting: "off",
        overrides: [{ files: "z-invalid.mdx", options: { parser: "babel" } }],
      }),
    );
    await tracked(repo, "a-valid.md");
    const invalid = "export const broken = ;\n";
    await tracked(repo, "z-invalid.mdx", invalid);

    await expect(formatMarkdown("write", repo, config)).rejects.toThrow();
    expect(await readFile(join(repo, "a-valid.md"), "utf8")).toBe(unformatted);
    expect(await readFile(join(repo, "z-invalid.mdx"), "utf8")).toBe(invalid);
  });

  test("an unresolved index conflict fails before changing files", async () => {
    const { repo, config } = await fixture();
    await tracked(repo, "a-valid.md");
    await tracked(repo, "conflict.md");
    const sha = (await git(repo, ["rev-parse", ":conflict.md"])).trim();
    await git(
      repo,
      ["update-index", "--index-info"],
      `0 ${"0".repeat(sha.length)}\tconflict.md\n100644 ${sha} 1\tconflict.md\n100644 ${sha} 2\tconflict.md\n`,
    );

    await expect(formatMarkdown("write", repo, config)).rejects.toThrow(/conflict|unmerged/i);
    expect(await readFile(join(repo, "a-valid.md"), "utf8")).toBe(unformatted);
    expect(await readFile(join(repo, "conflict.md"), "utf8")).toBe(unformatted);
  });
});
