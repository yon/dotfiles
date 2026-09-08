import { lstatSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { format, getFileInfo, resolveConfig } from "prettier";

export interface Summary {
  checked: number;
  changed: string[];
  skipped: string[];
}

function git(repo: string, ...args: string[]): string {
  const result = spawnSync("git", ["-C", repo, ...args], { encoding: "utf8" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr.trim() || "Git failed");
  return result.stdout;
}

function regularFile(repo: string, path: string): boolean {
  let current = repo;
  for (const part of path.split("/")) {
    current = join(current, part);
    try {
      if (lstatSync(current).isSymbolicLink()) return false;
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") return false;
      throw error;
    }
  }
  return lstatSync(current).isFile();
}

export async function formatMarkdown(
  mode: "check" | "write",
  repo: string,
  configPath = join(import.meta.dir, "config.json"),
): Promise<Summary> {
  const root = realpathSync(git(repo, "rev-parse", "--show-toplevel").trim());
  const baseConfig = await resolveConfig(join(root, "README.md"), {
    config: resolve(configPath),
    editorconfig: false,
  });
  if (!baseConfig) throw new Error(`Missing Prettier config: ${configPath}`);
  const result: Summary = { checked: 0, changed: [], skipped: [] };
  const edits: { path: string; before: string; after: string }[] = [];
  for (const entry of git(root, "ls-files", "--stage", "-z").split("\0")) {
    if (!entry) continue;
    const separator = entry.indexOf("\t");
    if (separator < 0) throw new Error("Invalid Git index entry");
    const [fileMode, , stage] = entry.slice(0, separator).split(" ");
    const path = entry.slice(separator + 1);
    if (!/\.(md|mdx)$/i.test(path)) continue;
    if (stage !== "0") throw new Error(`Resolve index conflict before formatting: ${path}`);
    if (!["100644", "100755"].includes(fileMode ?? "") || !regularFile(root, path)) {
      result.skipped.push(path);
      continue;
    }
    const fullPath = join(root, path);
    const info = await getFileInfo(fullPath, {
      ignorePath: join(root, ".prettierignore"),
      resolveConfig: false,
    });
    if (info.ignored) {
      result.skipped.push(path);
      continue;
    }
    const before = readFileSync(fullPath, "utf8");
    const config = await resolveConfig(fullPath, {
      config: resolve(configPath),
      editorconfig: false,
    });
    if (!config) throw new Error(`Missing Prettier config: ${configPath}`);
    let after: string;
    try {
      after = await format(before, { ...config, filepath: fullPath });
    } catch (error) {
      throw new Error(`${path}: ${error instanceof Error ? error.message : String(error)}`);
    }
    result.checked++;
    if (before !== after) {
      result.changed.push(path);
      edits.push({ path, before, after });
    }
  }
  // Parse every document before writing; a bad document must not cause a partial format.
  if (mode === "write") {
    for (const edit of edits) {
      if (
        !regularFile(root, edit.path) ||
        readFileSync(join(root, edit.path), "utf8") !== edit.before
      ) {
        throw new Error(`File changed during formatting: ${edit.path}`);
      }
    }
    for (const edit of edits) writeFileSync(join(root, edit.path), edit.after);
  }
  return result;
}

if (import.meta.main) {
  try {
    const args = process.argv.slice(2);
    if (args.length !== 1 || !["--check", "--write"].includes(args[0] ?? "")) {
      throw new Error("Usage: bun .prettier/markdown.ts --check|--write");
    }
    const mode = args[0] === "--write" ? "write" : "check";
    const result = await formatMarkdown(mode, process.cwd());
    for (const path of result.changed)
      console.log(
        `${mode === "write" ? "Formatted" : "Needs formatting"}: ${JSON.stringify(path)}`,
      );
    console.log(
      `Markdown: ${result.checked} checked, ${result.changed.length} ${mode === "write" ? "formatted" : "need formatting"}, ${result.skipped.length} skipped.`,
    );
    if (mode === "check" && result.changed.length) process.exitCode = 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 2;
  }
}
