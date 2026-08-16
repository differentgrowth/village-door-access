import { encode } from "uqr";

/** Match `--color-fg` / `--color-surface` / `--color-bg` for canvas and print. */
export const QR_INK = "#1b1814";
export const QR_PAPER = "#faf6f0";
export const QR_SHEET = "#efe8de";
export const QR_MUTED = "#6d665c";
export const QR_FONT = "Inter, ui-sans-serif, system-ui, sans-serif";

export const QR_QUIET_ZONE = 4;

const qrOptions = {
  border: QR_QUIET_ZONE,
  ecc: "H" as const,
};

export function locationVisitUrl(origin: string, locationId: string): string {
  const url = new URL("/", origin);
  url.searchParams.set("location", locationId);
  return url.href;
}

export function encodeLocationQr(url: string): {
  modules: boolean[][];
  size: number;
} {
  const { data, size } = encode(url, qrOptions);
  return { modules: data, size };
}

export function locationQrPath(url: string): { d: string; size: number } {
  const { modules, size } = encodeLocationQr(url);
  const parts: string[] = [];
  for (let y = 0; y < size; y += 1) {
    const row = modules[y];
    if (!row) {
      continue;
    }
    for (let x = 0; x < size; x += 1) {
      if (row[x]) {
        parts.push(`M${x} ${y}h1v1h-1z`);
      }
    }
  }
  return { d: parts.join(""), size };
}

export function stickerFilename(locationName: string): string {
  const slug = locationName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return `qr-${slug || "ubicacion"}.png`;
}
