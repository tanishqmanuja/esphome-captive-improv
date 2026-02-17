import { $ } from "bun";

type NetAdapter = {
  Name: string;
  InterfaceDescription: string;
  Status: string;
  MacAddress: string;
};

export async function getAdapters(): Promise<NetAdapter[]> {
  const cmd =
    "Get-NetAdapter | " +
    "Select-Object Name,InterfaceDescription,Status,MacAddress | " +
    "ConvertTo-Json";
  const json = await $`powershell -NoProfile -Command ${cmd}`.text();

  const parsed = JSON.parse(json);
  return Array.isArray(parsed) ? parsed : [parsed];
}

export async function isConnected(adapterName: string): Promise<boolean> {
  const cmd = `Get-NetAdapter -Name ${adapterName} | Select-Object Status | ConvertTo-Json`;
  const json = await $`powershell -NoProfile -Command ${cmd}`.text();

  const parsed = JSON.parse(json);
  return parsed.Status === "Up";
}

export function findAdapterByName(adapters: NetAdapter[], name: string) {
  return adapters.find((adapter) => adapter.Name === name);
}

export function findAdapterByMac(adapters: NetAdapter[], mac: string) {
  return adapters.find(
    (adapter) => normalizeMac(adapter.MacAddress) === normalizeMac(mac),
  );
}

function normalizeMac(mac: string): string {
  return mac.toLowerCase().replace(/[^a-f0-9]/g, "");
}
