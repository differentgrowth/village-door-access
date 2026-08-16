export const FIRST_LOCATION_ID = "00000000-0000-4000-8000-000000000001";
export const FIRST_LOCATION_NAME = "Acceso 1";

/** Days a Visit row is kept. After this, the name is deleted. Visit count is not. */
export const VISIT_RETENTION_DAYS = 90;

/** Shown only when ADMIN_PASSWORD is unset. v1 usability default, not a secret. */
export const DEMO_PASSWORD = "acceso1a";

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

export function parsePassword(raw: string): string | { error: string } {
  const value = raw.normalize("NFKC");
  if (value.length < PASSWORD_MIN_LENGTH) {
    return { error: "La contraseña tiene al menos 8 caracteres." };
  }
  if (value.length > PASSWORD_MAX_LENGTH) {
    return { error: "La contraseña es demasiado larga." };
  }
  return value;
}

export function parseLocationName(raw: string): string | { error: string } {
  const name = raw.replace(/\s+/g, " ").trim();
  if (name.length < 2) {
    return { error: "Escribe un nombre para la ubicación." };
  }
  if (name.length > 40) {
    return { error: "El nombre es demasiado largo." };
  }
  return name;
}

export function locationPickerMode(
  count: number,
  viewport: "mobile" | "desktop"
): "tabs" | "select" {
  if (viewport === "mobile") {
    return count > 3 ? "select" : "tabs";
  }
  return count > 6 ? "select" : "tabs";
}
