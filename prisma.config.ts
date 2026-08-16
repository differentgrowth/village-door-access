import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";

if (existsSync(".env.development.local")) {
  process.loadEnvFile(".env.development.local");
}

const migrateUrl =
  process.env.DATABASE_URL_UNPOOLED?.trim() ||
  process.env.DIRECT_URL?.trim() ||
  process.env.DATABASE_URL?.trim() ||
  "";

export default defineConfig({
  migrations: {
    path: "prisma/migrations",
  },
  schema: "prisma/schema.prisma",
  ...(migrateUrl ? { datasource: { url: migrateUrl } } : {}),
});
