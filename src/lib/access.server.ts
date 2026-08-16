import { randomInt, randomUUID } from "node:crypto";
import { type Location, Prisma } from "@/generated/prisma/client";
import {
  FIRST_LOCATION_ID,
  FIRST_LOCATION_NAME,
  parseLocationName,
  VISIT_RETENTION_DAYS,
} from "@/lib/access.rules";
import {
  clearAdminSession,
  isAdminSession,
  requireAdmin,
  writeAdminSession,
} from "@/lib/admin-session.server";
import {
  getAdminPassword,
  passwordsMatch,
  readSubmittedPassword,
} from "@/lib/admin-session-token";
import { getPrisma } from "@/lib/db";
import { isEmailConfigured, sendVisitEmail } from "@/lib/email.server";
import { pickPublicLocationId } from "@/lib/location-search";
import type {
  AccessCodeRow,
  AdminAccessState,
  LocationRow,
  PublicAccessState,
  VisitRow,
} from "./access.types";

function randomCode(): string {
  return randomInt(0, 10_000).toString().padStart(4, "0");
}

function toIso(value: Date | string | null | undefined): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
  }
  return new Date().toISOString();
}

function isPrismaCode(err: unknown, code: string): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === code
  );
}

function toLocationRow(row: Location): LocationRow {
  return {
    archived: row.archivedAt !== null,
    id: row.id,
    name: row.name,
  };
}

async function listLocationRecords(opts: {
  includeArchived: boolean;
}): Promise<Location[]> {
  const prisma = getPrisma();
  const byCreatedName = [
    { createdAt: "asc" as const },
    { name: "asc" as const },
  ];
  const active = await prisma.location.findMany({
    orderBy: byCreatedName,
    where: { archivedAt: null },
  });
  if (!opts.includeArchived) {
    return active;
  }
  const archived = await prisma.location.findMany({
    orderBy: byCreatedName,
    where: { archivedAt: { not: null } },
  });
  return [...active, ...archived];
}

function getLocationRecord(id: string): Promise<Location | null> {
  return getPrisma().location.findUnique({ where: { id } });
}

async function ensureOpenHistory(
  locationId: string,
  code: string,
  startedAt: string
) {
  const prisma = getPrisma();
  const open = await prisma.accessCode.findMany({
    orderBy: { startedAt: "desc" },
    where: { endedAt: null, locationId },
  });
  if (open.length > 1) {
    const extras = open.slice(1);
    await prisma.accessCode.updateMany({
      data: { endedAt: new Date() },
      where: { id: { in: extras.map((row) => row.id) } },
    });
    return;
  }
  if (open.length === 1) {
    return;
  }
  try {
    await prisma.accessCode.create({
      data: {
        code,
        id: randomUUID(),
        locationId,
        startedAt: new Date(startedAt),
      },
    });
  } catch (err) {
    if (isPrismaCode(err, "P2002")) {
      return;
    }
    throw err;
  }
}

export async function rotateAccessCode(
  locationId: string
): Promise<{ code: string; rotatedAt: string }> {
  const prisma = getPrisma();
  const current = await prisma.location.findUnique({
    select: { currentCode: true },
    where: { id: locationId },
  });
  let next = randomCode();
  if (current?.currentCode && next === current.currentCode) {
    next = randomCode();
  }
  const historyId = randomUUID();
  return prisma.$transaction(async (tx) => {
    await tx.accessCode.updateMany({
      data: { endedAt: new Date() },
      where: { endedAt: null, locationId },
    });
    const row = await tx.location.update({
      data: { currentCode: next, rotatedAt: new Date() },
      where: { id: locationId },
    });
    if (!row.currentCode) {
      throw new Error("No se pudo crear el código");
    }
    const state = {
      code: row.currentCode,
      rotatedAt: toIso(row.rotatedAt),
    };
    await tx.accessCode.create({
      data: {
        code: state.code,
        id: historyId,
        locationId,
        startedAt: new Date(state.rotatedAt),
      },
    });
    return state;
  });
}

