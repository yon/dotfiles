# Host facts (darwin)

- **Container CLI is Apple `container`, not Docker.** This host runs Apple's
  `container` CLI (Homebrew, `/opt/homebrew/bin/container`); there is no
  Docker daemon, so `docker ...` commands fail even if a docker client binary
  exists. Detect from PATH: prefer `container`, fall back to `docker` only on
  hosts that actually run it.
- **Claude in containers needs Bedrock settings.** A fresh `claude` CLI inside
  a sealed container 403s on a denied inference-profile ARN unless the host's
  `~/.claude/settings.bedrock.json` is copied in AND every invocation passes
  `--settings "$HOME/.claude/settings.bedrock.json"`.
- **gws auth is a credentials file, never a login flow.** The `gws` CLI
  authenticates via the `GOOGLE_WORKSPACE_CLI_CREDENTIALS_FILE` env var
  pointing at a credentials JSON. NEVER run `gws auth login` or
  `gws auth logout`; keyring/token-cache warnings are harmless noise.
- **The git stash is SHARED across all worktrees of a repo. NEVER `git
  stash`.** Concurrent agents cross-contaminate uncommitted changes through
  the shared stash stack. Commit WIP to your own branch instead.
