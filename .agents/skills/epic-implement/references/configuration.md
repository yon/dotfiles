# Execution configuration

Run `<skill-dir>/scripts/run.sh OPERATION ...` from the target repository. This thin Bash entrypoint uses TypeScript with Bun and reads `<repository>/.agents/epic-implement.json` automatically, including from a nested working directory. Use `run.sh --config /path/to/config.json OPERATION ...` to select a different file. The override replaces the default; it does not merge with it.

This is the epic-implement skill's configuration format, not a cross-harness standard. Missing default configuration uses `origin`, the remote's advertised default branch, `make check`, and two implementors. An explicit missing config or malformed configuration fails. Missing runner configuration blocks external runner dispatch, not native harness agents for worktree-safe tasks. Isolation always needs a working repository probe.

```json
{
  "remote": "origin",
  "gate": ["make", "check"],
  "max_implementors": 2,
  "models": {},
  "execution": {
    "launcher": "../scripts/devcontainer-up.sh",
    "probe": "../scripts/seal-probe.sh"
  }
}
```

Omit `base_ref` to use the repository's actual default branch. To choose another integration base explicitly, set it to a remote-tracking branch such as `upstream/release`. Issue worktrees still use the epic branch through `worktree create ... --base origin/epic/N-slug`.

`gate` is an argument array, executed from the repository root without a shell. Keep Make targets where the repository provides them. To express a pipeline or environment setup, use an executable repository wrapper rather than embedding shell syntax in JSON.

`models` maps role names to model identifiers understood by the configured runner. The core does not assume any model aliases. `execution.runner` and `execution.isolated_runner` are command argument arrays. Their templates accept `{role}`, `{model}`, `{epic}`, `{environment}` (`epic-N`), `{workspace}`, `{prompt_file}`, `{home}`, and `{skill_dir}`. The runner must consume the prompt file and return a nonzero exit code on failure. Values are individual arguments, not shell source. A `{model}` template requires a configured mapping for that role.

Launcher/probe executable paths resolve relative to the JSON file. A runner executable with a relative path resolves there after template substitution; other relative arguments remain the runner's responsibility. No general environment-variable expansion or arbitrary template evaluation occurs. Credentials belong in the execution environment or credential manager, not in this tracked configuration.

## Isolation contracts

- `execution.probe ENVIRONMENT`: exit 0 only when required task boundaries hold. Run against the actual environment; no cached container-liveness substitute.
- `execution.launcher EPIC_NUMBER`: provision the environment if needed. It owns image/runtime, mounts, firewall, dependency installation, and authorized authentication setup.
- If omitted, the seal helper looks for repository `scripts/seal-probe.sh` and `scripts/devcontainer-up.sh`. No probe means failure. A failed initial probe can invoke the launcher; a fresh successful probe is required afterward.
- Before each isolated runner invocation, `run.sh` repeats the seal check. It then sets `EPIC_ISOLATION_VERIFIED=epic-N` for the adapter. This is an accidental-misuse guard, not a security boundary or proof independent of the repository probe.

The launcher and runner must agree on workspace mapping and result transfer. Independent container clones avoid corrupting host worktree metadata. Provision the right issue branch/revision and push or otherwise reconcile its committed results before host-side review. Multiple implementors require independent workspace mappings; the supplied fixed-workspace example deliberately serializes them.

See [the Claude/Bedrock example](../examples/README.md) for the former skill's model/settings choices moved into configuration and an optional typed adapter. Its host path can be tested without provisioning isolation. An isolated run additionally requires the target repository's launcher, probe, clone, and authentication.

## Commands

```sh
~/.agents/skills/epic-implement/scripts/run.sh show-config
~/.agents/skills/epic-implement/scripts/run.sh --config /path/to/config.json show-config
~/.agents/skills/epic-implement/scripts/run.sh gate
~/.agents/skills/epic-implement/scripts/run.sh seal 123
~/.agents/skills/epic-implement/scripts/run.sh agent --role implementor --epic 123 --workspace /path/to/worktree --prompt-file /tmp/task.md --isolation required
```

The direct shell helpers remain usable with `EPIC_REMOTE`, `EPIC_BASE_REF`, `EPIC_GATE_CMD`, `EPIC_MAX_IMPLEMENTORS`, `EPIC_SEAL_LAUNCHER`, and `EPIC_SEAL_PROBE`. The configured entrypoint clears inherited values for these settings so the selected JSON controls execution. It also clears inherited isolation verification before host execution or reprobes before isolated execution.
