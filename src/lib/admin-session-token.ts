/**
 * Shared-Password session crypto. Cookie I/O lives in admin-session.server.ts.
 * v1 Operator auth is one Password, not per-person identity (ADR-0001).
 */
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { DEMO_PASSWORD, parsePassword } from "@/lib/access.rules";

export const SESSION_HOURS = 12;

export function isDemoPassword(): boolean {
  return !process.env.ADMIN_PASSWORD?.trim();
}

export function getAdminPassword(): string {
  const fromEnv = process.env.ADMIN_PASSWORD?.trim();
  if (fromEnv && fromEnv.length > 0) {
    const parsed = parsePassword(fromEnv);
    if (typeof parsed !== "string") {
      throw new Error(
        "ADMIN_PASSWORD must be at least 8 characters (at most 128)."
      );
    }
    return parsed;
  }
  return DEMO_PASSWORD;
}

/**
 * HMAC key for Operator cookies.
 * Demo preview (ADMIN_PASSWORD unset) derives a process key from the demo Password.
 * When ADMIN_PASSWORD is set, ADMIN_SESSION_SECRET is required — no committed default.
 */
export function sessionSecret(): string {
  const fromEnv = process.env.ADMIN_SESSION_SECRET?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  if (isDemoPassword()) {
    return createHmac("sha256", DEMO_PASSWORD)
      .update("village-door-demo-session")
      .digest("hex");
  }
  throw new Error(
    "ADMIN_SESSION_SECRET is required when ADMIN_PASSWORD is set."
  );
}

export function passwordsMatch(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export function readSubmittedPassword(raw: string): string | { error: string } {
  return parsePassword(raw);
}

function passwordDigest(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

function equalMac(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

export function signAdminToken(
  exp: number,
  password: string,
  secret: string
): string {
  const body = `v2.${exp}`;
  const mac = createHmac("sha256", secret)
    .update(`${body}.${passwordDigest(password)}`)
    .digest("base64url");
  return `${body}.${mac}`;
}

export function verifyAdminToken(
  token: string,
  password: string,
  secret: string
): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return false;
  }
  const [version, expStr, mac] = parts;
  if (version !== "v2" || !expStr || !mac) {
    return false;
  }
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() / 1000 > exp) {
    return false;
  }
  const expected = createHmac("sha256", secret)
    .update(`v2.${expStr}.${passwordDigest(password)}`)
    .digest("base64url");
  return equalMac(mac, expected);
}

export function issueAdminToken(nowSeconds = Date.now() / 1000): string {
  const exp = Math.floor(nowSeconds) + SESSION_HOURS * 60 * 60;
  return signAdminToken(exp, getAdminPassword(), sessionSecret());
}

export function tokenIsAdminSession(token: string | undefined): boolean {
  if (!token) {
    return false;
  }
  return verifyAdminToken(token, getAdminPassword(), sessionSecret());
}

// Fail loud as soon as the server module loads when production Password is set
// without a valid shape or without ADMIN_SESSION_SECRET.
if (typeof window === "undefined" && process.env.ADMIN_PASSWORD?.trim()) {
  getAdminPassword();
  sessionSecret();
}
