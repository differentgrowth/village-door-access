import { existsSync } from "node:fs";
import { register } from "node:module";

if (existsSync(".env.development.local")) {
  process.loadEnvFile(".env.development.local");
}

register(new URL("./alias-hooks.mjs", import.meta.url));
