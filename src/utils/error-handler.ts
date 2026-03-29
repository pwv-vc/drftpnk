import pc from "picocolors";

export function handleCommandError(err: unknown): never {
  console.error(pc.red(String(err instanceof Error ? err.message : err)));
  process.exit(1);
}

export function wrapCommandAction<T extends any[], R>(
  fn: (...args: T) => Promise<void> | void,
): (...args: T) => Promise<void> {
  return async (...args: T) => {
    try {
      await fn(...args);
    } catch (err) {
      handleCommandError(err);
    }
  };
}