async function ensureLocationReady(location: Location): Promise<Location> {
  if (location.currentCode) {
    await ensureOpenHistory(
      location.id,
      location.currentCode,
      toIso(location.rotatedAt)
    );
    return location;
  }
  await rotateAccessCode(location.id);
  const next = await getLocationRecord(location.id);
  if (!next) {
    throw new Error("No se pudo crear el código");
  }
  return next;
}

async function ensureLocations(): Promise<Location[]> {
  const prisma = getPrisma();
  const existing = await listLocationRecords({ includeArchived: true });
  if (existing.length === 0) {
    await prisma.location.upsert({
      create: { id: FIRST_LOCATION_ID, name: FIRST_LOCATION_NAME },
      update: {},
      where: { id: FIRST_LOCATION_ID },
    });
  }
  const rows = await listLocationRecords({ includeArchived: true });
  const ready: Location[] = [];
  for (const row of rows) {
    // biome-ignore lint/performance/noAwaitInLoops: Rotation must finish per Location
    ready.push(await ensureLocationReady(row));
  }
  return ready;
}

function pickLocation(
  rows: Location[],
  requestedId: string | undefined
): Location | null {
  if (rows.length === 0) {
    return null;
  }
  if (requestedId) {
    const match = rows.find((row) => row.id === requestedId);
    if (match) {
      return match;
    }
  }
  return rows.find((row) => row.archivedAt === null) ?? rows[0] ?? null;
}

const VISITOR_NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]*$/u;

function normalizeName(raw: string): string | { error: string } {
  const name = raw.replace(/\s+/g, " ").trim();
  if (name.length < 2) {
    return { error: "Escribe tu nombre y apellidos." };
  }
  if (name.length > 80) {
    return { error: "El nombre es demasiado largo." };
  }
  if (!VISITOR_NAME_PATTERN.test(name)) {
    return { error: "Usa solo letras, espacios y apóstrofos." };
  }
  return name;
}

export async function purgeExpiredVisits(): Promise<void> {
  await getPrisma().$executeRaw`
    delete from visits
    where visited_at < now() - (${VISIT_RETENTION_DAYS}::text || ' days')::interval
  `;
}

export async function getPublicStateImpl(input?: {
  locationId?: string;
}): Promise<PublicAccessState> {
  await purgeExpiredVisits();
  const all = await ensureLocations();
  const active = all.filter((row) => row.archivedAt === null);
  const selectedId = pickPublicLocationId(
    active.map((row) => row.id),
    input?.locationId
  );
  return {
    emailConfigured: isEmailConfigured(),
    locations: active.map(toLocationRow),
    selectedLocationId: selectedId,
  };
}

export async function getAdminStateImpl(input?: {
  locationId?: string;
}): Promise<AdminAccessState> {
  requireAdmin();
  await purgeExpiredVisits();
  const all = await ensureLocations();
  const selected = pickLocation(all, input?.locationId);
  if (!selected?.currentCode) {
    throw new Error("No hay ubicaciones");
  }
  return {
    archived: selected.archivedAt !== null,
    code: selected.currentCode,
    emailConfigured: isEmailConfigured(),
    locations: all.map(toLocationRow),
    rotatedAt: toIso(selected.rotatedAt),
    selectedLocationId: selected.id,
  };
}

export async function registerVisitImpl(input: {
  name: string;
  locationId: string;
  website?: string;
}): Promise<
  | { ok: true; visitedAt: string; emailSent: boolean; code: string }
  | { ok: false; error: string }
