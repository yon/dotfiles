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
- **Installing claude inside a container:** the CLI usually isn't baked into
  sealed images, and `sudo` there is scoped to the firewall script only. Use
  a user-local npm prefix: `npm config set prefix ~/.npm-global &&
  npm install -g @anthropic-ai/claude-code`. After launching an in-container
  claude, read its log output — silent immediate death means auth/config,
  not a crash worth retrying.
- **gws identity is selected by CONFIG DIR, and only by config dir.** This Mac
  has three Google accounts; each `~/.config/gws-config-<email>` dir holds its
  own credentials and token cache, so
  `GOOGLE_WORKSPACE_CLI_CONFIG_DIR=~/.config/gws-config-<email>` is the whole
  identity selector. Do NOT set
  `GOOGLE_WORKSPACE_CLI_CREDENTIALS_FILE`: a `client_secret.json` or cached
  token in the config dir OVERRIDES it, so setting it can silently
  authenticate as the WRONG account (broke djos 2026-07-28). NEVER run
  `gws auth login` / `gws auth logout`; keyring/token-cache warnings are
  harmless noise, but append `2>/dev/null` before parsing gws JSON. An
  `auth_method: none` almost always means CONFIG_DIR points at a path that
  does not exist — fix the path before re-authing.
- **The git stash is SHARED across all worktrees of a repo. NEVER `git
  stash`.** Concurrent agents cross-contaminate uncommitted changes through
  the shared stash stack. Commit WIP to your own branch instead.
- **In-container gate needs a scrubbed env (djos).** The sealed djos container
  bakes `AWS_BEARER_TOKEN_BEDROCK` (and `CLAUDE_CODE_OAUTH_TOKEN`) into every
  exec session; `tests/entrypoints/person-enrich.test.ts` hangs 30s and fails
  when a Bedrock credential is visible (pre-existing env-leak class, see the
  repo's "Gate clean env" note). Inside the container ALWAYS run the gate as:
  `env -u AWS_BEARER_TOKEN_BEDROCK -u CLAUDE_CODE_OAUTH_TOKEN -u DJOS_SOFI_AUTOSEND make check`.
  The claude CLI itself still needs those vars — scrub them ONLY for gate runs.

- **Never demonstrate a network-egress finding by making the request.** A
  reviewer proving that a script can reach the network must do it with a local
  shim (put an executable `curl`/`wget` early on `PATH` that records the
  invocation and exits non-zero) or by reasoning over the source. Observed live
  on eng-ops-dashboard epic #13: a red-stage reviewer demonstrating that an
  acceptance check could not detect an upload ran the constructed script and
  made real requests to an internal production host, from an unsealed machine,
  while reviewing the one issue that had been granted a seal exemption. The
  finding was correct and valuable; the method defeated the containment the
  review existed to protect. Shims prove the same thing and fail closed.
- **A check that greps source order is not evidence of runtime behaviour.**
  Same epic: "the token guard precedes every curl" was verified by comparing
  the line number of the guard string to the line number of the first `curl`.
  It passes on a script that defines the message in a function at the top and
  fires `curl` first. When an acceptance criterion names a runtime property,
  the check has to observe execution.
