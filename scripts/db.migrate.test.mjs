import assert from "node:assert/strict";
import { test } from "node:test";
import { FIRST_LOCATION_ID } from "../src/lib/access.rules.ts";
import { getPrisma } from "../src/lib/db.ts";

test("migrate deploy leaves the seed Location and records the Prisma migration", async () => {
  const prisma = getPrisma();
  const seed = await prisma.location.findUnique({
    where: { id: FIRST_LOCATION_ID },
  });
  assert.equal(seed?.name, "Acceso 1");
  const applied = await prisma.$queryRaw`
    select migration_name from _prisma_migrations
    order by migration_name
  `;
  assert.ok(
    Array.isArray(applied) &&
      applied.some((row) => row.migration_name === "0001_schema"),
    "expected 0001_schema in _prisma_migrations"
  );
});
