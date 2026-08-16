import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Neon (or any Postgres) when `DATABASE_URL` is set. There is no PGLite
 * fallback — Prisma talks the Postgres protocol only.
 */
function requireDatabaseUrl(): string {
  const url =
    typeof process === "undefined" ? undefined : process.env.DATABASE_URL;
  const trimmed = url?.trim();
  if (!trimmed) {
    throw new Error(
      "DATABASE_URL is required. Point it at Neon or local Postgres."
    );
  }
  return trimmed;
}

const globalRef = globalThis as typeof globalThis & {
  __prisma__?: PrismaClient;
};

function createPrisma(): PrismaClient {
  if (typeof window !== "undefined") {
    throw new Error(
      "@/lib/db is server-only — call getPrisma() from a createServerFn " +
        "handler or a server route loader, never from client code."
    );
  }
  const adapter = new PrismaPg({ connectionString: requireDatabaseUrl() });
  return new PrismaClient({ adapter });
}

/**
 * Shared, **server-only** Prisma Client. Memoized on globalThis so Vite HMR
 * does not open a second pool. Schema lives in `prisma/`; Neon applies it
 * with `prisma migrate deploy` during `pnpm build`.
 */
export function getPrisma(): PrismaClient {
  globalRef.__prisma__ ??= createPrisma();
  return globalRef.__prisma__;
}
