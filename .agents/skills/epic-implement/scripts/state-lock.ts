import {
  closeSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";

function code(error: unknown): string | undefined {
  return error instanceof Error &&
    "code" in error &&
    typeof error.code === "string"
    ? error.code
    : undefined;
}

/** Never steals a stale lock: reconcile the previous process before removing it. */
export function withStateLock<T>(directory: string, action: () => T): T {
  const deadline = Date.now() + 10_000;
  const token = `${process.pid}:${randomUUID()}`;
  while (true) {
    try {
      mkdirSync(directory, { mode: 0o700 });
      break;
    } catch (error: unknown) {
      if (code(error) !== "EEXIST") throw error;
      if (Date.now() >= deadline)
        throw new Error(
          `State lock busy: ${directory}. Reconcile its owning process and any partial operation before manually removing a stale lock.`,
        );
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
    }
  }
  const marker = join(directory, "owner");
  try {
    writeFileSync(marker, token, { flag: "wx", mode: 0o600 });
    return action();
  } finally {
    // Remove only this acquisition; unexpected replacement requires reconciliation.
    if (readFileSync(marker, "utf8") === token) {
      unlinkSync(marker);
      rmdirSync(directory);
    }
  }
}

export function atomicWriteJson(path: string, value: unknown): void {
  const temporary = join(dirname(path), `.epic-state-${randomUUID()}.json`);
  let descriptor: number | undefined;
  let renamed = false;
  try {
    descriptor = openSync(temporary, "wx", 0o600);
    writeFileSync(descriptor, `${JSON.stringify(value, null, 2)}\n`);
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
    renameSync(temporary, path);
    renamed = true;
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
    if (!renamed) {
      try {
        unlinkSync(temporary);
      } catch (error: unknown) {
        if (code(error) !== "ENOENT") throw error;
      }
    }
  }
}
