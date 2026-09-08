# Claude Code with Bedrock

Copy `claude-bedrock.json` to the target repository's `.agents/epic-implement.json`. The skill's
core remains harness independent; this optional adapter provides the former Claude/Bedrock model
choices: Haiku for verification, Sonnet for implementation/red review/hardening and specialists,
Opus for correctness/security/general review. Role names must match `run.sh agent --role`. The
retained escalation alias `fable` is explicit; its availability through your Bedrock account is
unverified. Configure an available alias or inference-profile identifier if needed; no fallback
silently substitutes another model. Settings can supply account-specific alias mappings.

The JSON omits `base_ref`, so repository remote-default resolution applies. `launcher` and `probe`
paths are relative to the configuration directory; the shown `../scripts/...` paths target the
repository root’s `scripts/` directory. Adjust them if your launcher/probe live elsewhere.
`{skill_dir}` refers to this installed skill, and `{home}` to the host home. Bun executes the typed
adapter in `claude-bedrock.ts`. The host runner reads `~/.claude/settings.bedrock.json`, passes the
model and prompt explicitly, selects Bedrock, and uses manual permissions. Noninteractive host work
may stop at permissions that require approval. It never enables permission bypass.

## Isolated execution prerequisites

Provide a repository launcher and isolation probe before using the isolated runner. There is
intentionally no generic launcher or always-passing probe. The launcher receives the epic number;
the probe receives `epic-N`. The probe must check the actual mount, credential, network, and
privilege boundaries. `run.sh` must obtain a passing fresh probe before setting the per-dispatch
`EPIC_ISOLATION_VERIFIED=epic-N` marker used by this adapter. The marker prevents accidental direct
use; it is not a security boundary against an attacker who controls the host environment or
configuration.

Provision Claude, Git, Bedrock access, and a container-local settings file at
`/opt/agent/settings.bedrock.json`, or adjust the example path. Provision an **independent clone**
at `/workspace`, on the same branch and commit as the selected clean host worktree. The adapter
checks branch, commit, and clean status in both environments. It rejects linked `.git` worktree
metadata and never resets, overwrites, synchronizes, or deletes work to make checks pass. The seal
probe must additionally reject bind-mounted host repositories and host Git metadata: filesystem
shape alone cannot establish mount isolation. Do not mount or automatically copy the host's
credential/settings directories. Use your repository's scoped provisioning mechanism for container
credentials.

Configure `--container-workspace` for your layout; host paths are never assumed to exist inside the
container. Concurrent workers need distinct environment workspaces and an explicit matching
transfer/integration workflow. This example uses one `/workspace` clone: run it serially, or
customize that mapping and provisioning before concurrent dispatch. After a worker changes or
commits its clone, deliberately transfer/reconcile the result with the host worktree before another
dispatch. Dirty or divergent resumes fail instead of discarding work.

`--container-cli` defaults to Apple's `container` and can name another executable with the
compatible `exec -i NAME sh -c SCRIPT ...` interface (such as Docker). Arguments and prompts are
passed without shell interpolation or login shells. Only isolated execution selects
`bypassPermissions`.

## Local verification

Run `bun test tests/claude-example.test.ts` from the skill directory. The tests use fake
Claude/container executables and temporary Git repositories to check argv, stdin, settings,
permission modes, and workspace failures. They do not call a model, contact Bedrock, start
containers, or prove actual isolation/authentication. Validate your launcher/probe and account
configuration before live execution.
