import defu from "defu";
import z from "zod";
import { removeUndefined } from "./utils/objects";
import { log } from "@clack/prompts";

export const CONFIG_SCHEMA = z.object({
  ap: z
    .object({
      ssid: z.string(),
      password: z.string().optional(),
      security: z.enum(["open", "wpa2-psk"]).optional(),
    })
    .transform((data) => ({
      ...data,
      security: data.security ?? (data.password ? "wpa2-psk" : "open"),
    }))
    .superRefine((data, ctx) => {
      if (data.security === "wpa2-psk" && !data.password) {
        ctx.addIssue({
          code: "custom",
          message: "Password required for WPA2-PSK",
        });
      }
    }),
  wifi: z.object({
    ssid: z.string(),
    password: z.string(),
  }),
  interface: z
    .object({
      name: z.string().optional(),
      mac: z.string().optional(),
    })
    .default({}),
});

export type Config = z.infer<typeof CONFIG_SCHEMA>;

export function validateConfig(config: unknown): Config {
  return CONFIG_SCHEMA.parse(config);
}

export async function loadConfig(flags: Record<string, any>): Promise<Config> {
  const flagsConfig: Partial<Config> = removeUndefined({
    ap: {
      ssid: flags.apSsid,
      password: flags.apPassword,
      security: flags.apSecurity,
    },
    wifi: {
      ssid: flags.wifiSsid,
      password: flags.wifiPassword,
    },
    interface: {
      name: flags.interfaceName,
      mac: flags.interfaceMac,
    },
  });

  let fileConfig: Partial<Config> = {};
  if (flags.configFile) {
    const file = Bun.file(flags.configFile);

    const configFileExists = await file.exists();
    const flagsConfigResult = CONFIG_SCHEMA.safeParse(flagsConfig);
    if (!configFileExists) {
      if (flagsConfigResult.success) {
        return flagsConfigResult.data;
      }

      log.error(`Config file not found: ${flags.configFile}`);
      process.exit(1);
    }

    const text = await file.text();
    fileConfig = Bun.YAML.parse(text) ?? {};
  }

  const mergedConfig = defu(flagsConfig, fileConfig);

  try {
    const finalConfig = validateConfig(mergedConfig);
    return finalConfig;
  } catch (err) {
    log.error("Config validation failed");
    process.exit(1);
  }
}
