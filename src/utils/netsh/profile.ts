import { file } from "bun";
import { randomBytes } from "crypto";
import { tmpdir } from "os";
import path from "path";
import { addProfile, removeProfile } from ".";

type SecurityMode = "open" | "wpa2-psk";

type ProfileOptions = {
  ssid: string;
  password?: string;
  security?: SecurityMode;
};

function getSecurityConfig(mode: SecurityMode, password?: string): string {
  if (mode !== "open" && !password) {
    throw new Error(`Password is required for security mode: ${mode}`);
  }

  const configs: Record<SecurityMode, string> = {
    open: `
      <authEncryption>
        <authentication>open</authentication>
        <encryption>none</encryption>
        <useOneX>false</useOneX>
      </authEncryption>`,
    "wpa2-psk": `
      <authEncryption>
        <authentication>WPA2PSK</authentication>
        <encryption>AES</encryption>
        <useOneX>false</useOneX>
      </authEncryption>
      <sharedKey>
        <keyType>passPhrase</keyType>
        <protected>false</protected>
        <keyMaterial>${escapeXml(password ?? "")}</keyMaterial>
      </sharedKey>`,
  };

  return configs[mode];
}

function buildWifiProfileXML(opts: ProfileOptions): string {
  const { ssid, password } = opts;
  const safeSsid = escapeXml(ssid);
  const security: SecurityMode =
    opts.security || (password ? "wpa2-psk" : "open");
  const securityBlock = getSecurityConfig(security, password);

  return `<?xml version="1.0"?>
<WLANProfile xmlns="http://www.microsoft.com/networking/WLAN/profile/v1">
  <name>${safeSsid}</name>
  <SSIDConfig>
    <SSID>
      <name>${safeSsid}</name>
    </SSID>
  </SSIDConfig>
  <connectionType>ESS</connectionType>
  <connectionMode>manual</connectionMode>
  <MSM>
    <security>${securityBlock}</security>
  </MSM>
</WLANProfile>`.trim();
}

export async function createTempWifiProfile(opts: ProfileOptions) {
  const xml = buildWifiProfileXML(opts);

  const nonce = randomBytes(4).toString("hex");
  const filePath = path.join(tmpdir(), `wifi-${nonce}.xml`);
  const fileHandle = file(filePath);

  try {
    await fileHandle.write(xml);
    await addProfile(filePath);

    return {
      xml: xml,
      path: filePath,
      cleanup: async () => {
        await removeProfile(opts.ssid);
      },
    };
  } catch (error) {
    console.error("Error creating WiFi profile:", error);
    throw error;
  } finally {
    if (await fileHandle.exists()) {
      await fileHandle.unlink();
    }
  }
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&"']/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case '"':
        return "&quot;";
      case "'":
        return "&apos;";
      default:
        return c;
    }
  });
}
