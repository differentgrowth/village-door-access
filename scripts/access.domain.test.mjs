import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { FIRST_LOCATION_ID } from "../src/lib/access.rules.ts";
import {
  archiveLocationRecord,
  getPublicStateImpl,
  purgeExpiredVisits,
  registerVisitImpl,
} from "../src/lib/access.server.ts";
import { getPrisma } from "../src/lib/db.ts";

const lastLocationError = /al menos una ubicación/;

test("purgeExpiredVisits erases old Visit rows and does not decrement Visit count", async () => {
  await getPublicStateImpl();
  const prisma = getPrisma();
  await prisma.location.update({
    data: { visitCount: 7 },
    where: { id: FIRST_LOCATION_ID },
  });
  const oldId = randomUUID();
  const recentId = randomUUID();
  await prisma.visit.create({
    data: {
      accessCode: "0000",
      id: oldId,
      locationId: FIRST_LOCATION_ID,
      visitedAt: new Date(Date.now() - 91 * 24 * 60 * 60 * 1000),
      visitorName: "Ana Antigua",
    },
  });
  await prisma.visit.create({
    data: {
      accessCode: "0000",
      id: recentId,
      locationId: FIRST_LOCATION_ID,
      visitedAt: new Date(),
      visitorName: "Ana Reciente",
    },
  });

  await purgeExpiredVisits();

  const remaining = await prisma.visit.findMany({
    orderBy: { id: "asc" },
    select: { id: true },
    where: { id: { in: [oldId, recentId] } },
  });
  assert.deepEqual(
    remaining.map((row) => row.id),
    [recentId]
  );
  const count = await prisma.location.findUnique({
    select: { visitCount: true },
    where: { id: FIRST_LOCATION_ID },
  });
  assert.equal(count?.visitCount, 7);
});

test("archiveLocationRecord refuses the last remaining Location", async () => {
  await getPublicStateImpl();
  const prisma = getPrisma();
  await prisma.location.updateMany({ data: { archivedAt: null } });
  const first = await archiveLocationRecord(FIRST_LOCATION_ID);
  assert.equal(first.ok, false);
  if (!first.ok) {
    assert.match(first.error, lastLocationError);
  }
  const stillActive = await prisma.location.count({
    where: { archivedAt: null, id: FIRST_LOCATION_ID },
  });
  assert.equal(stillActive, 1);
});

test("registerVisitImpl persists the Visit and increments Visit count before Notice", async () => {
  await getPublicStateImpl();
  const prisma = getPrisma();
  const before = await prisma.location.findUnique({
    select: { visitCount: true },
    where: { id: FIRST_LOCATION_ID },
  });
  const previous = before?.visitCount ?? 0;
  const name = `Visitante ${Date.now().toString(36).replace(/\d/g, "n")}`;

  process.env.NOTIFY_EMAIL = "operador@example.com";
  process.env.RESEND_API_KEY = "re_test_key";
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = () => {
    fetchCalls += 1;
    throw new Error("resend_down");
  };

  let result;
  try {
    result = await registerVisitImpl({
      locationId: FIRST_LOCATION_ID,
      name,
    });
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.NOTIFY_EMAIL;
    delete process.env.RESEND_API_KEY;
  }

  assert.equal(result.ok, true);
  assert.equal(fetchCalls, 1);
  const rows = await prisma.visit.findMany({
    where: { locationId: FIRST_LOCATION_ID, visitorName: name },
  });
  assert.equal(rows.length, 1);
  const after = await prisma.location.findUnique({
    select: { visitCount: true },
    where: { id: FIRST_LOCATION_ID },
  });
  assert.equal(after?.visitCount, previous + 1);
});

test("getPublicStateImpl does not send a stale Location sticker to another door", async () => {
  const open = await getPublicStateImpl();
  assert.ok(open.selectedLocationId);
  const unknown = await getPublicStateImpl({
    locationId: "00000000-0000-4000-8000-999999999999",
  });
  assert.equal(unknown.selectedLocationId, null);
  assert.ok(unknown.locations.length > 0);
});

test("a repeated name within 90 seconds at the same Location is one Visit", async () => {
  await getPublicStateImpl();
  const prisma = getPrisma();
  const before = await prisma.location.findUnique({
    select: { visitCount: true },
    where: { id: FIRST_LOCATION_ID },
  });
  const previous = before?.visitCount ?? 0;
  const name = `Repetida ${Date.now().toString(36).replace(/\d/g, "n")}`;

  const first = await registerVisitImpl({
    locationId: FIRST_LOCATION_ID,
    name,
  });
  const second = await registerVisitImpl({
    locationId: FIRST_LOCATION_ID,
    name,
  });

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  const rows = await prisma.visit.findMany({
    where: { locationId: FIRST_LOCATION_ID, visitorName: name },
  });
  assert.equal(rows.length, 1);
  const after = await prisma.location.findUnique({
    select: { visitCount: true },
    where: { id: FIRST_LOCATION_ID },
  });
  assert.equal(after?.visitCount, previous + 1);
});