> {
  if (input.website && input.website.trim().length > 0) {
    return { error: "No se ha podido registrar.", ok: false };
  }

  const nameOrError = normalizeName(input.name);
  if (typeof nameOrError !== "string") {
    return { error: nameOrError.error, ok: false };
  }

  await ensureLocations();
  const location = await getLocationRecord(input.locationId);
  if (!location || location.archivedAt !== null || !location.currentCode) {
    return { error: "Esa ubicación no está disponible.", ok: false };
  }

  const prisma = getPrisma();
  const recent = await prisma.$queryRaw<[{ n: number }]>`
    select count(*)::int as n from visits
    where visitor_name = ${nameOrError}
      and location_id = ${location.id}
      and visited_at > now() - interval '90 seconds'
  `;
  if ((recent[0]?.n ?? 0) > 0) {
    return {
      code: location.currentCode,
      emailSent: false,
      ok: true,
      visitedAt: new Date().toISOString(),
    };
  }

  const id = randomUUID();
  const visitedAt = new Date().toISOString();

  await purgeExpiredVisits();
  await prisma.visit.create({
    data: {
      accessCode: location.currentCode,
      emailError: null,
      emailSent: false,
      id,
      locationId: location.id,
      visitedAt: new Date(visitedAt),
      visitorName: nameOrError,
    },
  });
  await prisma.location.update({
    data: { visitCount: { increment: 1 } },
    where: { id: location.id },
  });

  const mail = await sendVisitEmail({
    code: location.currentCode,
    locationName: location.name,
    name: nameOrError,
    visitedAt,
  });
  if (mail.sent || (mail.error && mail.error !== "not_configured")) {
    await prisma.visit.update({
      data: {
        emailError:
          mail.error && mail.error !== "not_configured" ? mail.error : null,
        emailSent: mail.sent,
      },
      where: { id },
    });
  }

  return {
    code: location.currentCode,
    emailSent: mail.sent,
    ok: true,
    visitedAt,
  };
}

export function getAdminSessionImpl() {
  return {
    emailConfigured: isEmailConfigured(),
    ok: isAdminSession(),
  };
}

export function adminLoginImpl(input: {
  password: string;
}): { ok: true } | { ok: false; error: string } {
  const parsed = readSubmittedPassword(input.password);
  if (typeof parsed !== "string") {
    return { error: parsed.error, ok: false };
  }
  if (!passwordsMatch(parsed, getAdminPassword())) {
    return { error: "Contraseña incorrecta.", ok: false };
  }
  writeAdminSession();
  return { ok: true };
}

export function adminLogoutImpl() {
  clearAdminSession();
  return { ok: true as const };
}

export async function rotateCodeImpl(input: {
  locationId: string;
}): Promise<{ code: string; rotatedAt: string }> {
  requireAdmin();
  await ensureLocations();
  const location = await getLocationRecord(input.locationId);
  if (!location) {
    throw new Error("Esa ubicación no existe.");
  }
  if (location.archivedAt !== null) {
    throw new Error("Restaura la ubicación antes de rotar el código.");
  }
  return rotateAccessCode(location.id);
}

export async function listVisitsImpl(input: {
  locationId: string;
}): Promise<{ visits: VisitRow[]; todayCount: number; totalCount: number }> {
  requireAdmin();
  await purgeExpiredVisits();
  const prisma = getPrisma();
  const rows = await prisma.visit.findMany({
    orderBy: { visitedAt: "desc" },
    take: 150,
    where: { locationId: input.locationId },
  });

  const today = await prisma.$queryRaw<[{ n: number }]>`
    select count(*)::int as n from visits
    where location_id = ${input.locationId}
      and (visited_at at time zone 'Europe/Madrid')::date
        = (now() at time zone 'Europe/Madrid')::date
  `;
  const lifetime = await prisma.location.findUnique({
    select: { visitCount: true },
    where: { id: input.locationId },
  });
  return {
    todayCount: today[0]?.n ?? 0,
    totalCount: lifetime?.visitCount ?? 0,
    visits: rows.map((row) => ({
      code: row.accessCode,
      emailSent: row.emailSent,
      id: row.id,
      name: row.visitorName,
      visitedAt: toIso(row.visitedAt),
    })),
  };
}

