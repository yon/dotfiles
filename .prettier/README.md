# Markdown formatting

Install the pinned tools once from the repository root:

```sh
bun install --cwd .prettier --frozen-lockfile
```

- `make markdown-format` formats tracked Markdown and MDX.
- `make markdown-format-check` checks the same files without editing; it fails when formatting is
  needed.

The TypeScript helper uses Git's index so untracked files, runtime state, and symlink aliases are
not traversed. Files removed from the working tree are skipped; unresolved index conflicts fail. New
Markdown participates after it is added to Git.

Settings live in `config.json` and are passed explicitly to Prettier. Prose wraps at a target width
of 100 columns; fenced code contents are preserved. The root `.prettierignore` excludes
`.agents/AGENTS.md` because it contains generated instructions marked “DO NOT EDIT.”

The existing Make default and installation recipes are unchanged. The formatter package is separate
from home-level package manifests. Editors can use `.prettier/config.json` explicitly; the Make
targets define this repository's checked scope.

From this directory, run `bun run typecheck` and `bun test` to verify the helper.
