import { Command } from "commander";
import { version } from "../package.json";

const program = new Command();

program
  .name("Improv Captive Portal")
  .description("CLI to send wifi creds to ESPHome device via Captive Portal")
  .version(version, "--version", "Show version")
  .helpOption("-h, --help", "Show help");

program
  .option("--ap-ssid <ssid>", "AP SSID")
  .option("--ap-password <password>", "AP password")
  .option("--wifi-ssid <ssid>", "Wifi SSID")
  .option("--wifi-password <password>", "Wifi password")
  .option("--interface-name <name>", "Network interface name")
  .option("--interface-mac <mac>", "Network interface MAC address")
  .option("-c, --config-file", "Path to yaml config file", "./config.yaml")
  .parse(process.argv);

export { program };
