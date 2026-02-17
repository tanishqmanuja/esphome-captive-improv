import { $ } from "bun";

export async function connectToAP(adapter: string, ssid: string) {
  const { exitCode } =
    await $`netsh wlan connect name=${ssid} interface=${adapter}`.quiet();

  if (exitCode !== 0) {
    throw new Error("Failed to connect to WiFi network", { cause: exitCode });
  }
}

export async function addProfile(filePath: string) {
  const { exitCode } =
    await $`netsh wlan add profile filename=${filePath}`.quiet();

  if (exitCode !== 0) {
    throw new Error("Failed to add WiFi profile", { cause: exitCode });
  }
}

export async function removeProfile(ssid: string) {
  const { exitCode } = await $`netsh wlan delete profile name=${ssid}`.quiet();

  if (exitCode !== 0) {
    throw new Error("Failed to remove WiFi profile", { cause: exitCode });
  }
}
