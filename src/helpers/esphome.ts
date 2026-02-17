import pRetry from "p-retry";

const CAPTIVE_PORTAL_IP = "192.168.4.1";

export async function waitForPortal(timeout = 15_000) {
  await pRetry(
    async () => {
      const res = await fetch(`http://${CAPTIVE_PORTAL_IP}`, {
        signal: AbortSignal.timeout(1000),
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Portal not ready");
    },
    {
      maxRetryTime: timeout,
      retries: Infinity,
      minTimeout: 400,
      maxTimeout: 400,
      factor: 1,
    },
  );
}

type ProvisionResult = "sent" | "failed";

export async function sendWifiCreds(
  ssid: string,
  password: string,
): Promise<ProvisionResult> {
  const params = new URLSearchParams({
    ssid,
    psk: password,
  });

  const url = `http://${CAPTIVE_PORTAL_IP}/wifisave?${params}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(5000),
    });

    if (res.status === 302 || res.status === 200) {
      return "sent";
    }

    return "failed";
  } catch (err: any) {
    if (
      err?.message?.includes("reset") ||
      err?.message?.includes("aborted") ||
      err?.message?.includes("ECONNRESET")
    ) {
      return "sent";
    }

    throw err;
  }
}
