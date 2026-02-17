type CleanupFn = () => Promise<void> | void;
const cleanups = new Set<CleanupFn>();
let isCleaningUp = false;

export async function cleanup() {
  if (isCleaningUp) return;
  isCleaningUp = true;

  const tasks = Array.from(cleanups).reverse();

  const results = await Promise.allSettled(tasks.map((fn) => fn()));

  results.forEach((result, i) => {
    if (result.status === "rejected") {
      console.error(`Cleanup task ${i} failed:`, result.reason);
    }
  });

  cleanups.clear();
}

export function addCleanup(fn: CleanupFn) {
  cleanups.add(fn);
  return () => cleanups.delete(fn);
}

export function removeCleanup(fn: CleanupFn) {
  cleanups.delete(fn);
}

export function registerCleanupOnExit() {
  ["SIGINT", "SIGTERM", "SIGHUP"].forEach((signal) => {
    process.on(signal, async () => {
      await cleanup();
      process.exit(0);
    });
  });

  process.on("uncaughtException", async (err) => {
    await cleanup();
    process.exit(1);
  });
}