export async function listAccessCodesImpl(input: {
  locationId: string;
}): Promise<{ codes: AccessCodeRow[] }> {
  requireAdmin();
  await ensureLocations();
  const rows = await getPrisma().accessCode.findMany({
    orderBy: { startedAt: "desc" },
    take: 80,
    where: { locationId: input.locationId },
  });
  return {
    codes: rows.map((row) => ({
      code: row.code,
      endedAt: row.endedAt === null ? null : toIso(row.endedAt),
      id: row.id,
      startedAt: toIso(row.startedAt),
    })),
  };
}

export async function createLocationImpl(input: {
  name: string;
}): Promise<
  { ok: true; location: LocationRow } | { ok: false; error: string }
> {
  requireAdmin();
  const name = parseLocationName(input.name);
  if (typeof name !== "string") {
    return { error: name.error, ok: false };
  }

  const prisma = getPrisma();
  const clash = await prisma.location.findUnique({ where: { name } });
  if (clash) {
    return { error: "Ya existe una ubicación con ese nombre.", ok: false };
  }

  const id = randomUUID();
  await prisma.location.create({ data: { id, name } });
  const created = await getLocationRecord(id);
  if (!created) {
    return { error: "No se ha podido crear la ubicación.", ok: false };
  }
  await ensureLocationReady(created);
  const ready = await getLocationRecord(id);
  if (!ready) {
    return { error: "No se ha podido crear la ubicación.", ok: false };
  }
  return { location: toLocationRow(ready), ok: true };
}

export async function renameLocationImpl(input: {
  locationId: string;
  name: string;
}): Promise<
  { ok: true; location: LocationRow } | { ok: false; error: string }
> {
  requireAdmin();
  const name = parseLocationName(input.name);
  if (typeof name !== "string") {
    return { error: name.error, ok: false };
  }

  const prisma = getPrisma();
  const clash = await prisma.location.findFirst({
    where: { id: { not: input.locationId }, name },
  });
  if (clash) {
    return { error: "Ya existe una ubicación con ese nombre.", ok: false };
  }

  try {
    await prisma.location.update({
      data: { name },
      where: { id: input.locationId },
    });
  } catch (err) {
    if (isPrismaCode(err, "P2025")) {
      return { error: "Esa ubicación no existe.", ok: false };
    }
    if (isPrismaCode(err, "P2002")) {
      return { error: "Ya existe una ubicación con ese nombre.", ok: false };
    }
    throw err;
  }
  const row = await getLocationRecord(input.locationId);
  if (!row) {
    return { error: "Esa ubicación no existe.", ok: false };
  }
  return { location: toLocationRow(row), ok: true };
}

export async function archiveLocationRecord(
  locationId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const prisma = getPrisma();
  const location = await getLocationRecord(locationId);
  if (!location) {
    return { error: "Esa ubicación no existe.", ok: false };
  }
  if (location.archivedAt !== null) {
    return { ok: true };
  }

  const active = await prisma.location.count({
    where: { archivedAt: null },
  });
  if (active <= 1) {
    return { error: "Tiene que quedar al menos una ubicación.", ok: false };
  }

  await prisma.location.update({
    data: { archivedAt: new Date() },
    where: { id: locationId },
  });
  return { ok: true };
}

export function archiveLocationImpl(input: {
  locationId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  requireAdmin();
  return archiveLocationRecord(input.locationId);
}

export async function restoreLocationImpl(input: {
  locationId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  requireAdmin();
  try {
    await getPrisma().location.update({
      data: { archivedAt: null },
      where: { id: input.locationId },
    });
  } catch (err) {
    if (isPrismaCode(err, "P2025")) {
      return { error: "Esa ubicación no existe.", ok: false };
    }
    throw err;
  }
  return { ok: true };
}
