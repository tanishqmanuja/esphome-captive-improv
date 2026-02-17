import os from "os";
import pRetry from "p-retry";

function getInterfaceIPv4(name: string) {
  const iface = os.networkInterfaces()[name];
  if (!iface) return null;

  return iface.find((i) => i.family === "IPv4" && !i.internal)?.address ?? null;
}

export async function waitForIP(interfaceName: string, timeout = 20_000) {
  let ip: string | null;

  await pRetry(
    async () => {
      ip = getInterfaceIPv4(interfaceName);

      if (!ip) {
        throw new Error("No IP yet");
      }
    },
    {
      retries: Infinity,
      maxRetryTime: timeout,
      minTimeout: 500,
      maxTimeout: 500,
      factor: 1,
    },
  );

  return ip!;
}
