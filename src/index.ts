import { intro, log, note, outro, select, spinner } from "@clack/prompts";
import { match } from "ts-pattern";
import { version } from "../package.json";
import { loadConfig } from "./config";
import { addCleanup, registerCleanupOnExit } from "./helpers/cleanup";
import { sendWifiCreds, waitForPortal } from "./helpers/esphome";
import { waitForIP } from "./helpers/network";
import { program } from "./program";
import { connectToAP } from "./utils/netsh";
import { createTempWifiProfile } from "./utils/netsh/profile";
import {
  findAdapterByMac,
  findAdapterByName,
  getAdapters,
} from "./utils/network/adapters";
import { task } from "./utils/prompts/spinner-task";
import color from "picocolors";

registerCleanupOnExit();

const flags = program.opts();
const config = await loadConfig(flags);

process.stdout.write("\n");
intro(
  color.bgBlueBright(color.bold(color.black(" Improv // via Captive Portal "))),
);
log.message(color.gray(`Version: ${version}`));
log.message(color.gray(`Config : ${flags.configFile}`), { spacing: 0 });
log.message(color.gray(`Target : ${config.ap.ssid}`), { spacing: 0 });

/* Get Adapter */

const adapters = await getAdapters();
let adapter = match(config.interface)
  .when(
    (i): i is { mac: string } => Boolean(i.mac),
    (i) => findAdapterByMac(adapters, i.mac),
  )
  .when(
    (i): i is { name: string } => Boolean(i.name),
    (i) => findAdapterByName(adapters, i.name),
  )
  .otherwise(() => undefined);

if (!adapter) {
  const selected = await select({
    message: "Select network interface",
    options: adapters.map((a) => ({
      label: `${a.Name} @ ${a.MacAddress}`,
      hint: a.InterfaceDescription,
      value: a.MacAddress,
    })),
  });

  adapter = findAdapterByMac(adapters, selected.toString());
  if (!adapter)
    throw new Error(`Could not selected find adapter ${selected.toString()}`);
}

/* Connect */

await task({
  title: "Connecting to device",
  tasks: [
    {
      title: "Setting up network",
      fn: async () => {
        const profile = await createTempWifiProfile(config.ap);
        addCleanup(profile.cleanup);
      },
    },
    {
      title: "Connecting to AP",
      fn: async () => {
        await connectToAP(adapter.Name, config.ap.ssid);
        await waitForIP(adapter.Name);
      },
    },
    {
      title: "Waiting for Captive Portal",
      fn: async () => {
        await waitForPortal();
      },
    },
  ],
  errorHandler: () => {
    note("Check if Captive Portal AP exists and is reachable", "Note.", {});
    outro("Check AP and try again.");
    process.exit(1);
  },
});

/* Provision */

const spin = spinner();
spin.start("Provisioning device");

try {
  const result = await sendWifiCreds(config.wifi.ssid, config.wifi.password);
  match(result)
    .with("sent", () => {
      spin.clear();
      log.success(
        `Provisioning device\n${color.gray("↳")} ${color.gray("Credentials")} ${color.gray("...")} ${color.green("SENT")}`,
        { spacing: 0 },
      );
    })
    .with("failed", () =>
      spin.error(
        `Provisioning device\n${color.gray("│  ↳")} ${color.red("Unknown error")}`,
      ),
    );

  if (result === "sent") {
    note(
      "Credentials are sent directly to the device,\nwithout any verification of correctness.",
      "Note.",
    );

    outro("Device provisioned, woohoooo 🎉");
  }
} catch (err) {
  if (err instanceof DOMException && err.name === "TimeoutError") {
    spin.error(
      `Provisioning device\n${color.gray("│  ↳")} ${color.red("Timeout occurred")}`,
    );
    note(
      "Sometimes timeout may occure when wifi credentials are wrong.",
      "Note.",
    );
  } else {
    spin.error(
      `Provisioning device\n${color.gray("│  ↳")} ${color.red("Unknown error")}`,
    );
  }

  outro("Check your configuration and try again.");
  process.exit(1);
}
