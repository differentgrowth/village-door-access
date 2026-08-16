/**
 * v1 Operator auth is a shared Password (ADMIN_PASSWORD), not per-person identity.
 * Chosen for village usability: the town hall can hand over one secret.
 * This is not strong authentication. Do not treat it as multi-user security.
 */
import {
  deleteCookie,
  getCookie,
  getRequestProtocol,
  setCookie,
} from "@tanstack/react-start/server";
import {
  issueAdminToken,
  SESSION_HOURS,
  tokenIsAdminSession,
} from "@/lib/admin-session-token";

const COOKIE = "access_admin";

export function isAdminSession(): boolean {
  return tokenIsAdminSession(getCookie(COOKIE));
}

export function writeAdminSession(): void {
  setCookie(COOKIE, issueAdminToken(), {
    httpOnly: true,
    maxAge: SESSION_HOURS * 60 * 60,
    path: "/",
    sameSite: "lax",
    secure: getRequestProtocol() === "https",
  });
}

export function clearAdminSession(): void {
  deleteCookie(COOKIE, { path: "/" });
}

export function requireAdmin(): void {
  if (!isAdminSession()) {
    throw new Error("No autorizado");
  }
}
